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
import { saveOfflineAction } from '@/lib/offline-sync';
import EmployeeBottomNav from '@/components/EmployeeBottomNav';
import NetworkGuard from '@/components/NetworkGuard';

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

  // Monthly Attendance Tracking State (Resets every new month)
  const thaiMonths = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const [monthlyStats, setMonthlyStats] = useState<{
    presentDays: number;
    lateDays: number;
    totalWorkDays: number;
    totalAllowance: number;
    monthName: string;
    yearBuddhist: number;
  }>({
    presentDays: 0,
    lateDays: 0,
    totalWorkDays: 0,
    totalAllowance: 0,
    monthName: thaiMonths[currentMonth - 1],
    yearBuddhist: currentYear + 543,
  });

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

  const loadMonthlyAttendance = async (empId: string) => {
    try {
      const res = await fetch(`/api/employee/stats?id=${empId}&month=${currentMonth}&year=${currentYear}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success && data.data?.summary) {
        const sum = data.data.summary;
        const total = (sum.presentDays || 0) + (sum.lateDays || 0);
        setMonthlyStats({
          presentDays: sum.presentDays || 0,
          lateDays: sum.lateDays || 0,
          totalWorkDays: total,
          totalAllowance: sum.totalAllowance || 0,
          monthName: thaiMonths[currentMonth - 1],
          yearBuddhist: currentYear + 543,
        });
      }
    } catch (e) {
      console.error('Error fetching monthly attendance stats:', e);
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
      loadMonthlyAttendance(parsed.id);

      let channel: any = null;
      if (isSupabaseConfigured && supabase) {
        channel = supabase
          .channel(`advance-realtime-${parsed.id}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'salary_advance_requests' }, () => {
            loadRequests(parsed.id);
            loadMonthlyAttendance(parsed.id);
          })
          .subscribe();
      }

      const pollTimer = setInterval(() => {
        loadRequests(parsed.id);
        loadMonthlyAttendance(parsed.id);
      }, 5000);

      const handleVisibility = () => {
        if (document.visibilityState === 'visible') {
          loadRequests(parsed.id);
          loadMonthlyAttendance(parsed.id);
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

    const payload = {
      employeeId: employee.id,
      amount: numAmount,
      requestDate,
      needDate,
      reason,
    };

    // Offline check
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      await saveOfflineAction('ADVANCE_REQUEST', payload);
      setSuccessMsg('📡 บันทึกคำขอเบิกเงินแบบออฟไลน์เรียบร้อย ระบบจะส่งเข้าฐานข้อมูลอัตโนมัติเมื่อต่อเน็ต');
      setReason('');
      setRequests((prev) => [
        {
          id: `OFFLINE_${Date.now()}`,
          employee_id: employee.id,
          amount: numAmount,
          request_date: requestDate,
          reason,
          status: 'PENDING',
        },
        ...prev,
      ]);
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/advance-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
      // Network failure fallback
      await saveOfflineAction('ADVANCE_REQUEST', payload);
      setSuccessMsg('📡 บันทึกคำขอเบิกเงินแบบออฟไลน์เรียบร้อย ระบบจะส่งเข้าฐานข้อมูลอัตโนมัติเมื่อต่อเน็ต');
      setReason('');
      setRequests((prev) => [
        {
          id: `OFFLINE_${Date.now()}`,
          employee_id: employee.id,
          amount: numAmount,
          request_date: requestDate,
          reason,
          status: 'PENDING',
        },
        ...prev,
      ]);
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
      
      {/* Network Guard */}
      <NetworkGuard />

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
          <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-400/30 overflow-hidden flex items-center justify-center shrink-0">
            {employee?.avatar_url ? (
              <img src={employee.avatar_url} alt={employee.fullName || employee.full_name} className="w-full h-full object-cover" />
            ) : (
              <span className="font-black text-xs text-amber-400 font-sans">
                {(employee?.nickname || employee?.fullName || employee?.full_name || 'U').charAt(0)}
              </span>
            )}
          </div>
          <div>
            <h1 className="font-bold text-sm">ขอเบิกเงินเดือนล่วงหน้า</h1>
            <p className="text-[11px] text-slate-400 font-mono">
              {employee?.fullName || employee?.full_name} ({employee?.employeeCode || employee?.employee_code})
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
        
        {/* Monthly Attendance & Quota Hero Card with Controlled 30% Visibility */}
        <div className="p-4 rounded-3xl text-white shadow-xl relative overflow-hidden group border border-amber-500/30 bg-[#160f08]">
          {/* Custom Background Image with 30-40% Translucency */}
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-40 pointer-events-none transition-transform duration-700 group-hover:scale-110"
            style={{ backgroundImage: `url('/images/advance-quota-bg.jpg')` }}
          />
          {/* Soft Frosted Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-amber-950/70 via-orange-950/75 to-[#160f08]/90 pointer-events-none" />

          <div className="relative z-10 space-y-2">
            {/* Header Strip with Dynamic Month Name */}
            <div className="flex items-center justify-between text-amber-200 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-yellow-300 drop-shadow-md" />
                <span className="drop-shadow-sm">สถิติเข้างาน & โควตาเบิกเงิน</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/40 border border-white/15 text-amber-300 backdrop-blur-md">
                ประจำเดือน{monthlyStats.monthName} {monthlyStats.yearBuddhist}
              </span>
            </div>

            {/* Main Highlight: Total Attendance Days This Month */}
            <div className="flex items-baseline justify-between pt-1">
              <div>
                <div className="text-3xl font-black my-0.5 text-white drop-shadow-md tracking-tight">
                  {monthlyStats.totalWorkDays} <span className="text-sm font-normal text-amber-200">วัน</span>
                </div>
                <div className="text-[11px] text-amber-200 font-medium drop-shadow-sm flex items-center gap-1">
                  <span>เข้างานสะสมในเดือนนี้</span>
                  <span className="text-slate-400">•</span>
                  <span className="text-emerald-300">ตรงเวลา {monthlyStats.presentDays} วัน</span>
                  {monthlyStats.lateDays > 0 && (
                    <>
                      <span className="text-slate-400">•</span>
                      <span className="text-amber-300">สาย {monthlyStats.lateDays} วัน</span>
                    </>
                  )}
                </div>
              </div>

              {/* Allowance Payout Badge */}
              <div className="text-right">
                <div className="text-[10px] text-slate-300 font-medium">เบี้ยขยันสะสม</div>
                <div className="text-base font-black text-yellow-300 font-mono drop-shadow-sm">
                  +{monthlyStats.totalAllowance.toLocaleString()}฿
                </div>
              </div>
            </div>

            {/* Bottom Subtitle / Monthly Reset Indicator */}
            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-amber-200/90 font-medium">
              <span>วงเงินคงเหลือที่ขอเบิกได้: <b className="text-white font-mono">฿7,500</b></span>
              <span className="text-slate-300/80 italic">🔄 รีเซ็ตนับวันใหม่ทุกวันที่ 1</span>
            </div>
          </div>
        </div>

        {/* Advance Request Form (0% Dark Overlay / 100% Full Clarity) */}
        <div className="p-4 rounded-3xl relative overflow-hidden shadow-2xl border border-amber-500/30 bg-transparent space-y-3">
          {/* Custom Background Image with 100% Full Clarity */}
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-100 pointer-events-none transition-transform duration-700"
            style={{ backgroundImage: `url('/images/advance-form-bg.jpg')` }}
          />

          <div className="relative z-10 space-y-3">
            <div className="font-black text-xs flex items-center gap-1.5 text-slate-900 drop-shadow-sm">
              <Coins className="w-4 h-4 text-amber-600" />
              <span>ระบุจำนวนเงินที่ต้องการขอเบิก</span>
            </div>

          {/* Quick Amount Chips */}
          <div className="grid grid-cols-3 gap-2">
            {['500', '1000', '2000'].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setAmount(amt)}
                className={`py-2.5 rounded-2xl text-xs font-black font-mono transition-all active:scale-95 ${
                  amount === amt
                    ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md shadow-amber-500/40 border border-amber-700'
                    : 'bg-white/90 text-slate-900 border border-slate-300 shadow-sm hover:bg-white'
                }`}
              >
                +{Number(amt).toLocaleString()}฿
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmitAdvance} className="space-y-3 pt-2">
            <div>
              <label className="text-[11px] text-slate-900 font-black block mb-1 drop-shadow-xs">จำนวนเงิน (บาท)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="กรอกจำนวนเงิน"
                className="w-full p-3 rounded-2xl text-base font-mono font-bold bg-white/95 text-slate-900 border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-hidden shadow-xs placeholder:text-slate-500"
                required
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-900 font-black block mb-1 drop-shadow-xs">วันที่ต้องการรับเงิน</label>
              <input
                type="date"
                value={needDate}
                onChange={(e) => setNeedDate(e.target.value)}
                className="w-full p-2.5 rounded-2xl text-xs font-mono font-bold bg-white/95 text-slate-900 border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-hidden shadow-xs"
                required
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-900 font-black block mb-1 drop-shadow-xs">เหตุผลความจำเป็น</label>
              <input
                type="text"
                placeholder="เช่น ค่าใช้จ่ายฉุกเฉินในครอบครัว..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full p-2.5 rounded-2xl text-xs font-bold bg-white/95 text-slate-900 border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-hidden shadow-xs placeholder:text-slate-500"
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
