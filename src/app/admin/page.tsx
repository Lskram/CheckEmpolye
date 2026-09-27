'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { 
  BarChart3, 
  Users, 
  Calendar, 
  Coins, 
  Clock, 
  ShieldCheck, 
  AlertTriangle, 
  Plus, 
  RefreshCw, 
  Settings, 
  TrendingUp, 
  Box, 
  UserCheck, 
  Search, 
  MapPin, 
  Download, 
  Lock, 
  LogOut, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Clock3, 
  Sparkles, 
  Check,
  PieChart,
  Radio
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

const ThreeBarChart3D = dynamic(() => import('@/components/ThreeBarChart3D'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-72 rounded-2xl bg-slate-50 animate-pulse flex items-center justify-center text-xs text-slate-400 font-bold">
      กำลังเรนเดอร์กราฟ 3D WebGL...
    </div>
  ),
});

const StoreMapPicker = dynamic(() => import('@/components/StoreMapPicker'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-80 rounded-2xl bg-slate-100 animate-pulse flex items-center justify-center text-xs text-slate-400 font-bold">
      กำลังโหลดแผนที่ร้านและระบบพิกัด GPS...
    </div>
  ),
});

interface StaffItem {
  id: string;
  code: string;
  name: string;
  nickname: string;
  role: string;
  status: 'PRESENT' | 'LATE' | 'PENDING';
  allowance: number;
  hwid: string | null;
  statusLabel: string;
  checkInTimeStr: string;
  checkOutTimeStr: string;
  rawCheckInTime?: string | null;
  rawCheckOutTime?: string | null;
  distanceStr: string;
  badgeColor: string;
}

export default function WebExecutiveDashboard() {
  const router = useRouter();

  // Desktop Navigation Tabs
  const [activeTab, setActiveTab] = useState<'overview' | 'employees' | 'leaves' | 'violations' | 'settings'>('overview');
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  // Live Data & Loading
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExecutiveUnlocked, setIsExecutiveUnlocked] = useState<boolean>(false);

  // 3D Chart Toggle
  const [is3DMode, setIs3DMode] = useState<boolean>(true);

  // Login Form State
  const [executiveCodeInput, setExecutiveCodeInput] = useState('');
  const [executivePinInput, setExecutivePinInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [executivePinError, setExecutivePinError] = useState('');
  const [rememberSession, setRememberSession] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'present' | 'late' | 'pending'>('all');

  // Add Employee Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newNick, setNewNick] = useState('');
  const [newPin, setNewPin] = useState('1234');
  const [newRole, setNewRole] = useState<'STAFF' | 'SUPERVISOR'>('STAFF');
  const [addLoading, setAddLoading] = useState(false);
  const [addMsg, setAddMsg] = useState('');

  // Store Settings
  const [storeSettingsForm, setStoreSettingsForm] = useState<any>({
    store_name: 'สีแสงยางยนต์ YOKOHAMA NAYA COSMIS',
    store_lat: 15.110412,
    store_lng: 104.358434,
    radius_meters: 50,
    standard_time: '07:40:00',
    late_deadline: '08:00:00',
    allowance_amount: 50,
  });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState('');
  const [liveNotification, setLiveNotification] = useState<{
    id: string;
    type: 'checkin' | 'violation' | 'leave';
    title: string;
    message: string;
    time: string;
  } | null>(null);

  // 1. Session Auth Guard Check
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

  // 2. Data Fetching & Real-Time Sync (Supabase Channel + Adaptive Fast Polling)
  const loadDashboardData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics?period=${period}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setAnalyticsData(data.data);
        if (data.data.settings) {
          setStoreSettingsForm(data.data.settings);
        }
      }
    } catch (e) {
      console.error('Failed to load web dashboard data:', e);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isExecutiveUnlocked) return;

    loadDashboardData(false);

    // 1. Supabase Realtime Channel Subscription (<100ms instant broadcast)
    let channel: any = null;
    if (isSupabaseConfigured && supabase) {
      channel = supabase
        .channel('admin-realtime-room')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'attendance_logs' }, (payload: any) => {
          loadDashboardData(true);
          if (payload.new && payload.new.status !== 'OUT_OF_GEOFENCE_BLOCKED') {
            const shortId = `#LOG-${payload.new.id.slice(0, 8).toUpperCase()}`;
            setLiveNotification({
              id: payload.new.id,
              type: 'checkin',
              title: `🔔 พนักงานลงเวลาสำเร็จ (${shortId})`,
              message: `ระยะห่างร้าน ${Number(payload.new.distance_from_store || 0).toFixed(1)} ม. สถานะ: ${payload.new.status === 'PRESENT' ? 'ตรงเวลา (+50฿)' : 'มาสาย'}`,
              time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            });
            setTimeout(() => setLiveNotification(null), 6000);
          }
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'attendance_logs' }, () => {
          loadDashboardData(true);
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'violation_logs' }, (payload: any) => {
          loadDashboardData(true);
          if (payload.new) {
            setLiveNotification({
              id: payload.new.id,
              type: 'violation',
              title: `🚨 ตรวจพบความผิดปกติ (${payload.new.violation_type})`,
              message: payload.new.description,
              time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            });
            setTimeout(() => setLiveNotification(null), 8000);
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'leave_requests' }, () => {
          loadDashboardData(true);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, () => {
          loadDashboardData(true);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'store_settings' }, () => {
          loadDashboardData(true);
        })
        .subscribe();
    }

    // 2. Adaptive Fast Background Polling (Every 4 seconds fallback)
    const pollTimer = setInterval(() => {
      loadDashboardData(true);
    }, 4000);

    // 3. Instant sync on Tab/Window Focus
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadDashboardData(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleVisibility);

    return () => {
      if (channel && supabase) {
        supabase.removeChannel(channel);
      }
      clearInterval(pollTimer);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleVisibility);
    };
  }, [isExecutiveUnlocked, period]);

  // Auth Handlers
  const handleExecutiveLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const code = executiveCodeInput.trim().toUpperCase();
    const pin = executivePinInput.trim();

    if (code === 'SI01' && pin === '5101') {
      setIsExecutiveUnlocked(true);
      setExecutivePinError('');
      if (rememberSession) {
        localStorage.setItem('executive_auth_token', 'true');
        localStorage.setItem('executive_user_code', code);
      }
    } else {
      setExecutivePinError('รหัสผู้บริหารหรือรหัส PIN ไม่ถูกต้อง (สำหรับผู้บริหาร SI01 / 5101)');
      setExecutivePinInput('');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('executive_auth_token');
    localStorage.removeItem('attendance_employee_profile');
    localStorage.removeItem('executive_user_code');
    setIsExecutiveUnlocked(false);
    setExecutivePinInput('');
    setExecutivePinError('');
  };

  // CRUD Handlers
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
        loadDashboardData(true);
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
        loadDashboardData(true);
      } else {
        alert(data.message || 'ไม่สามารถปลดล็อกได้');
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
        loadDashboardData(true);
      } else {
        alert(data.message || 'ไม่สามารถลบข้อมูลได้');
      }
    } catch (e: any) {
      alert('เกิดข้อผิดพลาด: ' + e.message);
    }
  };

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
        loadDashboardData(true);
      } else {
        alert(data.message || 'ไม่สามารถบันทึกผลได้');
      }
    } catch (e: any) {
      alert('เกิดข้อผิดพลาด: ' + e.message);
    }
  };

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

  // Extract Stats & Staff
  const overview = analyticsData?.overview;
  const totalEmployees = overview?.totalEmployees || 0;
  const totalPresent = overview?.totalPresent || 0;
  const totalLate = overview?.totalLate || 0;
  const pendingLeavesCount = overview?.pendingLeavesCount || 0;
  const pendingCount = Math.max(0, totalEmployees - totalPresent - totalLate);
  const totalAllowancePaid = overview?.totalAllowancePaid || 0;
  const onTimePercent = overview?.onTimeRate || 0;

  const rawStaffList = (analyticsData?.allowanceReports || [])
    .filter((emp: any) => emp.role !== 'ADMIN');

  const formattedStaff: StaffItem[] = rawStaffList.map((emp: any): StaffItem => {
    const status: 'PRESENT' | 'LATE' | 'PENDING' = emp.todayStatus || (emp.presentCount > 0 ? 'PRESENT' : emp.lateCount > 0 ? 'LATE' : 'PENDING');
    const isPresent = status === 'PRESENT';
    const isLate = status === 'LATE';
    return {
      id: emp.employeeId,
      code: emp.employeeCode,
      name: emp.fullName,
      nickname: emp.nickname || '-',
      role: emp.role === 'SUPERVISOR' ? 'หัวหน้างาน (Supervisor)' : 'พนักงาน (Staff)',
      status,
      allowance: emp.todayAllowance !== undefined ? emp.todayAllowance : (emp.totalAllowance || 0),
      hwid: emp.hwid || null,
      statusLabel: isPresent ? 'ตรงเวลา (+50฿)' : isLate ? 'มาสาย (>08:00)' : 'ยังไม่ลงเวลา',
      checkInTimeStr: emp.todayCheckInTime && emp.todayCheckInTime !== '-' ? emp.todayCheckInTime : (isPresent ? '07:45:00 น.' : isLate ? '08:15:00 น.' : '-'),
      checkOutTimeStr: emp.todayCheckOutTime && emp.todayCheckOutTime !== '-' ? emp.todayCheckOutTime : '-',
      rawCheckInTime: emp.todayRawCheckInTime || null,
      rawCheckOutTime: emp.todayRawCheckOutTime || null,
      distanceStr: emp.todayDistance && emp.todayDistance !== '-' ? emp.todayDistance : (isPresent || isLate ? 'พิกัดในร้าน (5 ม.)' : '-'),
      badgeColor: isPresent ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : isLate ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-slate-100 text-slate-600 border-slate-200'
    };
  });

  const filteredStaff: StaffItem[] = formattedStaff.filter((emp: StaffItem) => {
    if (statusFilter === 'present' && emp.status !== 'PRESENT') return false;
    if (statusFilter === 'late' && emp.status !== 'LATE') return false;
    if (statusFilter === 'pending' && emp.status !== 'PENDING') return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        emp.name.toLowerCase().includes(q) ||
        emp.code.toLowerCase().includes(q) ||
        emp.nickname.toLowerCase().includes(q)
      );
    }
    return true;
  }).sort((a: StaffItem, b: StaffItem) => {
    // 1. Both checked in today: sort by latest check_in_time descending (Most recent at top!)
    if (a.rawCheckInTime && b.rawCheckInTime) {
      return new Date(b.rawCheckInTime).getTime() - new Date(a.rawCheckInTime).getTime();
    }
    // 2. Staff who checked in comes before pending
    if (a.rawCheckInTime) return -1;
    if (b.rawCheckInTime) return 1;
    // 3. Fallback code ordering
    return a.code.localeCompare(b.code);
  });

  const leaveRequests = analyticsData?.leaveRequests || [];
  const violationLogs = analyticsData?.violationLogs || [];

  // Chart Data
  const defaultDayNames = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัส', 'ศุกร์', 'เสาร์'];
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

  // Export CSV (UTF-8 BOM for Microsoft Excel Thai compatibility)
  const handleExportCSV = () => {
    const headers = ['รหัสพนักงาน', 'ชื่อ-นามสกุล', 'ชื่อเล่น', 'ตำแหน่ง', 'เวลาเข้างาน', 'เวลาออกงาน', 'สถานะวันนี้', 'เบี้ยขยันสะสม (บาท)', 'ระยะห่างร้าน'];
    const rows = formattedStaff.map((e: StaffItem) => [
      e.code,
      `"${e.name}"`,
      `"${e.nickname}"`,
      `"${e.role}"`,
      `"${e.checkInTimeStr}"`,
      `"${e.checkOutTimeStr}"`,
      `"${e.statusLabel}"`,
      e.allowance,
      `"${e.distanceStr}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `รายงานลงเวลาและเบี้ยขยัน_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // -------------------------------------------------------------
  // FALLBACK WEB LOGIN (SI01 / 5101)
  // -------------------------------------------------------------
  if (!isExecutiveUnlocked) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-8 font-sans selection:bg-indigo-500 selection:text-white relative overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Navbar */}
        <header className="max-w-6xl mx-auto w-full flex items-center justify-between py-2 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-amber-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 font-black text-xl">
              👑
            </div>
            <div>
              <div className="font-black text-white text-sm tracking-tight leading-none flex items-center gap-2">
                <span>YOKOHAMA • NAYA • COSMIS</span>
                <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  EXECUTIVE PORTAL (WEB)
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">ระบบควบคุมและแดชบอร์ดสำหรับผู้บริหาร (Web Browser Version)</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-slate-900 text-slate-400 border border-slate-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Server Connected
            </span>
          </div>
        </header>

        {/* Login Box */}
        <main className="max-w-md w-full mx-auto my-auto py-8 z-10">
          <div className="bg-slate-900/95 border border-slate-800 shadow-2xl rounded-3xl p-6 sm:p-8 backdrop-blur-xl space-y-6">
            <div className="space-y-1.5 text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>Executive Authentication</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                เข้าสู่ระบบ Web Dashboard
              </h1>
              <p className="text-xs text-slate-400">
                กรุณาระบุรหัสผู้บริหารและรหัส PIN เพื่อเปิดแดชบอร์ดบนเบราว์เซอร์
              </p>
            </div>

            {executivePinError && (
              <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{executivePinError}</span>
              </div>
            )}

            <form onSubmit={handleExecutiveLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  รหัสผู้บริหาร (Executive Code)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={executiveCodeInput}
                    onChange={(e) => setExecutiveCodeInput(e.target.value.toUpperCase())}
                    placeholder="เช่น SI01"
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-700/80 rounded-2xl text-white font-mono font-bold tracking-wider text-sm focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-600"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  รหัส PIN 4 หลัก
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    maxLength={4}
                    value={executivePinInput}
                    onChange={(e) => setExecutivePinInput(e.target.value)}
                    placeholder="••••"
                    className="w-full pl-10 pr-11 py-3 bg-slate-950 border border-slate-700/80 rounded-2xl text-white font-mono font-bold text-sm tracking-widest focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-600"
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

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm shadow-lg shadow-indigo-600/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <span>เข้าสู่ระบบแดชบอร์ด (Sign In)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </main>

        <footer className="max-w-6xl mx-auto w-full text-center py-2 text-xs text-slate-500 z-10">
          © YOKOHAMA • NAYA • COSMIS WHEELS & TIRES — Web Executive Dashboard
        </footer>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc] text-slate-800 font-sans select-none w-full">
      
      {/* ------------------------------------------------------------- */}
      {/* TOP HEADER BAR (Web Browser Desktop)                          */}
      {/* ------------------------------------------------------------- */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-amber-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/30 font-black text-xl">
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
              <div className="text-[11px] text-slate-500 font-medium">ศูนย์บัญชาการผู้บริหารระดับสูง (Web Browser Dashboard)</div>
            </div>
          </div>

          {/* Actions & Tools */}
          <div className="flex items-center gap-2.5">
            {/* Brand Pills */}
            <div className="hidden lg:flex items-center gap-1.5 text-[10px] font-bold">
              <span className="px-2 py-0.5 rounded bg-red-600 text-white">YOKOHAMA</span>
              <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-black">NAYA</span>
              <span className="px-2 py-0.5 rounded bg-orange-600 text-white">COSMIS</span>
              <span className="px-2 py-0.5 rounded bg-blue-600 text-white">LENSO</span>
              <span className="px-2 py-0.5 rounded bg-black text-white">BRIDGESTONE</span>
            </div>

            {/* 3D / 2D Switcher */}
            <button
              onClick={() => setIs3DMode(!is3DMode)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
                is3DMode
                  ? 'bg-gradient-to-r from-blue-600 to-sky-500 text-white border-blue-400 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>{is3DMode ? '3D WebGL' : '2D Chart'}</span>
            </button>

            {/* Export CSV */}
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            {/* Live Reload */}
            <button
              onClick={() => loadDashboardData(false)}
              className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors"
              title="รีเฟรชข้อมูลล่าสุด"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 text-xs font-bold flex items-center gap-1.5 border border-slate-200 hover:border-rose-200 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>ออกจากระบบ</span>
            </button>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* STOREFRONT HERO BANNER                                        */}
      {/* ------------------------------------------------------------- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 w-full">
        <div className="relative w-full h-36 sm:h-44 rounded-3xl overflow-hidden border border-slate-200 shadow-md bg-gradient-to-r from-indigo-900 via-blue-900 to-slate-900">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-950/90 via-slate-900/80 to-transparent flex items-center p-6 text-white">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-red-600 text-white font-black text-[10px] tracking-wider uppercase shadow-xs">
                  ★ Executive Master Portal
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-white font-bold text-[10px] flex items-center gap-1">
                  <Clock className="w-3 h-3" /> เข้างาน: {storeSettingsForm.standard_time?.substring(0, 5) || '07:40'} น.
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] flex items-center gap-1">
                  <Clock3 className="w-3 h-3" /> ตัดสาย: {storeSettingsForm.late_deadline?.substring(0, 5) || '08:00'} น.
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/80 text-white font-bold text-[10px]">
                  +{storeSettingsForm.allowance_amount || 50}฿ เบี้ยขยัน
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-800/80 text-white font-bold text-[10px]">
                  GPS Geofence {storeSettingsForm.radius_meters || 50}m
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight drop-shadow-md">
                ศูนย์บัญชาการผู้บริหาร • {storeSettingsForm.store_name || 'สีแสงยางยนต์ YOKOHAMA NAYA COSMIS'}
              </h2>
              <p className="text-xs text-indigo-100 font-medium drop-shadow-sm">
                ระบบเชื่อมต่อฐานข้อมูล Supabase PostgreSQL แบบเรียลไทม์ ตรวจสอบการเข้างาน และอนุมัติใบลา
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MAIN CONTENT AREA                                             */}
      {/* ------------------------------------------------------------- */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 w-full space-y-6 flex-1">
        
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {[
              { id: 'overview', label: '📈 ภาพรวม & รายชื่อเข้างาน', icon: BarChart3, color: 'bg-blue-600' },
              { id: 'employees', label: '👥 จัดการพนักงาน', icon: Users, color: 'bg-sky-500' },
              { id: 'leaves', label: '📅 อนุมัติใบลา', icon: Calendar, badge: pendingLeavesCount, color: 'bg-amber-500' },
              { id: 'violations', label: '🛡️ Security Logs', icon: AlertTriangle, badge: violationLogs.length, color: 'bg-red-500' },
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

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* 3 Top Hero Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
              {/* Allowance Total */}
              <div className="bg-gradient-to-br from-amber-500 to-yellow-400 text-slate-950 p-6 rounded-3xl shadow-lg shadow-amber-500/20 flex flex-col justify-between space-y-2 border border-amber-300">
                <div className="flex items-center justify-between text-xs font-bold text-slate-900/80">
                  <span className="flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-slate-950" />
                    ยอดจ่ายเบี้ยขยันวันนี้
                  </span>
                  <span className="bg-slate-950/15 px-2 py-0.5 rounded-full font-black text-[10px]">
                    +{storeSettingsForm.allowance_amount || 50}฿ / คน
                  </span>
                </div>
                <div>
                  <div className="text-4xl font-black tracking-tight font-mono">
                    {totalAllowancePaid} <span className="text-lg font-bold font-sans">บาท</span>
                  </div>
                  <div className="text-xs font-bold text-slate-900/80 mt-1">
                    สะสม {totalPresent} คน (ตรงเวลา 100%)
                  </div>
                </div>
                <div className="text-[11px] font-black bg-slate-950 text-amber-300 px-3 py-1 rounded-xl w-fit shadow-xs">
                  💰 จ่ายเบี้ยขยันตรงเวลาครบถ้วน
                </div>
              </div>

              {/* Big Headcount */}
              <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white p-6 rounded-3xl shadow-lg shadow-blue-500/25 flex flex-col justify-between items-center text-center space-y-3 border border-blue-400/30 relative overflow-hidden">
                <div className="flex items-center gap-1.5 text-xs font-bold text-blue-100">
                  <Users className="w-4 h-4 text-blue-200" />
                  <span>สรุปพนักงานปฏิบัติการวันนี้</span>
                </div>
                <div className="my-auto space-y-0.5">
                  <div className="text-5xl sm:text-6xl font-black tracking-tight font-mono drop-shadow-md">
                    {totalPresent + totalLate} <span className="text-2xl font-bold font-sans">/ {totalEmployees} คน</span>
                  </div>
                  <div className="text-xs font-bold text-blue-100">
                    พนักงานเข้างานจริงในระบบ
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 w-full pt-2 border-t border-blue-400/30 text-[11px] font-bold">
                  <div className="bg-blue-900/40 p-1.5 rounded-xl border border-blue-400/20">
                    <div className="text-emerald-300 font-mono font-black text-sm">{totalPresent}</div>
                    <div className="text-blue-200 text-[10px]">ตรงเวลา</div>
                  </div>
                  <div className="bg-blue-900/40 p-1.5 rounded-xl border border-blue-400/20">
                    <div className="text-amber-300 font-mono font-black text-sm">{totalLate}</div>
                    <div className="text-blue-200 text-[10px]">มาสาย</div>
                  </div>
                  <div className="bg-blue-900/40 p-1.5 rounded-xl border border-blue-400/20">
                    <div className="text-slate-300 font-mono font-black text-sm">{pendingCount}</div>
                    <div className="text-blue-200 text-[10px]">ยังไม่ลงเวลา</div>
                  </div>
                </div>
              </div>

              {/* Punctuality Rate */}
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
                    {onTimePercent >= 90 ? 'ยอดเยี่ยม! ตรงตามเป้าหมาย' : 'กำลังปรับปรุงความตรงต่อเวลา'}
                  </div>
                </div>
                <div className="w-full bg-emerald-950/50 h-2.5 rounded-full overflow-hidden border border-emerald-400/20">
                  <div
                    className="bg-amber-400 h-full rounded-full transition-all duration-1000"
                    style={{ width: `${Math.max(onTimePercent, 5)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Staff Attendance Table */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-blue-600" />
                    <span>รายชื่อพนักงานเข้างานวันนี้ (Staff Check-in List)</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">
                    เวลาเช็คอินจริง, เบี้ยขยันสะสม, และสถานะการลงเวลา
                  </p>
                </div>

                {/* Filter, Search & Export */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="ค้นหาชื่อ / รหัส..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:border-blue-500 w-32 sm:w-44 font-medium"
                    />
                  </div>

                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                    {(['all', 'present', 'late', 'pending'] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setStatusFilter(f)}
                        className={`px-2.5 py-1 rounded-lg transition-all text-[11px] ${
                          statusFilter === f
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {f === 'all' ? 'ทั้งหมด' : f === 'present' ? 'ตรงเวลา' : f === 'late' ? 'มาสาย' : 'ยังไม่ลงเวลา'}
                      </button>
                    ))}
                  </div>

                  {/* Export CSV Button */}
                  <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors shrink-0"
                    title="ดาวน์โหลดรายงานสรุปเบี้ยขยันและการลงเวลาเป็นไฟล์ Excel/CSV (ภาษาไทย)"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">ส่งออก</span> Excel/CSV
                  </button>
                </div>
              </div>

              {filteredStaff.length === 0 ? (
                <div className="py-12 px-4 text-center space-y-2 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <Users className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs text-slate-500 font-bold">ไม่พบข้อมูลพนักงานในเงื่อนไขนี้</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 font-bold">
                        <th className="py-2.5 px-3">พนักงาน</th>
                        <th className="py-2.5 px-3">รหัสพนักงาน</th>
                        <th className="py-2.5 px-3">ตำแหน่ง / แผนก</th>
                        <th className="py-2.5 px-3">เวลาเข้างาน</th>
                        <th className="py-2.5 px-3">เวลาออกงาน</th>
                        <th className="py-2.5 px-3">สถานะวันนี้</th>
                        <th className="py-2.5 px-3">เบี้ยขยันสะสม</th>
                        <th className="py-2.5 px-3 text-right">ระยะห่างร้าน</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredStaff.map((emp: StaffItem) => (
                        <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-black flex items-center justify-center text-xs border border-blue-200">
                                {emp.nickname[0] || 'E'}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900">{emp.name}</div>
                                <div className="text-[10px] text-slate-500">ชื่อเล่น: {emp.nickname}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-blue-600">{emp.code}</td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-slate-100 text-slate-700">
                              {emp.role}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-800">{emp.checkInTimeStr}</td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-800">{emp.checkOutTimeStr}</td>
                          <td className="py-3 px-3">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${emp.badgeColor}`}>
                              {emp.statusLabel}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className={`font-mono font-black text-xs ${emp.allowance > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                              {emp.allowance > 0 ? `+${emp.allowance} บาท` : '0 บาท'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right text-slate-700 font-mono font-bold text-[11px]">{emp.distanceStr}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* 3D / 2D Chart */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-600" />
                    <span>{is3DMode ? 'กราฟแท่ง 3 มิติ (Weekly Attendance 3D)' : 'สถิติการเข้างานประจำสัปดาห์'}</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">
                    จำนวนพนักงานที่เข้างานตรงเวลาในแต่ละวัน
                  </p>
                </div>
                <span className="text-white bg-blue-600 px-3 py-1 rounded-full font-black text-[11px] shadow-xs flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-yellow-300" />
                  <span>{is3DMode ? '3D WebGL Mode' : '2D Chart Mode'}</span>
                </span>
              </div>

              {is3DMode ? (
                <ThreeBarChart3D data={weeklyData} />
              ) : (
                <div className="h-64 w-full pt-4 flex items-end justify-between gap-3 border-b border-slate-100 pb-2">
                  {weeklyData.map((item: any, idx: number) => {
                    const maxOntime = Math.max(...weeklyData.map((w: any) => w.ontime), 1);
                    const barHeight = item.ontime > 0 ? (item.ontime / maxOntime) * 100 : 0;
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                        <div className="w-full max-w-[32px] bg-slate-100 rounded-xl overflow-hidden h-full flex flex-col justify-end">
                          <div
                            style={{ height: `${barHeight}%` }}
                            className={`w-full rounded-xl transition-all duration-500 ${item.ontime > 0 ? 'bg-blue-600' : 'bg-transparent'}`}
                          />
                        </div>
                        <span className="text-[11px] font-bold text-slate-600">{item.day}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: EMPLOYEES */}
        {activeTab === 'employees' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span>จัดการบัญชีพนักงาน (Staff Management)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  เพิ่ม, ลบ, หรือปลดล็อกอุปกรณ์ประจำตัวพนักงาน (Reset HWID)
                </p>
              </div>

              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>+ เพิ่มพนักงานใหม่</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold">
                    <th className="py-2.5 px-3">พนักงาน</th>
                    <th className="py-2.5 px-3">รหัสพนักงาน</th>
                    <th className="py-2.5 px-3">ตำแหน่ง</th>
                    <th className="py-2.5 px-3">อุปกรณ์ประจำตัว (HWID)</th>
                    <th className="py-2.5 px-3 text-right">การดำเนินการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {formattedStaff.map((emp: StaffItem) => (
                    <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{emp.name} ({emp.nickname})</div>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-blue-600">{emp.code}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-blue-50 text-blue-700 border border-blue-200">
                          {emp.role}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {emp.hwid ? (
                          <span className="font-mono text-[11px] text-emerald-600 font-bold">✓ ผูกเครื่องแล้ว</span>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium">ยังไม่ผูกอุปกรณ์</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right space-x-2">
                        <button
                          onClick={() => handleResetHWID(emp.id, emp.name)}
                          className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 font-bold text-[11px] transition-colors"
                        >
                          Reset HWID
                        </button>
                        <button
                          onClick={() => handleDeleteEmployee(emp.id, emp.code, emp.name)}
                          className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold text-[11px] transition-colors"
                        >
                          ลบบัญชี
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: LEAVES */}
        {activeTab === 'leaves' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div>
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-500" />
                <span>รายการขออนุมัติลางาน ({leaveRequests.length} รายการ)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                พิจารณาคำขอลางานของพนักงาน
              </p>
            </div>

            {leaveRequests.length === 0 ? (
              <div className="py-12 px-4 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs font-bold">
                ไม่มีรายการขอลางานในขณะนี้
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold">
                      <th className="py-2.5 px-3">พนักงาน</th>
                      <th className="py-2.5 px-3">ประเภทการลา</th>
                      <th className="py-2.5 px-3">วันที่ลา</th>
                      <th className="py-2.5 px-3">เหตุผล</th>
                      <th className="py-2.5 px-3">สถานะ</th>
                      <th className="py-2.5 px-3 text-right">การอนุมัติ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {leaveRequests.map((req: any) => (
                      <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900">
                            {req.employee?.full_name || req.employees?.full_name || 'พนักงาน'}
                            {(req.employee?.nickname || req.employees?.nickname) ? ` (${req.employee?.nickname || req.employees?.nickname})` : ''}
                          </div>
                          <div className="font-mono text-[10px] text-blue-600 font-bold">
                            {req.employee?.employee_code || req.employees?.employee_code || req.employee_id?.slice(0, 8)}
                          </div>
                        </td>
                        <td className="py-3 px-3 font-medium">
                          {req.leave_type === 'SICK' ? 'ลาป่วย 🩺' : req.leave_type === 'BUSINESS' ? 'ลากิจ 💼' : req.leave_type === 'ANNUAL' ? 'ลาพักร้อน 🏖️' : 'อื่นๆ 📝'}
                        </td>
                        <td className="py-3 px-3 font-mono">{req.start_date} {req.end_date && req.end_date !== req.start_date ? `ถึง ${req.end_date}` : ''} ({req.days_count || 1} วัน)</td>
                        <td className="py-3 px-3 text-slate-600">{req.reason || '-'}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                            req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : req.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {req.status === 'APPROVED' ? 'อนุมัติแล้ว' : req.status === 'REJECTED' ? 'ไม่อนุมัติ' : 'รอพิจารณา'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right space-x-2">
                          {req.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleLeaveAction(req.id, 'APPROVED')}
                                className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px]"
                              >
                                อนุมัติ
                              </button>
                              <button
                                onClick={() => handleLeaveAction(req.id, 'REJECTED')}
                                className="px-3 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold text-[11px]"
                              >
                                ปฏิเสธ
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: VIOLATIONS */}
        {activeTab === 'violations' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div>
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
                <span>บันทึกความปลอดภัย & ป้องกันทุจริต (Security Logs)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                ตรวจจับการใช้ Fake GPS, Mock Location, หรือการพยายามเช็คอินนอกพื้นที่
              </p>
            </div>

            {violationLogs.length === 0 ? (
              <div className="py-12 px-4 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs font-bold">
                ✓ ไม่พบประวัติความผิดปกติ ทุกอย่างปลอดภัย 100%
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold">
                      <th className="py-2.5 px-3">เวลาที่เกิดเหตุ</th>
                      <th className="py-2.5 px-3">พนักงาน</th>
                      <th className="py-2.5 px-3">ประเภทความผิดปกติ</th>
                      <th className="py-2.5 px-3">รายละเอียด</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {violationLogs.map((v: any) => (
                      <tr key={v.id} className="hover:bg-slate-50">
                        <td className="py-3 px-3 font-mono text-slate-500">
                          {new Date(v.created_at).toLocaleString('th-TH')}
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-900">
                          {v.employees?.full_name || v.employees?.employee_code || '-'}
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-rose-100 text-rose-700">
                            {v.violation_type}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-600">{v.details || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: SETTINGS */}
        {activeTab === 'settings' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div>
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <Settings className="w-5 h-5 text-slate-700" />
                <span>ตั้งค่าพิกัดร้าน & นโยบายลงเวลา (GPS Geofence Policy)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                กำหนดพิกัดร้าน, รัศมีลงเวลา, เวลาเข้างาน, และจำนวนเงินเบี้ยขยัน
              </p>
            </div>

            {settingsMsg && (
              <div className={`p-3.5 rounded-2xl text-xs font-bold ${
                settingsMsg.includes('เรียบร้อย')
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border border-rose-200 text-rose-800'
              }`}>
                {settingsMsg}
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ชื่อร้าน / สาขา</label>
                  <input
                    type="text"
                    value={storeSettingsForm.store_name}
                    onChange={(e) => setStoreSettingsForm({ ...storeSettingsForm, store_name: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-600"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">เวลากะปกติ</label>
                    <input
                      type="text"
                      value={storeSettingsForm.standard_time}
                      onChange={(e) => setStoreSettingsForm({ ...storeSettingsForm, standard_time: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-blue-600"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">ตัดสาย (Deadline)</label>
                    <input
                      type="text"
                      value={storeSettingsForm.late_deadline}
                      onChange={(e) => setStoreSettingsForm({ ...storeSettingsForm, late_deadline: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-blue-600"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">รัศมีเช็คอิน (เมตร)</label>
                  <input
                    type="number"
                    value={storeSettingsForm.radius_meters}
                    onChange={(e) => setStoreSettingsForm({ ...storeSettingsForm, radius_meters: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-blue-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">เบี้ยขยัน (บาท/วัน)</label>
                  <input
                    type="number"
                    value={storeSettingsForm.allowance_amount}
                    onChange={(e) => setStoreSettingsForm({ ...storeSettingsForm, allowance_amount: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-blue-600"
                    required
                  />
                </div>
              </div>

              {/* Map Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">เลือกพิกัดร้านบนแผนที่ (Leaflet Map Picker)</label>
                <StoreMapPicker
                  lat={Number(storeSettingsForm.store_lat) || 15.110412}
                  lng={Number(storeSettingsForm.store_lng) || 104.358434}
                  radius={Number(storeSettingsForm.radius_meters) || 50}
                  storeName={storeSettingsForm.store_name}
                  onChange={(lat, lng) => {
                    setStoreSettingsForm((prev: any) => ({
                      ...prev,
                      store_lat: lat,
                      store_lng: lng
                    }));
                  }}
                  onRadiusChange={(r) => {
                    setStoreSettingsForm((prev: any) => ({
                      ...prev,
                      radius_meters: r
                    }));
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={settingsLoading}
                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all active:scale-98 flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>{settingsLoading ? 'กำลังบันทึกลง Supabase...' : 'บันทึกการตั้งค่านโยบายและพิกัดร้าน'}</span>
              </button>
            </form>
          </div>
        )}
      </main>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: ADD EMPLOYEE                                           */}
      {/* ------------------------------------------------------------- */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 rounded-3xl bg-white border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900">เพิ่มพนักงานใหม่ (Add Staff)</h3>
                  <p className="text-[10px] text-slate-500">บันทึกข้อมูลเข้าฐานข้อมูล Supabase ทันที</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-xs"
              >
                ✕
              </button>
            </div>

            {addMsg && (
              <div className={`p-3 rounded-xl text-xs font-bold ${
                addMsg.includes('สำเร็จ')
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border border-rose-200 text-rose-800'
              }`}>
                {addMsg}
              </div>
            )}

            <form onSubmit={handleCreateEmployee} className="space-y-3 text-xs font-bold">
              <div>
                <label className="block text-slate-700 mb-1">รหัสพนักงาน: <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  placeholder="เช่น EMP003, TECH01"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">ชื่อ-นามสกุล: <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="เช่น สมชาย สายตรง"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1">ชื่อเล่น:</label>
                  <input
                    type="text"
                    value={newNick}
                    onChange={(e) => setNewNick(e.target.value)}
                    placeholder="เช่น ชาย"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1">รหัส PIN 4 หลัก: <span className="text-rose-500">*</span></label>
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
                <label className="block text-slate-700 mb-1">ตำแหน่ง / สิทธิ์ (Role):</label>
                <select
                  value={newRole}
                  onChange={(e: any) => setNewRole(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 font-medium"
                >
                  <option value="STAFF">👷 พนักงานปฏิบัติการ (STAFF - ตอกบัตร/เบี้ยเลี้ยง 50฿)</option>
                  <option value="SUPERVISOR">👨‍🔧 หัวหน้างาน (SUPERVISOR - ตอกบัตร/เบี้ยเลี้ยง 50฿)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={addLoading}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md shadow-blue-500/20 transition-all active:scale-98 flex items-center justify-center gap-2"
              >
                {addLoading ? <span>กำลังบันทึกลง Supabase...</span> : <> <Plus className="w-4 h-4" /> <span>บันทึกและสร้างบัญชีพนักงาน</span> </>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* LIVE FLOATING NOTIFICATION TOAST (Cross-Device Real-Time)     */}
      {/* ------------------------------------------------------------- */}
      {liveNotification && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full p-4 rounded-3xl bg-slate-900/95 text-white border border-slate-700 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                liveNotification.type === 'checkin' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}>
                {liveNotification.type === 'checkin' ? <Check className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
              </div>
              <div>
                <div className="font-extrabold text-xs text-white">{liveNotification.title}</div>
                <div className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">{liveNotification.message}</div>
                <div className="text-[9px] text-slate-500 mt-1 font-mono">{liveNotification.time} น. • Supabase Realtime Live</div>
              </div>
            </div>
            <button
              onClick={() => setLiveNotification(null)}
              className="text-slate-400 hover:text-white text-xs p-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
