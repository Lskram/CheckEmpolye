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
  Shield,
  Zap,
  Radio,
  Sliders,
  Cpu,
  Fingerprint,
  FileSpreadsheet
} from 'lucide-react';

export default function VercelPortalLandingPage() {
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
    <div className="min-h-screen bg-black text-white flex flex-col justify-between selection:bg-white selection:text-black font-sans antialiased relative overflow-hidden vercel-bg">
      
      {/* Background Subtle Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-b from-blue-600/10 via-purple-600/5 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* ------------------------------------------------------------- */}
      {/* 1. Vercel Iconic Navbar                                        */}
      {/* ------------------------------------------------------------- */}
      <header className="max-w-7xl mx-auto w-full px-6 py-5 flex items-center justify-between border-b border-neutral-800/60 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-3 group">
            {/* Vercel Triangle Icon */}
            <div className="w-8 h-8 rounded-lg bg-white text-black flex items-center justify-center font-black transition-transform duration-200 group-hover:scale-105">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 75 65">
                <path d="M37.5 0L75 65H0z" />
              </svg>
            </div>
            <div>
              <div className="font-bold text-white text-base tracking-tight flex items-center gap-2">
                <span>สีแสงยางยนต์</span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-700 text-neutral-300">
                  YOKOHAMA NAYA COSMIS
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* Center Live Telemetry Pill */}
        <div className="hidden md:flex items-center gap-3">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full text-xs font-mono bg-neutral-950 border border-neutral-800 text-neutral-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-neutral-400">STATUS:</span>
            <span className="text-emerald-400 font-bold">ALL SYSTEMS PRODUCTION READY</span>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono bg-neutral-950 border border-neutral-800 text-neutral-400">
            <Clock className="w-3.5 h-3.5 text-neutral-400" />
            <span>BKK {currentTime || '--:--:--'}</span>
          </div>
        </div>

        {/* Right Action */}
        <div className="flex items-center gap-3">
          <Link 
            href="/admin/login" 
            className="text-xs font-mono text-neutral-400 hover:text-white transition-colors hidden sm:block"
          >
            Executive Login →
          </Link>
          <Link 
            href="/admin/login" 
            className="px-4 py-2 rounded-full bg-white text-black hover:bg-neutral-200 text-xs font-bold transition-all hover:scale-105 shadow-sm flex items-center gap-1.5"
          >
            <span>Console</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* 2. Vercel Style Hero Section                                   */}
      {/* ------------------------------------------------------------- */}
      <main className="max-w-6xl mx-auto w-full px-6 py-12 md:py-16 space-y-12">
        
        <div className="text-center space-y-6 max-w-4xl mx-auto pt-4">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-mono bg-neutral-900/80 border border-neutral-800 text-neutral-300 shadow-inner">
            <span className="text-purple-400">▲</span>
            <span className="text-neutral-400">Vercel-Grade Cloud Architecture //</span>
            <span className="text-white font-bold">Version 3.6 Production</span>
          </div>

          {/* Massive Vercel Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.08] text-white">
            ระบบบันทึกเวลาทำงาน <br className="hidden sm:block" />
            <span className="vercel-gradient-text">
              ที่แม่นยำและรวดเร็วที่สุด.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-xl text-neutral-400 max-w-2xl mx-auto leading-relaxed font-normal">
            ลงเวลาความละเอียดสูงด้วยดาวเทียม GPS 50 ม., ระบบป้องกันการทุจริต 1 คน 1 เครื่อง (HWID Device Lock), และศูนย์บัญชาการผู้บริหารแบบ Real-Time WebSocket
          </p>

          {/* Hero CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link 
              href="/employee/login"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-white text-black font-bold text-base hover:bg-neutral-200 transition-all duration-200 hover:scale-[1.02] shadow-xl shadow-white/10 flex items-center justify-center gap-2 group"
            >
              <span>▲ เปิดแอปพนักงาน (Staff PWA)</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link 
              href="/admin"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-neutral-900/90 text-white font-bold text-base border border-neutral-700 hover:border-neutral-500 hover:bg-neutral-800 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <LayoutDashboard className="w-4 h-4 text-neutral-400" />
              <span>ศูนย์ควบคุมผู้บริหาร (Web Admin)</span>
            </Link>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* 3. Vercel Interactive Bento Grid (2 Gateway Doors)            */}
        {/* ------------------------------------------------------------- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">

          {/* Card 1: Staff Mobile PWA Gateway */}
          <Link 
            href="/employee/login"
            className="group relative vercel-card p-8 sm:p-10 flex flex-col justify-between overflow-hidden"
          >
            {/* Top Border Glow */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-blue-400 group-hover:scale-105 group-hover:border-blue-500/40 transition-all duration-200">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="font-mono text-xs text-neutral-400 tracking-wider">[ 01 ] • MOBILE_PWA</span>
                    <h2 className="text-2xl font-black text-white tracking-tight group-hover:text-blue-400 transition-colors">
                      แอปพนักงานประจำสาขา
                    </h2>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Staff Client
                </span>
              </div>

              <p className="text-sm text-neutral-400 leading-relaxed">
                สำหรับช่างและพนักงานประจำสาขา บันทึกเวลาเข้างาน-ออกงานด้วย GPS 50 ม., ยื่นคำขอลา 4 ประเภท, และขอเบิกเงินล่วงหน้า
              </p>

              {/* Code Snippet / Telemetry Box */}
              <div className="rounded-xl bg-black/80 border border-neutral-800 p-4 font-mono text-xs space-y-2">
                <div className="flex items-center justify-between text-neutral-500 border-b border-neutral-800 pb-2">
                  <span>TELEMETRY_STATUS</span>
                  <span className="text-emerald-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE
                  </span>
                </div>
                <div className="space-y-1 text-neutral-300">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">GPS Haversine:</span>
                    <span className="text-blue-400 font-bold">12.4m &lt; 50m (PASS)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">HWID Binding:</span>
                    <span className="text-emerald-400 font-bold">Realme-RMX3491-01 [BOUND]</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Daily Allowance:</span>
                    <span className="text-amber-400 font-bold">+50 THB (ON-TIME)</span>
                  </div>
                </div>
              </div>

              {/* Feature Tags */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono text-neutral-300">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-neutral-900/60 border border-neutral-800">
                  <MapPin className="w-3.5 h-3.5 text-blue-400" />
                  <span>GPS Geofence 50m</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-neutral-900/60 border border-neutral-800">
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  <span>เบี้ยขยัน +50฿</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-neutral-900/60 border border-neutral-800">
                  <Fingerprint className="w-3.5 h-3.5 text-emerald-400" />
                  <span>1 เครื่อง 1 คน (HWID)</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-neutral-900/60 border border-neutral-800">
                  <Clock className="w-3.5 h-3.5 text-purple-400" />
                  <span>Live Stopwatch</span>
                </div>
              </div>
            </div>

            <div className="pt-6 flex items-center justify-between border-t border-neutral-800/80 mt-8 text-xs font-mono font-bold text-white group-hover:text-blue-400">
              <span>[ LAUNCH STAFF APP ]</span>
              <div className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-500 transition-all duration-200">
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </Link>

          {/* Card 2: Executive Web Dashboard Gateway */}
          <Link 
            href="/admin"
            className="group relative vercel-card p-8 sm:p-10 flex flex-col justify-between overflow-hidden"
          >
            {/* Top Border Glow */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-purple-400 group-hover:scale-105 group-hover:border-purple-500/40 transition-all duration-200">
                    <LayoutDashboard className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="font-mono text-xs text-neutral-400 tracking-wider">[ 02 ] • EXECUTIVE_SUITE</span>
                    <h2 className="text-2xl font-black text-white tracking-tight group-hover:text-purple-400 transition-colors">
                      ศูนย์ควบคุมผู้บริหาร (Console)
                    </h2>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  Admin Master
                </span>
              </div>

              <p className="text-sm text-neutral-400 leading-relaxed">
                สำหรับผู้บริหารและหัวหน้างาน มอนิเตอร์สถิติสด Real-Time WebSocket, อนุมัติใบลา/เงินเบิกใน 1 คลิก, ปรับพิกัดร้านบนแผนที่, และ Export CSV
              </p>

              {/* Code Snippet / Telemetry Box */}
              <div className="rounded-xl bg-black/80 border border-neutral-800 p-4 font-mono text-xs space-y-2">
                <div className="flex items-center justify-between text-neutral-500 border-b border-neutral-800 pb-2">
                  <span>REALTIME_SUBSCRIPTION</span>
                  <span className="text-purple-400 flex items-center gap-1.5">
                    <Zap className="w-3 h-3 text-purple-400" />
                    &lt;100ms Latency
                  </span>
                </div>
                <div className="space-y-1 text-neutral-300">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">WebSocket Channels:</span>
                    <span className="text-emerald-400 font-bold">16 Connected (OK)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">1-Click Engine:</span>
                    <span className="text-purple-400 font-bold">Optimistic UI + Audio Chime</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">3D Hologram:</span>
                    <span className="text-sky-400 font-bold">Three.js WebGL Active</span>
                  </div>
                </div>
              </div>

              {/* Feature Tags */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono text-neutral-300">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-neutral-900/60 border border-neutral-800">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Realtime WebSocket</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-neutral-900/60 border border-neutral-800">
                  <Layers className="w-3.5 h-3.5 text-sky-400" />
                  <span>3D WebGL Analytics</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-neutral-900/60 border border-neutral-800">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>1-Click Approval</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-neutral-900/60 border border-neutral-800">
                  <Globe2 className="w-3.5 h-3.5 text-purple-400" />
                  <span>Leaflet Map Picker</span>
                </div>
              </div>
            </div>

            <div className="pt-6 flex items-center justify-between border-t border-neutral-800/80 mt-8 text-xs font-mono font-bold text-white group-hover:text-purple-400">
              <span>[ ENTER ADMIN CONSOLE ]</span>
              <div className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white group-hover:border-purple-500 transition-all duration-200">
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </Link>

        </div>

        {/* ------------------------------------------------------------- */}
        {/* 4. Vercel Terminal / Deploy Status Banner                    */}
        {/* ------------------------------------------------------------- */}
        <div className="vercel-card p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 border border-neutral-800/90 bg-neutral-950/60">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400">
              <Terminal className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="font-mono text-xs text-neutral-400 flex items-center gap-2">
                <span>PRODUCTION_DEPLOYMENT</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-emerald-400 font-bold">LIVE ON VERCEL</span>
              </div>
              <p className="text-sm font-medium text-neutral-200 mt-0.5">
                สีแสงยางยนต์ YOKOHAMA NAYA COSMIS • สาขาศรีสะเกษ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <span className="px-3 py-1 rounded-md bg-neutral-900 border border-neutral-800 text-neutral-300">
              Branch: <span className="text-white font-bold">main</span>
            </span>
            <span className="px-3 py-1 rounded-md bg-neutral-900 border border-neutral-800 text-neutral-300">
              Commit: <span className="text-white font-bold">v3.6-vercel</span>
            </span>
            <span className="px-3 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">
              Ready 24ms
            </span>
          </div>
        </div>

      </main>

      {/* ------------------------------------------------------------- */}
      {/* 5. Vercel Footer                                              */}
      {/* ------------------------------------------------------------- */}
      <footer className="max-w-7xl mx-auto w-full px-6 py-8 border-t border-neutral-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-neutral-500">
        <div className="flex items-center gap-2">
          <svg className="w-3.5 h-3.5 fill-current text-white" viewBox="0 0 75 65">
            <path d="M37.5 0L75 65H0z" />
          </svg>
          <span>© {new Date().getFullYear()} สีแสงยางยนต์ (YOKOHAMA NAYA COSMIS) — Powered by Vercel & Supabase</span>
        </div>

        <div className="flex items-center gap-4 text-neutral-400">
          <span>YOKOHAMA</span>
          <span>•</span>
          <span>NAYA</span>
          <span>•</span>
          <span>COSMIS</span>
          <span>•</span>
          <span>LENSO</span>
        </div>
      </footer>

    </div>
  );
}
