'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  KeyRound, 
  Smartphone, 
  ShieldCheck, 
  AlertTriangle, 
  ArrowRight, 
  RefreshCw, 
  User, 
  Lock, 
  Delete,
  Info,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  UserCheck,
  Sparkles,
  Sun,
  Moon,
  Shield
} from 'lucide-react';
import { getDeviceHWID } from '@/lib/hwid';
import { useAppTheme } from '@/lib/theme';
import NetworkGuard from '@/components/NetworkGuard';
import { syncServerTime } from '@/lib/server-time';

export default function EmployeeLoginPage() {
  const router = useRouter();
  const { isDark, toggleTheme } = useAppTheme();
  
  // State
  const [cachedUser, setCachedUser] = useState<any>(null);
  const [isFirstTimeMode, setIsFirstTimeMode] = useState(false);
  const [employeeCode, setEmployeeCode] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [hwid, setHwid] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [warningMsg, setWarningMsg] = useState('');

  // Live employee code lookup preview state
  const [lookupLoading, setLookupLoading] = useState(false);
  const [foundEmployee, setFoundEmployee] = useState<any>(null);
  const [lookupError, setLookupError] = useState('');

  // Fetch fresh profile and avatar from Supabase DB
  const refreshCachedUserProfile = async (id?: string, code?: string) => {
    if (!id && !code) return;
    try {
      const param = id ? `id=${encodeURIComponent(id)}` : `code=${encodeURIComponent(code || '')}`;
      const res = await fetch(`/api/auth/check-code?${param}`);
      const data = await res.json();
      if (data.server_timestamp) {
        syncServerTime(data.server_timestamp);
      }
      if (data.success && data.found && data.employee) {
        setCachedUser((prev: any) => {
          const updated = {
            ...(prev || {}),
            ...data.employee,
            id: data.employee.id || prev?.id,
            fullName: data.employee.full_name || prev?.fullName || prev?.full_name,
            employeeCode: data.employee.employee_code || prev?.employeeCode || prev?.employee_code,
            avatar_url: data.employee.avatar_url || null,
          };
          localStorage.setItem('attendance_employee_profile', JSON.stringify(updated));
          return updated;
        });
      }
    } catch (e) {
      console.warn('Could not refresh cached profile from DB:', e);
    }
  };

  useEffect(() => {
    const currentHWID = getDeviceHWID();
    setHwid(currentHWID);

    const saved = localStorage.getItem('attendance_employee_profile');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.id || parsed?.employee_code || parsed?.employeeCode) {
          setCachedUser(parsed);
          setIsFirstTimeMode(false);
          // Sync fresh avatar & profile data from Supabase in background
          refreshCachedUserProfile(parsed.id, parsed.employee_code || parsed.employeeCode);
        } else {
          setIsFirstTimeMode(true);
        }
      } catch (e) {
        setIsFirstTimeMode(true);
      }
    } else {
      setIsFirstTimeMode(true);
    }
  }, []);

  // Live Employee Code Debounced Pre-Check
  useEffect(() => {
    const trimmed = employeeCode.trim().toUpperCase();
    if (!trimmed || trimmed.length < 2) {
      setFoundEmployee(null);
      setLookupError('');
      return;
    }

    const timer = setTimeout(async () => {
      setLookupLoading(true);
      setLookupError('');
      try {
        const res = await fetch(`/api/auth/check-code?code=${encodeURIComponent(trimmed)}`);
        const data = await res.json();
        if (data.success && data.found && data.employee) {
          setFoundEmployee(data.employee);
          setLookupError('');
        } else {
          setFoundEmployee(null);
          setLookupError(data.message || 'ไม่พบบัญชีพนักงานรหัสนี้');
        }
      } catch (e) {
        setFoundEmployee(null);
      } finally {
        setLookupLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [employeeCode]);

  // Keypad Handlers
  const handleKeyPress = (num: string) => {
    if (isLoading) return;
    setErrorMsg('');
    setPinCode(prev => prev + num);
  };

  const handleBackspace = () => {
    if (isLoading) return;
    setPinCode(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    if (isLoading) return;
    setPinCode('');
  };

  // Switch to different user
  const handleSwitchAccount = () => {
    localStorage.removeItem('attendance_employee_profile');
    setCachedUser(null);
    setIsFirstTimeMode(true);
    setEmployeeCode('');
    setPinCode('');
    setErrorMsg('');
    setWarningMsg('');
    setFoundEmployee(null);
  };

  // Submit Login
  const handleLoginSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isLoading) return;

    setErrorMsg('');
    setWarningMsg('');

    if (isFirstTimeMode) {
      if (!employeeCode.trim()) {
        setErrorMsg('กรุณากรอกรหัสพนักงาน (เช่น 01, 02, SI01)');
        return;
      }
      if (!pinCode) {
        setErrorMsg('กรุณากรอกรหัสผ่าน PIN');
        return;
      }
    } else {
      if (!pinCode) {
        setErrorMsg('กรุณากรอกรหัส PIN');
        return;
      }
    }

    setIsLoading(true);

    try {
      if (isFirstTimeMode) {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            employeeCode: employeeCode.trim().toUpperCase(),
            pin: pinCode,
            hwid,
          }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          setErrorMsg(data.message || 'รหัสพนักงานหรือ PIN ไม่ถูกต้อง');
          setIsLoading(false);
          return;
        }

        if (data.server_timestamp) {
          syncServerTime(data.server_timestamp);
        }

        if (data.warning) {
          setWarningMsg(data.warning);
        }

        localStorage.setItem('attendance_employee_profile', JSON.stringify(data.employee));
        setTimeout(() => {
          router.push('/employee');
        }, data.warning ? 1500 : 300);

      } else {
        const res = await fetch('/api/auth/verify-pin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            employeeId: cachedUser.id,
            pin: pinCode,
            hwid,
          }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          setErrorMsg(data.message || 'รหัส PIN ไม่ถูกต้อง');
          setIsLoading(false);
          return;
        }

        if (data.server_timestamp) {
          syncServerTime(data.server_timestamp);
        }

        if (data.warning) {
          setWarningMsg(data.warning);
        }

        localStorage.setItem('attendance_employee_profile', JSON.stringify(data.employee));
        setTimeout(() => {
          router.push('/employee');
        }, data.warning ? 1500 : 300);
      }
    } catch (err: any) {
      setErrorMsg('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen w-full flex flex-col justify-between font-sans transition-colors duration-300 relative overflow-x-hidden ${
      isDark ? 'bg-[#090d16] text-slate-100' : 'bg-[#eef2f7] text-slate-800'
    }`}>
      {/* Continuous Network Connection Guard */}
      <NetworkGuard />

      {/* Ambient Background Glows */}
      {isDark ? (
        <>
          <div className="absolute top-[-50px] left-[-50px] w-72 h-72 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-[30%] right-[-50px] w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-[-50px] left-[20%] w-72 h-72 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        </>
      ) : (
        <>
          <div className="absolute top-[-50px] left-[-50px] w-72 h-72 bg-blue-300/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-[30%] right-[-50px] w-72 h-72 bg-emerald-300/20 rounded-full blur-3xl pointer-events-none" />
        </>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 1. TOP DOME HEADER & S-CURVE WAVE (Matching Internal Theme)   */}
      {/* ------------------------------------------------------------- */}
      <div className="w-full relative z-10 pt-4 pb-0 text-white overflow-hidden shadow-xl transition-colors duration-300">
        
        {/* Background Image Layer */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-700 hover:scale-105"
          style={{ 
            backgroundImage: `url('/images/header-bg.jpg')`,
          }}
        />

        {/* High-Contrast Frosted Overlay (30-40% Opacity) */}
        <div className={`absolute inset-0 transition-colors duration-300 ${
          isDark 
            ? 'bg-gradient-to-b from-[#090d16]/50 via-[#0c121e]/65 to-[#090d16]/90 backdrop-blur-[0.5px]' 
            : 'bg-gradient-to-b from-slate-950/55 via-slate-900/70 to-[#18223c]/85 backdrop-blur-[0.5px]'
        }`} />

        <div className="max-w-md mx-auto px-4 relative z-10">
          
          {/* Top Header Row */}
          <div className="flex items-center justify-between relative py-1">
            
            {/* Left: Official Sisaeng Store Logo */}
            <div className="flex items-center gap-2">
              <img 
                src="/images/store-logo.png" 
                alt="สีแสงยางยนต์ (Sisaeng Yang Yont)" 
                className="h-8 w-auto max-w-[120px] object-contain drop-shadow-md"
              />
              <div>
                <div className="text-[10px] font-bold text-blue-300 tracking-wider">YOKOHAMA NAYA</div>
                <div className="text-xs font-black text-white leading-none">สีแสงยางยนต์</div>
              </div>
            </div>

            {/* Right: Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-black/40 hover:bg-black/60 text-yellow-300 transition-transform active:scale-90 border border-white/15 backdrop-blur-md shadow-sm"
              title="สลับโหมด Dark / Light"
            >
              {isDark ? <Sun className="w-4 h-4 text-yellow-300" /> : <Moon className="w-4 h-4 text-sky-200" />}
            </button>
          </div>

          {/* Header Banner Subtitle */}
          <div className="mt-3 p-3 rounded-2xl bg-black/35 border border-white/15 backdrop-blur-md flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
                <Lock className="w-3.5 h-3.5" />
              </div>
              <div>
                <h2 className="text-xs font-black text-white drop-shadow-sm">เข้าสู่ระบบพนักงาน (Employee Portal)</h2>
                <p className="text-[9px] text-slate-300">ระบบลงเวลาทำงาน & เบี้ยเลี้ยงอัตโนมัติ</p>
              </div>
            </div>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300">
              ● ออนไลน์
            </span>
          </div>

        </div>

        {/* Smooth S-Curve Wave SVG Cutout */}
        <div className="w-full overflow-hidden leading-none mt-2 relative z-10">
          <svg viewBox="0 0 500 40" preserveAspectRatio="none" className="w-full h-6 text-[#090d16]" style={{ color: isDark ? '#090d16' : '#eef2f7' }}>
            <path d="M0,0 C150,40 350,0 500,40 L500,40 L0,40 Z" fill="currentColor" />
          </svg>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. MAIN LOGIN FORM & TACTILE KEYPAD                           */}
      {/* ------------------------------------------------------------- */}
      <div className="max-w-md w-full mx-auto px-4 py-2 space-y-3 relative z-10 flex-1 flex flex-col justify-center">

        {/* Returning User Profile Card OR First-time Input */}
        {!isFirstTimeMode && cachedUser ? (
          <div className={`p-4 rounded-3xl relative overflow-hidden shadow-xl border ${
            isDark ? 'neumorph-dark border-blue-500/30' : 'neumorph-light border-blue-300/50'
          } flex items-center justify-between transition-all`}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white font-black text-sm shadow-md ring-2 ring-white/20 shrink-0 relative">
                {cachedUser.avatar_url ? (
                  <img 
                    key={cachedUser.avatar_url}
                    src={cachedUser.avatar_url} 
                    alt={cachedUser.fullName || cachedUser.full_name || 'พนักงาน'} 
                    className="w-full h-full object-cover rounded-full" 
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <span>
                    {cachedUser.nickname 
                      ? cachedUser.nickname.slice(0, 2) 
                      : (cachedUser.fullName || cachedUser.full_name || 'EM').slice(0, 2)}
                  </span>
                )}
              </div>
              <div>
                <div className="font-black text-sm leading-tight flex items-center gap-1.5">
                  <span>{cachedUser.fullName || cachedUser.full_name}</span>
                  {cachedUser.nickname && <span className="text-[11px] font-normal text-slate-400">({cachedUser.nickname})</span>}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5 font-mono">
                  <span className="px-1.5 py-0.2 rounded bg-blue-500/15 text-blue-400 font-bold border border-blue-400/20">
                    รหัส: {cachedUser.employeeCode || cachedUser.employee_code}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-sans">✓ ผูกเครื่องนี้แล้ว</span>
                </div>
              </div>
            </div>
            <button
              onClick={handleSwitchAccount}
              className="text-[11px] text-blue-400 hover:text-blue-300 hover:underline font-bold px-2 py-1 rounded-xl bg-blue-500/10 border border-blue-400/20 active:scale-95 transition-all"
            >
              สลับบัญชี
            </button>
          </div>
        ) : (
          <div className={`p-4 rounded-3xl relative overflow-hidden shadow-xl border ${
            isDark ? 'neumorph-dark border-blue-500/30' : 'neumorph-light border-blue-300/50'
          } space-y-2`}>
            <label className="text-[11px] font-black text-slate-400 block flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>กรอกรหัสพนักงาน (EMP Code):</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="เช่น 01, 02, SI01"
                value={employeeCode}
                onChange={(e) => setEmployeeCode(e.target.value.toUpperCase())}
                className={`w-full py-3 px-3.5 rounded-2xl text-base font-mono font-black tracking-wider uppercase transition-all ${
                  isDark ? 'neumorph-dark-inset text-white focus:ring-2 focus:ring-blue-500' : 'neumorph-light-inset text-slate-800 focus:ring-2 focus:ring-blue-500'
                }`}
              />
              {lookupLoading && (
                <RefreshCw className="w-4 h-4 text-blue-400 animate-spin absolute right-3.5 top-3.5" />
              )}
            </div>

            {/* Real-Time Lookup Feedback */}
            {foundEmployee && (
              <div className="p-2.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5 shadow-sm">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-black text-xs shrink-0 shadow-md ring-1 ring-white/20">
                  {foundEmployee.avatar_url ? (
                    <img 
                      key={foundEmployee.avatar_url}
                      src={foundEmployee.avatar_url} 
                      alt={foundEmployee.full_name || foundEmployee.fullName || 'พนักงาน'} 
                      className="w-full h-full object-cover rounded-full" 
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <span>
                      {foundEmployee.nickname 
                        ? foundEmployee.nickname.slice(0, 2) 
                        : (foundEmployee.full_name || foundEmployee.fullName || 'EM').slice(0, 2)}
                    </span>
                  )}
                </div>
                <div className="truncate flex-1">
                  <div className="flex items-center gap-1">
                    <span className="font-black text-white">{foundEmployee.full_name || foundEmployee.fullName}</span>
                    {foundEmployee.nickname && <span className="text-[11px] text-emerald-200"> ({foundEmployee.nickname})</span>}
                  </div>
                  <span className="text-[10px] text-slate-300 block">{foundEmployee.position || 'พนักงานประจำ'}</span>
                </div>
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              </div>
            )}
            {lookupError && (
              <div className="text-[11px] text-rose-400 font-bold flex items-center gap-1 pt-1">
                <XCircle className="w-3.5 h-3.5" />
                <span>{lookupError}</span>
              </div>
            )}
          </div>
        )}

        {/* PIN Code Dots Display Card */}
        <div className={`p-4 rounded-3xl ${isDark ? 'neumorph-dark' : 'neumorph-light'} text-center space-y-2.5 shadow-xl`}>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold flex items-center gap-1">
              <KeyRound className="w-3.5 h-3.5 text-blue-400" />
              <span>กดรหัสผ่าน PIN</span>
            </span>
            <button
              onClick={() => setShowPassword(!showPassword)}
              className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 font-bold px-2 py-0.5 rounded-lg bg-blue-500/10 border border-blue-400/20 transition-all"
            >
              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showPassword ? 'ซ่อนรหัส' : 'ดูรหัส'}</span>
            </button>
          </div>

          {/* Dots Indicator */}
          <div className={`py-3 px-4 rounded-2xl ${isDark ? 'neumorph-dark-inset' : 'neumorph-light-inset'} flex items-center justify-center min-h-[50px] gap-3`}>
            {pinCode.length === 0 ? (
              <span className="text-xs text-slate-400 font-medium">กดรหัสผ่าน PIN 4 หลัก บนแป้นด้านล่าง</span>
            ) : showPassword ? (
              <span className="text-xl font-mono font-black tracking-widest text-blue-400 drop-shadow-sm">{pinCode}</span>
            ) : (
              pinCode.split('').map((_, idx) => (
                <span key={idx} className="w-4 h-4 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-400 shadow-md shadow-blue-500/50 transform scale-110 transition-all animate-pulse" />
              ))
            )}
          </div>
        </div>

        {/* Tactile 3D Neumorphic Keypad */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
            <button
              key={num}
              onClick={() => handleKeyPress(num)}
              className={`py-3.5 rounded-2xl text-xl font-black font-mono transition-all active:scale-90 cursor-pointer ${
                isDark ? 'neumorph-tile-dark text-white hover:text-blue-300' : 'neumorph-tile-light text-slate-800 hover:text-blue-600'
              }`}
            >
              {num}
            </button>
          ))}
          <button
            onClick={handleClear}
            className={`py-3.5 rounded-2xl text-sm font-black transition-all active:scale-90 cursor-pointer ${
              isDark ? 'neumorph-tile-dark text-rose-400 hover:bg-rose-500/10' : 'neumorph-tile-light text-rose-600 hover:bg-rose-50'
            }`}
          >
            ล้าง (C)
          </button>
          <button
            onClick={() => handleKeyPress('0')}
            className={`py-3.5 rounded-2xl text-xl font-black font-mono transition-all active:scale-90 cursor-pointer ${
              isDark ? 'neumorph-tile-dark text-white hover:text-blue-300' : 'neumorph-tile-light text-slate-800 hover:text-blue-600'
            }`}
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            className={`py-3.5 rounded-2xl text-base font-black transition-all active:scale-90 cursor-pointer flex items-center justify-center ${
              isDark ? 'neumorph-tile-dark text-slate-400 hover:text-slate-200' : 'neumorph-tile-light text-slate-600 hover:text-slate-800'
            }`}
          >
            ⌫
          </button>
        </div>

        {/* Feedback Messages */}
        {errorMsg && (
          <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 shadow-md">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span className="font-bold">{errorMsg}</span>
          </div>
        )}
        {warningMsg && (
          <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2 shadow-md">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
            <span className="font-bold">{warningMsg}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={() => handleLoginSubmit()}
          disabled={isLoading}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 text-white font-black text-sm shadow-xl shadow-blue-500/30 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer mt-1"
        >
          {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
          <span>{isLoading ? 'กำลังตรวจสอบสิทธิ์...' : 'ยืนยันเข้าสู่ระบบ (Unlock)'}</span>
        </button>

      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. FOOTER SECURITY BADGE                                      */}
      {/* ------------------------------------------------------------- */}
      <div className="max-w-md mx-auto w-full text-center text-xs text-slate-400 pb-3 pt-1 px-4 relative z-10">
        <div className="flex items-center justify-center gap-1.5 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse shadow-sm shadow-emerald-400/50"></span>
          <span>ระบบความปลอดภัย 1 คน 1 เครื่อง (HWID Protected)</span>
        </div>
      </div>
    </div>
  );
}
