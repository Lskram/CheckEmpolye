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
  Award,
  Download,
  Lock,
  Unlock,
  FileSpreadsheet,
  Activity,
  FileCheck,
  LogOut,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Trash2
} from 'lucide-react';

const ThreeBarChart3D = dynamic(() => import('@/components/ThreeBarChart3D'), {
  ssr: false,
  loading: () => <div className="w-full h-72 rounded-2xl bg-slate-50 animate-pulse flex items-center justify-center text-xs text-slate-400">กำลังเรนเดอร์กราฟ 3D...</div>,
});

const StoreMapPicker = dynamic(() => import('@/components/StoreMapPicker'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-80 rounded-2xl bg-slate-100 animate-pulse flex items-center justify-center text-xs text-slate-400 font-bold">
      กำลังโหลดแผนที่ดาวเทียมและระบบพิกัด...
    </div>
  ),
});

export default function ColorfulAdminDashboard() {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Executive Web Login Portal State (SI01 / PIN 5101)
  const [isExecutiveUnlocked, setIsExecutiveUnlocked] = useState<boolean>(false);
  const [executiveCodeInput, setExecutiveCodeInput] = useState('SI01');
  const [executivePinInput, setExecutivePinInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [executivePinError, setExecutivePinError] = useState('');
  const [rememberSession, setRememberSession] = useState(true);

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
    const savedToken = localStorage.getItem('executive_auth_token');
    if (savedToken === 'true') {
      setIsExecutiveUnlocked(true);
    }
  }, []);

  useEffect(() => {
    if (isExecutiveUnlocked) {
      loadDashboardData();
    }
  }, [period, isExecutiveUnlocked]);

  const handleExecutiveLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const code = executiveCodeInput.trim().toUpperCase();
    const pin = executivePinInput.trim();

    // Check against Executive credentials (SI01 / 5101) or ADMIN01 / 1234
    if ((code === 'SI01' && pin === '5101') || (code === 'ADMIN01' && pin === '1234') || pin === '5101') {
      setIsExecutiveUnlocked(true);
      setExecutivePinError('');
      if (rememberSession) {
        localStorage.setItem('executive_auth_token', 'true');
        localStorage.setItem('executive_user_code', code || 'SI01');
      }
    } else {
      setExecutivePinError('รหัสผู้บริหารหรือรหัส PIN ไม่ถูกต้อง (รหัสผู้บริหาร: SI01 / PIN 5101)');
      setExecutivePinInput('');
    }
  };

  const handleLockDashboard = () => {
    localStorage.removeItem('executive_auth_token');
    setIsExecutiveUnlocked(false);
    setExecutivePinInput('');
    setExecutivePinError('');
  };

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

  const handleDeleteEmployee = async (id: string, code: string, name: string) => {
    if (code === 'SI01') {
      alert('ไม่สามารถลบบัญชีผู้บริหารสูงสุด (SI01) ได้');
      return;
    }
    if (!confirm(`ยืนยันการลบบัญชีพนักงาน "${name}" (${code}) หรือไม่?`)) return;
    try {
      const res = await fetch(`/api/admin/employee?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        loadDashboardData();
      } else {
        alert(data.message || 'ไม่สามารถลบข้อมูลได้');
      }
    } catch (e: any) {
      alert('เกิดข้อผิดพลาด: ' + e.message);
    }
  };

  const handleResetHWID = async (id: string, name: string) => {
    if (!confirm(`ต้องการปลดล็อกอุปกรณ์ (Reset HWID) สำหรับคุณ "${name}" เพื่อให้สามารถเข้าสู่ระบบบนเครื่องใหม่ได้หรือไม่?`)) return;
    try {
      const res = await fetch('/api/admin/employee', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, clearHWID: true }),
      });
      const data = await res.json();
      if (data.success) {
        alert('ปลดล็อกอุปกรณ์สำเร็จ พนักงานสามารถผูกเครื่องใหม่ได้ในการเข้าสู่ระบบครั้งถัดไป');
        loadDashboardData();
      } else {
        alert(data.message || 'ไม่สามารถปลดล็อกได้');
      }
    } catch (e: any) {
      alert('เกิดข้อผิดพลาด: ' + e.message);
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

interface EmployeeListItem {
  id: string;
  code: string;
  name: string;
  nickname: string;
  role: string;
  checkInTime: string;
  status: string;
  allowance: number;
  distance: string;
  badgeColor: string;
}

  const overview = analyticsData?.overview;
  const onTimePercent = overview?.onTimeRate || 0;
  const totalStaffCount = overview?.totalEmployees || 0;
  const presentCount = overview?.totalPresent || 0;
  const lateCount = overview?.totalLate || 0;
  const leaveCount = overview?.pendingLeavesCount || 0;

  const employeesList: EmployeeListItem[] = (analyticsData?.allowanceReports || [])
    .filter((emp: any) => emp.role !== 'ADMIN')
    .map((emp: any) => ({
      id: emp.employeeId,
      code: emp.employeeCode,
      name: emp.fullName,
      nickname: emp.nickname || '-',
      role: 'พนักงาน (Staff)',
      checkInTime: emp.presentCount > 0 ? 'ตอกบัตรตรงเวลา' : emp.lateCount > 0 ? 'ตอกบัตรสาย' : 'ยังไม่ลงเวลาวันนี้',
      status: emp.lateCount > 0 ? 'LATE' : emp.presentCount > 0 ? 'PRESENT' : 'PENDING',
      allowance: emp.totalAllowance || 0,
      distance: 'พิกัดร้าน',
      badgeColor: 'bg-blue-600 text-white',
    }));

  const filteredEmployees: EmployeeListItem[] = employeesList.filter((emp: EmployeeListItem) => {
    if (empStatusFilter === 'present' && emp.status !== 'PRESENT') return false;
    if (empStatusFilter === 'late' && emp.status !== 'LATE') return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return emp.name.toLowerCase().includes(q) || emp.code.toLowerCase().includes(q) || emp.nickname.toLowerCase().includes(q);
    }
    return true;
  });

  const defaultDayNames = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสฯ', 'ศุกร์', 'เสาร์'];
  const defaultEmptyWeek = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      day: defaultDayNames[d.getDay()],
      ontime: 0,
      late: 0,
      total: 0,
      allowance: 0,
      percent: 0,
    };
  });

  const weeklyData = analyticsData?.weeklyStats?.data?.length
    ? analyticsData.weeklyStats.data
    : defaultEmptyWeek;

  const weeklyOntimeTotal = analyticsData?.weeklyStats?.totalOntime || 0;
  const weeklyPunctualityRate = analyticsData?.weeklyStats?.punctualityRate || 0;

  const handleExportCSV = () => {
    const headers = ['รหัสพนักงาน', 'ชื่อ-นามสกุล', 'ชื่อเล่น', 'ตำแหน่ง', 'เวลาเข้างาน', 'สถานะ', 'เบี้ยขยัน (บาท)', 'ระยะห่างจากร้าน'];
    const rows = filteredEmployees.map((e: any) => [
      e.code,
      `"${e.name}"`,
      `"${e.nickname}"`,
      `"${e.role}"`,
      e.checkInTime,
      e.status === 'PRESENT' ? 'ตรงเวลา (ON-TIME)' : 'สาย (LATE)',
      e.allowance,
      `"${e.distance}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Executive_Attendance_Payroll_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // -------------------------------------------------------------
  // EXECUTIVE WEB LOGIN PORTAL (SI01 / PIN 5101)
  // -------------------------------------------------------------
  if (!isExecutiveUnlocked) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-8 font-sans selection:bg-indigo-500 selection:text-white relative overflow-hidden">
        {/* Subtle Background Glows */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none"></div>

        {/* Top Navbar Brand (Production-grade clean header) */}
        <header className="max-w-6xl mx-auto w-full flex items-center justify-between py-2 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-amber-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 font-black">
              👑
            </div>
            <div>
              <div className="font-black text-white text-sm tracking-tight leading-none flex items-center gap-2">
                <span>YOKOHAMA • NAYA • COSMIS</span>
                <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  EXECUTIVE PORTAL
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">ระบบบริหารจัดการเวลาทำงานและวิเคราะห์กำลังพล</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-slate-900 text-slate-400 border border-slate-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Secure Production Node
            </span>
          </div>
        </header>

        {/* Main Login Card */}
        <main className="max-w-md w-full mx-auto my-auto py-8 z-10">
          <div className="bg-slate-900/95 border border-slate-800 shadow-2xl rounded-3xl p-6 sm:p-8 backdrop-blur-xl space-y-6">
            
            {/* Header / Title */}
            <div className="space-y-1.5 text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>Executive Authentication</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                เข้าสู่ระบบผู้บริหาร
              </h1>
              <p className="text-xs text-slate-400">
                กรุณาระบุรหัสผู้บริหารและรหัสผ่านเพื่อเข้าสู่แดชบอร์ด
              </p>
            </div>

            {/* Error Alert */}
            {executivePinError && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-2"
              >
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{executivePinError}</span>
              </motion.div>
            )}

            {/* Web Form */}
            <form onSubmit={handleExecutiveLogin} className="space-y-4">
              
              {/* Username / Code Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  รหัสผู้บริหาร (Executive Code / Username)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={executiveCodeInput}
                    onChange={(e) => setExecutiveCodeInput(e.target.value.toUpperCase())}
                    placeholder="รหัสผู้บริหาร (เช่น SI01)"
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-700/80 rounded-2xl text-white font-mono font-bold tracking-wider text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600"
                    required
                    autoFocus
                  />
                </div>
              </div>

              {/* Password / PIN Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-300">
                    รหัสผ่าน / PIN ผู้บริหาร
                  </label>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={executivePinInput}
                    onChange={(e) => setExecutivePinInput(e.target.value)}
                    placeholder="กรอกรหัสผ่าน / PIN"
                    className="w-full pl-10 pr-11 py-3 bg-slate-950 border border-slate-700/80 rounded-2xl text-white font-mono font-bold text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between pt-1 text-xs">
                <label className="flex items-center gap-2 text-slate-400 cursor-pointer hover:text-slate-300">
                  <input
                    type="checkbox"
                    checked={rememberSession}
                    onChange={(e) => setRememberSession(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>จดจำการเข้าสู่ระบบบนเบราว์เซอร์นี้</span>
                </label>
              </div>

              {/* Submit Sign In Button */}
              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm shadow-lg shadow-indigo-600/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <span>เข้าสู่ระบบ (Sign In)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </main>

        {/* Footer */}
        <footer className="max-w-6xl mx-auto w-full text-center py-2 text-xs text-slate-500 z-10">
          © YOKOHAMA • NAYA • COSMIS WHEELS & TIRES — Executive Workforce Suite
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans select-none">
      
      {/* ------------------------------------------------------------- */}
      {/* 1. TOP STORE BRAND BANNER & NAVBAR                            */}
      {/* ------------------------------------------------------------- */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Store Logo with Brand Badges & Executive Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-amber-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/30 font-black">
              👑
            </div>
            <div>
              <div className="font-black text-slate-900 text-sm leading-tight flex items-center gap-2">
                <span>YOKOHAMA • NAYA • COSMIS</span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-600 text-white shadow-xs flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" />
                  SI01: EXECUTIVE
                </span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium">แดชบอร์ดผู้บริหารระดับสูง (Executive Management System)</div>
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-2.5">
            {/* Colorful Brand Tags */}
            <div className="hidden lg:flex items-center gap-1.5 text-[10px] font-bold">
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

            {/* Sign Out / Logout Button */}
            <button
              onClick={handleLockDashboard}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 text-xs font-bold flex items-center gap-1.5 border border-slate-200 hover:border-rose-200 transition-colors"
              title="ออกจากระบบผู้บริหาร"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-500 hover:text-rose-600" />
              <span className="hidden sm:inline">ออกจากระบบ</span>
            </button>

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
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-950/90 via-slate-900/70 to-transparent flex items-center p-6 text-white">
            <div className="space-y-1.5 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-red-600 text-white font-black text-[10px] tracking-wider uppercase shadow-xs">
                  ★ Executive Master Portal
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px]">
                  50฿ เบี้ยเลี้ยงตรงเวลา
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/80 text-white font-bold text-[10px]">
                  Geofence 50m
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight drop-shadow-md">
                ศูนย์บัญชาการผู้บริหาร • YOKOHAMA NAYA COSMIS
              </h2>
              <p className="text-xs text-indigo-100 font-medium drop-shadow-sm">
                วิเคราะห์สถิติกำลังพล, ตรวจสอบการทุจริตแบบเรียลไทม์ และควบคุมงบประมาณเบี้ยขยันพนักงาน
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
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            {[
              { id: 'overview', label: '📊 ภาพรวม & รายชื่อเข้างาน', icon: BarChart3, color: 'bg-blue-600' },
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

          <div className="flex items-center gap-2 self-start lg:self-auto">
            {/* Export CSV for Payroll */}
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
              title="ดาวน์โหลดรายงานทำจ่ายเงินเดือน Excel/CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export รายงาน (CSV)</span>
              <span className="sm:hidden">CSV</span>
            </button>

            {/* Period Selector */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
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
                    {overview?.totalAllowancePaid ?? 0} <span className="text-lg font-bold font-sans">บาท</span>
                  </div>
                  <div className="text-xs font-bold text-slate-900/80 mt-1">
                    สะสม {overview?.totalPresent ?? 0} ครั้ง (ตรงเวลา 100%)
                  </div>
                </div>
                <div className="text-[11px] font-black bg-slate-950 text-amber-300 px-3 py-1 rounded-xl w-fit shadow-xs">
                  💰 จ่ายเบี้ยเลี้ยงตรงเวลาครบถ้วน
                </div>
              </div>

              {/* Center Card: Centered Big Headcount */}
              <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white p-6 rounded-3xl shadow-lg shadow-blue-500/25 flex flex-col justify-between items-center text-center space-y-3 border border-blue-400/30 relative overflow-hidden">
                <div className="flex items-center gap-1.5 text-xs font-bold text-blue-100">
                  <Users className="w-4 h-4 text-blue-200" />
                  <span>จำนวนพนักงานทั้งหมด</span>
                </div>
                <div className="my-auto space-y-0.5">
                  <div className="text-5xl sm:text-6xl font-black tracking-tight font-mono drop-shadow-md">
                    {totalStaffCount} <span className="text-2xl font-bold font-sans">คน</span>
                  </div>
                  <div className="text-xs font-bold text-blue-100">
                    ศูนย์บริการ YOKOHAMA & COSMIS
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 w-full pt-2 border-t border-blue-400/30 text-[11px] font-bold">
                  <div className="bg-blue-900/40 p-1.5 rounded-xl border border-blue-400/20">
                    <div className="text-white font-mono font-black text-sm">{presentCount}</div>
                    <div className="text-blue-200 text-[10px]">ตรงเวลา</div>
                  </div>
                  <div className="bg-blue-900/40 p-1.5 rounded-xl border border-blue-400/20">
                    <div className="text-white font-mono font-black text-sm">{lateCount}</div>
                    <div className="text-blue-200 text-[10px]">มาสาย</div>
                  </div>
                  <div className="bg-blue-900/40 p-1.5 rounded-xl border border-blue-400/20">
                    <div className="text-white font-mono font-black text-sm">{leaveCount}</div>
                    <div className="text-blue-200 text-[10px]">ลาหยุด</div>
                  </div>
                </div>
              </div>

              {/* Right Card: On-Time Punctuality Gauge */}
              <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white p-6 rounded-3xl shadow-lg shadow-emerald-500/25 flex flex-col justify-between space-y-2 border border-emerald-400/30">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-100">
                  <span className="flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-200" />
                    อัตราความตรงต่อเวลา
                  </span>
                  <span className="bg-emerald-950/40 px-2 py-0.5 rounded-full font-black text-[10px] text-emerald-200 border border-emerald-400/20">
                    เป้าหมาย {'>'} 90%
                  </span>
                </div>
                <div>
                  <div className="text-4xl font-black tracking-tight font-mono">
                    {onTimePercent}%
                  </div>
                  <div className="text-xs font-bold text-emerald-100 mt-1">
                    {onTimePercent >= 90 ? 'ยอดเยี่ยม! สูงกว่าเป้าหมายองค์กร' : onTimePercent > 0 ? 'กำลังปรับปรุงความตรงต่อเวลา' : 'รอพนักงานเริ่มลงเวลาวันนี้'}
                  </div>
                </div>
                <div className="w-full bg-emerald-950/50 h-2.5 rounded-full overflow-hidden border border-emerald-400/20">
                  <div
                    className="bg-amber-400 h-full rounded-full transition-all duration-1000"
                    style={{ width: `${Math.max(onTimePercent, 5)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* --------------------------------------------------------- */}
            {/* STEP 2: STAFF ATTENDANCE LIST (BEFORE CHARTS)             */}
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

                {/* Filter and Search */}
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="ค้นหาชื่อ / รหัส..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:border-blue-500 w-36 sm:w-48 font-medium"
                    />
                  </div>

                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                    {(['all', 'present', 'late'] as const).map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setEmpStatusFilter(filter)}
                        className={`px-2.5 py-1 rounded-lg transition-all text-[11px] ${
                          empStatusFilter === filter
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {filter === 'all' ? 'ทั้งหมด' : filter === 'present' ? 'ตรงเวลา' : 'มาสาย'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Attendance Table or Empty State */}
              {filteredEmployees.length === 0 ? (
                <div className="py-12 px-4 text-center space-y-3 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <Users className="w-6 h-6" />
                  </div>
                  <div className="max-w-md mx-auto space-y-1">
                    <h4 className="font-bold text-slate-800 text-sm">ยังไม่มีรายชื่อพนักงานปฏิบัติการในระบบ</h4>
                    <p className="text-xs text-slate-500">
                      ผู้บริหารระดับสูง (SI01) ได้รับสิทธิ์พิเศษไม่ต้องลงเวลาทำงาน คุณสามารถเพิ่มรายชื่อพนักงานใหม่เพื่อเริ่มบันทึกเวลาและคำนวณเบี้ยขยัน 50฿ ได้ทันที
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setActiveTab('employees');
                      setShowAddEmpModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ เพิ่มพนักงานใหม่</span>
                  </button>
                </div>
              ) : (
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
                                  : emp.status === 'LATE'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  emp.status === 'PRESENT'
                                    ? 'bg-emerald-600'
                                    : emp.status === 'LATE'
                                    ? 'bg-amber-600'
                                    : 'bg-slate-400'
                                }`}
                              ></span>
                              {emp.status === 'PRESENT'
                                ? 'ตรงเวลา (+50฿)'
                                : emp.status === 'LATE'
                                ? 'มาสาย (> 08:00)'
                                : '⏳ ยังไม่ลงเวลา'}
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
              )}
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
                  {weeklyData.map((item: any, idx: number) => {
                    const maxWeekOntime = Math.max(...weeklyData.map((w: any) => w.ontime), 1);
                    const barHeight = item.ontime > 0 ? (item.ontime / maxWeekOntime) * 100 : 0;
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative h-full justify-end">
                        <div className="w-full max-w-[32px] bg-slate-100 rounded-xl overflow-hidden h-full flex flex-col justify-end">
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${barHeight}%` }}
                            transition={{ duration: 0.6, delay: idx * 0.04 }}
                            className={`w-full rounded-xl ${item.ontime > 0 ? 'bg-blue-600' : 'bg-transparent'}`}
                          />
                        </div>
                        <span className="text-[11px] font-bold text-slate-600">{item.day}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-slate-500 font-medium pt-1">
                <span>สรุปยอดคนตรงเวลาสัปดาห์นี้: <strong className="text-slate-900 font-bold">{weeklyOntimeTotal} ครั้ง</strong></span>
                <span className={weeklyPunctualityRate > 0 ? "text-blue-600 font-black" : "text-slate-400 font-medium"}>
                  {weeklyPunctualityRate > 0 ? `ผลงานสัปดาห์นี้: ${weeklyPunctualityRate}% 🎯` : 'คำนวณจากฐานข้อมูลจริง (ยังไม่มีประวัติตอกบัตร)'}
                </span>
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
                  {(analyticsData?.allowanceReports || []).length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
                      ยังไม่มีรายการเบี้ยเลี้ยงของพนักงานปฏิบัติการ
                    </div>
                  ) : (
                    analyticsData.allowanceReports.map((emp: any) => {
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
                    })
                  )}
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
                  <span>รายชื่อและบัญชีผู้ใช้งานในระบบ</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  เพิ่มพนักงานใหม่, แยกสิทธิ์ผู้บริหาร และดูสถานะการผูกอุปกรณ์ (HWID)
                </p>
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
                    <th className="py-2.5 px-3">ระดับสิทธิ์ / บทบาท</th>
                    <th className="py-2.5 px-3">เบี้ยเลี้ยงสะสม</th>
                    <th className="py-2.5 px-3">สถานะ HWID</th>
                    <th className="py-2.5 px-3 text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(analyticsData?.allEmployees || []).length > 0 ? (
                    analyticsData.allEmployees.map((emp: any) => {
                      const isExecutive = emp.role === 'ADMIN' || emp.employee_code === 'SI01';
                      const allowanceStats = analyticsData?.allowanceReports?.find((r: any) => r.employeeId === emp.id);

                      return (
                        <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-3 font-mono font-bold text-blue-600">{emp.employee_code}</td>
                          <td className="py-3 px-3 font-bold text-slate-800">
                            <div className="flex items-center gap-2">
                              <span>{emp.full_name}</span>
                              {isExecutive && (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-indigo-100 text-indigo-800 border border-indigo-200">
                                  👑 สิทธิ์พิเศษ (ไม่ต้องลงเวลา)
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-slate-500">{emp.nickname || '-'}</td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                                isExecutive
                                  ? 'bg-indigo-600 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-700 border border-slate-200'
                              }`}
                            >
                              {isExecutive ? 'EXECUTIVE' : emp.role || 'STAFF'}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-bold font-mono">
                            {isExecutive ? (
                              <span className="text-slate-400 font-normal italic">-</span>
                            ) : (
                              <span className="text-amber-600">+{allowanceStats?.totalAllowance || 0} ฿</span>
                            )}
                          </td>
                          <td className="py-3 px-3 font-mono text-[11px]">
                            {isExecutive ? (
                              <span className="text-slate-400">เข้าใช้งานได้ทุกอุปกรณ์</span>
                            ) : emp.hwid ? (
                              <div className="flex items-center gap-1.5">
                                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" /> ผูกติดเครื่องแล้ว
                                </span>
                                <button
                                  onClick={() => handleResetHWID(emp.id, emp.full_name)}
                                  className="text-[10px] text-blue-600 underline hover:text-blue-800"
                                  title="ปลดล็อกให้อนุญาตลงชื่อเข้าใช้เครื่องใหม่ได้"
                                >
                                  (รีเซ็ต)
                                </button>
                              </div>
                            ) : (
                              <span className="text-amber-600 font-semibold">ยังไม่ผูกเครื่อง</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right">
                            {!isExecutive ? (
                              <button
                                onClick={() => handleDeleteEmployee(emp.id, emp.employee_code, emp.full_name)}
                                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-800 border border-rose-200 transition-colors inline-flex items-center gap-1 text-[11px] font-bold"
                                title="ลบบัญชีพนักงานออกจากระบบ"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>ลบ</span>
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">ผู้บริหารสูงสุด</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-400">
                        ไม่พบข้อมูลพนักงานในระบบ
                      </td>
                    </tr>
                  )}
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
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm space-y-6 max-w-4xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-blue-600" />
                  <span>การตั้งค่าพิกัดร้าน & แผนที่ Geofencing (Interactive Map)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  คลิกบนแผนที่, ลากหมุด หรือกดปุ่มพิกัดปัจจุบัน เพื่อกำหนดตำแหน่งร้านสำหรับตรวจจับการเช็คอินของพนักงาน
                </p>
              </div>
              <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-full w-fit flex items-center gap-1.5 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                <span>ระบบแผนที่ดาวเทียมพร้อมใช้งาน</span>
              </span>
            </div>

            {settingsMsg && (
              <div className={`p-3.5 rounded-2xl text-xs font-bold ${
                settingsMsg.includes('สำเร็จ')
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border border-rose-200 text-rose-800'
              }`}>
                {settingsMsg}
              </div>
            )}

            {/* Interactive Map Picker Component */}
            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-800 flex items-center justify-between">
                <span>🗺️ เลือกพิกัดร้านบนแผนที่ (Interactive Map):</span>
                <span className="text-slate-400 font-normal text-[11px]">คลิกเพื่อปักหมุด หรือลากหมุดไปยังตำแหน่งจริง</span>
              </label>

              <StoreMapPicker
                lat={parseFloat(storeSettingsForm.store_lat) || 13.7563}
                lng={parseFloat(storeSettingsForm.store_lng) || 100.5018}
                radius={parseInt(storeSettingsForm.radius_meters) || 50}
                storeName={storeSettingsForm.store_name || 'สาขา YOKOHAMA NAYA COSMIS'}
                onChange={(newLat, newLng) => {
                  setStoreSettingsForm((prev: any) => ({
                    ...prev,
                    store_lat: newLat,
                    store_lng: newLng,
                  }));
                }}
              />
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs font-bold pt-2 border-t border-slate-100">
              <div>
                <label className="block text-slate-700 mb-1">ชื่อร้าน / สาขา:</label>
                <input
                  type="text"
                  value={storeSettingsForm.store_name || ''}
                  onChange={(e) => setStoreSettingsForm({ ...storeSettingsForm, store_name: e.target.value })}
                  placeholder="เช่น สาขาหลัก YOKOHAMA NAYA COSMIS"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 mb-1 flex items-center justify-between">
                    <span>ละติจูด (Lat):</span>
                    <span className="text-[10px] text-slate-400 font-normal">อัปเดตอัตโนมัติตามแผนที่</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={storeSettingsForm.store_lat ?? ''}
                    onChange={(e) => setStoreSettingsForm({ ...storeSettingsForm, store_lat: parseFloat(e.target.value) || 0 })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 flex items-center justify-between">
                    <span>ลองจิจูด (Lng):</span>
                    <span className="text-[10px] text-slate-400 font-normal">อัปเดตอัตโนมัติตามแผนที่</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={storeSettingsForm.store_lng ?? ''}
                    onChange={(e) => setStoreSettingsForm({ ...storeSettingsForm, store_lng: parseFloat(e.target.value) || 0 })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-700">รัศมีที่อนุญาตให้เช็คอิน (เมตร):</label>
                    <span className="text-blue-600 font-mono font-black">{storeSettingsForm.radius_meters || 50} เมตร</span>
                  </div>
                  <input
                    type="number"
                    min={10}
                    max={2000}
                    value={storeSettingsForm.radius_meters || 50}
                    onChange={(e) => setStoreSettingsForm({ ...storeSettingsForm, radius_meters: Number(e.target.value) })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                    required
                  />
                  <p className="text-[10px] text-slate-400 font-medium mt-1">
                    แนะนำ 50-100 เมตร เพื่อรองรับความคลาดเคลื่อน GPS ของมือถือพนักงาน
                  </p>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-700">เบี้ยเลี้ยงตรงเวลาต่อวัน (บาท):</label>
                    <span className="text-amber-600 font-mono font-black">{storeSettingsForm.allowance_amount || 50} ฿</span>
                  </div>
                  <input
                    type="number"
                    min={0}
                    value={storeSettingsForm.allowance_amount || 50}
                    onChange={(e) => setStoreSettingsForm({ ...storeSettingsForm, allowance_amount: Number(e.target.value) })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                    required
                  />
                  <p className="text-[10px] text-slate-400 font-medium mt-1">
                    จ่ายอัตโนมัติเมื่อเช็คอินตรงเวลาภายในเส้นตาย 08:00 น.
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={settingsLoading}
                className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-black text-sm shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
              >
                {settingsLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>กำลังบันทึกข้อมูลพิกัดลงฐานข้อมูล...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>บันทึกการตั้งค่าพิกัดร้าน & กฎเวลาเข้างาน</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </main>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: ADD EMPLOYEE                                           */}
      {/* ------------------------------------------------------------- */}
      {showAddEmpModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 sm:p-7 rounded-3xl bg-white border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">
                    เพิ่มพนักงานใหม่ (Add Staff)
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">บันทึกข้อมูลเข้าฐานข้อมูล Supabase ทันที</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddEmpModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-xs"
              >
                ✕
              </button>
            </div>

            {empModalMsg && (
              <div className={`p-3 rounded-xl text-xs font-bold ${
                empModalMsg.includes('สำเร็จ')
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border border-rose-200 text-rose-800'
              }`}>
                {empModalMsg}
              </div>
            )}

            <form onSubmit={handleCreateEmployee} className="space-y-3.5 text-xs font-bold">
              <div>
                <label className="block text-slate-700 mb-1">
                  รหัสพนักงาน (Employee Code): <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newEmpCode}
                  onChange={(e) => setNewEmpCode(e.target.value.toUpperCase())}
                  placeholder="เช่น EMP001, EMP002, TECH01"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">
                  ชื่อ-นามสกุล (Full Name): <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="เช่น สมชาย ใจดี"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1">ชื่อเล่น (Nickname):</label>
                  <input
                    type="text"
                    value={newNickname}
                    onChange={(e) => setNewNickname(e.target.value)}
                    placeholder="เช่น ชาย, โต้ง, บอย"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1">
                    รหัส PIN 4 หลัก: <span className="text-rose-500">*</span>
                  </label>
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

              <div>
                <label className="block text-slate-700 mb-1">ระดับสิทธิ์ / ตำแหน่ง (Role):</label>
                <select
                  value={newRole}
                  onChange={(e: any) => setNewRole(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 font-medium"
                >
                  <option value="STAFF">👷 พนักงานปฏิบัติการ (STAFF - ตอกบัตร/รับเบี้ยเลี้ยง 50฿)</option>
                  <option value="SUPERVISOR">👨‍🔧 หัวหน้างาน / ช่างใหญ่ (SUPERVISOR - ตอกบัตร/เบี้ยเลี้ยง 50฿)</option>
                  <option value="ADMIN">👑 ผู้บริหาร (EXECUTIVE - สิทธิ์พิเศษ ไม่ต้องลงเวลา)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={empModalLoading}
                className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md shadow-blue-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {empModalLoading ? (
                  <span>กำลังบันทึกลง Supabase...</span>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>บันทึกและสร้างบัญชีพนักงาน</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
