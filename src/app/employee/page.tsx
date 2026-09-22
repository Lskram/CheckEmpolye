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
  Wifi,
  Battery
} from 'lucide-react';
import { calculateHaversineDistance } from '@/lib/geofence';
import { getDeviceHWID } from '@/lib/hwid';

export default function ExactEmployeeApp() {
  const router = useRouter();

  // Employee Profile & HWID
  const [employee, setEmployee] = useState<any>({
    fullName: 'สมศักดิ์ คงศรี',
    employeeCode: 'EMP001',
    nickname: 'ศักดิ์',
  });
  const [hwid, setHwid] = useState('');

  // Live Real-Time Clock
  const [time, setTime] = useState({
    hhmm: '09:28',
    ss: '34',
    dateThai: 'วันศุกร์, 20 มกราคม 2023',
    rawTimeStr: '09:28:34',
  });

  // Store Settings & Geofence
  const [storeSettings, setStoreSettings] = useState<any>({
    store_name: 'สาขาหลัก YOKOHAMA & NAYA WHEELS',
    store_lat: 13.7460000,
    store_lng: 100.5340000,
    radius_meters: 50,
    standard_time: '07:40',
    late_deadline: '08:00',
    allowance_amount: 50,
  });

  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [distance, setDistance] = useState<number | null>(null);

  // Check-in State & Results
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [checkInResult, setCheckInResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeHistoryTab, setActiveHistoryTab] = useState<'in' | 'out' | 'leave'>('in');
  const [activeNavTab, setActiveNavTab] = useState<'clock' | 'calendar' | 'allowance' | 'requests' | 'menu'>('clock');

  // Simulation Controls
  const [simMode, setSimMode] = useState<'inside' | 'outside'>('inside');
  const [simTimeMode, setSimTimeMode] = useState<'ontime' | 'late'>('ontime');
  const [showSimPanel, setShowSimPanel] = useState(false);

  useEffect(() => {
    // 1. Logged in profile
    const saved = localStorage.getItem('attendance_employee_profile');
    if (saved) {
      try {
        setEmployee(JSON.parse(saved));
      } catch (e) {}
    }

    // 2. HWID
    setHwid(getDeviceHWID());

    // 3. Store Settings
    fetch('/api/admin/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setStoreSettings(data.data);
        }
      })
      .catch((e) => console.error(e));

    // 4. Clock Ticker
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
  }, []);

  // Distance calculation
  useEffect(() => {
    if (!storeSettings) return;

    let targetLat = storeSettings.store_lat;
    let targetLng = storeSettings.store_lng;

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
        { latitude: storeSettings.store_lat, longitude: storeSettings.store_lng }
      );
      setDistance(dist);
    }
  }, [simMode, storeSettings]);

  const handleCheckIn = async () => {
    if (!employee?.id && !employee?.employeeCode) return;
    setIsCheckingIn(true);
    setErrorMessage('');
    setCheckInResult(null);

    let simulatedTimestamp = null;
    const todayStr = new Date().toISOString().split('T')[0];
    if (simTimeMode === 'ontime') {
      simulatedTimestamp = `${todayStr}T07:45:00+07:00`;
    } else {
      simulatedTimestamp = `${todayStr}T08:15:00+07:00`;
    }

    try {
      const empId = employee.id || '22222222-2222-2222-2222-222222222222';
      const res = await fetch('/api/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: empId,
          latitude: currentCoords?.lat || 13.74603,
          longitude: currentCoords?.lng || 100.53403,
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
          particleCount: 85,
          spread: 70,
          origin: { y: 0.5 },
          colors: ['#38bdf8', '#2563eb', '#fbbf24', '#ffffff'],
        });
      }
    } catch (err: any) {
      setErrorMessage('เกิดข้อผิดพลาดในการเชื่อมต่อ: ' + err.message);
    } finally {
      setIsCheckingIn(false);
    }
  };

  const isInsideRadius = distance !== null && distance <= (storeSettings?.radius_meters || 50);

  return (
    <div className="min-h-screen bg-[#1c4885] flex flex-col items-center justify-start py-4 sm:py-8 px-2 select-none font-sans text-slate-800">
      {/* ------------------------------------------------------------- */}
      {/* TOP PROMO TEXT (EXACTLY MATCHING USER SCREENSHOT HEADER)      */}
      {/* ------------------------------------------------------------- */}
      <div className="text-center text-white mb-5">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
          ลงเวลาเข้างาน
        </h1>
        <p className="text-xs sm:text-sm text-blue-100/90 font-light mt-0.5">
          เพื่อลดเวลาการทำงานของคุณ
        </p>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SMARTPHONE FRAME CONTAINER (EXACT MATCH)                      */}
      {/* ------------------------------------------------------------- */}
      <div className="w-full max-w-[370px] bg-white rounded-[44px] shadow-2xl ring-[10px] ring-slate-900/90 overflow-hidden relative flex flex-col border-[4px] border-slate-950">
        
        {/* Top Status Bar with Dynamic Island */}
        <div className="pt-2.5 px-6 flex items-center justify-between text-xs text-slate-900 bg-white font-semibold z-30">
          <span className="text-[12px] font-bold tracking-tight">9:41</span>
          
          {/* Dynamic Island */}
          <div className="w-24 h-5 bg-black rounded-full mx-auto -mt-0.5 flex items-center justify-end px-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-900/40"></span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="text-[10px]">5G</span>
            <Wifi className="w-3.5 h-3.5 stroke-[2.5]" />
            <Battery className="w-4 h-4 stroke-[2.5]" />
          </div>
        </div>

        {/* ----------------------------------------------------------- */}
        {/* PROFILE ROW HEADER                                          */}
        {/* ----------------------------------------------------------- */}
        <div className="px-5 pt-3 pb-2 flex items-center justify-between bg-white">
          {/* Staff Avatar + Name */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center relative shadow-xs">
              {/* Profile Illustration */}
              <div className="w-full h-full bg-gradient-to-tr from-slate-200 to-slate-100 flex items-center justify-center">
                <span className="font-bold text-slate-700 text-xs">
                  {employee?.nickname?.[0] || 'ส'}
                </span>
              </div>
            </div>
            <div className="font-bold text-slate-900 text-sm tracking-tight">
              {employee?.fullName || 'สมศักดิ์ คงศรี'}
            </div>
          </div>

          {/* Top Right Badges (Lock & Bell) */}
          <div className="flex items-center gap-2.5">
            {/* HWID Device Security Badge */}
            <div className="relative w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500">
              <Shield className="w-4 h-4 text-slate-600" />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                1
              </span>
            </div>

            {/* Notification Bell Badge */}
            <div className="relative w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500">
              <Bell className="w-4 h-4 text-slate-600" />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                1
              </span>
            </div>
          </div>
        </div>

        {/* ----------------------------------------------------------- */}
        {/* BLUE GRADIENT HERO CARD + EMBEDDED BUTTON                   */}
        {/* ----------------------------------------------------------- */}
        <div className="px-4 pt-1 pb-10 relative bg-white">
          {/* Main Blue Card */}
          <div className="bg-gradient-to-b from-[#3b82f6] via-[#2f77eb] to-[#2563eb] rounded-3xl pt-6 pb-12 px-4 text-center text-white relative shadow-md">
            {/* Digital Clock */}
            <div className="flex items-baseline justify-center gap-0.5 mb-2">
              <span className="text-4xl font-extrabold tracking-tight font-mono">
                {time.hhmm}
              </span>
              <span className="text-sm font-semibold font-mono text-blue-200">
                {time.ss}
              </span>
            </div>

            {/* Thai Date */}
            <p className="text-[11px] font-medium text-blue-100 tracking-tight">
              {time.dateThai}
            </p>

            {/* Shift Rules Badge */}
            <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-950/40 border border-white/20 text-[10px] font-bold text-white shadow-xs">
              <span>⏰ กะปกติ {storeSettings?.standard_time?.substring(0, 5) || '07:40'} น.</span>
              <span>•</span>
              <span className="text-amber-300">เลทได้ถึง {storeSettings?.late_deadline?.substring(0, 5) || '08:00'} น. (รับ 50฿)</span>
            </div>
          </div>

          {/* Overlapping Circular Check-In Button */}
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 z-20">
            {/* Pulsing Ripple Effect */}
            {isInsideRadius && !checkInResult && (
              <motion.div
                className="absolute -top-2 -left-2 w-28 h-28 rounded-full bg-blue-400/30"
                animate={{ scale: [1, 1.35, 1.6], opacity: [0.7, 0.2, 0] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
              />
            )}

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.94 }}
              onClick={handleCheckIn}
              disabled={isCheckingIn || !!checkInResult}
              className={`relative z-10 w-24 h-24 rounded-full flex flex-col items-center justify-center text-white ring-4 ring-white shadow-xl transition-all ${
                checkInResult
                  ? checkInResult.status === 'PRESENT'
                    ? 'bg-gradient-to-b from-emerald-500 to-teal-600'
                    : 'bg-gradient-to-b from-amber-500 to-orange-600'
                  : 'bg-gradient-to-b from-[#4fa2f6] via-[#3b82f6] to-[#2563eb]'
              }`}
            >
              {isCheckingIn ? (
                <RefreshCw className="w-6 h-6 animate-spin text-white" />
              ) : checkInResult ? (
                <div className="flex flex-col items-center">
                  <CheckCircle2 className="w-6 h-6 text-white mb-0.5" />
                  <span className="text-[10px] font-bold">เช็คอินแล้ว</span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center">
                  {/* Fingerprint / Touch Pointer Icon matching reference */}
                  <svg
                    className="w-7 h-7 text-white mb-0.5"
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

        {/* ----------------------------------------------------------- */}
        {/* 3 STATS COLUMNS (เข้างาน, ออกงาน, เวลาทำงาน)                 */}
        {/* ----------------------------------------------------------- */}
        <div className="px-5 pt-1 pb-3 grid grid-cols-3 gap-2 text-center bg-white">
          {/* Col 1: เข้างาน */}
          <div className="flex flex-col items-center space-y-1">
            <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold font-mono text-slate-800 tracking-tight">
              {checkInResult ? checkInResult.checkInTime : '--:--'}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">เข้างาน</span>
          </div>

          {/* Col 2: ออกงาน */}
          <div className="flex flex-col items-center space-y-1">
            <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold font-mono text-slate-400 tracking-tight">
              --:--
            </span>
            <span className="text-[10px] text-slate-400 font-medium">ออกงาน</span>
          </div>

          {/* Col 3: เวลาทำงาน */}
          <div className="flex flex-col items-center space-y-1">
            <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold font-mono text-slate-800 tracking-tight">
              {checkInResult ? `+${checkInResult.allowance}฿` : '--:--'}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">เวลาทำงาน</span>
          </div>
        </div>

        {/* ----------------------------------------------------------- */}
        {/* SECTION: ประวัติการลงเวลาการทำงาน                          */}
        {/* ----------------------------------------------------------- */}
        <div className="px-5 pt-2 pb-24 space-y-2 bg-white flex-1">
          <div className="text-xs font-bold text-slate-900 tracking-tight">
            ประวัติการลงเวลาการทำงาน
          </div>

          {/* 3 Pill Buttons (เข้างาน / ออกงาน / ลางาน) */}
          <div className="grid grid-cols-3 gap-1.5 pt-0.5">
            <button
              onClick={() => setActiveHistoryTab('in')}
              className={`py-1.5 px-2 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1 transition-all border ${
                activeHistoryTab === 'in'
                  ? 'bg-blue-50 text-blue-600 border-blue-200'
                  : 'bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>เข้างาน</span>
            </button>

            <button
              onClick={() => setActiveHistoryTab('out')}
              className={`py-1.5 px-2 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1 transition-all border ${
                activeHistoryTab === 'out'
                  ? 'bg-blue-50 text-blue-600 border-blue-200'
                  : 'bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>ออกงาน</span>
            </button>

            <button
              onClick={() => setActiveHistoryTab('leave')}
              className={`py-1.5 px-2 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1 transition-all border ${
                activeHistoryTab === 'leave'
                  ? 'bg-blue-50 text-blue-600 border-blue-200'
                  : 'bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-3 h-3" />
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
                className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px] flex items-start gap-2"
              >
                <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">การเช็คอินถูกปฏิเสธ</div>
                  <div>{errorMessage}</div>
                </div>
              </motion.div>
            )}

            {checkInResult && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`p-3 rounded-xl border text-[11px] ${
                  checkInResult.status === 'PRESENT'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    {checkInResult.status === 'PRESENT' ? 'เช็คอินตรงเวลาสำเร็จ' : 'เช็คอินสำเร็จ (มาสาย)'}
                  </span>
                  <span className="font-mono text-[10px]">{checkInResult.checkInTime} น.</span>
                </div>
                <div className="text-[10px] text-slate-600 mt-0.5">
                  เบี้ยเลี้ยงที่ได้รับ: <strong className="text-emerald-600 font-bold">+{checkInResult.allowance} บาท</strong>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Geofence Distance Indicator */}
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[10px] text-slate-500 flex items-center justify-between">
            <span className="flex items-center gap-1 font-medium text-slate-600">
              <MapPin className="w-3 h-3 text-blue-500" />
              <span>พิกัดร้าน YOKOHAMA & NAYA:</span>
            </span>
            <span className={`font-bold ${isInsideRadius ? 'text-emerald-600' : 'text-rose-500'}`}>
              {distance?.toFixed(0)} ม. ({isInsideRadius ? 'ในพื้นที่' : 'นอกร้าน'})
            </span>
          </div>

          {/* Simulator Quick Toggle Button */}
          <div className="pt-1 text-center">
            <button
              onClick={() => setShowSimPanel(!showSimPanel)}
              className="text-[10px] text-blue-600 hover:text-blue-700 font-semibold"
            >
              {showSimPanel ? '▲ ปิดโหมดจำลองทดสอบ' : '▼ เปิดโหมดจำลองทดสอบ (ใน/นอกร้าน, ตรงเวลา/สาย)'}
            </button>
          </div>

          {showSimPanel && (
            <div className="p-2.5 rounded-xl bg-blue-50/60 border border-blue-100 text-[10px] space-y-1.5 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-bold">ตำแหน่ง GPS:</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setSimMode('inside')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      simMode === 'inside' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border'
                    }`}
                  >
                    ในร้าน 5ม.
                  </button>
                  <button
                    onClick={() => setSimMode('outside')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      simMode === 'outside' ? 'bg-rose-500 text-white' : 'bg-white text-slate-600 border'
                    }`}
                  >
                    นอกร้าน 120ม.
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-bold">เวลาเข้างาน:</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setSimTimeMode('ontime')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      simTimeMode === 'ontime' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 border'
                    }`}
                  >
                    07:45 (ตรง)
                  </button>
                  <button
                    onClick={() => setSimTimeMode('late')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      simTimeMode === 'late' ? 'bg-amber-500 text-white' : 'bg-white text-slate-600 border'
                    }`}
                  >
                    08:15 (สาย)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ----------------------------------------------------------- */}
        {/* BOTTOM NAVIGATION BAR (5 ITEMS EXACT MATCH)                 */}
        {/* ----------------------------------------------------------- */}
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-2 py-2 flex items-center justify-around z-30">
          {/* Tab 1: เช็คเวลาทำงาน (Active) */}
          <button 
            onClick={() => setActiveNavTab('clock')}
            className="flex flex-col items-center gap-0.5 text-blue-600 font-bold text-[9px] min-w-[50px]"
          >
            <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Clock className="w-3 h-3" />
            </div>
            <span>เช็คเวลาทำงาน</span>
          </button>

          {/* Tab 2: ปฏิทิน */}
          <Link
            href="/employee/stats"
            className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-slate-600 text-[9px] min-w-[50px]"
          >
            <div className="w-5 h-5 flex items-center justify-center">
              <Calendar className="w-3.5 h-3.5" />
            </div>
            <span>ปฏิทิน</span>
          </Link>

          {/* Tab 3: เช็คสถานะ / บันทึก */}
          <Link
            href="/employee/stats"
            className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-slate-600 text-[9px] min-w-[50px]"
          >
            <div className="w-5 h-5 flex items-center justify-center">
              <CreditCard className="w-3.5 h-3.5" />
            </div>
            <span>เช็คสถานะ</span>
          </Link>

          {/* Tab 4: สถานะคำขอ */}
          <Link
            href="/employee/leave"
            className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-slate-600 text-[9px] min-w-[50px]"
          >
            <div className="w-5 h-5 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
            <span>สถานะคำขอ</span>
          </Link>

          {/* Tab 5: เมนู */}
          <Link
            href="/admin"
            className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-slate-600 text-[9px] min-w-[50px]"
          >
            <div className="w-5 h-5 flex items-center justify-center">
              <Menu className="w-3.5 h-3.5" />
            </div>
            <span>เมนู</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
