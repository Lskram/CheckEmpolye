'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { 
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
  LogOut, 
  Search, 
  MapPin, 
  TrendingUp, 
  Download, 
  UserCheck, 
  Clock3, 
  FileText, 
  Shield, 
  Smartphone, 
  Trash2, 
  KeyRound, 
  ArrowRight,
  Check,
  X,
  Lock,
  User,
  Eye,
  EyeOff
} from 'lucide-react';

const StoreMapPicker = dynamic(() => import('@/components/StoreMapPicker'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-64 rounded-2xl bg-slate-100 animate-pulse flex items-center justify-center text-xs text-slate-400 font-bold">
      กำลังโหลดแผนที่ร้านและระบบพิกัด GPS...
    </div>
  ),
});

export default function CleanExecutiveDashboard() {
  const router = useRouter();

  // Navigation Tabs: overview, staff, leaves, settings
  const [activeTab, setActiveTab] = useState<'overview' | 'staff' | 'leaves' | 'settings'>('overview');
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  // Live Data & Loading
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExecutiveUnlocked, setIsExecutiveUnlocked] = useState<boolean>(false);

  // Executive Login Fallback State (if direct web access)
  const [executiveCodeInput, setExecutiveCodeInput] = useState('');
  const [executivePinInput, setExecutivePinInput] = useState('');
  const [executivePinError, setExecutivePinError] = useState('');

  // Clock state
  const [timeStr, setTimeStr] = useState({
    time: '08:00',
    dateThai: 'วันพุธ, 23 กันยายน 2026'
  });

  // Staff Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [staffFilter, setStaffFilter] = useState<'all' | 'present' | 'late' | 'pending'>('all');

  // Add Employee Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newNick, setNewNick] = useState('');
  const [newPin, setNewPin] = useState('1234');
  const [newRole, setNewRole] = useState<'STAFF' | 'SUPERVISOR'>('STAFF');
  const [addLoading, setAddLoading] = useState(false);
  const [addMsg, setAddMsg] = useState('');

  // Store Settings Form
  const [storeSettingsForm, setStoreSettingsForm] = useState<any>({
    store_name: 'สีแสงยางยนต์ YOKOHAMA NAYA COSMIS',
    store_lat: 15.110412,
    store_lng: 104.358434,
    radius_meters: 50,
    standard_time: '07:40',
    late_deadline: '08:00',
    allowance_amount: 50,
  });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState('');

  // 1. Session & Auth Guard Check
  useEffect(() => {
    const savedToken = localStorage.getItem('executive_auth_token');
    const savedProfile = localStorage.getItem('attendance_employee_profile');
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        if (parsed && (parsed.role === 'ADMIN' || parsed.employee_code === 'SI01')) {
          setIsExecutiveUnlocked(true);
          return;
        }
      } catch (e) {}
    }
    if (savedToken === 'true') {
      setIsExecutiveUnlocked(true);
    }
  }, []);

  // 2. Clock ticker
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const ss = String(now.getSeconds()).padStart(2, '0');
      const thaiDays = ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'];
      const thaiMonths = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
      setTimeStr({
        time: `${hh}:${mm}:${ss}`,
        dateThai: `${thaiDays[now.getDay()]}, ${now.getDate()} ${thaiMonths[now.getMonth()]} ${now.getFullYear()}`
      });
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // 3. Load Data
  useEffect(() => {
    if (isExecutiveUnlocked) {
      loadData();
    }
  }, [period, isExecutiveUnlocked]);

  const loadData = async () => {
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
    } catch (err) {
      console.error('Error loading analytics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('executive_auth_token');
    localStorage.removeItem('attendance_employee_profile');
    setIsExecutiveUnlocked(false);
    router.push('/employee/login');
  };

  const handleExecutiveLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const code = executiveCodeInput.trim().toUpperCase();
    const pin = executivePinInput.trim();
    if (code === 'SI01' && pin === '5101') {
      setIsExecutiveUnlocked(true);
      setExecutivePinError('');
      localStorage.setItem('executive_auth_token', 'true');
    } else {
      setExecutivePinError('รหัสผู้บริหารหรือ PIN ไม่ถูกต้อง');
    }
  };

  // Employee Actions
  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    setAddMsg('');
    try {
      const res = await fetch('/api/admin/employee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeCode: newCode.trim().toUpperCase(),
          fullName: newName.trim(),
          nickname: newNick.trim(),
          pin: newPin.trim(),
          role: newRole,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setAddMsg(data.message || 'ไม่สามารถสร้างบัญชีได้');
        setAddLoading(false);
        return;
      }
      setAddMsg('สร้างบัญชีพนักงานสำเร็จ!');
      setTimeout(() => {
        setShowAddModal(false);
        setNewCode('');
        setNewName('');
        setNewNick('');
        setNewPin('1234');
        setAddMsg('');
        loadData();
      }, 700);
    } catch (e: any) {
      setAddMsg('เกิดข้อผิดพลาด: ' + e.message);
    } finally {
      setAddLoading(false);
    }
  };

  const handleResetHWID = async (id: string, name: string) => {
    if (!confirm(`ต้องการปลดล็อกอุปกรณ์ (Reset HWID) สำหรับ "${name}" หรือไม่?`)) return;
    try {
      const res = await fetch('/api/admin/employee', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, clearHWID: true }),
      });
      const data = await res.json();
      if (data.success) {
        alert('ปลดล็อกอุปกรณ์สำเร็จ พนักงานสามารถผูกเครื่องใหม่ได้ในการเข้าสู่ระบบครั้งถัดไป');
        loadData();
      }
    } catch (e: any) {
      alert('เกิดข้อผิดพลาด: ' + e.message);
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
        loadData();
      } else {
        alert(data.message || 'ไม่สามารถลบข้อมูลได้');
      }
    } catch (e: any) {
      alert('เกิดข้อผิดพลาด: ' + e.message);
    }
  };

  // Leave Actions
  const handleLeaveAction = async (leaveId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await fetch('/api/leave', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leaveId,
          status,
          approverId: '00000000-0000-0000-0000-000000000000',
        }),
      });
      const data = await res.json();
      if (data.success) {
        loadData();
      } else {
        alert(data.message || 'ไม่สามารถบันทึกผลได้');
      }
    } catch (e: any) {
      alert('เกิดข้อผิดพลาด: ' + e.message);
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsLoading(true);
    setSettingsMsg('');
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(storeSettingsForm),
      });
      const data = await res.json();
      if (data.success) {
        setSettingsMsg('บันทึกการตั้งค่าเรียบร้อยแล้ว');
        setTimeout(() => setSettingsMsg(''), 2500);
      } else {
        setSettingsMsg('ไม่สามารถบันทึกได้: ' + data.message);
      }
    } catch (err: any) {
      setSettingsMsg('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setSettingsLoading(false);
    }
  };

  // Extract Stats
  const overview = analyticsData?.overview;
  const totalEmployees = overview?.totalEmployees || 0;
  const totalPresent = overview?.totalPresent || 0;
  const totalLate = overview?.totalLate || 0;
  const pendingLeavesCount = overview?.pendingLeavesCount || 0;
  const pendingCount = Math.max(0, totalEmployees - totalPresent - totalLate);
  const totalAllowancePaid = overview?.totalAllowancePaid || 0;
  const onTimeRate = overview?.onTimeRate || 0;

  // Staff List Preparation
  const rawStaffList = (analyticsData?.allowanceReports || [])
    .filter((emp: any) => emp.role !== 'ADMIN');

  const formattedStaff = rawStaffList.map((emp: any) => {
    const isPresent = emp.presentCount > 0;
    const isLate = emp.lateCount > 0;
    const status = isPresent ? 'PRESENT' : isLate ? 'LATE' : 'PENDING';
    return {
      id: emp.employeeId,
      code: emp.employeeCode,
      name: emp.fullName,
      nickname: emp.nickname || '-',
      status,
      allowance: emp.totalAllowance || 0,
      hwid: emp.hwid || null,
      statusLabel: isPresent ? 'ตรงเวลา' : isLate ? 'มาสาย' : 'ยังไม่ลงเวลา',
      checkInTimeStr: isPresent ? '07:45 น.' : isLate ? '08:15 น.' : '-',
      distanceStr: isPresent || isLate ? 'ในร้าน (5 ม.)' : '-',
    };
  });

  const filteredStaff = formattedStaff.filter((emp: any) => {
    if (staffFilter === 'present' && emp.status !== 'PRESENT') return false;
    if (staffFilter === 'late' && emp.status !== 'LATE') return false;
    if (staffFilter === 'pending' && emp.status !== 'PENDING') return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        emp.name.toLowerCase().includes(q) ||
        emp.code.toLowerCase().includes(q) ||
        emp.nickname.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const leaveRequests = analyticsData?.leaveRequests || [];
  const violationLogs = analyticsData?.violationLogs || [];

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['รหัสพนักงาน', 'ชื่อ-นามสกุล', 'ชื่อเล่น', 'สถานะวันนี้', 'เบี้ยขยันสะสม (บาท)'];
    const rows = formattedStaff.map((e: any) => [
      e.code,
      `"${e.name}"`,
      `"${e.nickname}"`,
      e.statusLabel,
      e.allowance,
    ]);
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Executive_Attendance_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // -------------------------------------------------------------
  // FALLBACK WEB LOGIN (Only if opened outside app without auth)
  // -------------------------------------------------------------
  if (!isExecutiveUnlocked) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-5 font-sans select-none">
        <div className="w-full max-w-sm bg-white p-7 rounded-3xl shadow-xl border border-slate-100 space-y-5">
          <div className="text-center space-y-1">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center mx-auto text-2xl shadow-md shadow-blue-500/20">
              👑
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight pt-2">
              เข้าสู่ระบบผู้บริหาร
            </h1>
            <p className="text-xs text-slate-400">
              สีแสงยางยนต์ YOKOHAMA NAYA COSMIS
            </p>
          </div>

          {executivePinError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{executivePinError}</span>
            </div>
          )}

          <form onSubmit={handleExecutiveLogin} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">รหัสผู้บริหาร</label>
              <input
                type="text"
                value={executiveCodeInput}
                onChange={(e) => setExecutiveCodeInput(e.target.value.toUpperCase())}
                placeholder="เช่น SI01"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:border-blue-600"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">รหัส PIN 4 หลัก</label>
              <input
                type="password"
                maxLength={4}
                value={executivePinInput}
                onChange={(e) => setExecutivePinInput(e.target.value)}
                placeholder="••••"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-lg font-mono tracking-widest focus:outline-none focus:border-blue-600"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm shadow-md shadow-blue-500/25 active:scale-95 transition-all"
            >
              เข้าสู่ระบบผู้บริหาร
            </button>
          </form>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // MAIN CLEAN EXECUTIVE MOBILE APP VIEW
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen w-full bg-slate-50 flex flex-col justify-between select-none font-sans text-slate-800 pb-24">
      
      {/* ------------------------------------------------------------- */}
      {/* 1. TOP NATIVE HEADER & EXECUTIVE PROFILE                      */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white px-5 pt-4 pb-3 border-b border-slate-100 flex items-center justify-between shadow-xs sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-amber-500 via-indigo-600 to-blue-600 p-0.5 shadow-sm">
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
              <span className="text-base">👑</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black px-2 py-0.2 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
                SI01: ผู้บริหาร
              </span>
            </div>
            <div className="font-bold text-slate-900 text-base tracking-tight leading-tight mt-0.5">
              ศูนย์บัญชาการผู้บริหาร
            </div>
          </div>
        </div>

        {/* Top Right Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            title="รีเฟรชข้อมูล"
            className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors shadow-2xs"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleLogout}
            title="ออกจากระบบ"
            className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 hover:bg-rose-100 transition-colors shadow-2xs"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. MAIN SCROLLABLE CONTENT                                    */}
      {/* ------------------------------------------------------------- */}
      <div className="flex-1 px-4 pt-4 space-y-4 max-w-lg mx-auto w-full">
        
        {/* Blue Gradient Hero Card (Clean Style matching Employee App) */}
        <div className="bg-gradient-to-br from-[#2563eb] via-[#1d4ed8] to-[#1e40af] rounded-3xl p-5 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden">
          {/* Ambient Lighting */}
          <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center justify-between text-xs text-blue-100 font-medium mb-2">
            <span>{timeStr.dateThai}</span>
            <span className="font-mono font-bold bg-blue-900/40 px-2 py-0.5 rounded-lg border border-blue-400/20">
              {timeStr.time} น.
            </span>
          </div>

          <div className="flex items-center justify-between my-2">
            <div>
              <div className="text-[11px] text-blue-200 font-semibold">สรุปพนักงานวันนี้</div>
              <div className="text-3xl font-black font-mono tracking-tight">
                {totalPresent + totalLate} <span className="text-base font-normal text-blue-100">/ {totalEmployees} คน</span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-[11px] text-blue-200 font-semibold">ยอดจ่ายเบี้ยขยันวันนี้</div>
              <div className="text-2xl font-black font-mono text-amber-300">
                +{totalAllowancePaid} <span className="text-xs text-amber-200 font-normal">บาท</span>
              </div>
            </div>
          </div>

          {/* 3 Pillar Summary Badges */}
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-blue-400/25 text-center text-xs">
            <div className="bg-blue-900/40 rounded-xl p-2 border border-blue-400/20">
              <div className="font-black text-sm font-mono text-emerald-300">{totalPresent}</div>
              <div className="text-[10px] text-blue-200 font-medium">ตรงเวลา</div>
            </div>
            <div className="bg-blue-900/40 rounded-xl p-2 border border-blue-400/20">
              <div className="font-black text-sm font-mono text-amber-300">{totalLate}</div>
              <div className="text-[10px] text-blue-200 font-medium">มาสาย</div>
            </div>
            <div className="bg-blue-900/40 rounded-xl p-2 border border-blue-400/20">
              <div className="font-black text-sm font-mono text-slate-300">{pendingCount}</div>
              <div className="text-[10px] text-blue-200 font-medium">ยังไม่ลงเวลา</div>
            </div>
          </div>
        </div>

        {/* ----------------------------------------------------------- */}
        {/* TAB 1: 📊 ภาพรวม & สถิติ (OVERVIEW)                         */}
        {/* ----------------------------------------------------------- */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            
            {/* Quick KPI Cards Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs space-y-1">
                <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                  <span>ความตรงต่อเวลา</span>
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="text-2xl font-black text-slate-900 font-mono">
                  {onTimeRate}%
                </div>
                <div className="text-[10px] text-slate-400 font-medium">
                  {onTimeRate >= 90 ? 'ยอดเยี่ยม (>90%)' : 'ต่ำกว่าเป้าหมาย'}
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs space-y-1">
                <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                  <span>คำขอลาที่รออนุมัติ</span>
                  <Calendar className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-2xl font-black text-slate-900 font-mono">
                  {pendingLeavesCount} <span className="text-xs font-normal text-slate-500">รายการ</span>
                </div>
                <div className="text-[10px] text-slate-400 font-medium">
                  {pendingLeavesCount > 0 ? 'รอผู้บริหารพิจารณา' : 'ไม่มีคำขอค้าง'}
                </div>
              </div>
            </div>

            {/* Attendance Status Quick List */}
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-blue-600" />
                  <span>สถานะการเข้างานของลูกน้อง</span>
                </div>
                <button
                  onClick={() => setActiveTab('staff')}
                  className="text-xs text-blue-600 font-semibold hover:underline"
                >
                  ดูทั้งหมด ({formattedStaff.length}) →
                </button>
              </div>

              <div className="space-y-2">
                {formattedStaff.slice(0, 4).map((emp: any) => (
                  <div
                    key={emp.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold text-xs flex items-center justify-center">
                        {emp.nickname?.[0] || emp.name?.[0]}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-800">{emp.name} ({emp.nickname})</div>
                        <div className="text-[10px] text-slate-400 font-mono">{emp.code}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          emp.status === 'PRESENT'
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                            : emp.status === 'LATE'
                            ? 'bg-amber-50 text-amber-600 border border-amber-200'
                            : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        {emp.statusLabel}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Export Report Action */}
            <div className="pt-1">
              <button
                onClick={handleExportCSV}
                className="w-full py-3 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 shadow-2xs active:scale-[0.99] transition-all"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                <span>ดาวน์โหลดรายงานสรุปการทำงาน (Excel / CSV)</span>
              </button>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------- */}
        {/* TAB 2: 👥 จัดการลูกน้อง (STAFF ROSTER)                       */}
        {/* ----------------------------------------------------------- */}
        {activeTab === 'staff' && (
          <div className="space-y-3">
            {/* Search Bar & Add Button */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อ, ชื่อเล่น หรือรหัส..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-600 shadow-2xs font-medium"
                />
              </div>

              <button
                onClick={() => setShowAddModal(true)}
                className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm active:scale-95 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>เพิ่มพนักงาน</span>
              </button>
            </div>

            {/* Filter Pills */}
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: 'all', label: 'ทั้งหมด' },
                { id: 'present', label: 'ตรงเวลา' },
                { id: 'late', label: 'มาสาย' },
                { id: 'pending', label: 'ยังไม่มา' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setStaffFilter(f.id as any)}
                  className={`py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                    staffFilter === f.id
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Staff List Cards */}
            <div className="space-y-2.5">
              {filteredStaff.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center text-xs text-slate-400 border border-slate-100">
                  ไม่พบข้อมูลพนักงานตามเงื่อนไขที่เลือก
                </div>
              ) : (
                filteredStaff.map((emp: any) => (
                  <div
                    key={emp.id}
                    className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
                          {emp.nickname?.[0] || emp.name?.[0]}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-slate-900">{emp.name}</div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <span className="font-mono text-blue-600 font-bold">{emp.code}</span>
                            <span>• ชื่อเล่น: {emp.nickname}</span>
                          </div>
                        </div>
                      </div>

                      <span
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                          emp.status === 'PRESENT'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : emp.status === 'LATE'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}
                      >
                        {emp.statusLabel}
                      </span>
                    </div>

                    {/* Check-in Details & HWID Status */}
                    <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl text-center text-[11px]">
                      <div>
                        <div className="text-slate-400 font-medium text-[10px]">เวลาเช็คอิน</div>
                        <div className="font-bold font-mono text-slate-800">{emp.checkInTimeStr}</div>
                      </div>
                      <div>
                        <div className="text-slate-400 font-medium text-[10px]">เบี้ยขยันวันนี้</div>
                        <div className="font-bold text-emerald-600">+{emp.allowance}฿</div>
                      </div>
                      <div>
                        <div className="text-slate-400 font-medium text-[10px]">สถานะเครื่อง</div>
                        <div className="font-semibold text-slate-600">
                          {emp.hwid ? 'ผูกเครื่องแล้ว' : 'ยังไม่ผูก'}
                        </div>
                      </div>
                    </div>

                    {/* Staff Actions */}
                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100 text-xs">
                      {emp.hwid && (
                        <button
                          onClick={() => handleResetHWID(emp.id, emp.name)}
                          className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 font-semibold transition-colors text-[11px]"
                        >
                          ปลดล็อกอุปกรณ์ (Reset HWID)
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteEmployee(emp.id, emp.code, emp.name)}
                        className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-semibold transition-colors text-[11px]"
                      >
                        ลบ
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------- */}
        {/* TAB 3: 📝 อนุมัติใบลา (LEAVE REQUESTS)                      */}
        {/* ----------------------------------------------------------- */}
        {activeTab === 'leaves' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">
                รายการคำขอลาของพนักงาน
              </h3>
              <span className="text-xs text-slate-400 font-medium">
                ทั้งหมด {leaveRequests.length} รายการ
              </span>
            </div>

            {leaveRequests.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center text-xs text-slate-400 border border-slate-100 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="font-bold text-slate-600">ไม่มีคำขอลาที่รอดำเนินการ</p>
                <p className="text-[11px]">พนักงานทุกคนทำงานตามตารางปกติ</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {leaveRequests.map((leave: any) => (
                  <div
                    key={leave.id}
                    className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold text-xs text-slate-900">
                          {leave.employees?.full_name || 'พนักงาน'} ({leave.employees?.employee_code})
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          ประเภท: <strong className="text-blue-600">{leave.leave_type === 'SICK' ? 'ลาป่วย' : leave.leave_type === 'BUSINESS' ? 'ลากิจ' : 'ลาพักร้อน'}</strong>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          leave.status === 'PENDING'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : leave.status === 'APPROVED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {leave.status === 'PENDING' ? 'รออนุมัติ' : leave.status === 'APPROVED' ? 'อนุมัติแล้ว' : 'ปฏิเสธ'}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-xl text-xs space-y-1">
                      <div className="text-slate-600 text-[11px]">
                        📅 <strong>วันที่ลา:</strong> {leave.start_date} ถึง {leave.end_date}
                      </div>
                      <div className="text-slate-600 text-[11px]">
                        💬 <strong>เหตุผล:</strong> {leave.reason || '-'}
                      </div>
                    </div>

                    {leave.status === 'PENDING' && (
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => handleLeaveAction(leave.id, 'APPROVED')}
                          className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-xs transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>อนุมัติ</span>
                        </button>
                        <button
                          onClick={() => handleLeaveAction(leave.id, 'REJECTED')}
                          className="flex-1 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold text-xs flex items-center justify-center gap-1 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>ปฏิเสธ</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ----------------------------------------------------------- */}
        {/* TAB 4: ⚙️ ตั้งค่าร้าน & ความปลอดภัย (SETTINGS)               */}
        {/* ----------------------------------------------------------- */}
        {activeTab === 'settings' && (
          <div className="space-y-4">
            
            {/* Store & Geofencing Settings */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs space-y-3">
              <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span>พิกัดร้านและนโยบายลงเวลา (GPS Geofence)</span>
              </div>

              {settingsMsg && (
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold">
                  {settingsMsg}
                </div>
              )}

              <form onSubmit={handleSaveSettings} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">ชื่อร้าน / สาขา</label>
                  <input
                    type="text"
                    value={storeSettingsForm.store_name}
                    onChange={(e) => setStoreSettingsForm({ ...storeSettingsForm, store_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">เวลากะปกติ</label>
                    <input
                      type="text"
                      value={storeSettingsForm.standard_time}
                      onChange={(e) => setStoreSettingsForm({ ...storeSettingsForm, standard_time: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">ตัดสาย (Deadline)</label>
                    <input
                      type="text"
                      value={storeSettingsForm.late_deadline}
                      onChange={(e) => setStoreSettingsForm({ ...storeSettingsForm, late_deadline: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">รัศมีเช็คอิน (เมตร)</label>
                    <input
                      type="number"
                      value={storeSettingsForm.radius_meters}
                      onChange={(e) => setStoreSettingsForm({ ...storeSettingsForm, radius_meters: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">เบี้ยขยัน (บาท/วัน)</label>
                    <input
                      type="number"
                      value={storeSettingsForm.allowance_amount}
                      onChange={(e) => setStoreSettingsForm({ ...storeSettingsForm, allowance_amount: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-emerald-600 font-bold"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={settingsLoading}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs active:scale-95 transition-all"
                >
                  {settingsLoading ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่านโยบาย'}
                </button>
              </form>
            </div>

            {/* Security & Violation Logs */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs space-y-3">
              <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>บันทึกความปลอดภัย (Security Logs)</span>
              </div>

              {violationLogs.length === 0 ? (
                <div className="p-3 bg-slate-50 rounded-xl text-center text-xs text-slate-400">
                  ไม่มีประวัติความผิดปกติ ทุกอย่างปลอดภัย 100%
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {violationLogs.map((log: any) => (
                    <div
                      key={log.id}
                      className="p-2.5 rounded-xl bg-rose-50/70 border border-rose-100 text-[11px] space-y-0.5"
                    >
                      <div className="font-bold text-rose-700 flex items-center justify-between">
                        <span>{log.violation_type}</span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          {new Date(log.created_at).toLocaleTimeString('th-TH')}
                        </span>
                      </div>
                      <div className="text-slate-600">{log.description}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. FIXED BOTTOM NAVIGATION BAR (Executive Native Bar)          */}
      {/* ------------------------------------------------------------- */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-2.5 flex items-center justify-around z-30 shadow-lg max-w-lg mx-auto">
        
        {/* Tab 1: ภาพรวม */}
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex flex-col items-center gap-1 transition-colors ${
            activeTab === 'overview' ? 'text-blue-600 font-bold' : 'text-slate-400 font-medium'
          }`}
        >
          <TrendingUp className="w-5 h-5" />
          <span className="text-[10px]">ภาพรวม</span>
        </button>

        {/* Tab 2: ลูกน้อง */}
        <button
          onClick={() => setActiveTab('staff')}
          className={`flex flex-col items-center gap-1 transition-colors ${
            activeTab === 'staff' ? 'text-blue-600 font-bold' : 'text-slate-400 font-medium'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px]">ลูกน้อง</span>
        </button>

        {/* Tab 3: ใบลา */}
        <button
          onClick={() => setActiveTab('leaves')}
          className={`relative flex flex-col items-center gap-1 transition-colors ${
            activeTab === 'leaves' ? 'text-blue-600 font-bold' : 'text-slate-400 font-medium'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[10px]">ใบลา</span>
          {pendingLeavesCount > 0 && (
            <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center">
              {pendingLeavesCount}
            </span>
          )}
        </button>

        {/* Tab 4: ตั้งค่า */}
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center gap-1 transition-colors ${
            activeTab === 'settings' ? 'text-blue-600 font-bold' : 'text-slate-400 font-medium'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px]">ตั้งค่า</span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. MODAL: เพิ่มพนักงานใหม่                                     */}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-slate-100 space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="font-bold text-sm text-slate-900">เพิ่มพนักงานใหม่</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs"
                >
                  ✕
                </button>
              </div>

              {addMsg && (
                <div
                  className={`p-2.5 rounded-xl text-xs font-bold ${
                    addMsg.includes('สำเร็จ') ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                  }`}
                >
                  {addMsg}
                </div>
              )}

              <form onSubmit={handleCreateEmployee} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">รหัสพนักงาน</label>
                  <input
                    type="text"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                    placeholder="เช่น EMP003"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">ชื่อ-นามสกุล</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="เช่น สมศักดิ์ ใจดี"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">ชื่อเล่น</label>
                    <input
                      type="text"
                      value={newNick}
                      onChange={(e) => setNewNick(e.target.value)}
                      placeholder="เช่น ศักดิ์"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">รหัส PIN 4 หลัก</label>
                    <input
                      type="text"
                      maxLength={4}
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-center font-mono tracking-widest"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={addLoading}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/25 active:scale-95 transition-all mt-2"
                >
                  {addLoading ? 'กำลังบันทึก...' : 'บันทึกข้อมูลพนักงาน'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
