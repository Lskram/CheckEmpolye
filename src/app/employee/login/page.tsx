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

  const pinInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const currentHWID = getDeviceHWID();
    setHwid(currentHWID);

    const saved = localStorage.getItem('attendance_employee_profile');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.id) {
          setCachedUser(parsed);
          setIsFirstTimeMode(false);
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
    <div className={`min-h-screen w-full flex flex-col justify-between p-4 sm:p-6 transition-colors duration-300 font-sans ${
      isDark ? 'bg-[#090d16] text-slate-100' : 'bg-[#eef2f7] text-slate-800'
    }`}>
      {/* Continuous Network Connection Guard */}
      <NetworkGuard />

      {/* Top Header */}
      <div className="max-w-sm w-full mx-auto flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
            <Shield className="w-4 h-4" />
          </div>
          <span className="font-bold text-xs">YOKOHAMA NAYA</span>
        </div>
        
        {/* Theme Switcher */}
        <button
          onClick={toggleTheme}
          className={`p-2 rounded-xl border transition-all active:scale-90 ${
            isDark ? 'bg-slate-800 border-white/10 text-yellow-300' : 'bg-white border-slate-300 text-slate-700 shadow-sm'
          }`}
          title="สลับโหมด Dark / Light"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Login Card */}
      <div className="max-w-sm w-full mx-auto my-auto space-y-4">
        
        {/* Dome Icon & Title */}
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 mx-auto flex items-center justify-center text-2xl shadow-xl shadow-blue-500/30 text-white mb-2">
            🔐
          </div>
          <h1 className="text-xl font-black tracking-tight">เข้าสู่ระบบพนักงาน</h1>
          <p className="text-xs text-slate-400 mt-0.5">สีแสงยางยนต์ YOKOHAMA NAYA COSMIS</p>
        </div>

        {/* User Card / Mode Toggle */}
        {!isFirstTimeMode && cachedUser ? (
          <div className={`p-4 rounded-3xl ${isDark ? 'neumorph-dark' : 'neumorph-light'} flex items-center justify-between`}>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-md">
                {cachedUser.nickname ? cachedUser.nickname.slice(0, 2) : cachedUser.fullName?.slice(0, 2) || 'EM'}
              </div>
              <div>
                <div className="font-bold text-sm leading-tight">{cachedUser.fullName}</div>
                <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1 font-mono">
                  <span>รหัส: {cachedUser.employeeCode}</span>
                </div>
              </div>
            </div>
            <button
              onClick={handleSwitchAccount}
              className="text-[11px] text-blue-500 hover:underline font-semibold"
            >
              เปลี่ยนบัญชี
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Employee Code Input */}
            <div className={`p-3.5 rounded-3xl ${isDark ? 'neumorph-dark' : 'neumorph-light'}`}>
              <label className="text-[11px] font-bold text-slate-400 mb-1.5 block">รหัสพนักงาน (EMP Code):</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="เช่น 01, 02, SI01"
                  value={employeeCode}
                  onChange={(e) => setEmployeeCode(e.target.value.toUpperCase())}
                  className={`w-full py-2.5 px-3 rounded-2xl text-sm font-mono font-bold tracking-wider uppercase transition-all ${
                    isDark ? 'neumorph-dark-inset text-white' : 'neumorph-light-inset text-slate-800'
                  }`}
                />
                {lookupLoading && (
                  <RefreshCw className="w-4 h-4 text-blue-500 animate-spin absolute right-3 top-3" />
                )}
              </div>

              {/* Real-Time Lookup Feedback */}
              {foundEmployee && (
                <div className="mt-2 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <div>
                    <span className="font-bold">{foundEmployee.fullName}</span>
                    <span className="text-[10px] text-slate-400 block font-sans">{foundEmployee.position || 'พนักงาน'}</span>
                  </div>
                </div>
              )}
              {lookupError && (
                <div className="mt-2 text-[10px] text-rose-400 font-medium">
                  {lookupError}
                </div>
              )}
            </div>
          </div>
        )}

        {/* PIN Code Dots Display */}
        <div className={`p-4 rounded-3xl ${isDark ? 'neumorph-dark' : 'neumorph-light'} text-center space-y-2`}>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>กดรหัสผ่าน PIN</span>
            <button
              onClick={() => setShowPassword(!showPassword)}
              className="text-[11px] text-blue-500 flex items-center gap-1 font-semibold"
            >
              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showPassword ? 'ซ่อนรหัส' : 'ดูรหัส'}</span>
            </button>
          </div>

          {/* Dots */}
          <div className={`py-3 px-4 rounded-2xl ${isDark ? 'neumorph-dark-inset' : 'neumorph-light-inset'} flex items-center justify-center min-h-[48px] gap-2.5`}>
            {pinCode.length === 0 ? (
              <span className="text-xs text-slate-400 font-medium">กรุณากดรหัสผ่านที่แป้นด้านล่าง</span>
            ) : showPassword ? (
              <span className="text-lg font-mono font-black tracking-widest text-blue-500">{pinCode}</span>
            ) : (
              pinCode.split('').map((_, idx) => (
                <span key={idx} className="w-3.5 h-3.5 rounded-full bg-blue-500 shadow-md shadow-blue-500/40" />
              ))
            )}
          </div>
        </div>

        {/* Tactile Neumorphic Keypad */}
        <div className="grid grid-cols-3 gap-2 px-1">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
            <button
              key={num}
              onClick={() => handleKeyPress(num)}
              className={`py-3.5 rounded-2xl text-lg font-bold font-mono transition-all active:scale-90 cursor-pointer ${
                isDark ? 'neumorph-tile-dark text-white' : 'neumorph-tile-light text-slate-800'
              }`}
            >
              {num}
            </button>
          ))}
          <button
            onClick={handleClear}
            className={`py-3.5 rounded-2xl text-xs font-bold transition-all active:scale-90 cursor-pointer ${
              isDark ? 'neumorph-tile-dark text-rose-400' : 'neumorph-tile-light text-rose-600'
            }`}
          >
            C
          </button>
          <button
            onClick={() => handleKeyPress('0')}
            className={`py-3.5 rounded-2xl text-lg font-bold font-mono transition-all active:scale-90 cursor-pointer ${
              isDark ? 'neumorph-tile-dark text-white' : 'neumorph-tile-light text-slate-800'
            }`}
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            className={`py-3.5 rounded-2xl text-xs font-bold transition-all active:scale-90 cursor-pointer ${
              isDark ? 'neumorph-tile-dark text-slate-400' : 'neumorph-tile-light text-slate-600'
            }`}
          >
            ⌫
          </button>
        </div>

        {/* Feedback Messages */}
        {errorMsg && (
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {warningMsg && (
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{warningMsg}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={() => handleLoginSubmit()}
          disabled={isLoading}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm shadow-xl shadow-blue-500/30 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
        >
          {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
          <span>{isLoading ? 'กำลังตรวจสอบ...' : 'ยืนยันเข้าสู่ระบบ (Unlock)'}</span>
        </button>

      </div>

      {/* Footer Security Badge */}
      <div className="text-center text-xs text-slate-400 pt-2 flex items-center justify-center gap-1.5 font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
        <span>ระบบความปลอดภัย 1 คน 1 เครื่อง (อุปกรณ์ผ่านการตรวจสอบแล้ว)</span>
      </div>
    </div>
  );
}
