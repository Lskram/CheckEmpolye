'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Check, DollarSign, FileText, AlertTriangle, Volume2, VolumeX, ArrowRight, X, Sparkles } from 'lucide-react';
import { WebNotification, requestBrowserNotificationPermission } from '@/lib/web-notifications';

interface NotificationCenterProps {
  notifications: WebNotification[];
  onClearAll: () => void;
  onSelectNotification?: (notif: WebNotification) => void;
  activeToast: WebNotification | null;
  onDismissToast: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export default function NotificationCenter({
  notifications,
  onClearAll,
  onSelectNotification,
  activeToast,
  onDismissToast,
  soundEnabled,
  onToggleSound,
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasDesktopPerm, setHasDesktopPerm] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setHasDesktopPerm(Notification.permission === 'granted');
    }
  }, []);

  const handleRequestDesktop = async () => {
    const granted = await requestBrowserNotificationPermission();
    setHasDesktopPerm(granted);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <>
      {/* ------------------------------------------------------------- */}
      {/* 1. TOP BAR BELL TRIGGER                                      */}
      {/* ------------------------------------------------------------- */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 text-white transition-all active:scale-95 flex items-center justify-center shadow-sm"
          title="การแจ้งเตือน Real-time"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1.5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center shadow-lg shadow-rose-500/50 animate-bounce">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* ------------------------------------------------------------- */}
        {/* 2. NOTIFICATION DROPDOWN DRAWER                              */}
        {/* ------------------------------------------------------------- */}
        {isOpen && (
          <div className="absolute right-0 mt-3 w-96 max-w-[calc(100vw-2rem)] rounded-3xl bg-slate-900/95 border border-slate-700 shadow-2xl backdrop-blur-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-black">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                    การแจ้งเตือนสด
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
                      {notifications.length}
                    </span>
                  </h4>
                  <p className="text-[10px] text-slate-400">Log การเข้างาน & คำขอ Real-time</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={onToggleSound}
                  className={`p-1.5 rounded-lg text-xs transition-colors ${
                    soundEnabled ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-slate-500 hover:bg-slate-800'
                  }`}
                  title={soundEnabled ? 'ปิดเสียงแจ้งเตือน' : 'เปิดเสียงแจ้งเตือน'}
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Desktop Notification Banner if not enabled */}
            {!hasDesktopPerm && (
              <div className="p-2.5 bg-gradient-to-r from-blue-950 to-indigo-950 border-b border-blue-800/40 flex items-center justify-between gap-2 text-xs">
                <span className="text-[11px] text-blue-200">🔔 เปิดแจ้งเตือนบนหน้าจอเดสก์ท็อป</span>
                <button
                  onClick={handleRequestDesktop}
                  className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold transition-all shadow-sm"
                >
                  เปิดใช้งาน
                </button>
              </div>
            )}

            {/* Notifications List */}
            <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-800/60">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <Sparkles className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                  <p className="text-xs font-bold text-slate-300">ยังไม่มีการแจ้งเตือนใหม่</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">ระบบจะเด้งเตือนทันทีเมื่อมีคนเข้างานหรือมีคำขอ</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      if (onSelectNotification) onSelectNotification(n);
                      setIsOpen(false);
                    }}
                    className={`p-3.5 hover:bg-slate-800/60 transition-colors cursor-pointer flex items-start gap-3 ${
                      !n.read ? 'bg-blue-950/20' : ''
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-xs font-bold ${
                        n.type === 'advance'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : n.type === 'checkin'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : n.type === 'checkout'
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : n.type === 'leave'
                          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {n.type === 'advance' && <DollarSign className="w-4 h-4" />}
                      {n.type === 'checkin' && <Check className="w-4 h-4" />}
                      {n.type === 'checkout' && <Check className="w-4 h-4" />}
                      {n.type === 'leave' && <FileText className="w-4 h-4" />}
                      {n.type === 'violation' && <AlertTriangle className="w-4 h-4" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-xs text-white truncate">{n.title}</span>
                        <span className="text-[9px] text-slate-500 font-mono shrink-0">{n.time}</span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-2 leading-snug">{n.message}</p>
                      {n.targetTab && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-blue-400 font-bold mt-1 hover:underline">
                          ไปที่หน้านี้ <ArrowRight className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-2.5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs">
                <span className="text-[10px] text-slate-500">เก็บประวัติสดของการเชื่อมต่อนี้</span>
                <button
                  onClick={onClearAll}
                  className="text-[10px] font-bold text-rose-400 hover:text-rose-300 px-2 py-1 rounded-lg hover:bg-rose-500/10 transition-colors"
                >
                  ล้างรายการทั้งหมด
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. PROMINENT FLOATING TOAST POPUP (With Quick Actions)        */}
      {/* ------------------------------------------------------------- */}
      {activeToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full p-4 rounded-3xl bg-slate-900/95 text-white border border-slate-700 shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
                  activeToast.type === 'advance'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : activeToast.type === 'checkin'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : activeToast.type === 'checkout'
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : activeToast.type === 'leave'
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}
              >
                {activeToast.type === 'advance' && <DollarSign className="w-5 h-5" />}
                {activeToast.type === 'checkin' && <Check className="w-5 h-5" />}
                {activeToast.type === 'checkout' && <Check className="w-5 h-5" />}
                {activeToast.type === 'leave' && <FileText className="w-5 h-5" />}
                {activeToast.type === 'violation' && <AlertTriangle className="w-5 h-5" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-black text-xs text-white">{activeToast.title}</div>
                <div className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">{activeToast.message}</div>
                <div className="flex items-center justify-between gap-2 mt-2">
                  <span className="text-[9px] text-slate-500 font-mono">{activeToast.time} น. • Live Alert</span>
                  {activeToast.targetTab && onSelectNotification && (
                    <button
                      onClick={() => {
                        onSelectNotification(activeToast);
                        onDismissToast();
                      }}
                      className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] shadow-sm flex items-center gap-1"
                    >
                      ดูคำขอ <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={onDismissToast}
              className="text-slate-400 hover:text-white text-xs p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
