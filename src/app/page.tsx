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
  Globe2,
  Server,
  Terminal,
  ExternalLink,
  Shield
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
    <div className="min-h-screen bg-[#F8F9FB] text-slate-900 flex flex-col justify-between p-4 sm:p-6 md:p-8 font-sans antialiased">
      
      {/* Top Header Bar (Hostinger Style) */}
      <header className="max-w-6xl mx-auto w-full flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#673DE6] text-white flex items-center justify-center font-black text-lg shadow-sm">
            SY
          </div>
          <div>
            <div className="font-extrabold text-slate-900 text-sm tracking-tight leading-none flex items-center gap-2">
              <span>สีแสงยางยนต์</span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full hostinger-purple-badge">
                YOKOHAMA NAYA COSMIS
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">Cloud Attendance & Executive Management Portal</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono bg-white text-slate-700 border border-slate-200 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Bangkok {currentTime || '--:--:--'}</span>
          </div>
        </div>
      </header>

      {/* Hero & Navigation Cards */}
      <main className="max-w-5xl mx-auto w-full my-auto py-8 space-y-8">
        
        {/* Title Section */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold hostinger-purple-badge shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-[#673DE6]" />
            <span>ระบบบันทึกเวลาทำงานและบริหารจัดการสาขาอัจฉริยะ</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
            เลือกช่องทาง <span className="text-[#673DE6]">เข้าสู่ระบบ</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            ลงเวลาความแม่นยำสูงด้วยดาวเทียม GPS, ตรวจสอบ HWID 1 คน 1 เครื่อง, และศูนย์ควบคุมผู้บริหาร Real-time
          </p>
        </div>

        {/* 2 Primary Gateways (Hostinger Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Card 1: Employee Mobile PWA */}
          <Link 
            href="/employee/login"
            className="group relative hostinger-card p-6 sm:p-8 flex flex-col justify-between hover:border-[#673DE6] hover:shadow-md transition-all duration-200 bg-white"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-[#673DE6] border border-purple-100 flex items-center justify-center font-bold group-hover:scale-105 transition-transform duration-200">
                  <Smartphone className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold px-3 py-1 rounded-full hostinger-purple-badge">
                  Staff Mobile PWA
                </span>
              </div>

              <div>
                <h2 className="text-xl font-extrabold text-slate-900 group-hover:text-[#673DE6] transition-colors">
                  แอปพนักงาน (Staff Portal)
                </h2>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed font-medium">
                  สำหรับช่างและพนักงานประจำสาขา บันทึกเวลาเข้างาน-ออกงาน, ตรวจสอบพิกัด GPS ร้าน 50 ม., ยื่นใบลา, และขอเบิกเงินล่วงหน้า
                </p>
              </div>

              {/* Highlights */}
              <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] font-medium text-slate-700">
                <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200">
                  <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>GPS Geofence 50m</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200">
                  <Coins className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>เบี้ยขยัน +50฿</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>1 คน 1 เครื่อง (HWID)</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200">
                  <Clock className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span>Stopwatch นับเวลาสด</span>
                </div>
              </div>
            </div>

            <div className="pt-6 flex items-center justify-between border-t border-slate-100 mt-6 text-xs font-bold text-[#673DE6]">
              <span>เปิดแอปพนักงาน</span>
              <div className="w-7 h-7 rounded-full bg-purple-50 text-[#673DE6] flex items-center justify-center group-hover:translate-x-1 transition-transform">
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </Link>

          {/* Card 2: Executive Web Dashboard */}
          <Link 
            href="/admin"
            className="group relative hostinger-card p-6 sm:p-8 flex flex-col justify-between hover:border-slate-800 hover:shadow-md transition-all duration-200 bg-white"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-900 border border-slate-200 flex items-center justify-center font-bold group-hover:scale-105 transition-transform duration-200">
                  <LayoutDashboard className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  Host Console (Web Admin)
                </span>
              </div>

              <div>
                <h2 className="text-xl font-extrabold text-slate-900 group-hover:text-[#673DE6] transition-colors">
                  ศูนย์ควบคุมผู้บริหาร (Executive Dashboard)
                </h2>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed font-medium">
                  สำหรับผู้บริหารและหัวหน้างาน มอนิเตอร์สถิติสดแบบ Real-Time, อนุมัติใบลา/เงินเบิกใน 1 คลิก, ปรับพิกัดร้านบนแผนที่, และ Export CSV
                </p>
              </div>

              {/* Highlights */}
              <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] font-medium text-slate-700">
                <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200">
                  <Activity className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Realtime WebSocket</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200">
                  <Layers className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                  <span>3D WebGL Analytics</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>1-Click Approval</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200">
                  <Globe2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span>Leaflet Map Picker</span>
                </div>
              </div>
            </div>

            <div className="pt-6 flex items-center justify-between border-t border-slate-100 mt-6 text-xs font-bold text-slate-900 group-hover:text-[#673DE6]">
              <span>เข้าสู่ระบบแดชบอร์ด</span>
              <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-900 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </Link>

        </div>

        {/* Quick Brand Footer Ribbon */}
        <div className="hostinger-card py-3 px-6 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>วันที่ {currentDate || 'กำลังโหลด...'}</span>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-bold">
            <span className="px-2 py-0.5 rounded-md bg-red-50 text-red-700 border border-red-200">YOKOHAMA</span>
            <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200 font-black">NAYA</span>
            <span className="px-2 py-0.5 rounded-md bg-orange-50 text-orange-700 border border-orange-200">COSMIS</span>
            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">LENSO</span>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto w-full text-center py-2 text-xs text-slate-400">
        © {new Date().getFullYear()} สีแสงยางยนต์ (YOKOHAMA NAYA COSMIS) — Smart Cloud Attendance Platform
      </footer>
    </div>
  );
}
