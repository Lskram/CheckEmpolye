'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  FileText, 
  Calendar, 
  Clock, 
  Coins,
  Send, 
  CheckCircle2, 
  Clock3, 
  XCircle, 
  AlertCircle, 
  RefreshCw,
  Menu
} from 'lucide-react';

export default function EmployeeLeavePage() {
  const router = useRouter();
  const [employee, setEmployee] = useState<any>(null);

  // Form State
  const [leaveType, setLeaveType] = useState<'SICK' | 'BUSINESS' | 'ANNUAL' | 'OTHER'>('SICK');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('');

  // Submissions State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [leaveList, setLeaveList] = useState<any[]>([]);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('attendance_employee_profile');
    if (!saved) {
      router.push('/employee/login');
      return;
    }
    try {
      const parsed = JSON.parse(saved);
      setEmployee(parsed);
      loadLeaves(parsed.id);
    } catch (e) {
      router.push('/employee/login');
    }
  }, []);

  const loadLeaves = async (empId: string) => {
    try {
      const res = await fetch(`/api/leave?employeeId=${empId}`);
      const data = await res.json();
      if (data.success) {
        setLeaveList(data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee?.id || !reason) {
      setErrorMsg('กรุณาระบุเหตุผลการลา');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: employee.id,
          leaveType,
          startDate,
          endDate,
          reason,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.message || 'ไม่สามารถยื่นคำขอลาได้');
        setIsSubmitting(false);
        return;
      }

      setSuccessMsg('ยื่นคำขอลาสำเร็จ! รอผู้บริหารตรวจสอบอนุมัติ');
      setReason('');
      loadLeaves(employee.id);
    } catch (err: any) {
      setErrorMsg('เกิดข้อผิดพลาดในการส่งข้อมูล: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getLeaveTypeLabel = (type: string) => {
    switch (type) {
      case 'SICK': return 'ลาป่วย (Sick Leave)';
      case 'BUSINESS': return 'ลากิจ (Business Leave)';
      case 'ANNUAL': return 'ลาพักร้อน (Annual Leave)';
      default: return 'ลาอื่นๆ (Other)';
    }
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-slate-800 flex flex-col justify-between max-w-md mx-auto shadow-2xl pb-24">
      {/* Top Header */}
      <header className="bg-white px-5 pt-4 pb-3 flex items-center justify-between border-b border-slate-100 shadow-xs sticky top-0 z-30">
        <div>
          <h1 className="font-bold text-base text-slate-900">ยื่นคำขอลา (Leave Request)</h1>
          <p className="text-xs text-slate-500">
            {employee?.fullName} ({employee?.employeeCode})
          </p>
        </div>
      </header>

      {/* Main Leave Form */}
      <main className="p-4 flex-1 space-y-4">
        {successMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmitLeave} className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          {/* Leave Type Select */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              ประเภทการลา:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'SICK', label: 'ลาป่วย 🩺' },
                { id: 'BUSINESS', label: 'ลากิจ 💼' },
                { id: 'ANNUAL', label: 'ลาพักร้อน 🏖️' },
                { id: 'OTHER', label: 'อื่นๆ 📝' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setLeaveType(item.id as any)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all text-left flex items-center justify-between ${
                    leaveType === item.id
                      ? 'bg-blue-50 text-blue-700 border-blue-300 shadow-2xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>{item.label}</span>
                  {leaveType === item.id && <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                ตั้งแต่วันที่:
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-blue-600"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                ถึงวันที่:
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-blue-600"
                required
              />
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              เหตุผลการลา:
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="ระบุรายละเอียด เช่น มีไข้สูง ไปพบแพทย์ตามนัด"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-blue-600 resize-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-500/25 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>ส่งคำขอลาไปยังผู้บริหาร</span>
              </>
            )}
          </button>
        </form>

        {/* Previous Leaves List */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
          <h3 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-blue-600" />
            <span>ประวัติการยื่นลาของคุณ</span>
          </h3>

          <div className="space-y-2">
            {leaveList.length > 0 ? (
              leaveList.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">
                      {getLeaveTypeLabel(item.leave_type)}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
                        item.status === 'APPROVED'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : item.status === 'REJECTED'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {item.status === 'APPROVED' ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> อนุมัติแล้ว
                        </>
                      ) : item.status === 'REJECTED' ? (
                        <>
                          <XCircle className="w-3 h-3 text-rose-600" /> ไม่อนุมัติ
                        </>
                      ) : (
                        <>
                          <Clock3 className="w-3 h-3 text-amber-600" /> รอตรวจสอบ
                        </>
                      )}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {new Date(item.start_date).toLocaleDateString('th-TH')} - {new Date(item.end_date).toLocaleDateString('th-TH')} ({item.days_count} วัน)
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-700 italic bg-white p-2 rounded-xl border border-slate-200/70">
                    "{item.reason}"
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-xs text-slate-400">ยังไม่มีประวัติการยื่นลา</div>
            )}
          </div>
        </div>
      </main>

      {/* 5-Tab Navigation matching Screenshot */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-slate-200/90 px-3 py-2 flex items-center justify-around z-30 shadow-lg">
        <Link href="/employee" className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-slate-600 text-[10px] py-1">
          <div className="w-6 h-6 flex items-center justify-center"><Clock className="w-4 h-4" /></div>
          <span>เข้างาน</span>
        </Link>
        <Link href="/employee/stats" className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-slate-600 text-[10px] py-1">
          <div className="w-6 h-6 flex items-center justify-center"><Calendar className="w-4 h-4" /></div>
          <span>ปฏิทิน</span>
        </Link>
        <Link href="/employee/stats" className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-slate-600 text-[10px] py-1">
          <div className="w-6 h-6 flex items-center justify-center"><Coins className="w-4 h-4" /></div>
          <span>เบี้ยเลี้ยง</span>
        </Link>
        <Link href="/employee/leave" className="flex flex-col items-center gap-0.5 text-blue-600 font-bold text-[10px] py-1">
          <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center text-blue-600"><FileText className="w-4 h-4" /></div>
          <span>คำขอลา</span>
          <span className="w-1 h-1 rounded-full bg-blue-600"></span>
        </Link>
        <Link href="/admin" className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-slate-600 text-[10px] py-1">
          <div className="w-6 h-6 flex items-center justify-center"><Menu className="w-4 h-4" /></div>
          <span>ผู้บริหาร</span>
        </Link>
      </nav>
    </div>
  );
}
