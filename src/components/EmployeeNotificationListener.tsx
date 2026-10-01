'use client';

import React, { useEffect, useRef, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { MobileNotificationService } from '@/lib/mobile-notifications';
import { playWebAlertSound } from '@/lib/web-notifications';
import { XCircle, CheckCircle2, X, AlertTriangle, FileText, Coins } from 'lucide-react';
import { useAppTheme } from '@/lib/theme';

interface ToastItem {
  id: string;
  type: 'leave' | 'advance';
  status: 'APPROVED' | 'REJECTED';
  title: string;
  message: string;
  subMessage?: string;
  timestamp: number;
}

export default function EmployeeNotificationListener() {
  const { isDark } = useAppTheme();
  const [activeToast, setActiveToast] = useState<ToastItem | null>(null);

  // Cache maps to track state transitions (e.g. PENDING -> REJECTED / APPROVED)
  const knownLeavesRef = useRef<Map<string, string>>(new Map());
  const knownAdvancesRef = useRef<Map<string, string>>(new Map());
  const employeeIdRef = useRef<string | null>(null);
  const isFirstLoadRef = useRef<boolean>(true);

  // Display and auto-dismiss floating in-app banner
  const triggerToast = (toast: ToastItem) => {
    setActiveToast(toast);
    if (toast.status === 'REJECTED') {
      playWebAlertSound('violation');
    } else {
      playWebAlertSound('checkin');
    }
    setTimeout(() => {
      setActiveToast((current) => (current?.id === toast.id ? null : current));
    }, 7000);
  };

  const getLeaveTypeThai = (type: string) => {
    switch (type) {
      case 'SICK': return 'ลาป่วย';
      case 'BUSINESS': return 'ลากิจ';
      case 'ANNUAL': return 'ลาพักร้อน';
      default: return 'ลางาน';
    }
  };

  const checkStatusChanges = async (empId: string) => {
    if (!empId) return;

    try {
      // 1. Fetch Leaves for this employee
      const leaveRes = await fetch(`/api/leave?employeeId=${empId}`, { cache: 'no-store' });
      const leaveData = await leaveRes.json();

      if (leaveData.success && Array.isArray(leaveData.data)) {
        const leaves: any[] = leaveData.data;

        if (isFirstLoadRef.current) {
          leaves.forEach((l) => knownLeavesRef.current.set(l.id, l.status));
        } else {
          leaves.forEach((l) => {
            const prevStatus = knownLeavesRef.current.get(l.id);
            if (prevStatus && prevStatus !== l.status && (l.status === 'REJECTED' || l.status === 'APPROVED')) {
              const leaveTypeThai = getLeaveTypeThai(l.leave_type);
              const days = l.days_count || 1;
              const reasonText = l.rejection_reason || l.rejectionReason;

              // Native Push Notification
              MobileNotificationService.showLeaveStatusNotification(
                l.status,
                leaveTypeThai,
                days,
                reasonText
              );

              // Floating In-App Banner
              triggerToast({
                id: `leave-${l.id}-${Date.now()}`,
                type: 'leave',
                status: l.status,
                title: l.status === 'APPROVED' ? '✅ คำขอลางานได้รับการอนุมัติแล้ว!' : '❌ คำขอลางานถูกปฏิเสธ',
                message: l.status === 'APPROVED'
                  ? `คำขอ${leaveTypeThai} (${days} วัน) วันที่ ${l.start_date} ได้รับการอนุมัติแล้ว`
                  : `คำขอ${leaveTypeThai} วันที่ ${l.start_date} ถูกปฏิเสธโดยผู้บริหาร`,
                subMessage: reasonText ? `เหตุผล: ${reasonText}` : undefined,
                timestamp: Date.now(),
              });

              // Signal subpages to refresh
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('yokohama-leave-updated', { detail: l }));
              }
            }
            knownLeavesRef.current.set(l.id, l.status);
          });
        }
      }

      // 2. Fetch Advances for this employee
      const advRes = await fetch(`/api/advance-request?employeeId=${empId}`, { cache: 'no-store' });
      const advData = await advRes.json();

      if (advData.success && Array.isArray(advData.data)) {
        const advances: any[] = advData.data;

        if (isFirstLoadRef.current) {
          advances.forEach((a) => knownAdvancesRef.current.set(a.id, a.status));
        } else {
          advances.forEach((a) => {
            const prevStatus = knownAdvancesRef.current.get(a.id);
            if (prevStatus && prevStatus !== a.status && (a.status === 'REJECTED' || a.status === 'APPROVED')) {
              const amount = Number(a.amount);
              const reasonText = a.rejection_reason || a.rejectionReason;

              // Native Push Notification
              MobileNotificationService.showAdvanceStatusNotification(
                a.status,
                amount,
                reasonText
              );

              // Floating In-App Banner
              triggerToast({
                id: `adv-${a.id}-${Date.now()}`,
                type: 'advance',
                status: a.status,
                title: a.status === 'APPROVED' ? '✅ คำขอเบิกเงินได้รับการอนุมัติแล้ว!' : '❌ คำขอเบิกเงินถูกปฏิเสธ',
                message: a.status === 'APPROVED'
                  ? `คำขอเบิกเงินจำนวน ${amount.toLocaleString()} บาท ได้รับการอนุมัติเรียบร้อย`
                  : `คำขอเบิกเงินจำนวน ${amount.toLocaleString()} บาท ถูกปฏิเสธโดยผู้บริหาร`,
                subMessage: reasonText ? `เหตุผล: ${reasonText}` : undefined,
                timestamp: Date.now(),
              });

              // Signal subpages to refresh
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('yokohama-advance-updated', { detail: a }));
              }
            }
            knownAdvancesRef.current.set(a.id, a.status);
          });
        }
      }

      isFirstLoadRef.current = false;
    } catch (e) {
      console.warn('[EmployeeNotificationListener] Sync check failed:', e);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const saved = localStorage.getItem('attendance_employee_profile');
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved);
      if (!parsed?.id) return;

      employeeIdRef.current = parsed.id;
      checkStatusChanges(parsed.id);

      // Realtime Supabase Channels
      let leaveChannel: any = null;
      let advanceChannel: any = null;

      if (isSupabaseConfigured && supabase) {
        leaveChannel = supabase
          .channel(`emp-notif-leaves-${parsed.id}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'leave_requests',
              filter: `employee_id=eq.${parsed.id}`,
            },
            () => {
              checkStatusChanges(parsed.id);
            }
          )
          .subscribe();

        advanceChannel = supabase
          .channel(`emp-notif-advances-${parsed.id}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'salary_advance_requests',
              filter: `employee_id=eq.${parsed.id}`,
            },
            () => {
              checkStatusChanges(parsed.id);
            }
          )
          .subscribe();
      }

      // Fallback Heartbeat polling every 6 seconds
      const pollTimer = setInterval(() => {
        if (document.visibilityState === 'visible' && employeeIdRef.current) {
          checkStatusChanges(employeeIdRef.current);
        }
      }, 6000);

      const handleVisibility = () => {
        if (document.visibilityState === 'visible' && employeeIdRef.current) {
          checkStatusChanges(employeeIdRef.current);
        }
      };
      document.addEventListener('visibilitychange', handleVisibility);

      return () => {
        if (leaveChannel && supabase) supabase.removeChannel(leaveChannel);
        if (advanceChannel && supabase) supabase.removeChannel(advanceChannel);
        clearInterval(pollTimer);
        document.removeEventListener('visibilitychange', handleVisibility);
      };
    } catch (e) {
      // ignore
    }
  }, []);

  if (!activeToast) return null;

  const isRejected = activeToast.status === 'REJECTED';

  return (
    <div className="fixed top-4 left-4 right-4 z-50 max-w-md mx-auto animate-in fade-in slide-in-from-top-4 duration-300">
      <div className={`p-4 rounded-3xl shadow-2xl border flex items-start gap-3 backdrop-blur-md ${
        isRejected
          ? isDark 
            ? 'bg-rose-950/90 border-rose-500/50 text-rose-100 shadow-rose-950/60' 
            : 'bg-rose-600 text-white border-rose-700 shadow-rose-300/60'
          : isDark
            ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-100 shadow-emerald-950/60'
            : 'bg-emerald-600 text-white border-emerald-700 shadow-emerald-300/60'
      }`}>
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
          isRejected ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
        }`}>
          {isRejected ? (
            <XCircle className="w-6 h-6 text-rose-400" />
          ) : (
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-black text-sm drop-shadow-sm">{activeToast.title}</span>
          </div>
          <p className="text-xs font-medium leading-relaxed opacity-95 mt-0.5">
            {activeToast.message}
          </p>
          {activeToast.subMessage && (
            <div className={`mt-1.5 p-2 rounded-xl text-[11px] font-medium border ${
              isRejected
                ? 'bg-black/30 border-rose-400/20 text-rose-200'
                : 'bg-black/30 border-emerald-400/20 text-emerald-200'
            }`}>
              {activeToast.subMessage}
            </div>
          )}
        </div>

        <button
          onClick={() => setActiveToast(null)}
          className="p-1.5 rounded-xl bg-black/20 hover:bg-black/40 text-white/80 hover:text-white transition-all active:scale-90"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
