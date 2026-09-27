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
  Crosshair,
  Lock,
  Tag,
  Timer,
  AlertTriangle,
  X,
  Sparkles,
  Coins
} from 'lucide-react';
import { calculateHaversineDistance } from '@/lib/geofence';
import { getDeviceHWID } from '@/lib/hwid';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { getLiveHardwarePosition, watchLivePosition, LiveLocationResult } from '@/lib/location';
import { MobileNotificationService } from '@/lib/mobile-notifications';
import EmployeeBottomNav from '@/components/EmployeeBottomNav';

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
  const storeSettingsRef = useRef(storeSettings);
  storeSettingsRef.current = storeSettings;

  // Real Hardware Satellite GPS Coordinates & Accuracy
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(null);
  const currentCoordsRef = useRef(currentCoords);
  currentCoordsRef.current = currentCoords;

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

  // Safeguard: Check-out Confirmation Modal
  const [showCheckOutConfirmModal, setShowCheckOutConfirmModal] = useState(false);

  // Live Working Stopwatch Counter (ชั่วโมง:นาที:วินาที สดๆ)
  const [liveWorkDuration, setLiveWorkDuration] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
    totalSeconds: 0,
    text: '00:00:00',
  });

  // Recalculate Distance Helper (Always uses freshest references)
  const recalculateDistance = useCallback((coords?: { lat: number; lng: number } | null, settings?: any) => {
    const effectiveCoords = coords || currentCoordsRef.current;
    const effectiveSettings = settings || storeSettingsRef.current;

    if (!effectiveCoords?.lat || !effectiveCoords?.lng || !effectiveSettings?.store_lat || !effectiveSettings?.store_lng) {
      return;
    }

    const storeLat = Number(effectiveSettings.store_lat);
    const storeLng = Number(effectiveSettings.store_lng);
    if (isNaN(storeLat) || isNaN(storeLng)) return;

    const dist = calculateHaversineDistance(
      { latitude: effectiveCoords.lat, longitude: effectiveCoords.lng },
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
          const shortLogId = todayLog.id ? `#LOG-${todayLog.id.slice(0, 8).toUpperCase()}` : null;
          setCheckInResult({
            id: todayLog.id,
            logReference: shortLogId,
            status: todayLog.status,
            rawCheckInTime: todayLog.rawCheckInTime || todayLog.check_in_time,
            rawCheckOutTime: todayLog.rawCheckOutTime || todayLog.check_out_time,
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
          storeSettingsRef.current = data.data;
          // Recalculate distance immediately with current hardware coords
          if (currentCoordsRef.current) {
            recalculateDistance(currentCoordsRef.current, data.data);
          }
          if (data.data.standard_time) {
            MobileNotificationService.scheduleShiftCountdown(data.data.standard_time);
          }
        }
      })
      .catch((e) => console.error('Failed to fetch store settings:', e));
  }, [recalculateDistance]);

  // Live Stopwatch Ticker for Elapsed Working Time
  useEffect(() => {
    if (!checkInResult?.rawCheckInTime || checkInResult?.checkOutTime) {
      return;
    }

    const inDate = new Date(checkInResult.rawCheckInTime);

    const updateLiveDuration = () => {
      const now = new Date();
      const diffMs = Math.max(0, now.getTime() - inDate.getTime());
      const totalSecs = Math.floor(diffMs / 1000);
      const hrs = Math.floor(totalSecs / 3600);
      const mins = Math.floor((totalSecs % 3600) / 60);
      const secs = totalSecs % 60;

      const pad = (n: number) => String(n).padStart(2, '0');
      setLiveWorkDuration({
        hours: hrs,
        minutes: mins,
        seconds: secs,
        totalSeconds: totalSecs,
        text: `${pad(hrs)}:${pad(mins)}:${pad(secs)}`,
      });
    };

    updateLiveDuration();
    const interval = setInterval(updateLiveDuration, 1000);
    return () => clearInterval(interval);
  }, [checkInResult?.rawCheckInTime, checkInResult?.checkOutTime]);

  // Manual GPS Refresh Trigger
  const refreshRealGPS = async () => {
    setGpsLoading(true);
    setGpsError(null);
    try {
      const pos = await getLiveHardwarePosition({ enableHighAccuracy: true, timeout: 8000, maximumAge: 0 });
      const newCoords = { lat: pos.latitude, lng: pos.longitude };
      setCurrentCoords(newCoords);
      currentCoordsRef.current = newCoords;
      setGpsAccuracy(pos.accuracy);
      setGpsProvider(pos.provider);
      recalculateDistance(newCoords, storeSettingsRef.current);
    } catch (err: any) {
      console.warn('GPS refresh error:', err);
      setGpsError(err.message || 'ไม่สามารถรับสัญญาณดาวเทียม GPS ได้');
    } finally {
      setGpsLoading(false);
    }
  };

  // Manual Full Refresh (both store coordinates & device GPS)
  const handleManualRefresh = async () => {
    fetchSettings();
    await refreshRealGPS();
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
    MobileNotificationService.requestPermission();
    if (parsedEmp?.id) {
      fetchTodayStatus(parsedEmp.id, parsedEmp.full_name || parsedEmp.fullName);
    }

    // 1.4 Start Continuous Live Hardware Satellite GPS Tracking
    refreshRealGPS();
    const cleanupLocationWatcher = watchLivePosition(
      (pos: LiveLocationResult) => {
        const newCoords = { lat: pos.latitude, lng: pos.longitude };
        setCurrentCoords(newCoords);
        currentCoordsRef.current = newCoords;
        setGpsAccuracy(pos.accuracy);
        setGpsProvider(pos.provider);
        setGpsError(null);
        recalculateDistance(newCoords, storeSettingsRef.current);
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
        'กรกฎาคม', 'สหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
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

  const allowedRadius = Number(storeSettings?.radius_meters) || 50;
  const isInsideRadius = distance !== null && distance <= allowedRadius;

  // Logout Handler
  const handleLogout = () => {
    if (confirm('คุณต้องการออกจากระบบหรือไม่?')) {
      localStorage.removeItem('attendance_employee_profile');
      router.replace('/employee/login');
    }
  };

  // CHECK-IN HANDLER (Strict Geofence Enforcement + Live Satellite Fix)
  const handleCheckIn = async () => {
    if (!employee?.id && !employee?.employeeCode && !employee?.employee_code) return;
    setErrorMessage('');

    // 1. Strict Client-side Geofence Blocking
    if (distance !== null && distance > allowedRadius) {
      setErrorMessage(`🚫 คุณอยู่นอกพื้นที่ร้าน (${distance.toFixed(1)} เมตร เกินกำหนด ${allowedRadius} ม.) ไม่อนุญาตให้ลงเวลาเข้างาน`);
      return;
    }

    setIsCheckingIn(true);

    try {
      // 2. Fetch fresh live hardware satellite position on button press
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
      MobileNotificationService.showCheckInSuccess(
        data.data.checkInTime || time.hhmm,
        data.data.status !== 'PRESENT',
        data.data.allowance || 0
      );

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

  // CHECK-OUT SAFEGUARD TRIGGER (Shows Confirmation Modal)
  const promptCheckOut = () => {
    if (!employee?.id && !employee?.employeeCode && !employee?.employee_code) return;
    setErrorMessage('');

    // Strict Client-side Geofence Blocking
    if (distance !== null && distance > allowedRadius) {
      setErrorMessage(`🚫 คุณอยู่นอกพื้นที่ร้าน (${distance.toFixed(1)} เมตร เกินกำหนด ${allowedRadius} ม.) ไม่อนุญาตให้ลงเวลาออกงาน`);
      return;
    }

    setShowCheckOutConfirmModal(true);
  };

  // CHECK-OUT EXECUTION HANDLER
  const executeCheckOut = async () => {
    setShowCheckOutConfirmModal(false);
    setIsCheckingOut(true);

    try {
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
        rawCheckOutTime: data.data.rawCheckOutTime,
      }));

      MobileNotificationService.showCheckOutSuccess(
        data.data.checkOutTime || time.hhmm,
        data.data.workHours
      );

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

  return (
    <div className="min-h-screen w-full bg-slate-50 flex flex-col justify-between select-none font-sans text-slate-800 pb-20">
      {/* ------------------------------------------------------------- */}
      {/* 1. TOP HEADER (Blue Brand Theme)                              */}
      {/* ------------------------------------------------------------- */}
      <div className="w-full bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white px-5 pt-8 pb-5 rounded-b-3xl shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 text-white shadow-inner font-extrabold text-sm">
              {employee?.nickname ? employee.nickname[0] : (employee?.full_name ? employee.full_name[0] : 'พ')}
            </div>
            <div>
              <div className="text-[11px] font-bold text-blue-100 flex items-center gap-1.5">
                <span>พนักงาน</span>
                <span className="font-mono bg-white/20 px-1.5 py-0.2 rounded-md text-[10px]">
                  {employee?.employee_code || employee?.employeeCode || 'EMP'}
                </span>
              </div>
              <div className="text-sm font-extrabold tracking-tight leading-tight">
                {employee?.full_name || employee?.fullName || 'พนักงานปฏิบัติการ'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="ออกจากระบบ"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. MAIN INTERACTIVE CONTENT AREA                              */}
      {/* ------------------------------------------------------------- */}
      <div className="px-4 py-4 space-y-4 max-w-md w-full mx-auto flex-1">
        
        {/* Main Attendance Action Card */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col items-center text-center space-y-3 relative overflow-hidden">
          
          {/* Subtle Top Accent */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500" />

          {/* Date Label */}
          <div className="text-xs font-bold text-slate-400">
            {time.dateThai}
          </div>

          {/* Big Digital Clock */}
          <div className="flex items-baseline justify-center font-mono font-black text-slate-900 leading-none">
            <span className="text-5xl tracking-tighter">{time.hhmm}</span>
            <span className="text-xl text-slate-400 ml-1.5 font-medium">:{time.ss}</span>
          </div>

          {/* Geofence Status Indicator */}
          <div className="flex items-center justify-center">
            {currentCoords ? (
              isInsideRadius ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>อยู่ในรัศมีร้าน ({distance?.toFixed(0)} ม.) พร้อมลงเวลา</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>อยู่นอกระยะร้าน ({distance !== null ? `${distance.toFixed(0)} ม.` : 'กำลังค้นหา'})</span>
                </div>
              )
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>กำลังระบุพิกัดดาวเทียม...</span>
              </div>
            )}
          </div>

          {/* Big Circular Action Button */}
          <div className="py-2 relative">
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
              onClick={!checkInResult ? handleCheckIn : !checkInResult.checkOutTime ? promptCheckOut : undefined}
              disabled={isCheckingIn || isCheckingOut || (!!checkInResult && !!checkInResult.checkOutTime)}
              className={`relative z-10 w-24 h-24 rounded-full flex flex-col items-center justify-center text-white ring-4 shadow-2xl transition-all ${
                !checkInResult
                  ? isInsideRadius
                    ? 'bg-gradient-to-b from-[#3b82f6] via-[#2563eb] to-[#1d4ed8] ring-white shadow-blue-600/50'
                    : 'bg-gradient-to-b from-slate-600 via-slate-700 to-slate-800 ring-rose-300 shadow-slate-700/50'
                  : !checkInResult.checkOutTime
                    ? isInsideRadius
                      ? 'bg-gradient-to-b from-amber-500 via-orange-500 to-rose-600 ring-white shadow-orange-500/50'
                      : 'bg-gradient-to-b from-slate-600 via-slate-700 to-slate-800 ring-rose-300 shadow-slate-700/50'
                    : 'bg-gradient-to-b from-emerald-500 to-teal-600 ring-white shadow-emerald-500/40'
              }`}
            >
              {isCheckingIn || isCheckingOut ? (
                <RefreshCw className="w-7 h-7 animate-spin text-white" />
              ) : !checkInResult ? (
                isInsideRadius ? (
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
                ) : (
                  <div className="flex flex-col items-center justify-center text-rose-200">
                    <Lock className="w-7 h-7 mb-0.5" />
                    <span className="text-[10px] font-bold tracking-tight text-white">นอกพื้นที่</span>
                  </div>
                )
              ) : !checkInResult.checkOutTime ? (
                isInsideRadius ? (
                  <div className="flex flex-col items-center justify-center">
                    <LogOut className="w-7 h-7 text-white mb-0.5" />
                    <span className="text-xs font-bold tracking-tight">ออกงาน</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-rose-200">
                    <Lock className="w-7 h-7 mb-0.5" />
                    <span className="text-[10px] font-bold tracking-tight text-white">นอกพื้นที่</span>
                  </div>
                )
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
        <div className="grid grid-cols-3 gap-3 pt-1">
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
        {/* LIVE WORKING DURATION COUNTER (REAL-TIME STOPWATCH)         */}
        {/* ----------------------------------------------------------- */}
        {checkInResult && !checkInResult.checkOutTime && (
          <div className="p-4 rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white shadow-lg space-y-3 relative overflow-hidden border border-blue-500/20">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-400/30">
                  <Timer className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs text-blue-200">นับเวลาปฏิบัติงานสด (Live Shift Timer)</div>
                  <div className="text-[10px] text-slate-400">เช็คอินตั้งแต่ {checkInResult.checkInTime}</div>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black flex items-center gap-1.5 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                กำลังทำงาน
              </span>
            </div>

            {/* Big Digits Display */}
            <div className="flex items-center justify-center gap-2 py-2">
              <div className="bg-white/10 px-3.5 py-2 rounded-2xl border border-white/10 text-center min-w-[64px]">
                <div className="text-2xl font-black font-mono tracking-tight text-white">{String(liveWorkDuration.hours).padStart(2, '0')}</div>
                <div className="text-[9px] text-slate-400 uppercase font-bold">ชั่วโมง</div>
              </div>
              <span className="text-xl font-black text-blue-400">:</span>
              <div className="bg-white/10 px-3.5 py-2 rounded-2xl border border-white/10 text-center min-w-[64px]">
                <div className="text-2xl font-black font-mono tracking-tight text-white">{String(liveWorkDuration.minutes).padStart(2, '0')}</div>
                <div className="text-[9px] text-slate-400 uppercase font-bold">นาที</div>
              </div>
              <span className="text-xl font-black text-blue-400">:</span>
              <div className="bg-white/10 px-3.5 py-2 rounded-2xl border border-white/10 text-center min-w-[64px]">
                <div className="text-2xl font-black font-mono tracking-tight text-emerald-400">{String(liveWorkDuration.seconds).padStart(2, '0')}</div>
                <div className="text-[9px] text-slate-400 uppercase font-bold">วินาที</div>
              </div>
            </div>

            {/* 8-Hour Target Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] text-slate-300 font-medium">
                <span className="flex items-center gap-1">
                  <span>เป้าหมายกะทำงาน (8 ชม.)</span>
                  {liveWorkDuration.hours >= 8 && (
                    <span className="px-1.5 py-0.2 bg-amber-500/30 text-amber-300 rounded text-[9px] font-bold">
                      🔥 ครบเวลาแล้ว (OT)
                    </span>
                  )}
                </span>
                <span className="font-mono">{Math.min(100, Math.round((liveWorkDuration.totalSeconds / 28800) * 100))}%</span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${
                    liveWorkDuration.hours >= 8 
                      ? 'bg-gradient-to-r from-amber-400 to-emerald-400' 
                      : 'bg-gradient-to-r from-blue-500 to-indigo-400'
                  }`}
                  style={{ width: `${Math.min(100, (liveWorkDuration.totalSeconds / 28800) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------- */}
        {/* COMPLETED SHIFT SUMMARY CARD                                */}
        {/* ----------------------------------------------------------- */}
        {checkInResult?.checkOutTime && (
          <div className="p-4 rounded-3xl bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 border border-purple-200 text-purple-950 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-bold shadow-xs">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-extrabold text-xs text-purple-950">เสร็จสิ้นการทำงานวันนี้แล้ว</div>
                  <div className="text-[10px] text-purple-700 font-medium">ออกงานเมื่อเวลา {checkInResult.checkOutTime}</div>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-purple-200/80 text-purple-950 text-xs font-extrabold">
                {checkInResult.workingDuration || 'ครบเวลา'}
              </span>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------- */}
        {/* HIGH-PRECISION HARDWARE GEOFENCE STATUS CARD                */}
        {/* ----------------------------------------------------------- */}
        <div className="p-4 rounded-3xl bg-white border border-slate-100 shadow-sm space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs shrink-0 ${
                isInsideRadius ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
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
              isInsideRadius ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-rose-100 text-rose-800 border border-rose-300'
            }`}>
              {isInsideRadius ? `🟢 ในรัศมี ${allowedRadius}ม.` : `🔴 นอกรัศมี (${distance !== null ? `${distance.toFixed(0)}ม.` : ''})`}
            </span>
          </div>

          {/* Detailed Coordinates Comparison */}
          <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5 text-[11px] font-mono">
            <div className="flex items-center justify-between text-slate-600">
              <span className="font-bold text-slate-500 flex items-center gap-1">
                <span>🏢 จุดร้าน (Cloud):</span>
              </span>
              <span className="font-semibold text-slate-900">
                {storeSettings?.store_lat ? `${Number(storeSettings.store_lat).toFixed(6)}, ${Number(storeSettings.store_lng).toFixed(6)}` : 'กำลังโหลด...'}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span className="font-bold text-slate-500 flex items-center gap-1">
                <span>📱 พิกัดมือถือ (GPS):</span>
              </span>
              <span className="font-semibold text-slate-900">
                {currentCoords ? `${currentCoords.lat.toFixed(6)}, ${currentCoords.lng.toFixed(6)}` : '📡 กำลังจับสัญญาณ...'}
              </span>
            </div>
          </div>

          {/* Coordinates Details & Refresh */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-[10px] text-slate-400 font-medium">
              {isInsideRadius ? '✅ ปลดล็อกปุ่มลงเวลาแล้ว' : `⚠️ เกินรัศมีอนุญาต ${allowedRadius} เมตร`}
            </span>

            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={gpsLoading}
              className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 transition-all active:scale-95 text-xs shadow-xs"
              title="ดึงพิกัดร้านล่าสุดจาก Cloud และรีเฟรช GPS สด"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${gpsLoading ? 'animate-spin' : ''}`} />
              <span>{gpsLoading ? 'กำลังจับ GPS...' : 'รีเฟรชพิกัดสด'}</span>
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
                  <div className="font-bold">ไม่สามารถลงเวลาได้</div>
                  <div className="text-[11px] mt-0.5 leading-relaxed">{errorMessage}</div>
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
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-emerald-200/60 text-[11px]">
                  <span>เบี้ยขยันวันนี้: <strong className="text-emerald-700 font-bold">+{checkInResult.allowance} บาท</strong></span>
                  {checkInResult.logReference && (
                    <span className="font-mono font-black px-2 py-0.5 rounded-md bg-emerald-200/80 text-emerald-900">
                      {checkInResult.logReference}
                    </span>
                  )}
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
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-purple-200/60 text-[11px]">
                      {checkInResult.workingDuration && (
                        <span>รวมเวลาทำงาน: <strong className="text-purple-700 font-bold">{checkInResult.workingDuration}</strong></span>
                      )}
                      {checkInResult.logReference && (
                        <span className="font-mono font-black px-2 py-0.5 rounded-md bg-purple-200/80 text-purple-900">
                          {checkInResult.logReference}
                        </span>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-between">
                    <span>ยังไม่ได้ลงเวลาออกงานของวันนี้</span>
                    {checkInResult && (
                      <button
                        onClick={promptCheckOut}
                        disabled={isCheckingOut}
                        className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold text-[11px] transition-all"
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
      {/* 3. MODAL: CHECK-OUT SAFEGUARD CONFIRMATION DIALOG             */}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        {showCheckOutConfirmModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="max-w-sm w-full p-6 rounded-3xl bg-white border border-slate-200 shadow-2xl space-y-4 text-center"
            >
              <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-600 mx-auto flex items-center justify-center shadow-inner">
                <AlertTriangle className="w-7 h-7" />
              </div>

              <div>
                <h3 className="font-black text-base text-slate-900">ยืนยันการลงเวลาออกงาน?</h3>
                <p className="text-xs text-slate-500 mt-1">
                  โปรดตรวจสอบเวลาทำงานของคุณก่อนยืนยัน เพื่อป้องกันการเผลอกด
                </p>
              </div>

              {/* Working Duration Summary Box */}
              <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-1.5 text-xs text-amber-900">
                <div className="font-bold flex items-center justify-center gap-1.5">
                  <Timer className="w-4 h-4 text-amber-600" />
                  <span>เวลาปฏิบัติงานของคุณ ณ ตอนนี้:</span>
                </div>
                <div className="text-xl font-black font-mono text-amber-700">
                  {liveWorkDuration.hours} ชม. {liveWorkDuration.minutes} นาที {liveWorkDuration.seconds} วินาที
                </div>
                {liveWorkDuration.hours < 8 ? (
                  <div className="text-[11px] text-amber-800 font-medium bg-white/70 p-2 rounded-xl border border-amber-200/60 mt-1">
                    ⚠️ คุณยังทำงานไม่ครบกะ 8 ชั่วโมง (ยังอยู่ในเวลางาน) หากเผลอกดโดนปุ่ม กรุณากด <strong>"ยกเลิก"</strong>
                  </div>
                ) : (
                  <div className="text-[11px] text-emerald-800 font-medium bg-emerald-50 p-2 rounded-xl border border-emerald-200 mt-1">
                    🟢 ครบกะทำงานมาตรฐาน 8 ชั่วโมงแล้ว พร้อมบันทึกออกงาน
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCheckOutConfirmModal(false)}
                  className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all active:scale-95"
                >
                  ✕ ยกเลิก (เผลอกด)
                </button>
                <button
                  type="button"
                  onClick={executeCheckOut}
                  disabled={isCheckingOut}
                  className="py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-black text-xs shadow-md shadow-orange-500/20 transition-all active:scale-95 flex items-center justify-center gap-1.5"
                >
                  {isCheckingOut ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  <span>{isCheckingOut ? 'กำลังบันทึก...' : '✓ ยืนยันออกงาน'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------- */}
      {/* 4. SMART AUTO-HIDE BOTTOM NAVIGATION BAR                      */}
      {/* ------------------------------------------------------------- */}
      <EmployeeBottomNav currentTab="checkin" />
    </div>
  );
}
