'use client';

import { useState, useEffect } from 'react';
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
  Sparkles,
  Info
} from 'lucide-react';
import { getDeviceHWID } from '@/lib/hwid';

export default function EmployeeLoginPage() {
  const router = useRouter();
  
  // State
  const [cachedUser, setCachedUser] = useState<any>(null);
  const [isFirstTimeMode, setIsFirstTimeMode] = useState(false);
  const [employeeCode, setEmployeeCode] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [hwid, setHwid] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [warningMsg, setWarningMsg] = useState('');

  useEffect(() => {
    // Generate/Fetch client HWID
    const currentHWID = getDeviceHWID();
    setHwid(currentHWID);

    // Check LocalStorage for cached employee
    const saved = localStorage.getItem('attendance_employee_profile');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCachedUser(parsed);
        setIsFirstTimeMode(false);
      } catch (e) {
        setIsFirstTimeMode(true);
      }
    } else {
      setIsFirstTimeMode(true);
    }
  }, []);

  // Quick PIN Pad handler for cached login
  const handlePinInput = (digit: string) => {
    if (pinCode.length < 4) {
      const newPin = pinCode + digit;
      setPinCode(newPin);
      if (newPin.length === 4) {
        submitCachedPin(newPin);
      }
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
    if (!employeeCode || !pinCode) {
      setErrorMsg('กรุณากรอกรหัสพนักงานและรหัส PIN');
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
          pinCode,
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

      if (data.warning) {
        setWarningMsg(data.warning);
        setTimeout(() => {
          router.push('/employee');
        }, 1200);
      } else {
        router.push('/employee');
      }
    } catch (err: any) {
      setErrorMsg('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Submit Cached PIN Login
  const submitCachedPin = async (pinToVerify: string) => {
    if (!cachedUser?.id) return;
    setIsLoading(true);
    setErrorMsg('');
    setWarningMsg('');

    try {
      const res = await fetch('/api/auth/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: cachedUser.id,
          pinCode: pinToVerify,
          hwid,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.message || 'รหัส PIN ไม่ถูกต้อง');
        setPinCode('');
        setIsLoading(false);
        return;
      }

      localStorage.setItem('attendance_employee_profile', JSON.stringify(data.data));
      router.push('/employee');
    } catch (err: any) {
      setErrorMsg('เกิดข้อผิดพลาดในการตรวจสอบ PIN');
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
          {isFirstTimeMode ? 'เข้าสู่ระบบเพื่อผูกอุปกรณ์และเช็คชื่อเข้างาน' : 'ยินดีต้อนรับกลับ กรุณากรอกรหัส PIN 4 หลัก'}
        </p>
      </div>

      {/* 2. Main Authentication Body */}
      <div className="my-auto py-2">
        {/* Alerts */}
        {errorMsg && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
            <div>
              <div className="font-bold">เข้าสู่ระบบไม่สำเร็จ</div>
              <div className="text-[11px] mt-0.5">{errorMsg}</div>
            </div>
          </div>
        )}

        {warningMsg && (
          <div className="mb-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
            <div>{warningMsg}</div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* MODE A: CACHED USER PIN PAD                                  */}
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

            {/* 4-digit PIN Indicator dots */}
            <div className="flex justify-center items-center gap-4 mb-6">
              {[0, 1, 2, 3].map((index) => (
                <div
                  key={index}
                  className={`w-4 h-4 rounded-full transition-all duration-200 ${
                    pinCode.length > index
                      ? 'bg-blue-600 scale-125 shadow-md shadow-blue-400/50'
                      : 'bg-slate-200 border border-slate-300'
                  }`}
                />
              ))}
            </div>

            {/* Custom PIN Keypad */}
            <div className="grid grid-cols-3 gap-3 max-w-[260px] mx-auto mb-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handlePinInput(String(num))}
                  disabled={isLoading}
                  className="h-14 rounded-2xl bg-slate-50 hover:bg-blue-50 active:bg-blue-100 text-xl font-bold text-slate-800 transition-all border border-slate-100 flex items-center justify-center active:scale-95 shadow-xs"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={handleClearPin}
                disabled={isLoading}
                className="h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-600 transition-all border border-slate-200 flex items-center justify-center active:scale-95"
              >
                ล้าง
              </button>
              <button
                type="button"
                onClick={() => handlePinInput('0')}
                disabled={isLoading}
                className="h-14 rounded-2xl bg-slate-50 hover:bg-blue-50 active:bg-blue-100 text-xl font-bold text-slate-800 transition-all border border-slate-100 flex items-center justify-center active:scale-95 shadow-xs"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleBackspace}
                disabled={isLoading}
                className="h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all border border-slate-200 flex items-center justify-center active:scale-95"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>

            {/* Switch Account */}
            <div className="text-center pt-2">
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
          /* MODE B: FIRST-TIME LOGIN FORM                                 */
          /* ------------------------------------------------------------- */
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
            <form onSubmit={handleFirstTimeLogin} className="space-y-4">
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
                    className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 font-mono transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  รหัส PIN 4 หลัก (PIN Code)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    maxLength={4}
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    placeholder="••••"
                    className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 font-mono tracking-widest text-center text-lg transition-colors"
                    required
                  />
                </div>
              </div>

              {/* HWID Device Tag */}
              <div className="p-3.5 rounded-2xl bg-blue-50/50 border border-blue-100 text-xs text-slate-600">
                <div className="flex items-center justify-between font-bold text-slate-800 mb-1">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    HWID รหัสประจำเครื่อง:
                  </span>
                  <span className="font-mono text-blue-600 text-[11px] truncate max-w-[140px]">
                    {hwid || 'กำลังสร้างรหัส...'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  ระบบจะทำการผูกรหัสเครื่องนี้เข้ากับบัญชีพนักงานในฐานข้อมูล (1 คน 1 เครื่อง)
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>เข้าสู่ระบบและผูกเครื่อง</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Credentials */}
            <div className="mt-5 pt-4 border-t border-slate-100">
              <div className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                แตะเลือกรหัสพนักงานเพื่อทดสอบ:
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { code: 'EMP001', name: 'สมศักดิ์' },
                  { code: 'EMP002', name: 'วิชัย' },
                  { code: 'EMP003', name: 'อนุชา' }
                ].map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => {
                      setEmployeeCode(item.code);
                      setPinCode('1234');
                    }}
                    className="py-2.5 px-2 rounded-xl bg-slate-50 hover:bg-blue-50 active:bg-blue-100 text-slate-700 hover:text-blue-600 border border-slate-200 transition-colors text-center flex flex-col items-center"
                  >
                    <span className="font-mono font-bold text-xs">{item.code}</span>
                    <span className="text-[10px] text-slate-400">{item.name}</span>
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 text-center mt-2 font-medium">
                รหัส PIN เริ่มต้น: <span className="font-mono font-bold text-slate-600">1234</span>
              </p>
            </div>
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
