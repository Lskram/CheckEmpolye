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

  // Check-in State & Results
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [checkInResult, setCheckInResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeHistoryTab, setActiveHistoryTab] = useState<'in' | 'out' | 'leave'>('in');
  const [activeNavTab, setActiveNavTab] = useState<'clock' | 'calendar' | 'allowance' | 'requests'>('clock');

  // Simulation Controls
  const [simMode, setSimMode] = useState<'inside' | 'outside'>('inside');
  const [simTimeMode, setSimTimeMode] = useState<'ontime' | 'late'>('ontime');
  const [showSimPanel, setShowSimPanel] = useState(false);

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
    fetch('/api/admin/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setStoreSettings(data.data);
        }
      })
      .catch((e) => console.error(e));

    // 4. Fetch today's check-in status for this employee
    if (parsedEmp?.id) {
      fetch(`/api/employee/stats?id=${parsedEmp.id}`)
        .then((res) => res.json())
        .then((resData) => {
          if (resData.success && resData.data?.logs) {
            const todayStr = new Date().toISOString().split('T')[0];
            const todayLog = resData.data.logs.find((l: any) => l.check_in_time?.startsWith(todayStr));
            if (todayLog) {
              const timeStr = new Date(todayLog.check_in_time).toLocaleTimeString('th-TH', {
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'Asia/Bangkok',
              });
              setCheckInResult({
                id: todayLog.id,
                status: todayLog.status,
                checkInTime: timeStr,
                allowance: todayLog.allowance || 0,
                distance: todayLog.distance_from_store || 0,
                isLate: todayLog.status === 'LATE',
                employeeName: parsedEmp.full_name || parsedEmp.fullName,
              });
            }
          }
        })
        .catch((err) => console.error('Error fetching today status:', err));
    }

    // 5. Clock Ticker
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
      const year = now.getFullYear();

      setTime({
        hhmm: `${hh}:${mm}`,
        ss,
        dateThai: `${dayName}, ${dayDate} ${monthName} ${year}`,
        rawTimeStr: `${hh}:${mm}:${ss}`,
      });
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, [router]);

  // Distance calculation & GPS Tracking
  useEffect(() => {
    if (!storeSettings) return;

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
  }, [simMode, storeSettings]);

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
    const todayStr = new Date().toISOString().split('T')[0];
    if (simTimeMode === 'ontime') {
      simulatedTimestamp = `${todayStr}T07:45:00+07:00`;
    } else {
      simulatedTimestamp = `${todayStr}T08:15:00+07:00`;
    }

    try {
      const empId = employee.id || '11111111-1111-1111-1111-111111111111';
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

          {/* Overlapping Circular Check-In Button */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-20">
            {/* Pulsing Ripple Effect */}
            {isInsideRadius && !checkInResult && (
              <motion.div
                className="absolute -top-3 -left-3 w-30 h-30 rounded-full bg-blue-500/25"
                animate={{ scale: [1, 1.4, 1.7], opacity: [0.8, 0.25, 0] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
              />
            )}

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.92 }}
              onClick={handleCheckIn}
              disabled={isCheckingIn || !!checkInResult}
              className={`relative z-10 w-24 h-24 rounded-full flex flex-col items-center justify-center text-white ring-4 ring-white shadow-2xl transition-all ${
                checkInResult
                  ? checkInResult.status === 'PRESENT'
                    ? 'bg-gradient-to-b from-emerald-500 to-teal-600 shadow-emerald-500/40'
                    : 'bg-gradient-to-b from-amber-500 to-orange-600 shadow-amber-500/40'
                  : 'bg-gradient-to-b from-[#3b82f6] via-[#2563eb] to-[#1d4ed8] shadow-blue-600/50'
              }`}
            >
              {isCheckingIn ? (
                <RefreshCw className="w-7 h-7 animate-spin text-white" />
              ) : checkInResult ? (
                <div className="flex flex-col items-center">
                  <CheckCircle2 className="w-7 h-7 text-white mb-0.5" />
                  <span className="text-[11px] font-bold">เช็คอินแล้ว</span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center">
                  {/* Fingerprint / Touch Pointer Icon */}
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
            <div className="w-8 h-8 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mb-1">
              <Clock className="w-4 h-4" />
            </div>
            <span className="text-sm font-bold font-mono text-slate-400">
              --:--
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
              <div className="font-bold text-slate-800">ศิริแสงยางยนต์ ศรีสะเกษ</div>
              <div className="text-[11px] text-slate-400">ระยะห่าง: {distance !== null ? `${distance.toFixed(0)} เมตร` : 'กำลังคำนวณ...'}</div>
            </div>
          </div>
          <span className={`px-2.5 py-1 rounded-full font-bold text-[11px] ${
            isInsideRadius ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
          }`}>
            {isInsideRadius ? '● ในพื้นที่ 50ม.' : '● นอกรัศมีร้าน'}
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

            {checkInResult && (
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
          </AnimatePresence>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. FIXED BOTTOM NAVIGATION BAR                                */}
      {/* ------------------------------------------------------------- */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-2.5 flex items-center justify-around z-30 shadow-lg">
        {/* Tab 1: เช็คเวลาทำงาน */}
        <button 
          onClick={() => setActiveNavTab('clock')}
          className="flex flex-col items-center gap-1 text-blue-600 font-bold text-[10px]"
        >
          <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <Clock className="w-3.5 h-3.5" />
          </div>
          <span>เช็คเวลา</span>
        </button>

        {/* Tab 2: ปฏิทิน */}
        <Link
          href="/employee/stats"
          className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 text-[10px]"
        >
          <div className="w-6 h-6 flex items-center justify-center">
            <Calendar className="w-4 h-4" />
          </div>
          <span>ปฏิทิน</span>
        </Link>

        {/* Tab 3: เบี้ยขยัน */}
        <Link
          href="/employee/stats"
          className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 text-[10px]"
        >
          <div className="w-6 h-6 flex items-center justify-center">
            <CreditCard className="w-4 h-4" />
          </div>
          <span>เบี้ยขยัน</span>
        </Link>

        {/* Tab 4: ลางาน */}
        <Link
          href="/employee/leave"
          className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 text-[10px]"
        >
          <div className="w-6 h-6 flex items-center justify-center">
            <FileText className="w-4 h-4" />
          </div>
          <span>ลางาน</span>
        </Link>
      </div>
    </div>
  );
}
