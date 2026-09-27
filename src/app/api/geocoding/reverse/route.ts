import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const latParam = searchParams.get('lat');
    const lngParam = searchParams.get('lng');

    if (!latParam || !lngParam) {
      return NextResponse.json({ success: false, message: 'Missing lat or lng parameter' }, { status: 400 });
    }

    const lat = parseFloat(latParam);
    const lng = parseFloat(lngParam);

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json({ success: false, message: 'Invalid lat or lng' }, { status: 400 });
    }

    let placeName = '';
    let formattedAddress = '';
    let addressComponents: any = {};

    // 1. Primary: Nominatim Reverse Geocoding (Level 18 for high accuracy)
    try {
      const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
      const nomRes = await fetch(nominatimUrl, {
        headers: {
          'User-Agent': 'WorkforceAttendanceApp/2.0 (contact@attendance-system.app)',
          'Accept-Language': 'th,en;q=0.9',
        },
        next: { revalidate: 300 },
      });

      if (nomRes.ok) {
        const nomData = await nomRes.json();
        if (nomData && nomData.address) {
          const addr = nomData.address;
          addressComponents = addr;

          // Extract province cleanly (e.g. จ.ศรีสะเกษ, กรุงเทพมหานคร, จ.เชียงใหม่)
          let province = addr.province || addr.state || addr.city || '';
          if (province && !province.startsWith('จ.') && !province.startsWith('จังหวัด') && province !== 'กรุงเทพมหานคร') {
            province = `จ.${province}`;
          }

          // Extract district (อำเภอ / เขต / suburb / county)
          let district = addr.county || addr.district || addr.city_district || addr.suburb || '';
          if (district && !district.startsWith('อ.') && !district.startsWith('อำเภอ') && !district.startsWith('เขต')) {
            district = district.includes('เขต') ? district : `อ.${district}`;
          }

          // Extract subdistrict / locality (ตำบล / แขวง / เทศบาล / quarter)
          let subdistrict = addr.subdistrict || addr.quarter || addr.neighbourhood || addr.municipality || addr.town || '';
          if (subdistrict && !subdistrict.startsWith('ต.') && !subdistrict.startsWith('ตำบล') && !subdistrict.startsWith('แขวง') && !subdistrict.startsWith('เทศบาล')) {
            subdistrict = `ต.${subdistrict}`;
          }

          // Extract village (หมู่บ้าน / ชุมชน)
          let village = addr.village || addr.hamlet || '';
          if (village && !village.startsWith('บ้าน') && !village.startsWith('ม.') && !village.startsWith('หมู่') && !village.startsWith('ชุมชน')) {
            village = `บ้าน${village}`;
          }

          // Extract road (ถนน / ซอย / ทางหลวง)
          let road = addr.road || addr.street || addr.residential || '';
          if (road && !road.startsWith('ถ.') && !road.startsWith('ถนน') && !road.startsWith('ซ.') && !road.startsWith('ซอย') && !road.startsWith('วงเวียน')) {
            road = `ถ.${road}`;
          }

          // Extract POI / Building / Specific name
          const specificPoi = nomData.name || addr.shop || addr.building || addr.amenity || addr.office || addr.tourism || addr.leisure || addr.house_name;

          // Combine full address
          const locationParts = [road, village, subdistrict, district, province, addr.postcode].filter(Boolean);
          formattedAddress = locationParts.join(' ');

          // Determine smart place title
          if (specificPoi && specificPoi !== road) {
            placeName = specificPoi;
          } else if (addr.house_number && road) {
            placeName = `เลขที่ ${addr.house_number} ${road} ${subdistrict || district || ''}`.trim();
          } else if (road && (subdistrict || district)) {
            placeName = `${road} ${subdistrict || district}`.trim();
          } else if (village && (subdistrict || district)) {
            placeName = `${village} ${subdistrict || district}`.trim();
          } else if (subdistrict && district) {
            placeName = `จุดเช็คอิน ${subdistrict} ${district}`;
          } else if (district || province) {
            placeName = `จุดเช็คอิน ${[district, province].filter(Boolean).join(' ')}`;
          }
        }
      }
    } catch (nomErr) {
      console.warn('Nominatim reverse error:', nomErr);
    }

    // 2. Secondary Fallback: BigDataCloud Reverse Geocoding
    if (!placeName) {
      try {
        const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=th`;
        const bdcRes = await fetch(bdcUrl, {
          headers: { 'Accept': 'application/json' },
          next: { revalidate: 300 },
        });

        if (bdcRes.ok) {
          const bdcData = await bdcRes.json();
          if (bdcData) {
            const locality = bdcData.locality || bdcData.city || '';
            const principal = bdcData.principalSubdivision || '';
            
            if (locality && principal) {
              placeName = `จุดเช็คอิน ${locality} (${principal})`;
              formattedAddress = `${locality}, ${principal} ${bdcData.countryName || 'ประเทศไทย'}`;
            } else if (principal) {
              placeName = `จุดเช็คอิน จ.${principal}`;
              formattedAddress = `จ.${principal} ประเทศไทย`;
            }
          }
        }
      } catch (bdcErr) {
        console.warn('BigDataCloud reverse error:', bdcErr);
      }
    }

    // 3. Ultimate Fallback: Coordinates Point Name
    if (!placeName) {
      placeName = `จุดเช็คอินพิกัด (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
      formattedAddress = `พิกัดละติจูด ${lat.toFixed(6)}, ลองจิจูด ${lng.toFixed(6)}`;
    }

    return NextResponse.json({
      success: true,
      data: {
        placeName,
        formattedAddress: formattedAddress || placeName,
        lat: Number(lat.toFixed(6)),
        lng: Number(lng.toFixed(6)),
        addressComponents,
      },
    });
  } catch (error: any) {
    console.error('Reverse Geocoding error:', error);
    return NextResponse.json({
      success: false,
      message: error.message,
      data: {
        placeName: 'จุดเช็คอินพิกัด',
        formattedAddress: '',
      },
    }, { status: 500 });
  }
}
