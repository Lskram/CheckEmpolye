import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ success: true, results: [] });
    }

    const trimmedQuery = query.trim();

    // 1. Check if user pasted a Google Maps URL
    // e.g. https://maps.app.goo.gl/xxx or https://www.google.com/maps/place/.../@15.1104634,104.3584536...
    if (trimmedQuery.includes('maps.app.goo.gl') || trimmedQuery.includes('google.com/maps')) {
      try {
        const redirectRes = await fetch(trimmedQuery, { redirect: 'follow' });
        const finalUrl = redirectRes.url || trimmedQuery;
        
        // Extract @lat,lng from URL
        const atMatch = finalUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
        const placeMatch = finalUrl.match(/place\/([^/@]+)/);
        let placeName = 'ตำแหน่งจาก Google Maps';
        if (placeMatch && placeMatch[1]) {
          placeName = decodeURIComponent(placeMatch[1]).replace(/\+/g, ' ');
        }

        if (atMatch) {
          const lat = parseFloat(atMatch[1]);
          const lng = parseFloat(atMatch[2]);
          return NextResponse.json({
            success: true,
            results: [
              {
                id: `gmaps-${lat}-${lng}`,
                title: placeName,
                province: 'พิกัดจาก Google Maps Link',
                district: '',
                fullAddress: `ละติจูด ${lat.toFixed(6)}, ลองจิจูด ${lng.toFixed(6)}`,
                lat: Number(lat.toFixed(6)),
                lng: Number(lng.toFixed(6)),
                isGmapsLink: true,
              },
            ],
          });
        }
      } catch (gmapsErr) {
        console.warn('Failed to resolve Google Maps shortlink:', gmapsErr);
      }
    }

    // 2. Check if user typed coordinates directly: "15.1104, 104.3584"
    const coordsMatch = trimmedQuery.match(/^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/);
    if (coordsMatch) {
      const lat = parseFloat(coordsMatch[1]);
      const lng = parseFloat(coordsMatch[3]);
      return NextResponse.json({
        success: true,
        results: [
          {
            id: `coord-${lat}-${lng}`,
            title: `พิกัด: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
            province: 'พิกัดตรง (Custom Coordinates)',
            district: '',
            fullAddress: `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`,
            lat: Number(lat.toFixed(6)),
            lng: Number(lng.toFixed(6)),
          },
        ],
      });
    }

    // 3. Search via OpenStreetMap Nominatim with addressdetails=1 (Rich Thai Provinces / Districts)
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      trimmedQuery
    )}&limit=8&addressdetails=1&countrycodes=th`;

    const nomRes = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'WorkforceAttendanceApp/2.0 (contact@attendance-system.app)',
        'Accept-Language': 'th,en;q=0.9',
      },
      next: { revalidate: 120 },
    });

    if (nomRes.ok) {
      const nomData = await nomRes.json();
      if (Array.isArray(nomData) && nomData.length > 0) {
        const results = nomData.map((item: any) => {
          const addr = item.address || {};
          
          // Extract province cleanly (e.g. ศรีสะเกษ, กรุงเทพมหานคร, เชียงใหม่)
          let province = addr.province || addr.state || addr.city || '';
          if (province && !province.startsWith('จ.') && !province.startsWith('จังหวัด') && province !== 'กรุงเทพมหานคร') {
            province = `จ.${province}`;
          }

          // Extract district (อำเภอ / เขต)
          let district = addr.county || addr.district || addr.city_district || addr.town || addr.municipality || '';
          if (district && !district.startsWith('อ.') && !district.startsWith('อำเภอ') && !district.startsWith('เขต')) {
            district = `อ.${district}`;
          }

          // Extract subdistrict (ตำบล / แขวง)
          let subdistrict = addr.subdistrict || addr.quarter || addr.suburb || addr.village || '';
          if (subdistrict && !subdistrict.startsWith('ต.') && !subdistrict.startsWith('ตำบล') && !subdistrict.startsWith('แขวง')) {
            subdistrict = `ต.${subdistrict}`;
          }

          // Main title
          const title = item.name || addr.shop || addr.building || addr.amenity || (item.display_name.split(',')[0]);

          // Combine location info
          const locationParts = [subdistrict, district, province].filter(Boolean);
          const locationSubtitle = locationParts.length > 0 ? locationParts.join(' ') : item.display_name;

          return {
            id: String(item.place_id || `${item.lat}-${item.lon}`),
            title,
            province: province || 'ประเทศไทย',
            district: district || '',
            subdistrict: subdistrict || '',
            fullAddress: locationSubtitle,
            lat: Number(parseFloat(item.lat).toFixed(6)),
            lng: Number(parseFloat(item.lon).toFixed(6)),
          };
        });

        return NextResponse.json({ success: true, results, source: 'nominatim' });
      }
    }

    // 4. Fallback: Search via Photon API
    const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(trimmedQuery)}&limit=6&lat=15.11&lon=104.35`;
    const photonRes = await fetch(photonUrl, { headers: { 'Accept': 'application/json' } });
    if (photonRes.ok) {
      const pData = await photonRes.json();
      if (pData && pData.features && pData.features.length > 0) {
        const results = pData.features.map((f: any) => {
          const p = f.properties || {};
          const coords = f.geometry?.coordinates || [0, 0];
          const province = p.state ? (p.state.startsWith('จ.') ? p.state : `จ.${p.state}`) : (p.city || 'ประเทศไทย');
          const district = p.district ? (p.district.startsWith('อ.') ? p.district : `อ.${p.district}`) : '';
          const title = p.name || p.street || trimmedQuery;
          const fullAddress = [district, province].filter(Boolean).join(' ');

          return {
            id: `${coords[1]}-${coords[0]}`,
            title,
            province,
            district,
            subdistrict: '',
            fullAddress: fullAddress || 'ประเทศไทย',
            lat: Number(coords[1].toFixed(6)),
            lng: Number(coords[0].toFixed(6)),
          };
        });

        return NextResponse.json({ success: true, results, source: 'photon' });
      }
    }

    return NextResponse.json({ success: true, results: [] });
  } catch (error: any) {
    console.error('Geocoding search API error:', error);
    return NextResponse.json({ success: false, error: error.message, results: [] }, { status: 500 });
  }
}
