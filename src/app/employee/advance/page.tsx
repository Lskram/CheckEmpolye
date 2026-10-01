'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Coins, 
  Calendar, 
  Send, 
  CheckCircle2, 
  Clock3, 
  XCircle, 
  AlertCircle, 
  RefreshCw,
  ArrowLeft,
  DollarSign,
  User,
  FileText,
  Sun,
  Moon,
  Shield
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { SalaryAdvanceRequest } from '@/lib/types';
import { useAppTheme } from '@/lib/theme';
import EmployeeBottomNav from '@/components/EmployeeBottomNav';

export default function EmployeeSalaryAdvancePage() {
  const router = useRouter();
  const { isDark, toggleTheme } = useAppTheme();
  const [employee, setEmployee] = useState<any>(null);

  // Form State
  const [amount, setAmount] = useState<string>('1000');
  const [requestDate, setRequestDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [needDate, setNeedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState<string>('');

  // Submissions State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requests, setRequests] = useState<SalaryAdvanceRequest[]>([]);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const loadRequests = async (empId: string) => {
    try {
      const res = await fetch(`/api/advance-request?employeeId=${empId}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setRequests(data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('attendance_employee_profile');
    if (!saved) {
      router.push('/employee/login');
      return;
    }
    try {
      const parsed = JSON.parse(saved);
      setEmployee(parsed);
      loadRequests(parsed.id);

      let channel: any = null;
      if (isSupabaseConfigured && supabase) {
        channel = supabase
          .channel(`advance-realtime-${parsed.id}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'salary_advance_requests' }, () => {
            loadRequests(parsed.id);
          })
          .subscribe();
      }

      const pollTimer = setInterval(() => {
        loadRequests(parsed.id);
      }, 5000);

      const handleVisibility = () => {
        if (document.visibilityState === 'visible') {
          loadRequests(parsed.id);
        }
      };
      document.addEventListener('visibilitychange', handleVisibility);

      return () => {
        if (channel && supabase) supabase.removeChannel(channel);
        clearInterval(pollTimer);
        document.removeEventListener('visibilitychange', handleVisibility);
      };
    } catch (e) {
      router.push('/employee/login');
    }
  }, []);

  const handleSubmitAdvance = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg('กรุณาระบุจำนวนเงินที่ถูกต้อง');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/advance-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: employee.id,
          amount: numAmount,
          requestDate,
          needDate,
          reason,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg('ยื่นคำขอเบิกเงินล่วงหน้าสำเร็จแล้ว! รอผู้บริหารพิจารณา');
        setReason('');
        loadRequests(employee.id);
      } else {
        setErrorMsg(data.message || 'เกิดข้อผิดพลาดในการส่งคำขอ');
      }
    } catch (err: any) {
      setErrorMsg('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> อนุมัติแล้ว
          </span>
        );
      case 'REJECTED':
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold text-rose-500 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20">
            <XCircle className="w-3.5 h-3.5" /> ไม่อนุมัติ
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
            <Clock3 className="w-3.5 h-3.5" /> รอพิจารณา
          </span>
        );
    }
  };

  return (
    <div className={`min-h-screen w-full flex flex-col justify-between max-w-md mx-auto shadow-2xl relative overflow-hidden pb-28 font-sans transition-colors duration-300 ${
      isDark ? 'bg-[#090d16] text-slate-100' : 'bg-[#eef2f7] text-slate-800'
    }`}>
      
      {/* Header */}
      <header className={`px-4 pt-4 pb-3 flex items-center justify-between sticky top-0 z-30 transition-colors ${
        isDark ? 'bg-[#0f1626]/90 border-b border-white/5 backdrop-blur-xl' : 'bg-white/90 border-b border-slate-200 backdrop-blur-xl shadow-xs'
      }`}>
        <div className="flex items-center gap-2.5">
          <Link
            href="/employee"
            className={`p-2 rounded-xl border transition-all active:scale-90 ${
              isDark ? 'bg-slate-800 border-white/10 text-slate-300' : 'bg-slate-100 border-slate-300 text-slate-700'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="font-bold text-sm">ขอเบิกเงินเดือนล่วงหน้า</h1>
            <p className="text-[11px] text-slate-400 font-mono">
              {employee?.fullName} ({employee?.employeeCode})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-xl border transition-all active:scale-90 ${
              isDark ? 'bg-slate-800 border-white/10 text-yellow-300' : 'bg-slate-100 border-slate-300 text-slate-700'
            }`}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 flex-1 space-y-4 relative z-10">
        
        {/* Quota Card */}
        <div className="p-4 rounded-3xl bg-gradient-to-br from-amber-600 to-orange-700 text-white shadow-xl shadow-amber-950/30 relative overflow-hidden">
          <div className="flex items-center justify-between text-amber-100 text-xs mb-1 font-semibold">
            <span>วงเงินคงเหลือที่ขอเบิกได้</span>
            <Coins className="w-5 h-5 text-yellow-300" />
          </div>
          <div className="text-3xl font-black my-1">
            7,500 <span className="text-sm font-normal">บาท</span>
          </div>
          <div className="text-[10px] text-amber-100/90 font-medium">
            เพดานสูงสุด 50% ของฐานเงินเดือน (รอบจ่ายสิ้นเดือน)
          </div>
        </div>

        {/* Advance Request Form */}
        <div className={`p-4 rounded-3xl ${isDark ? 'neumorph-dark' : 'neumorph-light'} space-y-3`}>
          <div className="font-bold text-xs flex items-center gap-1.5">
            <Coins className="w-4 h-4 text-amber-500" />
            <span>ระบุจำนวนเงินที่ต้องการขอเบิก</span>
          </div>

          {/* Quick Amount Chips */}
          <div className="grid grid-cols-3 gap-2">
            {['500', '1000', '2000'].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setAmount(amt)}
                className={`py-2.5 rounded-2xl text-xs font-bold font-mono transition-all active:scale-95 ${
                  amount === amt
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/30'
                    : isDark ? 'neumorph-tile-dark text-slate-300' : 'neumorph-tile-light text-slate-700'
                }`}
              >
                +{Number(amt).toLocaleString()}฿
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmitAdvance} className="space-y-3 pt-2">
            <div>
              <label className="text-[11px] text-slate-400 font-bold block mb-1">จำนวนเงิน (บาท)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="กรอกจำนวนเงิน"
                className={`w-full p-3 rounded-2xl text-base font-mono font-bold ${
                  isDark ? 'neumorph-dark-inset text-white' : 'neumorph-light-inset text-slate-800'
                }`}
                required
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 font-bold block mb-1">วันที่ต้องการรับเงิน</label>
              <input
                type="date"
                value={needDate}
                onChange={(e) => setNeedDate(e.target.value)}
                className={`w-full p-2.5 rounded-2xl text-xs font-mono font-bold ${
                  isDark ? 'neumorph-dark-inset text-white' : 'neumorph-light-inset text-slate-800'
                }`}
                required
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 font-bold block mb-1">เหตุผลความจำเป็น</label>
              <input
                type="text"
                placeholder="เช่น ค่าใช้จ่ายฉุกเฉินในครอบครัว..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className={`w-full p-2.5 rounded-2xl text-xs ${
                  isDark ? 'neumorph-dark-inset text-white' : 'neumorph-light-inset text-slate-800'
                }`}
                required
              />
            </div>

            {errorMsg && (
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
                {successMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-xs shadow-xl shadow-amber-500/30 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>{isSubmitting ? 'กำลังส่งข้อมูล...' : 'ยื่นคำขอเบิกเงิน'}</span>
            </button>
          </form>
        </div>

        {/* Requests History */}
        <div className={`p-4 rounded-3xl ${isDark ? 'neumorph-dark' : 'neumorph-light'} space-y-3`}>
          <div className="font-bold text-xs flex items-center justify-between">
            <span>ประวัติการขอเบิกเงิน</span>
            <span className="text-[10px] text-slate-400">ซิงค์สด Realtime</span>
          </div>

          <div className="space-y-2">
            {requests.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">
                ยังไม่มีประวัติการขอเบิกเงิน
              </div>
            ) : (
              requests.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-2xl flex items-center justify-between transition-all ${
                    isDark ? 'neumorph-tile-dark' : 'neumorph-tile-light'
                  }`}
                >
                  <div>
                    <div className="font-bold text-sm font-mono text-amber-500">
                      {Number(item.amount).toLocaleString()} บาท
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      ยื่นเมื่อ: {item.request_date || (item as any).requestDate}
                    </div>
                    {item.reason && (
                      <div className="text-[11px] text-slate-400 mt-1 italic">
                        "{item.reason}"
                      </div>
                    )}
                  </div>
                  <div>
                    {getStatusBadge(item.status)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </main>

      {/* SMART AUTO-HIDE BOTTOM NAVIGATION BAR */}
      <EmployeeBottomNav currentTab="advance" />
    </div>
  );
}
