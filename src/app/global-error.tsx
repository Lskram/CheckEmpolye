'use client';

import { useEffect } from 'react';
import { RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global Error Boundary caught:', error);
  }, [error]);

  const handleHardRefresh = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.unregister();
        }
      }
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
    } catch (e) {
      console.error('Cache clear error:', e);
    }
    window.location.reload();
  };

  return (
    <html lang="th">
      <body className="min-h-screen bg-[#0a0a0c] text-white flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-[#121216] border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6">
          
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              ตรวจพบข้อผิดพลาดของระบบ
            </h2>
            <p className="text-xs text-neutral-400 font-mono leading-relaxed">
              กรุณากดปุ่มด้านล่างเพื่อล้างแคชและโหลดข้อมูลเวอร์ชันล่าสุด
            </p>
          </div>

          {error?.message && (
            <div className="p-3 bg-neutral-950 border border-neutral-800/80 rounded-xl text-[11px] font-mono text-rose-300 text-left overflow-x-auto max-h-28">
              <code>{error.message}</code>
            </div>
          )}

          <div className="space-y-3 pt-2">
            <button
              onClick={handleHardRefresh}
              className="w-full py-3.5 px-4 rounded-xl bg-white hover:bg-neutral-200 text-black font-black text-xs font-mono flex items-center justify-center gap-2 shadow-lg shadow-white/10 transition-all active:scale-95"
            >
              <RefreshCw className="w-4 h-4 text-black" />
              <span>ล้างแคชและโหลดใหม่ (Auto-Repair)</span>
            </button>

            <button
              onClick={() => reset()}
              className="w-full py-3 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 font-bold text-xs font-mono transition-all"
            >
              ลองใหม่อีกครั้ง
            </button>
          </div>

          <div className="pt-4 border-t border-neutral-800/80 text-[10px] font-mono text-neutral-500 flex items-center justify-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>ศูนย์บริการสีแสงยางยนต์ YOKOHAMA NAYA COSMIS</span>
          </div>

        </div>
      </body>
    </html>
  );
}
