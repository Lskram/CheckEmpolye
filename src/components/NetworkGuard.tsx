'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { WifiOff, Wifi, AlertTriangle, RefreshCw, LogOut, ShieldAlert } from 'lucide-react';
import { MobileNotificationService } from '@/lib/mobile-notifications';
import { playWebAlertSound } from '@/lib/web-notifications';
import { syncPendingActions } from '@/lib/offline-sync';
import { useAppTheme } from '@/lib/theme';
import EmployeeNotificationListener from '@/components/EmployeeNotificationListener';

export default function NetworkGuard() {
  const router = useRouter();
  const { isDark } = useAppTheme();
  const [isOffline, setIsOffline] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [showReconnectedToast, setShowReconnectedToast] = useState(false);

  // Active Internet Ping Check
  const checkRealConnection = useCallback(async (): Promise<boolean> => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return false;
    }
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const res = await fetch('/api/auth/check-code?_t=' + Date.now(), {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return res.status !== 0;
    } catch (e) {
      return false;
    }
  }, []);

  const handleOfflineDetected = useCallback(() => {
    setIsOffline(true);
    playWebAlertSound('violation');
    MobileNotificationService.showOfflineWarning();
  }, []);

  const handleOnlineDetected = useCallback(async () => {
    const isActuallyOnline = await checkRealConnection();
    if (isActuallyOnline) {
      setIsOffline(false);
      setShowReconnectedToast(true);
      playWebAlertSound('checkin');
      setTimeout(() => setShowReconnectedToast(false), 4000);
      // Auto-sync any queued offline actions
      syncPendingActions();
    } else {
      setIsOffline(true);
    }
  }, [checkRealConnection]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Initial check
    if (!navigator.onLine) {
      handleOfflineDetected();
    }

    const onOffline = () => handleOfflineDetected();
    const onOnline = () => handleOnlineDetected();

    window.addEventListener('offline', onOffline);
    window.addEventListener('online', onOnline);

    // Periodic heartbeat check every 6 seconds
    const interval = setInterval(async () => {
      if (document.visibilityState === 'visible') {
        const online = await checkRealConnection();
        if (!online && !isOffline) {
          handleOfflineDetected();
        } else if (online && isOffline) {
          handleOnlineDetected();
        }
      }
    }, 6000);

    return () => {
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('online', onOnline);
      clearInterval(interval);
    };
  }, [handleOfflineDetected, handleOnlineDetected, checkRealConnection, isOffline]);

  // Retry Connection Button Handler
  const handleRetry = async () => {
    setIsChecking(true);
    const online = await checkRealConnection();
    setIsChecking(false);

    if (online) {
      setIsOffline(false);
      setShowReconnectedToast(true);
      playWebAlertSound('checkin');
      setTimeout(() => setShowReconnectedToast(false), 4000);
      syncPendingActions();
    } else {
      playWebAlertSound('violation');
    }
  };

  // Logout / Exit App Handler
  const handleExit = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('attendance_employee_profile');
    }
    router.push('/employee/login');
  };

  return (
    <>
      {/* Global Real-time Employee Status Notification Listener (Leaves & Advances) */}
      <EmployeeNotificationListener />

      {/* Reconnected Green Toast */}
      {showReconnectedToast && (
        <div className="fixed top-4 left-4 right-4 z-50 max-w-md mx-auto p-3.5 rounded-2xl bg-emerald-600 text-white shadow-2xl flex items-center justify-between animate-bounce">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <Wifi className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="font-bold text-xs">เชื่อมต่ออินเทอร์เน็ตเรียบร้อยแล้ว</div>
              <div className="text-[10px] text-emerald-100">ระบบพร้อมใช้งานและซิงค์ข้อมูลสดอัตโนมัติ</div>
            </div>
          </div>
          <button
            onClick={() => setShowReconnectedToast(false)}
            className="text-xs px-2 py-1 bg-black/20 hover:bg-black/40 rounded-lg transition-all"
          >
            ✕
          </button>
        </div>
      )}

      {/* Persistent Offline Alert Modal Overlay */}
      {isOffline && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className={`w-full max-w-sm rounded-3xl p-6 text-center space-y-4 shadow-2xl border ${
            isDark ? 'bg-[#0f1626] border-rose-500/30 text-slate-100' : 'bg-white border-rose-400/40 text-slate-800'
          }`}>
            
            {/* Pulsing Icon */}
            <div className="w-16 h-16 rounded-full bg-rose-500/20 border-2 border-rose-500/40 flex items-center justify-center mx-auto text-rose-500 animate-pulse">
              <WifiOff className="w-8 h-8" />
            </div>

            {/* Title & Description */}
            <div className="space-y-1.5">
              <h2 className="text-base font-bold text-rose-500 flex items-center justify-center gap-1.5">
                <AlertTriangle className="w-5 h-5" />
                <span>ขาดการเชื่อมต่ออินเทอร์เน็ต!</span>
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                ระบบจำเป็นต้องเชื่อมต่ออินเทอร์เน็ตตลอดเวลา เพื่อตรวจสอบพิกัด GPS, รหัสเครื่อง (HWID) และซิงค์ข้อมูลกับเซิร์ฟเวอร์
              </p>
            </div>

            {/* Offline Status Details */}
            <div className={`p-3 rounded-2xl text-[11px] font-mono space-y-1 ${
              isDark ? 'bg-slate-900/80 text-slate-300' : 'bg-slate-100 text-slate-600'
            }`}>
              <div className="flex justify-between">
                <span>สถานะเครือข่าย:</span>
                <span className="text-rose-400 font-bold">ออฟไลน์ (Offline)</span>
              </div>
              <div className="flex justify-between">
                <span>ความปลอดภัย:</span>
                <span className="text-amber-400 font-bold">ล็อกการทำงานชั่วคราว</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                onClick={handleRetry}
                disabled={isChecking}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-lg shadow-blue-500/30 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
                <span>{isChecking ? 'กำลังตรวจสอบสัญญาณ...' : 'ลองเชื่อมต่อใหม่ (Retry)'}</span>
              </button>

              <button
                onClick={handleExit}
                className={`w-full py-2.5 rounded-2xl border text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer ${
                  isDark ? 'bg-slate-800/80 border-white/10 text-slate-300 hover:bg-rose-500/20 hover:text-rose-300' : 'bg-slate-100 border-slate-300 text-slate-600 hover:bg-rose-50 hover:text-rose-600'
                }`}
              >
                <LogOut className="w-4 h-4" />
                <span>ออกจากระบบ (ออกสู่หน้าล็อกอิน)</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
