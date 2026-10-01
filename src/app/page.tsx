'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Smartphone, 
  LayoutDashboard, 
  MapPin, 
  ShieldCheck, 
  Coins, 
  Clock, 
  ArrowRight, 
  Sparkles, 
  ChevronRight,
  Activity,
  Layers,
  CheckCircle2,
  Lock,
  Globe2
} from 'lucide-react';

export default function PortalLandingPage() {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('th-TH', { 
          timeZone: 'Asia/Bangkok', 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit', 
          hour12: false 
        })
      );
      setCurrentDate(
        now.toLocaleDateString('th-TH', { 
          timeZone: 'Asia/Bangkok', 
          weekday: 'long', 
          day: 'numeric', 
          month: 'long', 
          year: 'numeric' 
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 flex flex-col justify-between p-4 sm:p-6 md:p-10 font-sans relative overflow-hidden bg-grid-pattern">
      {/* Ambient background glows */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[300px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[300px] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Minimalist Header */}
      <header className="max-w-6xl mx-auto w-full flex items-center justify-between z-10 py-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-amber-400 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 font-black text-xl">
            ⚡
          </div>
          <div>
            <div className="font-black text-white text-base tracking-tight leading-none flex items-center gap-2">
              <span>สีแสงยางยนต์</span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30">
                YOKOHAMA NAYA COSMIS
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Smart Attendance & Executive Branch Management Portal</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono bg-slate-900/80 text-emerald-400 border border-slate-800 shadow-xs backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Bangkok {currentTime || '--:--:--'}</span>
          </div>
        </div>
      </header>

      {/* Hero & Bento Grid Navigation */}
      <main className="max-w-6xl mx-auto w-full my-auto py-8 z-10 space-y-8">
        
        {/* Title Section */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-slate-800/80 text-slate-300 border border-slate-700/60 shadow-sm backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>ระบบบันทึกเวลาทำงานและบริหารจัดการสาขาอัจฉริยะ</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            เลือกช่องทาง <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400">เข้าสู่ระบบ</span>
          </h1>
          <p className="text-sm text-slate-400">
            ระบบลงเวลาความแม่นยำสูงด้วยดาวเทียม GPS, ป้องกันการตอกบัตรแทนกันด้วย Hardware ID, และศูนย์ควบคุมผู้บริหารแบบเรียลไทม์
          </p>
        </div>

        {/* Bento Grid: 2 Primary Gateways */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Bento Card 1: Employee Mobile PWA */}
          <Link 
            href="/employee/login"
            className="group relative bento-card p-6 sm:p-8 flex flex-col justify-between overflow-hidden hover:border-blue-500/50 hover:bg-slate-900/90 transition-all duration-300"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all duration-500 pointer-events-none" />

            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform duration-300">
                  <Smartphone className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30">
                  Staff Mobile App / PWA
                </span>
              </div>

              <div>
                <h2 className="text-2xl font-black text-white group-hover:text-blue-400 transition-colors">
                  แอปพนักงาน (Staff Portal)
                </h2>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  สำหรับช่างและพนักงานประจำสาขา บันทึกเวลาเข้างาน-ออกงาน, ตรวจสอบพิกัด GPS, ยื่นใบลา, และขอเบิกเงินล่วงหน้า
                </p>
              </div>

              {/* Mini Highlights */}
              <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] font-medium text-slate-300">
                <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>GPS Geofence 50m</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <Coins className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>เบี้ยขยัน +50฿</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>1 คน 1 เครื่อง (HWID)</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <Clock className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span>Stopwatch นับเวลาสด</span>
                </div>
              </div>
            </div>

            <div className="pt-6 relative z-10 flex items-center justify-between border-t border-slate-800/80 mt-6 text-sm font-bold text-blue-400 group-hover:text-blue-300">
              <span>เปิดแอปพนักงาน</span>
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                <ArrowRight className="w-4 h-4 text-blue-400" />
              </div>
            </div>
          </Link>

          {/* Bento Card 2: Executive Web Dashboard */}
          <Link 
            href="/admin"
            className="group relative bento-card p-6 sm:p-8 flex flex-col justify-between overflow-hidden hover:border-emerald-500/50 hover:bg-slate-900/90 transition-all duration-300"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all duration-500 pointer-events-none" />

            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25 group-hover:scale-105 transition-transform duration-300">
                  <LayoutDashboard className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  Executive Headquarters
                </span>
              </div>

              <div>
                <h2 className="text-2xl font-black text-white group-hover:text-emerald-400 transition-colors">
                  ศูนย์ควบคุมผู้บริหาร (Executive Dashboard)
                </h2>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  สำหรับผู้บริหารและหัวหน้างาน มอนิเตอร์สถิติสดแบบ Real-Time, อนุมัติใบลา/เงินเบิกใน 1 คลิก, ปรับพิกัดร้าน, และ Export รายงาน
                </p>
              </div>

              {/* Mini Highlights */}
              <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] font-medium text-slate-300">
                <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <Activity className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Realtime WebSocket</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <Layers className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span>3D WebGL Analytics</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>1-Click Approval</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <Globe2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>Leaflet Map Picker</span>
                </div>
              </div>
            </div>

            <div className="pt-6 relative z-10 flex items-center justify-between border-t border-slate-800/80 mt-6 text-sm font-bold text-emerald-400 group-hover:text-emerald-300">
              <span>เข้าสู่ระบบแดชบอร์ด</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                <ArrowRight className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
          </Link>

        </div>

        {/* Quick Brand Footer Ribbon */}
        <div className="bento-card py-3 px-6 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>วันที่ {currentDate || 'กำลังโหลด...'}</span>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-bold">
            <span className="px-2 py-0.5 rounded bg-red-600/80 text-white border border-red-500/40">YOKOHAMA</span>
            <span className="px-2 py-0.5 rounded bg-amber-500/80 text-slate-950 border border-amber-400 font-black">NAYA</span>
            <span className="px-2 py-0.5 rounded bg-orange-600/80 text-white border border-orange-500/40">COSMIS</span>
            <span className="px-2 py-0.5 rounded bg-blue-600/80 text-white border border-blue-500/40">LENSO</span>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto w-full text-center py-3 text-xs text-slate-500 z-10">
        © {new Date().getFullYear()} สีแสงยางยนต์ — Smart Attendance & Branch Management System (PWA & Web)
      </footer>
    </div>
  );
}
