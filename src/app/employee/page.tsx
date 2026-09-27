'use client';

import { useState, useEffect } from 'react';
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
  LogOut 
} from 'lucide-react';
import { calculateHaversineDistance } from '@/lib/geofence';
import { getDeviceHWID } from '@/lib/hwid';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export default function ExactEmployeeApp() {
  const router = useRouter();

  // Employee Profile & HWID
  const [employee, setEmployee] = useState<any>(null);
  const [hwid, setHwid] = useState('');
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // Live Real-Time Clock
  const [time, setTime] = useState({
    hhmm: '09:28',
    ss: '34',
    dateThai: 'วันศุกร์, 20 มกราคม 2023',
    rawTimeStr: '09:28:34',
  });

  // Store Settings & Geofence
  const [storeSettings, setStoreSettings] = useState<any>({
    store_name: 'สีแสงยางยนต์ (YOKOHAMA NAYA COSMIS)',
    store_lat: 15.110412,
    store_lng: 104.358434,
    radius_meters: 50,
    standard_time: '07:40',
    late_deadline: '08:00',
    allowance_amount: 50,
  });

  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>({
    lat: 15.110412,
    lng: 104.358434,
  });
  const [distance, setDistance] = useState<number | null>(5);

  // Check-in & Check-out State & Results
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkInResult, setCheckInResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeHistoryTab, setActiveHistoryTab] = useState<'in' | 'out' | 'leave'>('in');
  const [activeNavTab, setActiveNavTab] = useState<'clock' | 'calendar' | 'allowance' | 'requests'>('clock');

  // Simulation Controls
  const [simMode, setSimMode] = useState<'inside' | 'outside'>('inside');
  const [simTimeMode, setSimTimeMode] = useState<'ontime' | 'late'>('ontime');
  const [showSimPanel, setShowSimPanel] = useState(false);

  const fetchTodayStatus = (empId: string, empName: string) => {
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
            allowance: todayLog.allowance || 0,
            distance: todayLog.distance || 0,
            isLate: todayLog.status === 'LATE',
            employeeName: empName,
          });
        }
      })
      .catch((err) => console.error('Error fetching today status:', err));
  };

  const fetchSettings = () => {
    fetch('/api/admin/settings', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setStoreSettings(data.data);
        }
      })
      .catch((e) => console.error(e));
  };

  useEffect(() => {
    // 1. Auth Guard - Check saved profile
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

    // 2. Fetch HWID
    const deviceHwid = getDeviceHWID();
    setHwid(deviceHwid);

    // 3. Store Settings
    fetchSettings();

    // 4. Fetch today's check-in status for this employee
    if (parsedEmp?.id) {
      fetchTodayStatus(parsedEmp.id, parsedEmp.full_name || parsedEmp.fullName);
    }

    // 5. Supabase Realtime Channel for Store Settings & Attendance Updates
    let channel: any = null;
    if (isSupabaseConfigured && supabase && parsedEmp?.id) {
      channel = supabase
        .channel(`employee-sync-${parsedEmp.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'store_settings' }, () => {
          fetchSettings();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance_logs' }, () => {
          fetchTodayStatus(parsedEmp.id, parsedEmp.full_name || parsedEmp.fullName);
        })
        .subscribe();
    }

    // 6. Clock Ticker
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
    const interval = setInterval(updateClock, 1000);
    return () => {
      clearInterval(interval);
      if (channel && supabase) supabase.removeChannel(channel);
    };
  }, [router]);

  // Real GPS & Distance Tracking
  const [gpsLoading, setGpsLoading] = useState(false);
  const [isUsingRealGPS, setIsUsingRealGPS] = useState(false);

  const refreshRealGPS = () => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      setGpsLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setCurrentCoords({ lat, lng });
          setIsUsingRealGPS(true);
          setGpsLoading(false);

          if (storeSettings) {
            const dist = calculateHaversineDistance(
              { latitude: lat, longitude: lng },
              { latitude: Number(storeSettings.store_lat) || 15.110412, longitude: Number(storeSettings.store_lng) || 104.358434 }
            );
            setDistance(dist);
          }
        },
        (err) => {
          console.warn('GPS Geolocation notice:', err.message);
          setGpsLoading(false);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    }
  };

  useEffect(() => {
    if (!storeSettings) return;

    if (!isUsingRealGPS) {
      let targetLat = Number(storeSettings.store_lat) || 15.110412;
      let targetLng = Number(storeSettings.store_lng) || 104.358434;

      if (simMode === 'inside') {
        targetLat += 0.00003;
        targetLng += 0.00003;
        setCurrentCoords({ lat: targetLat, lng: targetLng });
      } else {
        targetLat += 0.0012;
        targetLng += 0.0012;
        setCurrentCoords({ lat: targetLat, lng: targetLng });
      }

      if (targetLat && targetLng) {
        const dist = calculateHaversineDistance(
          { latitude: targetLat, longitude: targetLng },
          { latitude: Number(storeSettings.store_lat) || 15.110412, longitude: Number(storeSettings.store_lng) || 104.358434 }
        );
        setDistance(dist);
      }
    }
  }, [simMode, storeSettings, isUsingRealGPS]);

  // Logout Handler
  const handleLogout = () => {
    if (confirm('คุณต้องการออกจากระบบหรือไม่?')) {
      localStorage.removeItem('attendance_employee_profile');
      router.replace('/employee/login');
    }
  };

  const handleCheckIn = async () => {
    if (!employee?.id && !employee?.employeeCode && !employee?.employee_code) return;
    setIsCheckingIn(true);
    setErrorMessage('');

    let simulatedTimestamp = null;
    if (showSimPanel) {
      const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date());
      if (simTimeMode === 'ontime') {
        simulatedTimestamp = `${todayStr}T07:45:00+07:00`;
      } else {
        simulatedTimestamp = `${todayStr}T08:15:00+07:00`;
      }
    }

    try {
      const empId = employee.id || employee.employeeId;
      const res = await fetch('/api/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: empId,
          latitude: currentCoords?.lat || 15.110412,
          longitude: currentCoords?.lng || 104.358434,
          accuracy: 5,
          hwid,
          simulatedTime: simulatedTimestamp,
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

  const handleCheckOut = async () => {
    if (!employee?.id && !employee?.employeeCode && !employee?.employee_code) return;
    setIsCheckingOut(true);
    setErrorMessage('');

    let simulatedTimestamp = null;
    if (showSimPanel) {
      const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date());
      simulatedTimestamp = `${todayStr}T17:05:00+07:00`;
    }

    try {
      const empId = employee.id || employee.employeeId;
      const res = await fetch('/api/check-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: empId,
          latitude: currentCoords?.lat || 15.110412,
          longitude: currentCoords?.lng || 104.358434,
          accuracy: 5,
          hwid,
          simulatedTime: simulatedTimestamp,
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

  const isInsideRadius = distance !== null && distance <= (storeSettings?.radius_meters || 50);

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

        {/* Geofence Status Banner */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-100 shadow-xs flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isInsideRadius ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-slate-800">{storeSettings?.store_name || 'สีแสงยางยนต์'}</div>
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <span>ระยะห่าง: {distance !== null ? `${distance.toFixed(0)} เมตร` : 'กำลังคำนวณ...'}</span>
                <button
                  type="button"
                  onClick={refreshRealGPS}
                  className="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-0.5"
                  title="รีเฟรชพิกัด GPS จริงจากมือถือ"
                >
                  <RefreshCw className={`w-3 h-3 ${gpsLoading ? 'animate-spin' : ''}`} />
                  <span>{gpsLoading ? 'กำลังจับ GPS...' : 'รีเฟรช GPS'}</span>
                </button>
              </div>
            </div>
          </div>
          <span className={`px-2.5 py-1 rounded-full font-bold text-[11px] ${
            isInsideRadius ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
          }`}>
            {isInsideRadius ? `● ในพื้นที่ ${storeSettings?.radius_meters || 50}ม.` : '● นอกรัศมีร้าน'}
          </span>
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
                  <div className="font-bold">ไม่สามารถเช็คอินได้</div>
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
                  <span className="font-mono">{checkInResult.checkInTime} น.</span>
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
