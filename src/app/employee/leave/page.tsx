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
  Menu,
  ArrowLeft,
  Sun,
  Moon,
  Shield
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAppTheme } from '@/lib/theme';
import { saveOfflineAction } from '@/lib/offline-sync';
import EmployeeBottomNav from '@/components/EmployeeBottomNav';
import NetworkGuard from '@/components/NetworkGuard';

export default function EmployeeLeavePage() {
  const router = useRouter();
  const { isDark, toggleTheme } = useAppTheme();
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

  const loadLeaves = async (empId: string) => {
    try {
      const res = await fetch(`/api/leave?employeeId=${empId}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setLeaveList(data.data);
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
      loadLeaves(parsed.id);

      let channel: any = null;
      if (isSupabaseConfigured && supabase) {
        channel = supabase
          .channel(`leave-realtime-${parsed.id}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'leave_requests' }, () => {
            loadLeaves(parsed.id);
          })
          .subscribe();
      }

      const pollTimer = setInterval(() => {
        loadLeaves(parsed.id);
      }, 5000);

      const handleVisibility = () => {
        if (document.visibilityState === 'visible') {
          loadLeaves(parsed.id);
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

  const handleSubmitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee?.id || !reason) {
      setErrorMsg('กรุณาระบุเหตุผลการลา');
      return;
    }

    const payload = {
      employeeId: employee.id,
      leaveType,
      startDate,
      endDate,
      reason,
    };

    // Offline check
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      await saveOfflineAction('LEAVE_REQUEST', payload);
      setSuccessMsg('📡 บันทึกคำขอลาแบบออฟไลน์เรียบร้อย ระบบจะส่งเข้าฐานข้อมูลอัตโนมัติเมื่อต่อเน็ต');
      setReason('');
      setLeaveList((prev) => [
        {
          id: `OFFLINE_${Date.now()}`,
          employeeId: employee.id,
          leaveType,
          startDate,
          endDate,
          reason,
          status: 'PENDING',
        },
        ...prev,
      ]);
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg('ยื่นใบลาสำเร็จแล้ว! รอหัวหน้างานพิจารณาอนุมัติ');
        setReason('');
        loadLeaves(employee.id);
      } else {
        setErrorMsg(data.message || 'เกิดข้อผิดพลาดในการยื่นใบลา');
      }
    } catch (err: any) {
      // Network failure fallback
      await saveOfflineAction('LEAVE_REQUEST', payload);
      setSuccessMsg('📡 บันทึกคำขอลาแบบออฟไลน์เรียบร้อย ระบบจะส่งเข้าฐานข้อมูลอัตโนมัติเมื่อต่อเน็ต');
      setReason('');
      setLeaveList((prev) => [
        {
          id: `OFFLINE_${Date.now()}`,
          employeeId: employee.id,
          leaveType,
          startDate,
          endDate,
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

  const getLeaveTypeName = (type: string) => {
    switch (type) {
      case 'SICK': return 'ลาป่วย (Sick Leave)';
      case 'BUSINESS': return 'ลากิจ (Business Leave)';
      case 'ANNUAL': return 'ลาพักร้อน (Annual Leave)';
      default: return 'ลาอื่นๆ';
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
          <div>
            <h1 className="font-bold text-sm">ยื่นคำขอลาหยุด</h1>
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
        
        {/* Form Card with Vacation/Leave Custom Background */}
        <div className={`p-4 rounded-3xl relative overflow-hidden shadow-2xl border border-purple-500/20 bg-[#0c121e] space-y-3`}>
          {/* Custom Vacation / Leave Background Image with Controlled Opacity */}
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-20 pointer-events-none transition-transform duration-700"
            style={{ backgroundImage: `url('/images/leave-form-bg.jpg')` }}
          />
          {/* Solid Seamless Dark Frosted Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#090d16] via-[#0c121e]/90 to-[#090d16] pointer-events-none" />

          <div className="relative z-10 space-y-3">
            <div className="font-bold text-xs flex items-center gap-1.5 text-white drop-shadow-sm">
              <FileText className="w-4 h-4 text-purple-400" />
              <span>เลือกประเภทการลา</span>
            </div>

          {/* 4 Category Pills */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'SICK', label: '🩺 ลาป่วย', color: 'rose' },
              { id: 'BUSINESS', label: '💼 ลากิจ', color: 'blue' },
              { id: 'ANNUAL', label: '🏖️ ลาพักร้อน', color: 'emerald' },
              { id: 'OTHER', label: '📝 อื่นๆ', color: 'amber' }
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setLeaveType(cat.id as any)}
                className={`p-3 rounded-2xl text-xs font-bold transition-all active:scale-95 text-left ${
                  leaveType === cat.id
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/30'
                    : isDark ? 'neumorph-tile-dark text-slate-300' : 'neumorph-tile-light text-slate-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmitLeave} className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-slate-400 font-bold block mb-1">วันที่เริ่มต้น</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={`w-full p-2.5 rounded-2xl text-xs font-mono font-bold ${
                    isDark ? 'neumorph-dark-inset text-white' : 'neumorph-light-inset text-slate-800'
                  }`}
                  required
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 font-bold block mb-1">วันที่สิ้นสุด</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={`w-full p-2.5 rounded-2xl text-xs font-mono font-bold ${
                    isDark ? 'neumorph-dark-inset text-white' : 'neumorph-light-inset text-slate-800'
                  }`}
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 font-bold block mb-1">เหตุผลความจำเป็น</label>
              <textarea
                rows={2}
                placeholder="ระบุอาการหรือเหตุผลความจำเป็น..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className={`w-full p-2.5 rounded-2xl text-xs resize-none ${
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
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs shadow-xl shadow-purple-500/30 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>{isSubmitting ? 'กำลังส่งข้อมูล...' : 'ส่งใบลาให้อนุมัติ'}</span>
            </button>
          </form>
          </div>
        </div>

        {/* Leave History List */}
        <div className={`p-4 rounded-3xl ${isDark ? 'neumorph-dark' : 'neumorph-light'} space-y-3`}>
          <div className="font-bold text-xs flex items-center justify-between">
            <span>ประวัติการยื่นใบลา</span>
            <span className="text-[10px] text-slate-400">ซิงค์สด Realtime</span>
          </div>

          <div className="space-y-2">
            {leaveList.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">
                ยังไม่มีประวัติการยื่นใบลา
              </div>
            ) : (
              leaveList.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-2xl flex items-center justify-between transition-all ${
                    isDark ? 'neumorph-tile-dark' : 'neumorph-tile-light'
                  }`}
                >
                  <div>
                    <div className="font-bold text-xs">{getLeaveTypeName(item.leaveType)}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {item.startDate} {item.startDate !== item.endDate ? `ถึง ${item.endDate}` : ''}
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
      <EmployeeBottomNav currentTab="leave" />
    </div>
  );
}
