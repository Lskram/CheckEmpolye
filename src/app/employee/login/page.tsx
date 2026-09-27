'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
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
  UserCheck
} from 'lucide-react';
import { getDeviceHWID } from '@/lib/hwid';

export default function EmployeeLoginPage() {
  const router = useRouter();
  
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
    // Generate/Fetch client HWID
    const currentHWID = getDeviceHWID();
    setHwid(currentHWID);

    // Check LocalStorage for cached employee
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
    }, 350);

    return () => clearTimeout(timer);
  }, [employeeCode]);

  // Touch PIN Pad handler for cached login (supports variable length)
  const handlePinInput = (digit: string) => {
    if (pinCode.length < 20) {
      setPinCode((prev) => prev + digit);
    }
  };

  const handleBackspace = () => {
    setPinCode((prev) => prev.slice(0, -1));
  };

  const handleClearPin = () => {
    setPinCode('');
  };

  // Submit First-time Login
  const handleFirstTimeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeCode.trim() || !pinCode.trim()) {
      setErrorMsg('กรุณากรอกรหัสพนักงานและรหัส PIN / รหัสผ่าน');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setWarningMsg('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeCode: employeeCode.trim().toUpperCase(),
          pinCode: pinCode.trim(),
          hwid,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.message || 'เข้าสู่ระบบไม่สำเร็จ');
        setIsLoading(false);
        return;
      }

      localStorage.setItem('attendance_employee_profile', JSON.stringify(data.data));

      const targetPath = data.data.role === 'ADMIN' ? '/executive' : '/employee';
      if (data.data.role === 'ADMIN') {
        localStorage.setItem('executive_auth_token', 'true');
        localStorage.setItem('executive_user_code', data.data.employee_code);
      }

      if (data.warning) {
        setWarningMsg(data.warning);
        setTimeout(() => {
          router.push(targetPath);
        }, 1200);
      } else {
        router.push(targetPath);
      }
    } catch (err: any) {
      setErrorMsg('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Submit Cached PIN Login
  const handleCachedPinSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!cachedUser?.id) return;
    if (!pinCode.trim()) {
      setErrorMsg('กรุณากรอกรหัส PIN / รหัสผ่าน');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setWarningMsg('');

    try {
      const res = await fetch('/api/auth/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: cachedUser.id,
          pinCode: pinCode.trim(),
          hwid,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.message || 'รหัส PIN / รหัสผ่านไม่ถูกต้อง');
        setPinCode('');
        setIsLoading(false);
        if (data.code === 'EMPLOYEE_NOT_FOUND' || res.status === 404) {
          localStorage.removeItem('attendance_employee_profile');
          setIsFirstTimeMode(true);
        }
        return;
      }

      localStorage.setItem('attendance_employee_profile', JSON.stringify(data.data));
      const targetPath = data.data.role === 'ADMIN' ? '/executive' : '/employee';
      if (data.data.role === 'ADMIN') {
        localStorage.setItem('executive_auth_token', 'true');
        localStorage.setItem('executive_user_code', data.data.employee_code);
      }
      router.push(targetPath);
    } catch (err: any) {
      setErrorMsg('เกิดข้อผิดพลาดในการตรวจสอบ PIN: ' + err.message);
      setPinCode('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchAccount = () => {
    localStorage.removeItem('attendance_employee_profile');
    setCachedUser(null);
    setIsFirstTimeMode(true);
    setPinCode('');
    setEmployeeCode('');
    setFoundEmployee(null);
    setLookupError('');
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-800 flex flex-col justify-between p-5 max-w-lg mx-auto select-none font-sans">
      {/* 1. Header Branding */}
      <div className="pt-6 pb-2 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white mb-3 shadow-xl shadow-blue-500/25 ring-4 ring-blue-100">
          <Smartphone className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          สีแสงยางยนต์ <span className="text-blue-600">Check-In</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {isFirstTimeMode ? 'เข้าสู่ระบบเพื่อผูกอุปกรณ์และเช็คชื่อเข้างาน' : 'ยินดีต้อนรับกลับ กรุณากรอกรหัส PIN / รหัสผ่าน'}
        </p>
      </div>

      {/* 2. Main Authentication Body */}
      <div className="my-auto py-2">
        {/* Alerts */}
        {errorMsg && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 shadow-xs animate-shake">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
            <div>
              <div className="font-bold">เข้าสู่ระบบไม่สำเร็จ</div>
              <div className="text-[11px] mt-0.5">{errorMsg}</div>
            </div>
          </div>
        )}

        {warningMsg && (
          <div className="mb-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2.5 shadow-xs">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
            <div>{warningMsg}</div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* MODE A: CACHED USER UNLOCK                                    */}
        {/* ------------------------------------------------------------- */}
        {!isFirstTimeMode && cachedUser ? (
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
            {/* User Profile */}
            <div className="flex flex-col items-center text-center mb-5">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-black text-xl flex items-center justify-center shadow-lg shadow-blue-500/25 mb-2 ring-4 ring-blue-50">
                {cachedUser.nickname?.[0] || cachedUser.full_name?.[0] || 'ส'}
              </div>
              <h2 className="text-base font-bold text-slate-900">
                {cachedUser.full_name || cachedUser.fullName}
              </h2>
              <div className="inline-flex items-center gap-2 mt-1">
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 font-mono font-bold">
                  {cachedUser.employee_code || cachedUser.employeeCode}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  ({cachedUser.nickname || 'พนักงาน'})
                </span>
              </div>
            </div>

            {/* Dynamic PIN / Password Input Display with Toggle */}
            <form onSubmit={handleCachedPinSubmit} className="space-y-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  ref={pinInputRef}
                  type={showPassword ? 'text' : 'password'}
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                  placeholder="กรอกรหัส PIN หรือรหัสผ่าน"
                  className="w-full pl-10 pr-10 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-base font-mono tracking-widest text-center focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-colors"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Dynamic Dots Indicator (Expands with input length) */}
              <div className="flex justify-center items-center gap-2 min-h-6 flex-wrap py-1">
                {pinCode.length === 0 ? (
                  <span className="text-[11px] text-slate-400 font-medium">แตะแป้นตัวเลข หรือพิมพ์รหัสผ่าน</span>
                ) : (
                  Array.from({ length: pinCode.length }).map((_, i) => (
                    <div
                      key={i}
                      className="w-3 h-3 rounded-full bg-blue-600 shadow-xs shadow-blue-400/50 animate-fade-in"
                    />
                  ))
                )}
              </div>

              {/* Custom Numeric PIN Keypad */}
              <div className="grid grid-cols-3 gap-2.5 max-w-[280px] mx-auto mb-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handlePinInput(String(num))}
                    disabled={isLoading}
                    className="h-13 rounded-2xl bg-slate-50 hover:bg-blue-50 active:bg-blue-100 text-xl font-bold text-slate-800 transition-all border border-slate-100 flex items-center justify-center active:scale-95 shadow-xs"
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleClearPin}
                  disabled={isLoading}
                  className="h-13 rounded-2xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-600 transition-all border border-slate-200 flex items-center justify-center active:scale-95"
                >
                  ล้าง
                </button>
                <button
                  type="button"
                  onClick={() => handlePinInput('0')}
                  disabled={isLoading}
                  className="h-13 rounded-2xl bg-slate-50 hover:bg-blue-50 active:bg-blue-100 text-xl font-bold text-slate-800 transition-all border border-slate-100 flex items-center justify-center active:scale-95 shadow-xs"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handleBackspace}
                  disabled={isLoading}
                  className="h-13 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all border border-slate-200 flex items-center justify-center active:scale-95"
                >
                  <Delete className="w-5 h-5" />
                </button>
              </div>

              {/* Submit Unlock Button */}
              <button
                type="submit"
                disabled={isLoading || !pinCode.trim()}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all disabled:opacity-40"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>ยืนยันเข้าสู่ระบบ (Unlock)</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Switch Account */}
            <div className="text-center pt-3">
              <button
                type="button"
                onClick={handleSwitchAccount}
                className="text-xs text-slate-500 hover:text-blue-600 transition-colors font-semibold"
              >
                เข้าใช้งานด้วยรหัสอื่น (สลับบัญชี)
              </button>
            </div>
          </div>
        ) : (
          /* ------------------------------------------------------------- */
          /* MODE B: FIRST-TIME LOGIN FORM (DYNAMIC CHECK & FLEXIBLE PIN)  */
          /* ------------------------------------------------------------- */
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
            <form onSubmit={handleFirstTimeLogin} className="space-y-4">
              
              {/* Employee Code Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  รหัสพนักงาน (Employee Code)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={employeeCode}
                    onChange={(e) => setEmployeeCode(e.target.value.toUpperCase())}
                    placeholder="เช่น EMP001 หรือ EMP002"
                    className="w-full pl-10 pr-10 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 font-mono transition-colors"
                    required
                    autoFocus
                  />
                  {lookupLoading && (
                    <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center">
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                    </div>
                  )}
                </div>

                {/* Real-Time Employee Code Preview Badge */}
                {foundEmployee && (
                  <div className="mt-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-fade-in">
                    <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div className="font-bold truncate">
                      <span>{foundEmployee.full_name}</span>
                      {foundEmployee.nickname && (
                        <span className="text-emerald-600 ml-1 font-medium">({foundEmployee.nickname})</span>
                      )}
                      <span className="text-[10px] ml-2 px-1.5 py-0.5 rounded-md bg-emerald-200 text-emerald-900 font-mono">
                        {foundEmployee.role === 'ADMIN' ? 'ผู้บริหาร' : 'พนักงาน'}
                      </span>
                    </div>
                  </div>
                )}

                {lookupError && (
                  <p className="mt-1.5 text-[11px] text-rose-500 font-medium flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{lookupError}</span>
                  </p>
                )}
              </div>

              {/* PIN / Password Input (Flexible length, no limit) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  รหัส PIN / รหัสผ่าน (PIN or Password)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    placeholder="กรอกรหัส PIN หรือรหัสผ่าน"
                    className="w-full pl-10 pr-10 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 font-mono transition-colors"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !employeeCode.trim() || !pinCode.trim()}
                className="w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all disabled:opacity-50 mt-2"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>เข้าสู่ระบบ</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* 3. Footer Security Note */}
      <div className="py-2 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
        <span>ระบบความปลอดภัยเชื่อมต่อ Supabase Database</span>
      </div>
    </div>
  );
}
