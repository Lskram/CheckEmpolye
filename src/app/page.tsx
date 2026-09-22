'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Smartphone, 
  ShieldCheck, 
  MapPin, 
  Clock, 
  Coins, 
  BellRing, 
  UserCheck, 
  ChevronRight,
  Sparkles
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [cachedUser, setCachedUser] = useState<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem('attendance_employee_profile');
    if (saved) {
      try {
        setCachedUser(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b0f19] via-[#0f172a] to-[#070a12] text-slate-100 flex flex-col justify-between p-4 sm:p-8">
      {/* Top Header */}
      <header className="max-w-5xl mx-auto w-full flex items-center justify-between py-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-green-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Clock className="w-5 h-5 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-white tracking-tight leading-none">
              Attendance <span className="text-emerald-400">PWA</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">ระบบเช็คอิน & บริหารเวลาทำงานอัจฉริยะ</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-800/50">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Next.js + Supabase Ready
          </span>
        </div>
      </header>

      {/* Main Hero & Quick Entry Selection */}
      <main className="max-w-5xl mx-auto w-full my-auto py-8 sm:py-12">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-slate-800/80 text-slate-300 border border-slate-700/60 mb-4">
            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
            Geofencing 50m • HWID Fingerprint • เบี้ยเลี้ยง 50฿
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-3">
            เลือกระบบที่ต้องการเข้าใช้งาน
          </h2>
          <p className="text-sm sm:text-base text-slate-400">
            รองรับทั้งมุมมองพนักงานผ่านมือถือ (PWA Mobile) และหน้าจอผู้บริหาร (Executive Dashboard)
          </p>
        </div>

        {/* Portal Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Employee PWA Portal */}
          <Link
            href="/employee"
            className="group relative flex flex-col justify-between p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-800/40 border border-slate-800 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/10 hover:-translate-y-1"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Smartphone className="w-28 h-28 text-emerald-400" />
            </div>

            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-5 group-hover:scale-110 transition-transform">
                <Smartphone className="w-6 h-6" />
              </div>
              <div className="inline-block px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
                Mobile PWA View
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                พนักงาน (Employee Portal)
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-6">
                เช็คอินด้วย Geofencing พิกัดร้าน, ตรวจสอบ HWID ประจำเครื่อง, รับเบี้ยเลี้ยง 50 บาทเมื่อมาก่อน 08:00 น., ดูปฏิทินสถิติ และยื่นคำขอลา
              </p>

              {cachedUser && (
                <div className="mb-4 p-3 rounded-lg bg-slate-800/80 border border-slate-700/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
                      {cachedUser.nickname?.[0] || 'U'}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-200">{cachedUser.fullName}</div>
                      <div className="text-slate-400">รหัส {cachedUser.employeeCode} (บันทึกไว้แล้ว)</div>
                    </div>
                  </div>
                  <span className="text-emerald-400 font-medium">ปลดล็อกด้วย PIN →</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-800/80 text-sm font-semibold text-emerald-400">
              <span>เข้าสู่หน้าพนักงาน</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Admin Executive Dashboard */}
          <Link
            href="/admin"
            className="group relative flex flex-col justify-between p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-800/40 border border-slate-800 hover:border-indigo-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <ShieldCheck className="w-28 h-28 text-indigo-400" />
            </div>

            <div>
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-5 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="inline-block px-2.5 py-0.5 rounded text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-2">
                Executive & Management
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors">
                ผู้บริหาร (Admin Dashboard)
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-6">
                สรุปยอดเบี้ยเลี้ยงรวม, กราฟสถิติมาสายรายวัน/สัปดาห์/เดือน, ตรวจสอบการทำผิดกฎ HWID ซ้ำซ้อน (Red Alert), อนุมัติใบลา และสร้างบัญชีพนักงานใหม่
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-800/80 text-sm font-semibold text-indigo-400">
              <span>เข้าสู่แดชบอร์ดผู้บริหาร</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>

        {/* Feature Highlights Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-4xl mx-auto mt-8">
          <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800/80 flex items-center gap-3">
            <MapPin className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <div className="text-xs font-semibold text-slate-200">Geofencing 50m</div>
              <div className="text-[11px] text-slate-400">คำนวณ Haversine แม่นยำ</div>
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800/80 flex items-center gap-3">
            <Coins className="w-5 h-5 text-yellow-400 shrink-0" />
            <div>
              <div className="text-xs font-semibold text-slate-200">เบี้ยเลี้ยง 50 บาท</div>
              <div className="text-[11px] text-slate-400">มาก่อน 08:00 น. รับทันที</div>
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800/80 flex items-center gap-3">
            <UserCheck className="w-5 h-5 text-indigo-400 shrink-0" />
            <div>
              <div className="text-xs font-semibold text-slate-200">HWID Device Bind</div>
              <div className="text-[11px] text-slate-400">1 เครื่องต่อ 1 บัญชี</div>
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800/80 flex items-center gap-3">
            <BellRing className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <div className="text-xs font-semibold text-slate-200">LINE Alert มาสาย</div>
              <div className="text-[11px] text-slate-400">ส่งแจ้งเตือนกลุ่มอัตโนมัติ</div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto w-full text-center py-4 border-t border-slate-800/50 text-xs text-slate-500">
        Attendance PWA & Executive Workforce Management System • Next.js & Supabase
      </footer>
    </div>
  );
}
