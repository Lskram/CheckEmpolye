'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Crown, 
  Lock, 
  User, 
  ArrowRight, 
  ShieldCheck, 
  KeyRound, 
  Sparkles, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Sun, 
  Moon, 
  LayoutDashboard, 
  Bot, 
  Smartphone, 
  Clock,
  Shield,
  Zap,
  Check
} from 'lucide-react';
import { useAppTheme } from '@/lib/theme';
import { getDeviceHWID } from '@/lib/hwid';

export default function PresidentLoginLandingPage() {
  const router = useRouter();
  const { isDark, toggleTheme } = useAppTheme();

  // Form States
  const [executiveCode, setExecutiveCode] = useState('SI01');
  const [pinCode, setPinCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberSession, setRememberSession] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [hwid, setHwid] = useState('');

  // Live Bangkok Time
  const [clock, setClock] = useState({
    time: '--:--:--',
    date: 'วันพฤหัสบดี, 1 ตุลาคม 2026',
  });

  useEffect(() => {
    const currentHWID = getDeviceHWID();
    setHwid(currentHWID);

    // Check if already authenticated as executive
    const saved = localStorage.getItem('executive_auth_unlocked');
    if (saved === 'true') {
      const profile = localStorage.getItem('attendance_employee_profile');
      if (profile) {
        try {
          const parsed = JSON.parse(profile);
          if (parsed.role === 'ADMIN' || parsed.employee_code === 'SI01') {
            router.push('/admin');
            return;
          }
        } catch (e) {}
      }
    }

    // Tick Clock
    const updateTime = () => {
      const now = new Date();
      setClock({
        time: now.toLocaleTimeString('th-TH', { timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        date: now.toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
      });
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [router]);

  // Handle Login Submit
  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isLoading) return;

    setErrorMessage('');
    setSuccessMessage('');

    if (!executiveCode.trim()) {
      setErrorMessage('กรุณากรอกรหัสผู้บริหาร (เช่น SI01)');
      return;
    }
    if (!pinCode) {
      setErrorMessage('กรุณากรอกรหัสผ่าน PIN');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeCode: executiveCode.trim().toUpperCase(),
          pin: pinCode.trim(),
          hwid,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.message || 'รหัสผู้บริหารหรือ PIN ไม่ถูกต้อง');
        setIsLoading(false);
        return;
      }

      // Check role
      const emp = data.employee || data.data;
      if (emp.role !== 'ADMIN' && emp.employee_code !== 'SI01') {
        setErrorMessage('บัญชีนี้ไม่มีสิทธิ์เข้าสู่ระบบศูนย์ควบคุมผู้บริหาร');
        setIsLoading(false);
        return;
      }

      setSuccessMessage('ยืนยันตัวตนท่านประธานสำเร็จ กำลังเปิดศูนย์ควบคุม...');

      if (rememberSession) {
        localStorage.setItem('executive_auth_unlocked', 'true');
        localStorage.setItem('executive_code', emp.employee_code);
        localStorage.setItem('attendance_employee_profile', JSON.stringify(emp));
      } else {
        sessionStorage.setItem('executive_auth_unlocked', 'true');
        sessionStorage.setItem('executive_code', emp.employee_code);
        localStorage.setItem('attendance_employee_profile', JSON.stringify(emp));
      }

      setTimeout(() => {
        router.push('/admin');
      }, 700);

    } catch (err: any) {
      setErrorMessage('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์: ' + err.message);
      setIsLoading(false);
    }
  };

  // Quick Fill Helper for 1-Click test
  const handleQuickFill = () => {
    setExecutiveCode('SI01');
    setPinCode('5101');
    setErrorMessage('');
  };

  return (
    <div className={`min-h-screen flex flex-col justify-between select-none font-sans relative overflow-hidden transition-colors duration-300 ${
      isDark ? 'bg-[#070b14] text-slate-100' : 'bg-slate-100 text-slate-800'
    }`}>
      
      {/* Ambient Lighting Orbs */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-amber-500/15 via-blue-600/10 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="absolute -bottom-40 right-10 w-[500px] h-[300px] bg-gradient-to-t from-blue-600/10 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Top Navbar */}
      <header className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-4 flex items-center justify-between z-10">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-white flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <Crown style={{ width: 20, height: 20 }} />
          </div>
          <div>
            <span className="font-extrabold text-sm tracking-tight block">สีแสงยางยนต์</span>
            <span className="text-[10px] font-mono text-amber-400 font-bold tracking-wider">YOKOHAMA NAYA COSMIS</span>
          </div>
        </Link>

        {/* Live Clock & Theme Switcher */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-mono font-medium backdrop-blur-md bg-slate-900/50 border-slate-800 text-slate-300">
            <Clock style={{ width: 13, height: 13 }} className="text-amber-400" />
            <span>{clock.time}</span>
          </div>

          <button
            onClick={toggleTheme}
            className={`p-2 rounded-xl border transition-all ${
              isDark ? 'bg-slate-800/80 border-white/10 text-yellow-300' : 'bg-white border-slate-300 text-slate-700 shadow-sm'
            }`}
            title="สลับโหมด Dark / Light"
          >
            {isDark ? <Sun style={{ width: 15, height: 15 }} /> : <Moon style={{ width: 15, height: 15 }} />}
          </button>
        </div>
      </header>

      {/* Main Center Card */}
      <main className="max-w-md w-full mx-auto px-4 py-8 z-10 my-auto">
        <div className={`p-6 sm:p-8 rounded-3xl border shadow-2xl backdrop-blur-xl transition-all relative overflow-hidden ${
          isDark 
            ? 'bg-[#0e1626]/90 border-slate-800 shadow-black/80 ring-1 ring-white/10' 
            : 'bg-white/95 border-slate-200 shadow-xl ring-1 ring-black/5'
        }`}>
          
          {/* Subtle Top Gold Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500" />

          {/* Header Identity */}
          <div className="text-center space-y-2 mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <Crown style={{ width: 13, height: 13 }} />
              <span>Executive Command Center</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center justify-center gap-2">
              <span>เข้าสู่ระบบผู้บริหาร</span>
            </h1>
            
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              ศูนย์บัญชาการและมอนิเตอร์เวลาทำงานร้านสีแสงยางยนต์
            </p>
          </div>

          {/* Success / Error Alerts */}
          {errorMessage && (
            <div className="mb-4 p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-2.5 animate-shake">
              <AlertTriangle style={{ width: 16, height: 16 }} className="shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2.5">
              <CheckCircle2 style={{ width: 16, height: 16 }} className="shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            
            {/* Executive Code Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>รหัสผู้บริหาร (Executive Code)</span>
                <span className="text-[10px] text-amber-400 font-mono">ผู้บริหารสูงสุด: SI01</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User style={{ width: 16, height: 16 }} />
                </div>
                <input
                  type="text"
                  value={executiveCode}
                  onChange={(e) => setExecutiveCode(e.target.value.toUpperCase())}
                  placeholder="เช่น SI01"
                  className={`w-full pl-10 pr-4 py-3 rounded-2xl text-sm font-mono font-bold tracking-wider transition-all focus:outline-none focus:ring-2 ${
                    isDark 
                      ? 'bg-slate-950/80 border border-slate-800 text-white focus:ring-amber-500 focus:border-amber-500' 
                      : 'bg-slate-50 border border-slate-300 text-slate-900 focus:ring-amber-500 focus:border-amber-500'
                  }`}
                  required
                />
              </div>
            </div>

            {/* PIN Code Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>รหัสผ่าน PIN</span>
                <span className="text-[10px] text-slate-400">PIN 4 หลัก (5101)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock style={{ width: 16, height: 16 }} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                  placeholder="กรอกรหัส PIN..."
                  className={`w-full pl-10 pr-11 py-3 rounded-2xl text-sm font-mono font-bold tracking-widest transition-all focus:outline-none focus:ring-2 ${
                    isDark 
                      ? 'bg-slate-950/80 border border-slate-800 text-white focus:ring-amber-500 focus:border-amber-500' 
                      : 'bg-slate-50 border border-slate-300 text-slate-900 focus:ring-amber-500 focus:border-amber-500'
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                </button>
              </div>
            </div>

            {/* Remember Session Checkbox */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={rememberSession}
                  onChange={(e) => setRememberSession(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                />
                <span>จดจำการเข้าสู่ระบบในเครื่องนี้</span>
              </label>

              <button
                type="button"
                onClick={handleQuickFill}
                className="text-amber-400 hover:text-amber-300 text-[11px] font-bold underline"
              >
                ใส่รหัสทดสอบ (SI01)
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-black font-extrabold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/25 active:scale-[0.98] disabled:opacity-50 mt-2"
            >
              {isLoading ? (
                <>
                  <RefreshCw style={{ width: 16, height: 16 }} className="animate-spin" />
                  <span>กำลังตรวจสอบสิทธิ์...</span>
                </>
              ) : (
                <>
                  <ShieldCheck style={{ width: 18, height: 18 }} />
                  <span>เข้าสู่ระบบศูนย์ควบคุมผู้บริหาร</span>
                  <ArrowRight style={{ width: 16, height: 16 }} />
                </>
              )}
            </button>
          </form>

          {/* Quick Portal Switcher Links */}
          <div className="mt-6 pt-4 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-center text-xs">
            <Link
              href="/admin/war-room"
              className={`p-2 rounded-xl border flex items-center justify-center gap-1.5 font-medium transition-all ${
                isDark ? 'bg-slate-900/60 border-slate-800 hover:bg-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <Bot style={{ width: 13, height: 13 }} className="text-blue-400" />
              <span>Agent War Room</span>
            </Link>

            <Link
              href="/employee/login"
              className={`p-2 rounded-xl border flex items-center justify-center gap-1.5 font-medium transition-all ${
                isDark ? 'bg-slate-900/60 border-slate-800 hover:bg-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <Smartphone style={{ width: 13, height: 13 }} className="text-purple-400" />
              <span>แอปพนักงาน (PWA)</span>
            </Link>
          </div>

        </div>
      </main>

      {/* Bottom Footer */}
      <footer className="max-w-6xl mx-auto w-full px-4 py-4 text-center text-xs text-slate-500 font-mono z-10">
        <span>© {new Date().getFullYear()} ร้านสีแสงยางยนต์ (YOKOHAMA NAYA COSMIS) — Smart Branch Architecture</span>
      </footer>

    </div>
  );
}
