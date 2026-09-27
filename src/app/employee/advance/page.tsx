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
  FileText
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { SalaryAdvanceRequest } from '@/lib/types';
import EmployeeBottomNav from '@/components/EmployeeBottomNav';

export default function EmployeeSalaryAdvancePage() {
  const router = useRouter();
  const [employee, setEmployee] = useState<any>(null);

  // Form State
  const [amount, setAmount] = useState<string>('1000');
  const [requestDate, setRequestDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [neededBeforeDate, setNeededBeforeDate] = useState<string>('');
  const [reason, setReason] = useState<string>('');

  // Submissions State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [advanceList, setAdvanceList] = useState<SalaryAdvanceRequest[]>([]);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const loadAdvanceRequests = async (empId: string) => {
    try {
      const res = await fetch(`/api/advance-request?employeeId=${empId}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setAdvanceList(data.data);
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
      loadAdvanceRequests(parsed.id);

      // Realtime listener for advance requests updates
      let channel: any = null;
      if (isSupabaseConfigured && supabase) {
        channel = supabase
          .channel(`advance-realtime-${parsed.id}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'salary_advance_requests' }, () => {
            loadAdvanceRequests(parsed.id);
          })
          .subscribe();
      }

      const pollTimer = setInterval(() => {
        loadAdvanceRequests(parsed.id);
      }, 5000);

      const handleVisibility = () => {
        if (document.visibilityState === 'visible') {
          loadAdvanceRequests(parsed.id);
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
    if (!employee?.id) {
      setErrorMsg('ไม่พบข้อมูลพนักงาน กรุณาเข้าสู่ระบบใหม่');
      return;
    }

    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      setErrorMsg('กรุณาระบุยอดเงินที่ต้องการเบิกที่ถูกต้อง');
      return;
    }

    if (!reason.trim()) {
      setErrorMsg('กรุณาระบุหมายเหตุหรือเหตุผลความจำเป็นในการขอเบิกเงิน');
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
          amount: numericAmount,
          requestDate,
          reason: reason.trim(),
          neededBeforeDate: neededBeforeDate || null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg(data.message || 'ยื่นคำขอเบิกเงินล่วงหน้าเรียบร้อย รอผู้บริหารอนุมัติ');
        setReason('');
        setNeededBeforeDate('');
        loadAdvanceRequests(employee.id);
      } else {
        setErrorMsg(data.message || 'เกิดข้อผิดพลาดในการยื่นคำขอ');
      }
    } catch (err: any) {
      setErrorMsg('เชื่อมต่อเซิร์ฟเวอร์ล้มเหลว: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const quickAmounts = [500, 1000, 1500, 2000, 3000];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans pb-28 select-none">
      {/* Top Header */}
      <header className="bg-slate-900 text-white p-4 sticky top-0 z-40 shadow-md">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/employee"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-black text-sm tracking-tight flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-amber-400" />
                <span>ขอเบิกเงินล่วงหน้า</span>
              </h1>
              <p className="text-[11px] text-slate-400">
                {employee?.full_name} ({employee?.nickname || employee?.employee_code})
              </p>
            </div>
          </div>

          <button
            onClick={() => employee?.id && loadAdvanceRequests(employee.id)}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
            title="รีเฟรชข้อมูล"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-5">
        {/* Form Card */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-black text-sm text-slate-900">แบบฟอร์มขอเบิกเงินล่วงหน้า</h2>
              <p className="text-[11px] text-slate-500">ยื่นคำขอเพื่อส่งตรงไปยังผู้บริหารพิจารณา</p>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmitAdvance} className="space-y-3.5 text-xs font-bold">
            {/* Employee Name (Auto-filled) */}
            <div>
              <label className="block text-slate-600 mb-1">ชื่อผู้ขอเบิกเงิน:</label>
              <div className="p-2.5 bg-slate-100 rounded-xl text-slate-700 font-medium flex items-center gap-2 border border-slate-200">
                <User className="w-4 h-4 text-slate-400" />
                <span>{employee?.full_name} ({employee?.employee_code})</span>
              </div>
            </div>

            {/* Quick Amount Buttons & Custom Amount */}
            <div>
              <label className="block text-slate-700 mb-1">
                ยอดเงินที่ต้องการเบิก (บาท): <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-1.5 flex-wrap mb-2">
                {quickAmounts.map((q) => (
                  <button
                    type="button"
                    key={q}
                    onClick={() => setAmount(q.toString())}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                      amount === q.toString()
                        ? 'bg-amber-500 text-slate-950 shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {q.toLocaleString()}฿
                  </button>
                ))}
              </div>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 font-bold">฿</span>
                <input
                  type="number"
                  min="100"
                  step="50"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="ระบุจำนวนเงิน เช่น 1500"
                  className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono text-sm focus:outline-none focus:border-amber-500"
                  required
                />
              </div>
            </div>

            {/* Request Date & Needed Before Date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 mb-1">วันที่ขอเบิก:</label>
                <input
                  type="date"
                  value={requestDate}
                  onChange={(e) => setRequestDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-medium focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">
                  จำเป็นต้องใช้ก่อนวันที่:
                </label>
                <input
                  type="date"
                  value={neededBeforeDate}
                  onChange={(e) => setNeededBeforeDate(e.target.value)}
                  placeholder="ไม่ระบุก็ได้"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-medium focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Reason / Notes */}
            <div>
              <label className="block text-slate-700 mb-1">
                หมายเหตุ / เหตุผลความจำเป็น: <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="ระบุเหตุผล เช่น ค่าเทอมลูก, จ่ายค่ายา, ซ่อมรถมอเตอร์ไซค์ ฯลฯ"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'กำลังส่งคำขอ...' : 'ส่งคำขอเบิกเงินล่วงหน้า'}</span>
            </button>
          </form>
        </div>

        {/* History List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-black text-xs text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <Clock3 className="w-3.5 h-3.5" />
              <span>ประวัติการขอเบิกเงิน ({advanceList.length})</span>
            </h3>
          </div>

          {advanceList.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 text-xs font-bold space-y-1">
              <Coins className="w-8 h-8 text-slate-300 mx-auto" />
              <div>ยังไม่มีประวัติการขอเบิกเงินล่วงหน้า</div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {advanceList.map((item) => {
                const isApproved = item.status === 'APPROVED';
                const isRejected = item.status === 'REJECTED';
                const isPending = item.status === 'PENDING';

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-base font-mono text-slate-900">
                          {Number(item.amount).toLocaleString()} <span className="text-xs font-sans">บาท</span>
                        </span>
                        <span className="text-[11px] text-slate-400">
                          ({new Date(item.request_date).toLocaleDateString('th-TH')})
                        </span>
                      </div>

                      {isApproved && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          อนุมัติแล้ว
                        </span>
                      )}
                      {isRejected && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                          <XCircle className="w-3 h-3 text-rose-600" />
                          ไม่อนุมัติ
                        </span>
                      )}
                      {isPending && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                          <Clock3 className="w-3 h-3 text-amber-600" />
                          รอพิจารณา
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-600 font-medium">
                      <span className="text-slate-400">เหตุผล:</span> {item.reason}
                    </div>

                    {item.needed_before_date && (
                      <div className="text-[11px] text-amber-800 bg-amber-50 px-2 py-1 rounded-lg w-fit font-medium">
                        ⏰ จำเป็นต้องใช้ก่อน: {new Date(item.needed_before_date).toLocaleDateString('th-TH')}
                      </div>
                    )}

                    {isRejected && item.rejection_reason && (
                      <div className="text-[11px] text-rose-700 bg-rose-50 p-2 rounded-xl border border-rose-100 font-medium">
                        เหตุผลที่ไม่อนุมัติ: {item.rejection_reason}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* SMART AUTO-HIDE BOTTOM NAVIGATION BAR */}
      <EmployeeBottomNav currentTab="advance" />
    </div>
  );
}
