'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, ZoomIn, ZoomOut, Search, Crosshair, ShieldCheck, RefreshCw } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

interface StoreMapPickerProps {
  lat: number;
  lng: number;
  radius: number;
  storeName?: string;
  onChange: (lat: number, lng: number) => void;
}

export default function StoreMapPicker({
  lat,
  lng,
  radius,
  storeName = 'สาขาหลัก',
  onChange,
}: StoreMapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const circleRef = useRef<any>(null);

  const [isLocating, setIsLocating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize Leaflet Map
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (typeof window === 'undefined' || !mapContainerRef.current) return;

      const L = (await import('leaflet')).default;

      // Fix if map already initialized on this container
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const initialLat = Number(lat) || 13.7563;
      const initialLng = Number(lng) || 100.5018;
      const initialRadius = Number(radius) || 50;

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 17,
        zoomControl: false,
      });

      // OpenStreetMap Tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      // Custom Modern Pin Icon
      const customIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
            <div style="background: linear-gradient(135deg, #2563eb, #4f46e5); color: white; padding: 6px 12px; border-radius: 9999px; font-size: 11px; font-weight: 800; box-shadow: 0 4px 12px rgba(37,99,235,0.4); border: 2px solid white; white-space: nowrap; margin-bottom: 4px;">
              📍 ${storeName || 'จุดเช็คอินร้าน'}
            </div>
            <div style="width: 28px; height: 28px; background: #2563eb; border: 3px solid white; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); box-shadow: 0 4px 12px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
              <div style="width: 8px; height: 8px; background: white; border-radius: 50%; transform: rotate(45deg);"></div>
            </div>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      // Draggable Marker
      const marker = L.marker([initialLat, initialLng], {
        draggable: true,
        icon: customIcon,
      }).addTo(map);

      // Geofence Circle Overlay
      const circle = L.circle([initialLat, initialLng], {
        radius: initialRadius,
        color: '#2563eb',
        fillColor: '#3b82f6',
        fillOpacity: 0.22,
        weight: 2,
        dashArray: '4, 6',
      }).addTo(map);

      // Marker Drag End Handler
      marker.on('dragend', function (e: any) {
        const position = e.target.getLatLng();
        circle.setLatLng(position);
        onChange(Number(position.lat.toFixed(6)), Number(position.lng.toFixed(6)));
      });

      // Map Click Handler
      map.on('click', function (e: any) {
        const { lat: clickLat, lng: clickLng } = e.latlng;
        marker.setLatLng([clickLat, clickLng]);
        circle.setLatLng([clickLat, clickLng]);
        onChange(Number(clickLat.toFixed(6)), Number(clickLng.toFixed(6)));
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;
      circleRef.current = circle;

      if (isMounted) {
        setMapLoaded(true);
      }

      // Trigger size invalidation after load
      setTimeout(() => {
        map.invalidateSize();
      }, 250);
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update marker and circle position when props change externally
  useEffect(() => {
    if (!mapInstanceRef.current || !markerRef.current || !circleRef.current) return;
    const curLat = Number(lat);
    const curLng = Number(lng);
    const curRadius = Number(radius) || 50;

    if (!isNaN(curLat) && !isNaN(curLng)) {
      markerRef.current.setLatLng([curLat, curLng]);
      circleRef.current.setLatLng([curLat, curLng]);
      circleRef.current.setRadius(curRadius);
    }
  }, [lat, lng, radius]);

  // Request Device GPS Location
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('เบราว์เซอร์นี้ไม่รองรับระบบ Geolocation');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const userLat = Number(pos.coords.latitude.toFixed(6));
        const userLng = Number(pos.coords.longitude.toFixed(6));

        onChange(userLat, userLng);

        if (mapInstanceRef.current && markerRef.current && circleRef.current) {
          mapInstanceRef.current.flyTo([userLat, userLng], 18, { duration: 1.2 });
          markerRef.current.setLatLng([userLat, userLng]);
          circleRef.current.setLatLng([userLat, userLng]);
        }
      },
      (err) => {
        setIsLocating(false);
        console.error(err);
        alert(`ไม่สามารถดึงพิกัดปัจจุบันได้: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Search Address / Place via Nominatim
  const handleSearchPlace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchError('');

    try {
      // If user entered comma-separated coords: e.g. "13.7563, 100.5018"
      const coordsMatch = searchQuery.match(/^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/);
      if (coordsMatch) {
        const searchLat = parseFloat(coordsMatch[1]);
        const searchLng = parseFloat(coordsMatch[3]);
        onChange(searchLat, searchLng);
        if (mapInstanceRef.current && markerRef.current && circleRef.current) {
          mapInstanceRef.current.flyTo([searchLat, searchLng], 18);
          markerRef.current.setLatLng([searchLat, searchLng]);
          circleRef.current.setLatLng([searchLat, searchLng]);
        }
        setIsSearching(false);
        return;
      }

      // Nominatim search
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}&countrycodes=th&limit=1`
      );
      const data = await res.json();

      if (data && data.length > 0) {
        const item = data[0];
        const searchLat = Number(parseFloat(item.lat).toFixed(6));
        const searchLng = Number(parseFloat(item.lon).toFixed(6));

        onChange(searchLat, searchLng);
        if (mapInstanceRef.current && markerRef.current && circleRef.current) {
          mapInstanceRef.current.flyTo([searchLat, searchLng], 18, { duration: 1.2 });
          markerRef.current.setLatLng([searchLat, searchLng]);
          circleRef.current.setLatLng([searchLat, searchLng]);
        }
      } else {
        setSearchError('ไม่พบสถานที่ดังกล่าว ลองระบุชื่อถนน หรืออำเภอ/จังหวัด');
      }
    } catch (err: any) {
      setSearchError('เกิดข้อผิดพลาดในการค้นหา');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Map Control Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* Search Input */}
        <form onSubmit={handleSearchPlace} className="flex-1 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาสถานที่ เช่น เซ็นทรัลบางนา หรือวางพิกัด 13.75, 100.50"
            className="w-full pl-9 pr-20 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 font-medium"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <button
            type="submit"
            disabled={isSearching}
            className="absolute right-1 top-1/2 -translate-y-1/2 px-2.5 py-1 text-[11px] font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {isSearching ? 'ค้นหา...' : 'ค้นหา'}
          </button>
        </form>

        {/* GPS Current Location Button */}
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          disabled={isLocating}
          className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all active:scale-95 disabled:opacity-50 shrink-0"
        >
          {isLocating ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>กำลังดึง GPS...</span>
            </>
          ) : (
            <>
              <Crosshair className="w-3.5 h-3.5 text-emerald-200" />
              <span>📍 ตำแหน่งปัจจุบันของฉัน</span>
            </>
          )}
        </button>
      </div>

      {searchError && (
        <div className="text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-2">
          {searchError}
        </div>
      )}

      {/* Interactive Map Canvas */}
      <div className="relative w-full h-80 rounded-2xl overflow-hidden border-2 border-slate-200 shadow-inner bg-slate-100">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Overlay Helper Badge */}
        <div className="absolute top-3 left-3 z-10 bg-slate-900/85 backdrop-blur-xs text-white px-3 py-1.5 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 shadow-md border border-white/10 pointer-events-none">
          <MapPin className="w-3.5 h-3.5 text-amber-400" />
          <span>คลิกบนแผนที่ หรือลากหมุดเพื่อเปลี่ยนพิกัดร้าน</span>
        </div>

        {/* Geofence Info Badge */}
        <div className="absolute bottom-3 right-3 z-10 bg-blue-950/90 backdrop-blur-xs text-blue-200 px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-2 shadow-md border border-blue-500/30 pointer-events-none">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
          <span>วงรัศมีอนุญาต: {radius} เมตร</span>
        </div>

        {/* Zoom Controls */}
        <div className="absolute top-3 right-3 z-10 flex flex-col gap-1">
          <button
            type="button"
            onClick={() => mapInstanceRef.current?.zoomIn()}
            className="w-8 h-8 rounded-lg bg-white/95 hover:bg-white text-slate-800 shadow-md flex items-center justify-center font-bold text-base transition-colors border border-slate-200"
            title="ขยายแผนที่"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => mapInstanceRef.current?.zoomOut()}
            className="w-8 h-8 rounded-lg bg-white/95 hover:bg-white text-slate-800 shadow-md flex items-center justify-center font-bold text-base transition-colors border border-slate-200"
            title="ย่อแผนที่"
          >
            -
          </button>
        </div>
      </div>

      {/* Live Coordinate Display */}
      <div className="flex items-center justify-between p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
          <span className="text-slate-600 font-medium">พิกัดที่เลือก:</span>
          <span className="font-mono font-bold text-blue-950">
            {Number(lat).toFixed(6)}, {Number(lng).toFixed(6)}
          </span>
        </div>
        <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
          ระบบ Geofencing อ้างอิงจากจุดนี้
        </span>
      </div>
    </div>
  );
}
