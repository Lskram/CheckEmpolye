'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { 
  BarChart3, 
  PieChart, 
  Users, 
  Calendar, 
  Coins, 
  Clock, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  RefreshCw, 
  Settings, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Smartphone,
  Check,
  X,
  Sliders,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Box,
  UserCheck,
  Search,
  MapPin,
  Flame,
  Award
} from 'lucide-react';

const ThreeBarChart3D = dynamic(() => import('@/components/ThreeBarChart3D'), {
  ssr: false,
  loading: () => <div className="w-full h-72 rounded-2xl bg-slate-50 animate-pulse flex items-center justify-center text-xs text-slate-400">กำลังเรนเดอร์กราฟ 3D...</div>,
});

export default function ColorfulAdminDashboard() {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 3D Toggle
  const [is3DMode, setIs3DMode] = useState<boolean>(true);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'employees' | 'leaves' | 'violations' | 'settings'>('overview');

  // Employee Check-in Filter Tab
  const [empStatusFilter, setEmpStatusFilter] = useState<'all' | 'present' | 'late'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Employee Modal
  const [showAddEmpModal, setShowAddEmpModal] = useState(false);
  const [newEmpCode, setNewEmpCode] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newNickname, setNewNickname] = useState('');
  const [newPin, setNewPin] = useState('1234');
  const [newRole, setNewRole] = useState<'STAFF' | 'ADMIN' | 'SUPERVISOR'>('STAFF');
  const [empModalLoading, setEmpModalLoading] = useState(false);
  const [empModalMsg, setEmpModalMsg] = useState('');

  // Store Settings
  const [storeSettingsForm, setStoreSettingsForm] = useState<any>({});
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, [period]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics?period=${period}`);
      const data = await res.json();
      if (data.success) {
        setAnalyticsData(data.data);
        if (data.data.settings) {
          setStoreSettingsForm(data.data.settings);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmpModalLoading(true);
    setEmpModalMsg('');

    try {
      const res = await fetch('/api/admin/employee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeCode: newEmpCode,
          fullName: newFullName,
          nickname: newNickname,
          pin: newPin,
          role: newRole,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setEmpModalMsg(data.message || 'ไม่สามารถสร้างบัญชีได้');
        setEmpModalLoading(false);
        return;
      }

      setEmpModalMsg('สร้างบัญชีพนักงานสำเร็จ!');
      setTimeout(() => {
        setShowAddEmpModal(false);
        setNewEmpCode('');
        setNewFullName('');
        setNewNickname('');
        setNewPin('1234');
        setEmpModalMsg('');
        loadDashboardData();
      }, 800);
    } catch (err: any) {
      setEmpModalMsg('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setEmpModalLoading(false);
    }
  };

  const handleLeaveAction = async (leaveId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await fetch('/api/leave', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leaveId, status, reviewedBy: 'ADMIN01' }),
      });
      loadDashboardData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsLoading(true);
    setSettingsMsg('');
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(storeSettingsForm),
      });
      const data = await res.json();
      if (data.success) {
        setSettingsMsg('บันทึกการตั้งค่าเรียบร้อยแล้ว');
      }
    } catch (e) {
      setSettingsMsg('บันทึกไม่สำเร็จ');
    } finally {
      setSettingsLoading(false);
    }
  };

  const overview = analyticsData?.overview;
  const onTimePercent = overview?.onTimeRate || 92;
  const totalStaffCount = overview?.totalEmployees || 4;
  const presentCount = overview?.totalPresent || 14;
  const lateCount = overview?.totalLate || 2;
  const leaveCount = overview?.pendingLeavesCount || 0;

  const employeesList = [
    {
      id: '22222222-2222-2222-2222-222222222222',
      code: 'EMP001',
      name: 'สมชาย สายตรง (Somchai)',
      nickname: 'ชาย',
      role: 'ช่างเทคนิคยาง (YOKOHAMA)',
      checkInTime: '07:45:12 น.',
      status: 'PRESENT',
      allowance: 50,
      distance: '2.5 ม.',
      badgeColor: 'bg-red-500 text-white',
    },
    {
      id: '33333333-3333-3333-3333-333333333333',
      code: 'EMP002',
      name: 'วิภาดา ขยันยิ่ง (Wiphada)',
      nickname: 'ภา',
      role: 'ที่ปรึกษาการขาย (NAYA WHEELS)',
      checkInTime: '08:12:45 น.',
      status: 'LATE',
      allowance: 0,
      distance: '12.0 ม.',
      badgeColor: 'bg-amber-500 text-white',
    },
    {
      id: '44444444-4444-4444-4444-444444444444',
      code: 'EMP003',
      name: 'กิตติพงษ์ ตรงเวลา (Kittiphong)',
      nickname: 'กิต',
      role: 'ช่างติดตั้งล้อแม็ก (COSMIS RACING)',
      checkInTime: '07:38:20 น.',
      status: 'PRESENT',
      allowance: 50,
      distance: '4.8 ม.',
      badgeColor: 'bg-blue-600 text-white',
    },
    {
      id: '11111111-1111-1111-1111-111111111111',
      code: 'ADMIN01',
      name: 'ผู้จัดการ ภัทรพล (Admin)',
      nickname: 'แอดมิน',
      role: 'ผู้จัดการสาขาหลัก (BRIDGESTONE)',
      checkInTime: '07:30:00 น.',
      status: 'PRESENT',
      allowance: 50,
      distance: '1.2 ม.',
      badgeColor: 'bg-slate-900 text-white',
    },
  ];

  const filteredEmployees = employeesList.filter((emp) => {
    if (empStatusFilter === 'present' && emp.status !== 'PRESENT') return false;
    if (empStatusFilter === 'late' && emp.status !== 'LATE') return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return emp.name.toLowerCase().includes(q) || emp.code.toLowerCase().includes(q) || emp.nickname.toLowerCase().includes(q);
    }
    return true;
  });

  const weeklyData = [
    { day: 'จันทร์', ontime: 14, late: 2, total: 16, allowance: 700, percent: 88 },
    { day: 'อังคาร', ontime: 15, late: 1, total: 16, allowance: 750, percent: 94 },
    { day: 'พุธ', ontime: 16, late: 0, total: 16, allowance: 800, percent: 100 },
    { day: 'พฤหัสฯ', ontime: 13, late: 3, total: 16, allowance: 650, percent: 81 },
    { day: 'ศุกร์', ontime: 15, late: 1, total: 16, allowance: 750, percent: 94 },
    { day: 'เสาร์', ontime: 16, late: 0, total: 16, allowance: 800, percent: 100 },
    { day: 'อาทิตย์', ontime: 12, late: 2, total: 14, allowance: 600, percent: 86 },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans select-none">
      
      {/* ------------------------------------------------------------- */}
      {/* 1. TOP STORE BRAND BANNER & NAVBAR                            */}
      {/* ------------------------------------------------------------- */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Store Logo with Brand Badges */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-sky-500 to-amber-400 flex items-center justify-center text-white shadow-md shadow-blue-500/30 font-black">
              ⚡
            </div>
            <div>
              <div className="font-black text-slate-900 text-sm leading-tight flex items-center gap-2">
                <span>YOKOHAMA • NAYA • COSMIS</span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-600 text-white shadow-xs">
                  MAIN STORE
                </span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium">ระบบบริหารเวลาทำงาน & เบี้ยเลี้ยงพนักงาน</div>
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-2.5">
            {/* Colorful Brand Tags */}
            <div className="hidden md:flex items-center gap-1.5 text-[10px] font-bold">
              <span className="px-2 py-0.5 rounded bg-red-600 text-white">YOKOHAMA</span>
              <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-black">NAYA</span>
              <span className="px-2 py-0.5 rounded bg-orange-600 text-white">COSMIS</span>
              <span className="px-2 py-0.5 rounded bg-blue-600 text-white">LENSO</span>
              <span className="px-2 py-0.5 rounded bg-black text-white">BRIDGESTONE</span>
            </div>

            {/* 3D Switcher */}
            <button
              onClick={() => setIs3DMode(!is3DMode)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
                is3DMode
                  ? 'bg-gradient-to-r from-blue-600 to-sky-500 text-white border-blue-400 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>{is3DMode ? 'กราฟ 3D' : 'กราฟ 2D'}</span>
            </button>

            <Link
              href="/employee"
              target="_blank"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors border border-blue-200"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>หน้า PWA</span>
              <ExternalLink className="w-3 h-3 text-blue-500" />
            </Link>

            <button
              onClick={loadDashboardData}
              className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors"
              title="รีเฟรชข้อมูล"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* 2. REAL STOREFRONT PHOTO HERO BANNER                          */}
      {/* ------------------------------------------------------------- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 w-full">
        <div className="relative w-full h-36 sm:h-44 rounded-3xl overflow-hidden border border-slate-200 shadow-md">
          <img
            src="/shop-banner.png"
            alt="YOKOHAMA NAYA COSMIS BRIDGESTONE Store Front"
            className="w-full h-full object-cover object-center"
          />
          {/* Vibrant Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 via-slate-900/60 to-transparent flex items-center p-6 text-white">
            <div className="space-y-1 max-w-lg">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-red-600 text-white font-black text-[10px] tracking-wider uppercase shadow-xs">
                  ★ ศูนย์บริการยาง & ล้อแม็กมาตรฐาน
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px]">
                  50฿ เบี้ยเลี้ยงตรงเวลา
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight drop-shadow-md">
                สาขาหลัก YOKOHAMA • NAYA • COSMIS • LENSO
              </h2>
              <p className="text-xs text-blue-100 font-medium drop-shadow-sm">
                ระบบลงเวลาด้วย Geofencing รัศมี 50 เมตร & ระบบคำนวณเบี้ยเลี้ยงอัตโนมัติ
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. MAIN DASHBOARD CONTENT                                     */}
      {/* ------------------------------------------------------------- */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 w-full space-y-6 flex-1">
        
        {/* Navigation Tabs & Period Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'overview', label: '📊 สถิติ & รายชื่อเข้างาน', icon: BarChart3, color: 'bg-blue-600' },
              { id: 'employees', label: '👥 จัดการพนักงาน', icon: Users, color: 'bg-sky-500' },
              { id: 'leaves', label: '📝 อนุมัติใบลา', icon: Calendar, badge: overview?.pendingLeavesCount, color: 'bg-amber-500' },
              { id: 'violations', label: '🛡️ Security Logs', icon: AlertTriangle, badge: overview?.unresolvedViolationsCount, color: 'bg-red-500' },
              { id: 'settings', label: '⚙️ ตั้งค่าระบบ', icon: Settings, color: 'bg-slate-700' },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ${
                    activeTab === tab.id
                      ? `${tab.color} text-white shadow-md`
                      : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-400 text-slate-900">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 self-start sm:self-auto shadow-2xs">
            {(['daily', 'weekly', 'monthly'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  period === p
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {p === 'daily' ? 'รายวัน' : p === 'weekly' ? 'รายสัปดาห์' : 'รายเดือน'}
              </button>
            ))}
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* VIEW 1: VIBRANT EXECUTIVE DASHBOARD                           */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            
            {/* --------------------------------------------------------- */}
            {/* STEP 1: TOP 3-COLUMN HERO (CENTERED BIG HEADCOUNT)        */}
            {/* --------------------------------------------------------- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
              
              {/* Left Card: Allowance Total (Vibrant Gold / Amber) */}
              <div className="bg-gradient-to-br from-amber-500 to-yellow-400 text-slate-950 p-6 rounded-3xl shadow-lg shadow-amber-500/20 flex flex-col justify-between space-y-2 border border-amber-300">
                <div className="flex items-center justify-between text-xs font-bold text-slate-900/80">
                  <span className="flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-slate-950" />
                    ยอดจ่ายเบี้ยเลี้ยงรวม
                  </span>
                  <span className="bg-slate-950/15 px-2 py-0.5 rounded-full font-black text-[10px]">
                    50฿ / ครั้ง
                  </span>
                </div>
                <div>
                  <div className="text-4xl font-black tracking-tight font-mono">
                    {overview?.totalAllowancePaid || 4850} <span className="text-lg font-bold font-sans">บาท</span>
                  </div>
                  <div className="text-xs font-bold text-slate-900/80 mt-1">
                    สะสม {overview?.totalPresent || 97} ครั้ง (ตรงเวลา 100%)
                  </div>
                </div>
                <div className="text-[11px] font-black bg-slate-950 text-amber-300 px-3 py-1 rounded-xl w-fit shadow-xs">
                  💰 จ่ายเบี้ยเลี้ยงตรงเวลาครบถ้วน
                </div>
              </div>

              {/* CENTER HIGHLIGHT CARD: TOTAL HEADCOUNT (Vibrant Royal Blue) */}
              <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-sky-500 text-white p-6 rounded-3xl shadow-xl shadow-blue-600/30 text-center flex flex-col justify-between space-y-3 relative overflow-hidden border border-blue-400/40">
                <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-white/10 blur-xl pointer-events-none"></div>

                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-blue-100">
                  <Users className="w-4 h-4 text-sky-200" />
                  <span>จำนวนพนักงานทั้งหมด</span>
                </div>

                {/* Big Centered Headcount */}
                <div className="my-auto py-1">
                  <div className="text-5xl font-black tracking-tight drop-shadow-md font-mono">
                    {totalStaffCount} <span className="text-2xl font-bold font-sans">คน</span>
                  </div>
                  <p className="text-xs text-blue-100 font-semibold mt-1">
                    ศูนย์บริการ YOKOHAMA & COSMIS
                  </p>
                </div>

                {/* Breakdown Pills inside Center Card */}
                <div className="grid grid-cols-3 gap-1.5 bg-black/20 backdrop-blur-xs p-1.5 rounded-2xl text-[11px] border border-white/10">
                  <div className="text-center">
                    <div className="font-black text-emerald-300 text-base">{presentCount}</div>
                    <div className="text-[10px] text-blue-100 font-semibold">ตรงเวลา</div>
                  </div>
                  <div className="text-center border-x border-white/20">
                    <div className="font-black text-amber-300 text-base">{lateCount}</div>
                    <div className="text-[10px] text-blue-100 font-semibold">มาสาย</div>
                  </div>
                  <div className="text-center">
                    <div className="font-black text-sky-200 text-base">{leaveCount}</div>
                    <div className="text-[10px] text-blue-100 font-semibold">ลาหยุด</div>
                  </div>
                </div>
              </div>

              {/* Right Card: On-Time Rate % (Vibrant Emerald & Cyan) */}
              <div className="bg-gradient-to-br from-emerald-600 to-teal-500 text-white p-6 rounded-3xl shadow-lg shadow-emerald-500/20 flex flex-col justify-between space-y-2 border border-emerald-400">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-100">
                  <span className="flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-white" />
                    อัตราความตรงต่อเวลา
                  </span>
                  <span className="bg-white/20 px-2 py-0.5 rounded-full font-bold text-[10px]">
                    เป้าหมาย &gt; 90%
                  </span>
                </div>
                <div>
                  <div className="text-4xl font-black tracking-tight font-mono">
                    {onTimePercent}<span className="text-2xl font-bold font-sans">%</span>
                  </div>
                  <div className="text-xs font-medium text-emerald-100 mt-1">
                    ยอดเยี่ยม! สูงกว่าเป้าหมายองค์กร
                  </div>
                </div>
                <div className="w-full h-2.5 bg-black/20 rounded-full overflow-hidden flex border border-white/20">
                  <div style={{ width: `${onTimePercent}%` }} className="bg-white rounded-full"></div>
                  <div style={{ width: `${100 - onTimePercent}%` }} className="bg-amber-400"></div>
                </div>
              </div>
            </div>

            {/* --------------------------------------------------------- */}
            {/* STEP 2: รายชื่อพนักงานเข้างาน (BEFORE CHARTS)             */}
            {/* --------------------------------------------------------- */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-blue-600" />
                    <span>รายชื่อพนักงานเข้างาน (Staff Check-in List)</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">
                    เวลาเช็คอินจริง, ยอดเบี้ยเลี้ยง 50 บาท, ระยะห่าง GPS และแผนกช่าง/บริการ
                  </p>
                </div>

                {/* Filter & Search */}
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="ค้นหาชื่อ / รหัส..."
                      className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500 w-36 sm:w-48"
                    />
                  </div>

                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                    <button
                      onClick={() => setEmpStatusFilter('all')}
                      className={`px-2.5 py-1 rounded-lg transition-all ${
                        empStatusFilter === 'all' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      ทั้งหมด
                    </button>
                    <button
                      onClick={() => setEmpStatusFilter('present')}
                      className={`px-2.5 py-1 rounded-lg transition-all ${
                        empStatusFilter === 'present' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      ตรงเวลา
                    </button>
                    <button
                      onClick={() => setEmpStatusFilter('late')}
                      className={`px-2.5 py-1 rounded-lg transition-all ${
                        empStatusFilter === 'late' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      มาสาย
                    </button>
                  </div>
                </div>
              </div>

              {/* Colorful Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold">
                      <th className="py-2.5 px-3">พนักงาน</th>
                      <th className="py-2.5 px-3">รหัสพนักงาน</th>
                      <th className="py-2.5 px-3">ตำแหน่ง / แผนก</th>
                      <th className="py-2.5 px-3">เวลาเช็คอิน</th>
                      <th className="py-2.5 px-3">สถานะ</th>
                      <th className="py-2.5 px-3">เบี้ยเลี้ยงวันนี้</th>
                      <th className="py-2.5 px-3 text-right">ระยะห่างร้าน</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredEmployees.map((emp) => (
                      <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-black flex items-center justify-center text-xs border border-blue-200">
                              {emp.nickname[0]}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">{emp.name}</div>
                              <div className="text-[10px] text-slate-500">ชื่อเล่น: {emp.nickname}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-blue-600">{emp.code}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${emp.badgeColor}`}>
                            {emp.role}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-800">{emp.checkInTime}</td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black inline-flex items-center gap-1 ${
                              emp.status === 'PRESENT'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${emp.status === 'PRESENT' ? 'bg-emerald-600' : 'bg-amber-600'}`}></span>
                            {emp.status === 'PRESENT' ? 'ตรงเวลา (+50฿)' : 'มาสาย (> 08:00)'}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`font-mono font-black text-xs ${emp.allowance > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                            {emp.allowance > 0 ? `+${emp.allowance} บาท` : '0 บาท'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right text-slate-700 font-mono font-bold text-[11px]">{emp.distance}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* --------------------------------------------------------- */}
            {/* STEP 3: WEEKLY ATTENDANCE 3D BAR CHART                    */}
            {/* --------------------------------------------------------- */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-600" />
                    <span>{is3DMode ? 'กราฟแท่ง 3 มิติ (Weekly Attendance 3D)' : 'สถิติการเข้างานประจำสัปดาห์'}</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">
                    {is3DMode ? 'สามารถใช้เมาส์คลิกหมุนดูมุมมอง 3 มิติได้รอบทิศทาง' : 'จำนวนพนักงานที่เข้างานตรงเวลาในแต่ละวัน'}
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-white bg-blue-600 px-3 py-1 rounded-full font-black text-[11px] shadow-xs flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-yellow-300" />
                    <span>{is3DMode ? '3D WebGL Mode' : '2D Chart Mode'}</span>
                  </span>
                </div>
              </div>

              {/* 3D or 2D Bar Chart */}
              {is3DMode ? (
                <ThreeBarChart3D data={weeklyData} />
              ) : (
                <div className="h-64 w-full pt-4 flex items-end justify-between gap-3 sm:gap-6 border-b border-slate-100 pb-2">
                  {weeklyData.map((item, idx) => {
                    const barHeight = (item.ontime / 18) * 100;
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative h-full justify-end">
                        <div className="w-full max-w-[32px] bg-slate-100 rounded-xl overflow-hidden h-full flex flex-col justify-end">
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${barHeight}%` }}
                            transition={{ duration: 0.6, delay: idx * 0.04 }}
                            className="w-full bg-blue-600 rounded-xl"
                          />
                        </div>
                        <span className="text-[11px] font-bold text-slate-600">{item.day}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-slate-500 font-medium pt-1">
                <span>สรุปยอดคนตรงเวลาสัปดาห์นี้: <strong>104 ครั้ง</strong></span>
                <span className="text-blue-600 font-black">ผลงานสัปดาห์นี้: 93.4% 🎯</span>
              </div>
            </div>

            {/* --------------------------------------------------------- */}
            {/* STEP 4: DONUT CHART + ALLOWANCE RANKING                   */}
            {/* --------------------------------------------------------- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Donut Chart */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                    <PieChart className="w-4 h-4 text-blue-600" />
                    <span>สัดส่วนความตรงต่อเวลา (Donut Chart)</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">สัดส่วนความตรงต่อเวลาและการลาหยุด</p>
                </div>

                <div className="relative w-44 h-44 mx-auto my-1 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-100"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-blue-600"
                      strokeDasharray={`${onTimePercent}, 100`}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>

                  <div className="absolute text-center">
                    <div className="text-3xl font-black text-slate-900 leading-none font-mono">{onTimePercent}%</div>
                    <div className="text-[10px] font-black text-blue-600 mt-1">ตรงเวลา</div>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100 text-xs font-medium">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-slate-700">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                      <span>ตรงเวลา (รับ 50฿)</span>
                    </span>
                    <strong className="text-slate-900 font-bold">{presentCount} คน</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-slate-700">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                      <span>มาสาย (&gt; 08:00)</span>
                    </span>
                    <strong className="text-slate-700 font-bold">{lateCount} คน</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-slate-700">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
                      <span>ลาหยุด</span>
                    </span>
                    <strong className="text-slate-700 font-bold">{leaveCount} คน</strong>
                  </div>
                </div>
              </div>

              {/* Employee Allowance Ranking */}
              <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                      <Coins className="w-4 h-4 text-amber-500" />
                      <span>ยอดเบี้ยเลี้ยงรายบุคคล (Allowance Ranking)</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">ยอดเงินสะสมของพนักงานแต่ละคน</p>
                  </div>
                  <span className="text-xs font-black text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-lg border border-amber-300">
                    50฿ / ครั้ง
                  </span>
                </div>

                <div className="space-y-3 pt-1">
                  {analyticsData?.allowanceReports?.map((emp: any) => {
                    const max = 1500;
                    const percent = Math.min(100, Math.round((emp.totalAllowance / max) * 100));

                    return (
                      <div key={emp.employeeId} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                              {emp.nickname?.[0] || 'U'}
                            </span>
                            <span className="font-bold text-slate-900">{emp.fullName}</span>
                            <span className="text-[10px] font-mono text-slate-500">({emp.employeeCode})</span>
                          </div>
                          <div className="text-right font-mono">
                            <strong className="text-amber-600 font-black text-sm">{emp.totalAllowance} ฿</strong>
                            <span className="text-[10px] text-slate-400 ml-1">({emp.allowanceCount} ครั้ง)</span>
                          </div>
                        </div>

                        <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percent}%` }}
                            transition={{ duration: 0.6 }}
                            className="h-full bg-gradient-to-r from-amber-400 via-yellow-400 to-emerald-400 rounded-full"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 2: EMPLOYEES MANAGEMENT                                  */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'employees' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span>รายชื่อพนักงานทั้งหมด</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">เพิ่มพนักงานใหม่ และดูรหัสประจำเครื่อง (HWID)</p>
              </div>

              <button
                onClick={() => setShowAddEmpModal(true)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>เพิ่มพนักงานใหม่</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold">
                    <th className="py-2.5 px-3">รหัส</th>
                    <th className="py-2.5 px-3">ชื่อ-นามสกุล</th>
                    <th className="py-2.5 px-3">ชื่อเล่น</th>
                    <th className="py-2.5 px-3">สิทธิ์</th>
                    <th className="py-2.5 px-3">เบี้ยเลี้ยงสะสม</th>
                    <th className="py-2.5 px-3">สถานะ HWID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {analyticsData?.allowanceReports?.map((emp: any) => (
                    <tr key={emp.employeeId} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-blue-600">{emp.employeeCode}</td>
                      <td className="py-3 px-3 font-bold text-slate-800">{emp.fullName}</td>
                      <td className="py-3 px-3 text-slate-500">{emp.nickname || '-'}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono text-[10px] font-bold">
                          {emp.role}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-bold text-amber-600 font-mono">{emp.totalAllowance} ฿</td>
                      <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">ผูกติดเครื่องแล้ว</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 3: LEAVE APPROVALS                                       */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'leaves' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>รายการคำขอลาของพนักงาน</span>
            </h3>

            <div className="space-y-3">
              {analyticsData?.pendingLeaves?.length > 0 ? (
                analyticsData.pendingLeaves.map((leave: any) => (
                  <div
                    key={leave.id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">
                          {leave.employee?.full_name} ({leave.employee?.employee_code})
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                          {leave.leave_type === 'SICK' ? 'ลาป่วย' : leave.leave_type === 'BUSINESS' ? 'ลากิจ' : 'ลาพักร้อน'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500">
                        วันที่: <strong>{new Date(leave.start_date).toLocaleDateString('th-TH')}</strong> ถึง <strong>{new Date(leave.end_date).toLocaleDateString('th-TH')}</strong> ({leave.days_count} วัน)
                      </div>
                      <div className="text-xs text-slate-600 italic bg-white p-2 rounded-xl border border-slate-200">
                        "{leave.reason}"
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleLeaveAction(leave.id, 'APPROVED')}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs"
                      >
                        <Check className="w-4 h-4" />
                        <span>อนุมัติ</span>
                      </button>
                      <button
                        onClick={() => handleLeaveAction(leave.id, 'REJECTED')}
                        className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs"
                      >
                        <X className="w-4 h-4" />
                        <span>ปฏิเสธ</span>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-xs text-slate-400 font-medium">
                  ไม่มีคำขอลาที่รอการอนุมัติในขณะนี้
                </div>
              )}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 4: SECURITY LOGS                                         */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'violations' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span>ประวัติความผิดปกติ & การใช้งานอุปกรณ์ (Security Logs)</span>
            </h3>

            <div className="space-y-3">
              {analyticsData?.violations?.map((viol: any) => (
                <div
                  key={viol.id}
                  className={`p-4 rounded-2xl border text-xs ${
                    viol.severity === 'CRITICAL'
                      ? 'bg-red-50 border-red-200 text-red-900'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-black text-sm mb-1">{viol.violation_type}</div>
                      <p className="font-medium text-slate-700">{viol.description}</p>
                      <div className="text-[11px] text-slate-400 mt-1 font-mono">
                        {new Date(viol.created_at).toLocaleString('th-TH')} • HWID: {viol.hwid}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white border text-slate-600 shrink-0">
                      {viol.severity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 5: SETTINGS                                              */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'settings' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 max-w-2xl">
            <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
              <Settings className="w-4 h-4 text-blue-600" />
              <span>การตั้งค่าพิกัดร้าน & กฎเวลาเข้างาน</span>
            </h3>

            {settingsMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                {settingsMsg}
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs font-bold">
              <div>
                <label className="block text-slate-700 mb-1">ชื่อร้าน / สาขา:</label>
                <input
                  type="text"
                  value={storeSettingsForm.store_name || ''}
                  onChange={(e) => setStoreSettingsForm({ ...storeSettingsForm, store_name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1">ละติจูด (Lat):</label>
                  <input
                    type="number"
                    step="any"
                    value={storeSettingsForm.store_lat || ''}
                    onChange={(e) => setStoreSettingsForm({ ...storeSettingsForm, store_lat: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1">ลองจิจูด (Lng):</label>
                  <input
                    type="number"
                    step="any"
                    value={storeSettingsForm.store_lng || ''}
                    onChange={(e) => setStoreSettingsForm({ ...storeSettingsForm, store_lng: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1">รัศมีที่อนุญาต (เมตร):</label>
                  <input
                    type="number"
                    value={storeSettingsForm.radius_meters || 50}
                    onChange={(e) => setStoreSettingsForm({ ...storeSettingsForm, radius_meters: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1">เบี้ยเลี้ยงต่อวัน (บาท):</label>
                  <input
                    type="number"
                    value={storeSettingsForm.allowance_amount || 50}
                    onChange={(e) => setStoreSettingsForm({ ...storeSettingsForm, allowance_amount: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={settingsLoading}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-xs transition-colors"
              >
                {settingsLoading ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
              </button>
            </form>
          </div>
        )}
      </main>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: ADD EMPLOYEE                                           */}
      {/* ------------------------------------------------------------- */}
      {showAddEmpModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 rounded-3xl bg-white border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-600" />
                <span>เพิ่มพนักงานใหม่</span>
              </h3>
              <button onClick={() => setShowAddEmpModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            {empModalMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                {empModalMsg}
              </div>
            )}

            <form onSubmit={handleCreateEmployee} className="space-y-3 text-xs font-bold">
              <div>
                <label className="block text-slate-700 mb-1">รหัสพนักงาน (เช่น EMP004):</label>
                <input
                  type="text"
                  value={newEmpCode}
                  onChange={(e) => setNewEmpCode(e.target.value.toUpperCase())}
                  placeholder="EMP004"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">ชื่อ-นามสกุล:</label>
                <input
                  type="text"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="สมชาย ใจดี"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1">ชื่อเล่น:</label>
                  <input
                    type="text"
                    value={newNickname}
                    onChange={(e) => setNewNickname(e.target.value)}
                    placeholder="ชาย"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1">รหัส PIN 4 หลัก:</label>
                  <input
                    type="password"
                    maxLength={4}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    placeholder="1234"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono text-center tracking-widest focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={empModalLoading}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-xs transition-colors"
              >
                {empModalLoading ? 'กำลังสร้างบัญชี...' : 'สร้างบัญชีพนักงาน'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
