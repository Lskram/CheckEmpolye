'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  MapPin, 
  Crosshair, 
  ShieldCheck, 
  RefreshCw, 
  Search, 
  X, 
  Compass, 
  Check, 
  Sliders, 
  Navigation2,
  Building2,
  Copy,
  ExternalLink,
  Map as MapIcon,
  CheckCircle2
} from 'lucide-react';

interface StoreMapPickerProps {
  lat: number;
  lng: number;
  radius: number;
  storeName?: string;
  onChange: (lat: number, lng: number) => void;
  onRadiusChange?: (radius: number) => void;
  onSave?: () => void;
  isSaving?: boolean;
}

interface SearchResultItem {
  id: string;
  title: string;
  province: string;
  district?: string;
  subdistrict?: string;
  fullAddress: string;
  lat: number;
  lng: number;
  isGmapsLink?: boolean;
}

export default function StoreMapPicker({
  lat,
  lng,
  radius = 50,
  storeName = 'สีแสงยางยนต์ YOKOHAMA NAYA COSMIS',
  onChange,
  onRadiusChange,
  onSave,
  isSaving = false,
}: StoreMapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const circleRef = useRef<any>(null);

  // Local Coordinate Inputs for smooth editing
  const [localLatInput, setLocalLatInput] = useState<string>(Number(lat || 15.110412).toFixed(6));
  const [localLngInput, setLocalLngInput] = useState<string>(Number(lng || 104.358434).toFixed(6));
  const [copiedCoords, setCopiedCoords] = useState(false);

  const [isLocating, setIsLocating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedRadius, setSelectedRadius] = useState<number>(radius || 50);
  const [customStatusMsg, setCustomStatusMsg] = useState<string>('');

  // Sync radius state with props
  useEffect(() => {
    if (radius && radius !== selectedRadius) {
      setSelectedRadius(radius);
    }
  }, [radius]);

  // Sync local lat/lng inputs when props change externally
  useEffect(() => {
    const pLat = Number(lat);
    const pLng = Number(lng);
    if (!isNaN(pLat) && !isNaN(pLng)) {
      setLocalLatInput(pLat.toFixed(6));
      setLocalLngInput(pLng.toFixed(6));
    }
  }, [lat, lng]);

  // Initialize Leaflet Map
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (typeof window === 'undefined' || !mapContainerRef.current) return;

      const L = (await import('leaflet')).default;

      // Clean up previous instance if any
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const initialLat = Number(lat) || 15.110412;
      const initialLng = Number(lng) || 104.358434;
      const initialRadius = Number(radius) || 50;

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 17,
        zoomControl: false,
      });

      // Crisp OpenStreetMap Standard Layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      // High-Visibility Animated Center Marker
      const centerIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
            <div style="background: linear-gradient(135deg, #1e3a8a, #2563eb); color: white; padding: 5px 12px; border-radius: 9999px; font-size: 11px; font-weight: 800; box-shadow: 0 4px 14px rgba(37,99,235,0.45); border: 2px solid white; white-space: nowrap; margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
              <span>📍 ${storeName || 'จุดเช็คอินร้าน'}</span>
            </div>
            <!-- Radar Beacon Center Dot -->
            <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
              <div style="position: absolute; width: 32px; height: 32px; background: rgba(37, 99, 235, 0.35); border-radius: 50%; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
              <div style="width: 22px; height: 22px; background: #2563eb; border: 3px solid white; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); box-shadow: 0 4px 10px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; z-index: 2;">
                <div style="width: 6px; height: 6px; background: #ffffff; border-radius: 50%; transform: rotate(45deg);"></div>
              </div>
            </div>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      // Draggable Marker
      const marker = L.marker([initialLat, initialLng], {
        draggable: true,
        icon: centerIcon,
      }).addTo(map);

      // Geofence Radius Circle (Default: 50m)
      const circle = L.circle([initialLat, initialLng], {
        radius: initialRadius,
        color: '#2563eb',
        fillColor: '#3b82f6',
        fillOpacity: 0.22,
        weight: 2.5,
        dashArray: '5, 5',
      }).addTo(map);

      // Update when user drags marker
      marker.on('dragend', function (e: any) {
        const pos = e.target.getLatLng();
        const newLat = Number(pos.lat.toFixed(6));
        const newLng = Number(pos.lng.toFixed(6));
        circle.setLatLng([newLat, newLng]);
        setLocalLatInput(newLat.toFixed(6));
        setLocalLngInput(newLng.toFixed(6));
        onChange(newLat, newLng);
      });

      // Update when user clicks anywhere on map
      map.on('click', function (e: any) {
        const { lat: clickLat, lng: clickLng } = e.latlng;
        const newLat = Number(clickLat.toFixed(6));
        const newLng = Number(clickLng.toFixed(6));
        marker.setLatLng([newLat, newLng]);
        circle.setLatLng([newLat, newLng]);
        setLocalLatInput(newLat.toFixed(6));
        setLocalLngInput(newLng.toFixed(6));
        onChange(newLat, newLng);
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;
      circleRef.current = circle;

      // Invalidate size on load
      setTimeout(() => {
        if (isMounted && mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 300);
    }

    initMap();

    // ResizeObserver to handle tab changes and modal resizing
    let resizeObserver: ResizeObserver | null = null;
    if (mapContainerRef.current && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      });
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      isMounted = false;
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update map visual coordinates when lat/lng props change
  useEffect(() => {
    if (!mapInstanceRef.current || !markerRef.current || !circleRef.current) return;
    const curLat = Number(lat);
    const curLng = Number(lng);

    if (!isNaN(curLat) && !isNaN(curLng)) {
      markerRef.current.setLatLng([curLat, curLng]);
      circleRef.current.setLatLng([curLat, curLng]);
    }
  }, [lat, lng]);

  // Update circle radius when selectedRadius changes
  useEffect(() => {
    if (!circleRef.current) return;
    circleRef.current.setRadius(Number(selectedRadius) || 50);
  }, [selectedRadius]);

  // Direct Coordinates update from input fields
  const applyManualCoordinates = (newLatStr: string, newLngStr: string) => {
    const parsedLat = parseFloat(newLatStr);
    const parsedLng = parseFloat(newLngStr);

    if (isNaN(parsedLat) || isNaN(parsedLng)) {
      alert('กรุณากรอกพิกัดตัวเลขละติจูดและลองจิจูดให้ถูกต้อง');
      return;
    }

    if (parsedLat < -90 || parsedLat > 90 || parsedLng < -180 || parsedLng > 180) {
      alert('ค่าพิกัดไม่อยู่ในช่วงที่ถูกต้อง (-90 ถึง 90, -180 ถึง 180)');
      return;
    }

    const roundedLat = Number(parsedLat.toFixed(6));
    const roundedLng = Number(parsedLng.toFixed(6));

    setLocalLatInput(roundedLat.toFixed(6));
    setLocalLngInput(roundedLng.toFixed(6));
    onChange(roundedLat, roundedLng);

    if (mapInstanceRef.current && markerRef.current && circleRef.current) {
      mapInstanceRef.current.flyTo([roundedLat, roundedLng], 17, { duration: 1.2 });
      markerRef.current.setLatLng([roundedLat, roundedLng]);
      circleRef.current.setLatLng([roundedLat, roundedLng]);
    }

    setCustomStatusMsg(`📍 ปักหมุดพิกัด: ${roundedLat}, ${roundedLng}`);
    setTimeout(() => setCustomStatusMsg(''), 3000);
  };

  // Instant Regex coordinate detector when typing or pasting in search box
  const checkAndParseDirectInput = (text: string): boolean => {
    const trimmed = text.trim();
    
    // 1. Check if string is "15.110412, 104.358434" or "15.110412 104.358434"
    const coordMatch = trimmed.match(/^(-?\d+(\.\d+)?)[,\s]+(-?\d+(\.\d+)?)$/);
    if (coordMatch) {
      const latVal = parseFloat(coordMatch[1]);
      const lngVal = parseFloat(coordMatch[3]);
      applyManualCoordinates(latVal.toString(), lngVal.toString());
      return true;
    }

    // 2. Check if string contains @lat,lng in Google Maps URL
    const atMatch = trimmed.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (atMatch) {
      const latVal = parseFloat(atMatch[1]);
      const lngVal = parseFloat(atMatch[2]);
      applyManualCoordinates(latVal.toString(), lngVal.toString());
      return true;
    }

    // 3. Check query param ?q=lat,lng
    const qMatch = trimmed.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (qMatch) {
      const latVal = parseFloat(qMatch[1]);
      const lngVal = parseFloat(qMatch[2]);
      applyManualCoordinates(latVal.toString(), lngVal.toString());
      return true;
    }

    return false;
  };

  // Live Auto-Complete Search with Debounce
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed || trimmed.length < 2) {
      setSearchResults([]);
      setIsDropdownOpen(false);
      return;
    }

    // If it's direct coordinates or GMaps link, parse directly
    if (checkAndParseDirectInput(trimmed)) {
      setSearchResults([]);
      setIsDropdownOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/geocoding/search?q=${encodeURIComponent(trimmed)}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.results)) {
          setSearchResults(data.results);
          setIsDropdownOpen(data.results.length > 0);
        } else {
          setSearchResults([]);
        }
      } catch (err) {
        console.error('Search fetch error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle selecting a search result item
  const handleSelectLocation = (item: SearchResultItem) => {
    const newLat = item.lat;
    const newLng = item.lng;

    setLocalLatInput(newLat.toFixed(6));
    setLocalLngInput(newLng.toFixed(6));
    onChange(newLat, newLng);
    setSearchQuery(item.title);
    setIsDropdownOpen(false);

    if (mapInstanceRef.current && markerRef.current && circleRef.current) {
      mapInstanceRef.current.flyTo([newLat, newLng], 18, { duration: 1.2 });
      markerRef.current.setLatLng([newLat, newLng]);
      circleRef.current.setLatLng([newLat, newLng]);
    }
  };

  // Quick preset: สีแสงยางยนต์ (Official Branch)
  const handleSetSisaengBranch = () => {
    const branchLat = 15.110412;
    const branchLng = 104.358434;
    setLocalLatInput(branchLat.toFixed(6));
    setLocalLngInput(branchLng.toFixed(6));
    onChange(branchLat, branchLng);
    setSearchQuery('สีแสงยางยนต์ (Sisaeng Yangyont)');
    if (mapInstanceRef.current && markerRef.current && circleRef.current) {
      mapInstanceRef.current.flyTo([branchLat, branchLng], 18, { duration: 1.2 });
      markerRef.current.setLatLng([branchLat, branchLng]);
      circleRef.current.setLatLng([branchLat, branchLng]);
    }
    setCustomStatusMsg('📍 รีเซ็ตตำแหน่งเป็น: สาขาสีแสงยางยนต์ (สำนักงานใหญ่)');
    setTimeout(() => setCustomStatusMsg(''), 3000);
  };

  // Device GPS Auto-Locate
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('อุปกรณ์ของคุณไม่รองรับระบบ Geolocation');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const userLat = Number(pos.coords.latitude.toFixed(6));
        const userLng = Number(pos.coords.longitude.toFixed(6));

        setLocalLatInput(userLat.toFixed(6));
        setLocalLngInput(userLng.toFixed(6));
        onChange(userLat, userLng);
        setSearchQuery('ตำแหน่ง GPS ปัจจุบันของฉัน');

        if (mapInstanceRef.current && markerRef.current && circleRef.current) {
          mapInstanceRef.current.flyTo([userLat, userLng], 18, { duration: 1.2 });
          markerRef.current.setLatLng([userLat, userLng]);
          circleRef.current.setLatLng([userLat, userLng]);
        }

        setCustomStatusMsg(`📍 ปักหมุดพิกัด GPS อุปกรณ์ของคุณสำเร็จ: ${userLat}, ${userLng}`);
        setTimeout(() => setCustomStatusMsg(''), 3000);
      },
      (err) => {
        setIsLocating(false);
        console.error(err);
        alert(`ไม่สามารถดึงตำแหน่ง GPS ได้: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleRadiusChangeInternal = (newRad: number) => {
    setSelectedRadius(newRad);
    if (onRadiusChange) {
      onRadiusChange(newRad);
    }
  };

  // Copy coordinates to clipboard
  const handleCopyCoords = () => {
    const curLat = Number(lat).toFixed(6);
    const curLng = Number(lng).toFixed(6);
    navigator.clipboard.writeText(`${curLat}, ${curLng}`);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2000);
  };

  return (
    <div className="space-y-3 relative">
      {/* ------------------------------------------------------------- */}
      {/* SEARCH BAR & AUTOCOMPLETE WITH PROVINCE BADGES               */}
      {/* ------------------------------------------------------------- */}
      <div className="relative z-30">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          
          {/* Main Search Input */}
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchResults.length > 0) setIsDropdownOpen(true);
              }}
              placeholder="🔍 ค้นหาสถานที่, จังหวัด หรือวางลิงก์ Google Maps / พิกัดตัวเลข"
              className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-300 rounded-2xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 font-medium transition-all shadow-xs"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                  setIsDropdownOpen(false);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {isSearching && (
              <div className="absolute right-8 top-1/2 -translate-y-1/2">
                <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
              </div>
            )}
          </div>

          {/* GPS Current Location Button */}
          <button
            type="button"
            onClick={handleGetCurrentLocation}
            disabled={isLocating}
            className="px-3.5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-xs shrink-0"
          >
            {isLocating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
                <span>กำลังระบุ GPS...</span>
              </>
            ) : (
              <>
                <Crosshair className="w-3.5 h-3.5 text-emerald-400" />
                <span>📍 พิกัดของฉัน</span>
              </>
            )}
          </button>

          {/* Preset Quick Button for Sisaeng Yangyont */}
          <button
            type="button"
            onClick={handleSetSisaengBranch}
            className="px-3 py-2.5 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5 shrink-0"
          >
            <Building2 className="w-3.5 h-3.5 text-blue-600" />
            <span>🏢 สาขาสีแสงยางยนต์</span>
          </button>
        </div>

        {/* ----------------------------------------------------------- */}
        {/* AUTOCOMPLETE DROPDOWN RESULTS (WITH PROVINCE BADGES)        */}
        {/* ----------------------------------------------------------- */}
        {isDropdownOpen && searchResults.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden max-h-72 overflow-y-auto divide-y divide-slate-100">
            <div className="px-3 py-2 bg-slate-50 text-[11px] font-bold text-slate-500 flex items-center justify-between">
              <span>ผลการค้นหาสถานที่ ({searchResults.length} รายการ)</span>
              <span className="text-[10px] text-blue-600 font-medium">คลิกเพื่อปักหมุดทันที</span>
            </div>

            {searchResults.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectLocation(item)}
                className="w-full p-3 text-left hover:bg-blue-50/70 transition-colors flex items-start gap-2.5 group"
              >
                <div className="w-7 h-7 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-xs text-slate-900 group-hover:text-blue-700 transition-colors">
                      {item.title}
                    </span>
                    {item.province && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black shrink-0">
                        📍 {item.province}
                      </span>
                    )}
                    {item.district && (
                      <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-medium shrink-0">
                        {item.district}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5 font-medium">
                    {item.fullAddress}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                    Lat: {item.lat.toFixed(6)}, Lng: {item.lng.toFixed(6)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* INTERACTIVE LEAFLET MAP CONTAINER                             */}
      {/* ------------------------------------------------------------- */}
      <div className="relative w-full h-84 sm:h-96 rounded-3xl overflow-hidden border-2 border-slate-200 shadow-inner bg-slate-100">
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {/* Top Floating Helper Banner */}
        <div className="absolute top-3 left-3 z-20 bg-slate-900/90 backdrop-blur-xs text-white px-3.5 py-1.5 rounded-2xl text-[11px] font-semibold flex items-center gap-1.5 shadow-lg border border-white/10 pointer-events-none">
          <MapPin className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
          <span>คลิกบนแผนที่ หรือลากหมุด เพื่อกำหนดจุดร้านค้า</span>
        </div>

        {/* Dynamic Status Toast Banner */}
        {customStatusMsg && (
          <div className="absolute top-3 right-14 z-20 bg-emerald-600 text-white px-3.5 py-1.5 rounded-2xl text-[11px] font-bold flex items-center gap-1.5 shadow-lg animate-fade-in border border-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{customStatusMsg}</span>
          </div>
        )}

        {/* Bottom Geofence Indicator Badge */}
        <div className="absolute bottom-3 left-3 z-20 bg-blue-950/90 backdrop-blur-xs text-white px-3.5 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-lg border border-blue-500/40 pointer-events-none">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
          <span>วงรัศมีอนุญาต: {selectedRadius} เมตร (เริ่มต้น 50 ม.)</span>
        </div>

        {/* Zoom Controls */}
        <div className="absolute top-3 right-3 z-20 flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => mapInstanceRef.current?.zoomIn()}
            className="w-8 h-8 rounded-xl bg-white hover:bg-slate-50 text-slate-800 shadow-lg flex items-center justify-center font-black text-base transition-all border border-slate-200 active:scale-95"
            title="ขยาย"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => mapInstanceRef.current?.zoomOut()}
            className="w-8 h-8 rounded-xl bg-white hover:bg-slate-50 text-slate-800 shadow-lg flex items-center justify-center font-black text-base transition-all border border-slate-200 active:scale-95"
            title="ย่อ"
          >
            -
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* DIRECT LAT/LNG INPUT FIELDS WITH TWO-WAY REAL-TIME SYNC       */}
      {/* ------------------------------------------------------------- */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-slate-800 text-xs">พิกัด GPS ของร้าน (ละติจูด, ลองจิจูด)</span>
              <p className="text-[10px] text-slate-500">สามารถพิมพ์หรือวางตัวเลขพิกัดเพื่อปักหมุดตรงนี้ได้ทันที</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Copy button */}
            <button
              type="button"
              onClick={handleCopyCoords}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition-all flex items-center gap-1"
              title="คัดลอกพิกัด"
            >
              {copiedCoords ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCoords ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
            </button>

            {/* Open in Google Maps */}
            <a
              href={`https://www.google.com/maps?q=${Number(lat).toFixed(6)},${Number(lng).toFixed(6)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition-all flex items-center gap-1"
              title="เปิดใน Google Maps"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>เปิดดูบน Maps</span>
            </a>
          </div>
        </div>

        {/* Dual Input Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              ละติจูด (Latitude): <span className="text-blue-600">*</span>
            </label>
            <input
              type="number"
              step="0.000001"
              value={localLatInput}
              onChange={(e) => setLocalLatInput(e.target.value)}
              onBlur={() => applyManualCoordinates(localLatInput, localLngInput)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  applyManualCoordinates(localLatInput, localLngInput);
                }
              }}
              placeholder="เช่น 15.110412"
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              ลองจิจูด (Longitude): <span className="text-blue-600">*</span>
            </label>
            <input
              type="number"
              step="0.000001"
              value={localLngInput}
              onChange={(e) => setLocalLngInput(e.target.value)}
              onBlur={() => applyManualCoordinates(localLatInput, localLngInput)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  applyManualCoordinates(localLatInput, localLngInput);
                }
              }}
              placeholder="เช่น 104.358434"
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        {/* Radius preset pills */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-slate-500 mr-1">เลือกรัศมีอนุญาต:</span>
            {[30, 50, 80, 100, 150, 200].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => handleRadiusChangeInternal(r)}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                  selectedRadius === r
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {r} ม.
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => applyManualCoordinates(localLatInput, localLngInput)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 shadow-xs"
            >
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>ปรับหมุด</span>
            </button>

            {onSave && (
              <button
                type="button"
                onClick={() => {
                  applyManualCoordinates(localLatInput, localLngInput);
                  onSave();
                }}
                disabled={isSaving}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black transition-all active:scale-95 flex items-center gap-1.5 shadow-md shadow-blue-500/25"
              >
                {isSaving ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                )}
                <span>{isSaving ? 'กำลังบันทึกลง Cloud...' : '💾 บันทึกจุดนี้ทันที'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
