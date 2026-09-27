'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { 
  Shield, 
  Bell, 
  Calendar, 
  CreditCard, 
  Clock, 
  Menu, 
  CheckCircle2, 
  AlertCircle, 
  Sliders, 
  RefreshCw, 
  FileText, 
  MapPin, 
  ChevronRight, 
  LogOut,
  Navigation2,
  Radio,
  Crosshair
} from 'lucide-react';
import { calculateHaversineDistance } from '@/lib/geofence';
import { getDeviceHWID } from '@/lib/hwid';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { getLiveHardwarePosition, watchLivePosition, LiveLocationResult } from '@/lib/location';

export default function ExactEmployeeApp() {
  const router = useRouter();

  // Employee Profile & HWID
  const [employee, setEmployee] = useState<any>(null);
  const [hwid, setHwid] = useState('');
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // Live Real-Time Clock
  const [time, setTime] = useState({
    hhmm: '07:40',
    ss: '00',
    dateThai: 'วันจันทร์, 1 มกราคม 2024',
    rawTimeStr: '07:40:00',
  });

  // Store Settings & Geofence (Live Synced from Supabase DB)
  const [storeSettings, setStoreSettings] = useState<any>({
    store_name: 'สีแสงยางยนต์ (YOKOHAMA NAYA COSMIS)',
    store_lat: 15.110412,
    store_lng: 104.358434,
    radius_meters: 50,
    standard_time: '07:40',
    late_deadline: '08:00',
    allowance_amount: 50,
  });

  // Real Hardware Satellite GPS Coordinates & Accuracy
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsProvider, setGpsProvider] = useState<'capacitor' | 'browser' | 'fallback'>('capacitor');

  // Check-in & Check-out State & Results
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkInResult, setCheckInResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeHistoryTab, setActiveHistoryTab] = useState<'in' | 'out' | 'leave'>('in');

  // Recalculate Distance Helper
  const recalculateDistance = useCallback((coords: { lat: number; lng: number } | null, settings: any) => {
    if (!coords || !settings?.store_lat || !settings?.store_lng) return;
    const storeLat = Number(settings.store_lat);
    const storeLng = Number(settings.store_lng);
    if (isNaN(storeLat) || isNaN(storeLng)) return;

    const dist = calculateHaversineDistance(
      { latitude: coords.lat, longitude: coords.lng },
      { latitude: storeLat, longitude: storeLng }
    );
    setDistance(dist);
  }, []);

  // Fetch Today's Check-in & Check-out Status
  const fetchTodayStatus = useCallback((empId: string, empName: string) => {
    fetch(`/api/employee/stats?id=${empId}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success && resData.data?.todayLog) {
          const todayLog = resData.data.todayLog;
          setCheckInResult({
            id: todayLog.id,
            status: todayLog.status,
            checkInTime: todayLog.checkInTime,
            checkOutTime: todayLog.checkOutTime || null,
            workingDuration: todayLog.workingDuration || null,
            allowance: todayLog.allowance || 0,
            distance: todayLog.distance || 0,
            isLate: todayLog.status === 'LATE',
            employeeName: empName,
          });
        }
      })
      .catch((err) => console.error('Error fetching today status:', err));
  }, []);

  // Fetch Store Settings from DB
  const fetchSettings = useCallback(() => {
    fetch('/api/admin/settings', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setStoreSettings(data.data);
          // Recalculate distance immediately with current hardware coords
          setCurrentCoords((latestCoords) => {
            if (latestCoords) {
              recalculateDistance(latestCoords, data.data);
            }
            return latestCoords;
          });
        }
      })
      .catch((e) => console.error('Failed to fetch store settings:', e));
  }, [recalculateDistance]);

  // Manual GPS Refresh Trigger
  const refreshRealGPS = async () => {
    setGpsLoading(true);
    setGpsError(null);
    try {
      const pos = await getLiveHardwarePosition({ enableHighAccuracy: true, timeout: 8000, maximumAge: 0 });
      const newCoords = { lat: pos.latitude, lng: pos.longitude };
      setCurrentCoords(newCoords);
      setGpsAccuracy(pos.accuracy);
      setGpsProvider(pos.provider);
      recalculateDistance(newCoords, storeSettings);
    } catch (err: any) {
      console.warn('GPS refresh error:', err);
      setGpsError(err.message || 'ไม่สามารถรับสัญญาณดาวเทียม GPS ได้');
    } finally {
      setGpsLoading(false);
    }
  };

  // 1. Core Lifecycle Setup & Real-Time Sync
  useEffect(() => {
    // 1.1 Auth Guard - Check saved profile
    const saved = localStorage.getItem('attendance_employee_profile');
    if (!saved) {
      router.replace('/employee/login');
      return;
    }

    let parsedEmp: any = null;
    try {
      parsedEmp = JSON.parse(saved);
      if (parsedEmp?.role === 'ADMIN' || parsedEmp?.employee_code === 'SI01') {
        router.replace('/executive');
        return;
      }
      setEmployee(parsedEmp);
      setIsAuthChecking(false);
    } catch (e) {
      router.replace('/employee/login');
      return;
    }

    // 1.2 Fetch HWID
    const deviceHwid = getDeviceHWID();
    setHwid(deviceHwid);

    // 1.3 Fetch Initial Settings & Status
    fetchSettings();
    if (parsedEmp?.id) {
      fetchTodayStatus(parsedEmp.id, parsedEmp.full_name || parsedEmp.fullName);
    }

    // 1.4 Start Continuous Live Hardware Satellite GPS Tracking
    refreshRealGPS();
    const cleanupLocationWatcher = watchLivePosition(
      (pos: LiveLocationResult) => {
        const newCoords = { lat: pos.latitude, lng: pos.longitude };
        setCurrentCoords(newCoords);
        setGpsAccuracy(pos.accuracy);
        setGpsProvider(pos.provider);
        setGpsError(null);
        recalculateDistance(newCoords, storeSettings);
      },
      (err: any) => {
        console.warn('Live location watch error:', err);
      }
    );

    // 1.5 Supabase Realtime Channel Subscription (<100ms sync when Admin updates marker)
    let channel: any = null;
    if (isSupabaseConfigured && supabase && parsedEmp?.id) {
      channel = supabase
        .channel(`employee-geofence-sync-${parsedEmp.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'store_settings' }, () => {
          fetchSettings();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance_logs' }, () => {
          fetchTodayStatus(parsedEmp.id, parsedEmp.full_name || parsedEmp.fullName);
        })
        .subscribe();
    }

    // 1.6 Fast Adaptive Heartbeat Polling (Every 4 seconds fallback)
    const settingsPollTimer = setInterval(() => {
      fetchSettings();
    }, 4000);

    // 1.7 Sync on App Focus / Visibility Change
    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        fetchSettings();
        refreshRealGPS();
        if (parsedEmp?.id) {
          fetchTodayStatus(parsedEmp.id, parsedEmp.full_name || parsedEmp.fullName);
        }
      }
    };
    document.addEventListener('visibilitychange', handleFocus);
    window.addEventListener('focus', handleFocus);

    // 1.8 Clock Ticker
    const updateClock = () => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const ss = String(now.getSeconds()).padStart(2, '0');

      const thaiDays = ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'];
      const thaiMonths = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
      ];

      const dayName = thaiDays[now.getDay()];
      const dayDate = now.getDate();
      const monthName = thaiMonths[now.getMonth()];
      const year = now.getFullYear() + 543;

      setTime({
        hhmm: `${hh}:${mm}`,
        ss,
        dateThai: `${dayName}, ${dayDate} ${monthName} ${year}`,
        rawTimeStr: `${hh}:${mm}:${ss}`,
      });
    };

    updateClock();
    const clockInterval = setInterval(updateClock, 1000);

    return () => {
      clearInterval(clockInterval);
      clearInterval(settingsPollTimer);
      cleanupLocationWatcher();
      document.removeEventListener('visibilitychange', handleFocus);
      window.removeEventListener('focus', handleFocus);
      if (channel && supabase) supabase.removeChannel(channel);
    };
  }, [router, fetchSettings, fetchTodayStatus, recalculateDistance]);

  // Recalculate distance whenever storeSettings changes
  useEffect(() => {
    if (currentCoords && storeSettings) {
      recalculateDistance(currentCoords, storeSettings);
    }
  }, [storeSettings, currentCoords, recalculateDistance]);

  // Logout Handler
  const handleLogout = () => {
    if (confirm('คุณต้องการออกจากระบบหรือไม่?')) {
      localStorage.removeItem('attendance_employee_profile');
      router.replace('/employee/login');
    }
  };

  // CHECK-IN HANDLER (Captures Fresh Hardware GPS on Tap)
  const handleCheckIn = async () => {
    if (!employee?.id && !employee?.employeeCode && !employee?.employee_code) return;
    setIsCheckingIn(true);
    setErrorMessage('');

    try {
      // 1. Fetch fresh live hardware satellite position on button press
      let freshLat = currentCoords?.lat;
      let freshLng = currentCoords?.lng;
      let freshAcc = gpsAccuracy || 5;

      try {
        const livePos = await getLiveHardwarePosition({ enableHighAccuracy: true, timeout: 6000, maximumAge: 0 });
        freshLat = livePos.latitude;
        freshLng = livePos.longitude;
        freshAcc = livePos.accuracy;
        setCurrentCoords({ lat: livePos.latitude, lng: livePos.longitude });
        setGpsAccuracy(livePos.accuracy);
        recalculateDistance({ lat: livePos.latitude, lng: livePos.longitude }, storeSettings);
      } catch (e) {
        console.warn('Using last known coordinates for check-in:', e);
      }

      if (freshLat === undefined || freshLng === undefined) {
        setErrorMessage('ไม่สามารถระบุพิกัดดาวเทียม GPS ได้ กรุณาเปิด GPS บนโทรศัพท์แล้วกดใหม่อีกครั้ง');
        setIsCheckingIn(false);
        return;
      }

      const empId = employee.id || employee.employeeId;
      const res = await fetch('/api/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: empId,
          latitude: freshLat,
          longitude: freshLng,
          accuracy: freshAcc,
          hwid,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.message || 'การเช็คอินถูกปฏิเสธ');
        setIsCheckingIn(false);
        return;
      }

      setCheckInResult(data.data);

      if (data.data.status === 'PRESENT') {
        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.5 },
          colors: ['#38bdf8', '#2563eb', '#10b981', '#fbbf24', '#ffffff'],
        });
      }
    } catch (err: any) {
      setErrorMessage('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์: ' + err.message);
    } finally {
      setIsCheckingIn(false);
    }
  };

  // CHECK-OUT HANDLER (Captures Fresh Hardware GPS on Tap)
  const handleCheckOut = async () => {
    if (!employee?.id && !employee?.employeeCode && !employee?.employee_code) return;
    setIsCheckingOut(true);
    setErrorMessage('');

    try {
      // 1. Fetch fresh live hardware satellite position on button press
      let freshLat = currentCoords?.lat;
      let freshLng = currentCoords?.lng;
      let freshAcc = gpsAccuracy || 5;

      try {
        const livePos = await getLiveHardwarePosition({ enableHighAccuracy: true, timeout: 6000, maximumAge: 0 });
        freshLat = livePos.latitude;
        freshLng = livePos.longitude;
        freshAcc = livePos.accuracy;
        setCurrentCoords({ lat: livePos.latitude, lng: livePos.longitude });
        setGpsAccuracy(livePos.accuracy);
        recalculateDistance({ lat: livePos.latitude, lng: livePos.longitude }, storeSettings);
      } catch (e) {
        console.warn('Using last known coordinates for check-out:', e);
      }

      if (freshLat === undefined || freshLng === undefined) {
        setErrorMessage('ไม่สามารถระบุพิกัดดาวเทียม GPS ได้ กรุณาเปิด GPS บนโทรศัพท์');
        setIsCheckingOut(false);
        return;
      }

      const empId = employee.id || employee.employeeId;
      const res = await fetch('/api/check-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: empId,
          latitude: freshLat,
          longitude: freshLng,
          accuracy: freshAcc,
          hwid,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.message || 'การลงเวลาออกงานถูกปฏิเสธ');
        setIsCheckingOut(false);
        return;
      }

      setCheckInResult((prev: any) => ({
        ...prev,
        checkOutTime: data.data.checkOutTime,
        workingDuration: data.data.workingDuration,
      }));

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.5 },
        colors: ['#a855f7', '#3b82f6', '#10b981', '#fbbf24'],
      });
    } catch (err: any) {
      setErrorMessage('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์: ' + err.message);
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (isAuthChecking) {
    return (
      <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const allowedRadius = Number(storeSettings?.radius_meters) || 50;
  const isInsideRadius = distance !== null && distance <= allowedRadius;

  return (
    <div className="min-h-screen w-full bg-slate-50 flex flex-col justify-between select-none font-sans text-slate-800 pb-20">
      {/* ------------------------------------------------------------- */}
      {/* 1. TOP NATIVE HEADER & PROFILE                                */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white px-5 pt-4 pb-3 border-b border-slate-100 flex items-center justify-between shadow-xs sticky top-0 z-30">
        {/* Staff Avatar + Name */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 p-0.5 shadow-sm">
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
              <span className="font-extrabold text-blue-600 text-sm">
                {employee?.nickname?.[0] || employee?.full_name?.[0] || employee?.fullName?.[0] || 'ส'}
              </span>
            </div>
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-400">ยินดีต้อนรับ</div>
            <div className="font-bold text-slate-900 text-base tracking-tight leading-tight">
              {employee?.full_name || employee?.fullName || 'สมศักดิ์ คงศรี'}
            </div>
          </div>
        </div>

        {/* Top Right Badges (Security Shield, Logout) */}
        <div className="flex items-center gap-2">
          {/* HWID Device Security Badge */}
          <div 
            title={`HWID: ${hwid || 'ผูกเครื่องแล้ว'}`}
            className="relative w-9 h-9 rounded-xl bg-slate-100/80 border border-slate-200/80 flex items-center justify-center text-slate-600 shadow-2xs"
          >
            <Shield className="w-4 h-4 text-blue-600" />
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 text-white text-[8px] font-bold flex items-center justify-center ring-2 ring-white">
              ✓
            </span>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            title="ออกจากระบบ"
            className="relative w-9 h-9 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 hover:bg-rose-100 transition-colors shadow-2xs"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. MAIN SCROLLABLE CONTENT BODY                               */}
      {/* ------------------------------------------------------------- */}
      <div className="flex-1 px-4 pt-4 space-y-4 max-w-lg mx-auto w-full">
        {/* Blue Gradient Hero Card */}
        <div className="relative pt-1 pb-12">
          <div className="bg-gradient-to-br from-[#2563eb] via-[#1d4ed8] to-[#1e40af] rounded-3xl pt-7 pb-14 px-4 text-center text-white relative shadow-xl shadow-blue-500/20 overflow-hidden">
            {/* Background ambient lighting */}
            <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            
            {/* Digital Clock */}
            <div className="flex items-baseline justify-center gap-1 mb-1.5">
              <span className="text-5xl font-black tracking-tight font-mono drop-shadow-sm">
                {time.hhmm}
              </span>
              <span className="text-lg font-bold font-mono text-blue-200">
                {time.ss}
              </span>
            </div>

            {/* Thai Date */}
            <p className="text-xs font-medium text-blue-100/90 tracking-wide">
              {time.dateThai}
            </p>

            {/* Shift Rules Badge */}
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/25 backdrop-blur-md border border-white/15 text-[11px] font-bold text-white shadow-inner">
              <span>⏰ กะปกติ {storeSettings?.standard_time?.substring(0, 5) || '07:40'} น.</span>
              <span className="text-blue-200">•</span>
              <span className="text-amber-300">เลทได้ถึง {storeSettings?.late_deadline?.substring(0, 5) || '08:00'} น. (รับ {storeSettings?.allowance_amount || 50}฿)</span>
            </div>
          </div>

          {/* Overlapping Circular Check-In / Check-Out Dynamic Action Button */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-20">
            {/* Pulsing Ripple Effect */}
            {isInsideRadius && (!checkInResult || (checkInResult && !checkInResult.checkOutTime)) && (
              <motion.div
                className={`absolute -top-3 -left-3 w-30 h-30 rounded-full ${
                  !checkInResult ? 'bg-blue-500/25' : 'bg-amber-500/25'
                }`}
                animate={{ scale: [1, 1.4, 1.7], opacity: [0.8, 0.25, 0] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
              />
            )}

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.92 }}
              onClick={!checkInResult ? handleCheckIn : !checkInResult.checkOutTime ? handleCheckOut : undefined}
              disabled={isCheckingIn || isCheckingOut || (!!checkInResult && !!checkInResult.checkOutTime)}
              className={`relative z-10 w-24 h-24 rounded-full flex flex-col items-center justify-center text-white ring-4 ring-white shadow-2xl transition-all ${
                !checkInResult
                  ? 'bg-gradient-to-b from-[#3b82f6] via-[#2563eb] to-[#1d4ed8] shadow-blue-600/50'
                  : !checkInResult.checkOutTime
                    ? 'bg-gradient-to-b from-amber-500 via-orange-500 to-rose-600 shadow-orange-500/50'
                    : 'bg-gradient-to-b from-emerald-500 to-teal-600 shadow-emerald-500/40'
              }`}
            >
              {isCheckingIn || isCheckingOut ? (
                <RefreshCw className="w-7 h-7 animate-spin text-white" />
              ) : !checkInResult ? (
                <div className="flex flex-col items-center justify-center">
                  <svg
                    className="w-8 h-8 text-white mb-0.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 11V3a1 1 0 0 0-2 0v9" />
                    <path d="M10 8.5a1 1 0 0 1 2 0" />
                    <path d="M14 9.5a1 1 0 0 1 2 0v2.5" />
                    <path d="M18 11.5a1 1 0 0 1 2 0v3a8 8 0 1 1-16 0v-4" />
                  </svg>
                  <span className="text-xs font-bold tracking-tight">เข้างาน</span>
                </div>
              ) : !checkInResult.checkOutTime ? (
                <div className="flex flex-col items-center justify-center">
                  <LogOut className="w-7 h-7 text-white mb-0.5" />
                  <span className="text-xs font-bold tracking-tight">ออกงาน</span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center">
                  <CheckCircle2 className="w-7 h-7 text-white mb-0.5" />
                  <span className="text-[11px] font-bold">เสร็จสิ้น</span>
                </div>
              )}
            </motion.button>
          </div>
        </div>

        {/* 3 Summary Stat Cards */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          {/* Card 1: เข้างาน */}
          <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-xs text-center flex flex-col items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-1">
              <Clock className="w-4 h-4" />
            </div>
            <span className="text-sm font-bold font-mono text-slate-800">
              {checkInResult ? checkInResult.checkInTime : '--:--'}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">เข้างาน</span>
          </div>

          {/* Card 2: ออกงาน */}
          <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-xs text-center flex flex-col items-center justify-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
              checkInResult?.checkOutTime ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'
            }`}>
              <LogOut className="w-4 h-4" />
            </div>
            <span className={`text-sm font-bold font-mono ${
              checkInResult?.checkOutTime ? 'text-amber-600' : 'text-slate-400'
            }`}>
              {checkInResult?.checkOutTime ? checkInResult.checkOutTime : '--:--'}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">ออกงาน</span>
          </div>

          {/* Card 3: เบี้ยขยัน */}
          <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-xs text-center flex flex-col items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1">
              <CreditCard className="w-4 h-4" />
            </div>
            <span className="text-sm font-bold font-mono text-emerald-600">
              {checkInResult ? `+${checkInResult.allowance}฿` : '0฿'}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">เบี้ยขยันวันนี้</span>
          </div>
        </div>

        {/* ----------------------------------------------------------- */}
        {/* HIGH-PRECISION HARDWARE GEOFENCE STATUS CARD                */}
        {/* ----------------------------------------------------------- */}
        <div className="p-4 rounded-3xl bg-white border border-slate-100 shadow-sm space-y-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs ${
                isInsideRadius ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
              }`}>
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <div className="font-extrabold text-slate-900 text-sm leading-tight">
                  {storeSettings?.store_name || 'สีแสงยางยนต์ YOKOHAMA'}
                </div>
                <div className="text-[11px] text-slate-500 font-medium mt-0.5 flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-slate-700">
                    ระยะห่าง: {distance !== null ? `${distance.toFixed(1)} เมตร` : 'กำลังคำนวณ...'}
                  </span>
                  {gpsAccuracy !== null && (
                    <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded-md">
                      (±{gpsAccuracy}ม.)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Geofence Tag */}
            <span className={`px-2.5 py-1 rounded-full font-black text-[11px] shrink-0 ${
              isInsideRadius ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            }`}>
              {isInsideRadius ? `● ในรัศมี ${allowedRadius}ม.` : `● นอกรัศมีร้าน`}
            </span>
          </div>

          {/* Coordinates Details & Refresh */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
            <div className="flex items-center gap-1.5 font-mono">
              <Crosshair className="w-3.5 h-3.5 text-blue-500" />
              {currentCoords ? (
                <span>GPS จริง: {currentCoords.lat.toFixed(5)}, {currentCoords.lng.toFixed(5)}</span>
              ) : (
                <span className="text-amber-600 animate-pulse">📡 กำลังค้นหาสัญญาณดาวเทียม GPS...</span>
              )}
            </div>

            <button
              type="button"
              onClick={refreshRealGPS}
              disabled={gpsLoading}
              className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-50"
              title="ดึงพิกัด GPS สดจากดาวเทียม"
            >
              <RefreshCw className={`w-3 h-3 ${gpsLoading ? 'animate-spin' : ''}`} />
              <span>{gpsLoading ? 'กำลังจับ GPS...' : 'รีเฟรช GPS'}</span>
            </button>
          </div>
        </div>

        {/* History Tabs Section */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs space-y-3">
          <div className="text-sm font-bold text-slate-900 tracking-tight">
            ประวัติการลงเวลาการทำงาน
          </div>

          {/* 3 Pill Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setActiveHistoryTab('in')}
              className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border ${
                activeHistoryTab === 'in'
                  ? 'bg-blue-50 text-blue-600 border-blue-200'
                  : 'bg-slate-50 text-slate-500 border-slate-100'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>เข้างาน</span>
            </button>

            <button
              onClick={() => setActiveHistoryTab('out')}
              className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border ${
                activeHistoryTab === 'out'
                  ? 'bg-blue-50 text-blue-600 border-blue-200'
                  : 'bg-slate-50 text-slate-500 border-slate-100'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>ออกงาน</span>
            </button>

            <button
              onClick={() => setActiveHistoryTab('leave')}
              className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border ${
                activeHistoryTab === 'leave'
                  ? 'bg-blue-50 text-blue-600 border-blue-200'
                  : 'bg-slate-50 text-slate-500 border-slate-100'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>ลางาน</span>
            </button>
          </div>

          {/* Feedback & Result Card */}
          <AnimatePresence>
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">ไม่สามารถบันทึกเวลาได้</div>
                  <div className="text-[11px] mt-0.5">{errorMessage}</div>
                </div>
              </motion.div>
            )}

            {activeHistoryTab === 'in' && checkInResult && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`p-3.5 rounded-xl border text-xs ${
                  checkInResult.status === 'PRESENT'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}
              >
                <div className="flex items-center justify-between font-bold text-sm">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    {checkInResult.status === 'PRESENT' ? 'เช็คอินตรงเวลาสำเร็จ' : 'เช็คอินสำเร็จ (มาสาย)'}
                  </span>
                  <span className="font-mono">{checkInResult.checkInTime}</span>
                </div>
                <div className="text-[11px] text-slate-600 mt-1">
                  เบี้ยขยันที่ได้รับวันนี้: <strong className="text-emerald-600 font-bold">+{checkInResult.allowance} บาท</strong>
                </div>
              </motion.div>
            )}

            {activeHistoryTab === 'out' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`p-3.5 rounded-xl border text-xs ${
                  checkInResult?.checkOutTime
                    ? 'bg-purple-50 border-purple-200 text-purple-900'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                {checkInResult?.checkOutTime ? (
                  <>
                    <div className="flex items-center justify-between font-bold text-sm">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-purple-600" />
                        ลงเวลาออกงานเรียบร้อย
                      </span>
                      <span className="font-mono text-purple-700">{checkInResult.checkOutTime}</span>
                    </div>
                    {checkInResult.workingDuration && (
                      <div className="text-[11px] text-slate-600 mt-1">
                        รวมระยะเวลาทำงาน: <strong className="text-purple-700 font-bold">{checkInResult.workingDuration}</strong>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-between">
                    <span>ยังไม่ได้ลงเวลาออกงานของวันนี้</span>
                    {checkInResult && (
                      <button
                        onClick={handleCheckOut}
                        disabled={isCheckingOut}
                        className="px-2.5 py-1 bg-amber-500 text-white rounded-lg font-bold text-[11px]"
                      >
                        {isCheckingOut ? 'กำลังบันทึก...' : 'กดออกงาน'}
                      </button>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {activeHistoryTab === 'leave' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3.5 rounded-xl border border-blue-100 bg-blue-50/60 text-xs flex items-center justify-between"
              >
                <div className="text-slate-700">
                  <div className="font-bold text-blue-900">ยื่นคำขอลางาน</div>
                  <div className="text-[11px] text-slate-500">ลาป่วย, ลากิจ, ลาพักร้อน ผ่านระบบ</div>
                </div>
                <Link
                  href="/employee/leave"
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-xl font-bold text-xs flex items-center gap-1 shadow-xs"
                >
                  <span>ส่งใบลา</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. FIXED BOTTOM NAVIGATION BAR (3 Clean Primary Tabs)         */}
      {/* ------------------------------------------------------------- */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 backdrop-blur-md border-t border-slate-200 px-6 py-2.5 flex items-center justify-around z-30 shadow-lg">
        {/* Tab 1: เช็คเวลา */}
        <Link 
          href="/employee"
          className="flex flex-col items-center gap-1 text-blue-600 font-bold text-xs"
        >
          <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
            <Clock className="w-4 h-4" />
          </div>
          <span>เช็คเวลา</span>
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
        </Link>

        {/* Tab 2: ปฏิทิน */}
        <Link
          href="/employee/stats"
          className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 font-medium text-xs transition-colors"
        >
          <div className="w-8 h-8 flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
          <span>ปฏิทิน</span>
        </Link>

        {/* Tab 3: ยื่นใบลา */}
        <Link
          href="/employee/leave"
          className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 font-medium text-xs transition-colors"
        >
          <div className="w-8 h-8 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <span>ยื่นใบลา</span>
        </Link>
      </div>
    </div>
  );
}
