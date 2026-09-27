'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

const StoreMapPicker = dynamic(() => import('@/components/StoreMapPicker'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-64 rounded-2xl bg-slate-100 animate-pulse flex items-center justify-center text-xs text-slate-400 font-bold">
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
  rawCheckInTime?: string | null;
  distanceStr: string;
  badgeColor: string;
}

export default function MobileExecutiveApp() {
  const router = useRouter();

  // Navigation Tabs: overview, staff, leaves, settings
  const [activeTab, setActiveTab] = useState<'overview' | 'staff' | 'leaves' | 'settings'>('overview');
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;
  const hasLoadedSettingsRef = useRef(false);

  // Live Data & Loading
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExecutiveUnlocked, setIsExecutiveUnlocked] = useState<boolean>(false);

  // Executive Login Fallback State
  const [executiveCodeInput, setExecutiveCodeInput] = useState('');
  const [executivePinInput, setExecutivePinInput] = useState('');
  const [executivePinError, setExecutivePinError] = useState('');

  // Live Clock
  const [timeStr, setTimeStr] = useState({
    time: '08:00:00',
    dateThai: 'วันอาทิตย์, 27 กันยายน 2026'
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
    standard_time: '07:40:00',
    late_deadline: '08:00:00',
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

  // 2. Real-time Clock Ticker
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const timeFormatted = now.toLocaleTimeString('th-TH', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      const dateFormatted = now.toLocaleDateString('th-TH', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      setTimeStr({ time: timeFormatted, dateThai: dateFormatted });
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // 3. Data Fetching & Real-Time Synchronization (Supabase Channel + Adaptive 4s Polling)
  const loadData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics?period=${period}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setAnalyticsData(data.data);
        if (data.data.settings) {
          if (!hasLoadedSettingsRef.current || activeTabRef.current !== 'settings') {
            setStoreSettingsForm(data.data.settings);
            hasLoadedSettingsRef.current = true;
          }
        }
      }
    } catch (e) {
      console.error('Failed to load executive data:', e);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isExecutiveUnlocked) return;

    loadData(false);

    // 1. Supabase Realtime Channel Subscription (<100ms instant broadcast)
    let channel: any = null;
    if (isSupabaseConfigured && supabase) {
      channel = supabase
        .channel('executive-mobile-realtime-room')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance_logs' }, () => {
          loadData(true);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'leave_requests' }, () => {
          loadData(true);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'violation_logs' }, () => {
          loadData(true);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, () => {
          loadData(true);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'store_settings' }, () => {
          loadData(true);
        })
        .subscribe();
    }

    // 2. Adaptive Fast Background Polling (4s)
    const pollTimer = setInterval(() => {
      loadData(true);
    }, 4000);

    // 3. Auto-sync on Tab/Window Focus
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadData(true);
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
      localStorage.setItem('executive_auth_token', 'true');
      localStorage.setItem('executive_user_code', code);
    } else {
      setExecutivePinError('รหัสผู้บริหารหรือ PIN ไม่ถูกต้อง (SI01 / PIN 5101)');
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
    router.push('/employee/login');
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
        loadData(true);
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
        loadData(true);
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
        loadData(true);
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
        loadData(true);
      } else {
        alert(data.message || 'ไม่สามารถบันทึกผลได้');
      }
    } catch (e: any) {
      alert('เกิดข้อผิดพลาด: ' + e.message);
    }
  };

  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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
        if (data.data) {
          setStoreSettingsForm(data.data);
        }
        setSettingsMsg('✅ บันทึกนโยบายและพิกัดร้านเรียบร้อยแล้ว');
        setTimeout(() => setSettingsMsg(''), 4000);
      } else {
        setSettingsMsg('❌ ไม่สามารถบันทึกได้: ' + (data.message || 'เกิดข้อผิดพลาด'));
      }
    } catch (err: any) {
      setSettingsMsg('❌ เกิดข้อผิดพลาด: ' + err.message);
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
      rawCheckInTime: emp.todayRawCheckInTime || null,
      distanceStr: emp.todayDistance && emp.todayDistance !== '-' ? emp.todayDistance : (isPresent || isLate ? 'ในร้าน (5 ม.)' : '-'),
      badgeColor: isPresent ? 'bg-emerald-100 text-emerald-800' : isLate ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-600'
    };
  });

  const filteredStaff: StaffItem[] = formattedStaff.filter((emp: StaffItem) => {
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
  }).sort((a: StaffItem, b: StaffItem) => {
    // 1. Both checked in today: sort by latest check-in timestamp descending
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

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['รหัสพนักงาน', 'ชื่อ-นามสกุล', 'ชื่อเล่น', 'สถานะวันนี้', 'เบี้ยขยันสะสม (บาท)'];
    const rows = formattedStaff.map((e: StaffItem) => [
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
  // FALLBACK MOBILE LOGIN (If not logged in)
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
  // MAIN EXECUTIVE MOBILE APP VIEW (No top header bar)
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen w-full bg-slate-50 flex flex-col justify-between select-none font-sans text-slate-800 pb-24">
      
      {/* ------------------------------------------------------------- */}
      {/* MAIN SCROLLABLE CONTENT                                       */}
      {/* ------------------------------------------------------------- */}
      <div className="flex-1 px-4 pt-4 space-y-4 max-w-lg mx-auto w-full">
        
        {/* Blue Gradient Hero Card */}
        <div className="bg-gradient-to-br from-[#2563eb] via-[#1d4ed8] to-[#1e40af] rounded-3xl p-5 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center justify-between text-xs text-blue-100 font-medium mb-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block shadow-xs shadow-emerald-400/50" />
              <span>{timeStr.dateThai}</span>
            </div>
            <span className="font-mono font-bold bg-blue-900/40 px-2.5 py-0.5 rounded-lg border border-blue-400/20">
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

        {/* ------------------------------------------------------------- */}
        {/* TAB 1: OVERVIEW (ภาพรวม)                                      */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            
            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
                <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
                  <span>ความตรงต่อเวลา</span>
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-black font-mono text-slate-900">{onTimeRate}%</div>
                <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                  {onTimeRate >= 90 ? 'ตรงตามเป้าหมาย' : 'ต่ำกว่าเป้าหมาย'}
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
                <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
                  <span>คำขอลาที่รออนุมัติ</span>
                  <Calendar className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-2xl font-black font-mono text-slate-900">{pendingLeavesCount}</div>
                <div className="text-[10px] text-slate-400 font-medium mt-0.5">รอผู้บริหารพิจารณา</div>
              </div>
            </div>

            {/* Staff Attendance Summary List */}
            <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-black text-slate-900">สถานะการเข้างานของลูกน้อง</span>
                </div>
                <button
                  onClick={() => setActiveTab('staff')}
                  className="text-xs text-blue-600 font-bold hover:underline"
                >
                  ดูทั้งหมด ({formattedStaff.length}) →
                </button>
              </div>

              <div className="space-y-2">
                {formattedStaff.map((emp) => (
                  <div
                    key={emp.id}
                    className="p-3 rounded-2xl bg-slate-50/80 border border-slate-100 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-black text-xs flex items-center justify-center">
                        {emp.nickname[0] || 'U'}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          {emp.name} ({emp.nickname})
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {emp.code}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${emp.badgeColor}`}>
                        {emp.statusLabel}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick CSV Export */}
            <button
              onClick={handleExportCSV}
              className="w-full py-3.5 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-xs flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>ดาวน์โหลดรายงานสรุปการทำงาน (Excel / CSV)</span>
            </button>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 2: STAFF (ลูกน้อง)                                         */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'staff' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-sm text-slate-900">รายชื่อลูกน้อง ({formattedStaff.length} คน)</h3>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-3 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center gap-1 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>เพิ่มพนักงาน</span>
              </button>
            </div>

            <div className="space-y-2">
              {formattedStaff.map((emp) => (
                <div key={emp.id} className="p-3.5 rounded-2xl bg-white border border-slate-100 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-black text-xs flex items-center justify-center">
                        {emp.nickname[0] || 'U'}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-900">{emp.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{emp.code} • {emp.nickname}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700">
                      {emp.role}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <div className="text-[10px] text-slate-500">
                      อุปกรณ์: {emp.hwid ? <span className="text-emerald-600 font-bold">ผูกแล้ว</span> : 'ยังไม่ผูก'}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleResetHWID(emp.id, emp.name)}
                        className="px-2 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold"
                      >
                        Reset HWID
                      </button>
                      <button
                        onClick={() => handleDeleteEmployee(emp.id, emp.code, emp.name)}
                        className="px-2 py-1 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 text-[10px] font-bold"
                      >
                        ลบ
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 3: LEAVES (ใบลา)                                          */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'leaves' && (
          <div className="space-y-3">
            <h3 className="font-black text-sm text-slate-900">คำขอลางาน ({leaveRequests.length})</h3>
            {leaveRequests.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-100 text-slate-400 text-xs font-bold">
                ไม่มีรายการขอลางานในขณะนี้
              </div>
            ) : (
              <div className="space-y-2">
                {leaveRequests.map((req: any) => (
                  <div key={req.id} className="p-3.5 rounded-2xl bg-white border border-slate-100 shadow-xs space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-900">
                          {req.employee?.full_name || req.employees?.full_name || 'พนักงาน'}
                          {(req.employee?.nickname || req.employees?.nickname) ? ` (${req.employee?.nickname || req.employees?.nickname})` : ''}
                        </span>
                        <span className="ml-1.5 font-mono text-[10px] text-blue-600 font-bold">
                          [{req.employee?.employee_code || req.employees?.employee_code || req.employee_id?.slice(0, 8)}]
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-amber-100 text-amber-800">
                        {req.leave_type === 'SICK' ? 'ลาป่วย 🩺' : req.leave_type === 'BUSINESS' ? 'ลากิจ 💼' : req.leave_type === 'ANNUAL' ? 'ลาพักร้อน 🏖️' : 'อื่นๆ 📝'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600">
                      {req.start_date} {req.end_date && req.end_date !== req.start_date ? `ถึง ${req.end_date}` : ''} ({req.days_count || 1} วัน) • <span className="italic text-slate-500">"{req.reason || 'ไม่ระบุเหตุผล'}"</span>
                    </div>
                    {req.status === 'PENDING' && (
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => handleLeaveAction(req.id, 'APPROVED')}
                          className="px-3 py-1 rounded-lg bg-emerald-600 text-white font-bold text-xs"
                        >
                          อนุมัติ
                        </button>
                        <button
                          onClick={() => handleLeaveAction(req.id, 'REJECTED')}
                          className="px-3 py-1 rounded-lg bg-rose-100 text-rose-700 font-bold text-xs"
                        >
                          ปฏิเสธ
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 4: SETTINGS (ตั้งค่า)                                      */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'settings' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-500 text-slate-950 flex items-center justify-center text-xl shadow-xs">
                👑
              </div>
              <div>
                <div className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md w-fit">
                  SI01 • ผู้บริหารสูงสุด
                </div>
                <div className="text-sm font-black text-slate-900 mt-0.5">ศูนย์บัญชาการผู้บริหาร</div>
                <div className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  ระบบเชื่อมต่อเรียลไทม์ (Live Sync)
                </div>
              </div>
            </div>

            {/* Store Policy Form */}
            <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span>พิกัดร้านและนโยบายลงเวลา (GPS Geofence)</span>
              </div>

              {settingsMsg && (
                <div className={`p-3 rounded-2xl text-xs font-bold ${
                  settingsMsg.includes('✅') || settingsMsg.includes('สำเร็จ')
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border border-rose-200 text-rose-800'
                }`}>
                  {settingsMsg}
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">ชื่อร้าน / สาขา</label>
                <input
                  type="text"
                  value={storeSettingsForm.store_name}
                  onChange={(e) => setStoreSettingsForm({ ...storeSettingsForm, store_name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">เวลากะปกติ</label>
                  <input
                    type="text"
                    value={storeSettingsForm.standard_time}
                    onChange={(e) => setStoreSettingsForm({ ...storeSettingsForm, standard_time: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">ตัดสาย (Deadline)</label>
                  <input
                    type="text"
                    value={storeSettingsForm.late_deadline}
                    onChange={(e) => setStoreSettingsForm({ ...storeSettingsForm, late_deadline: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
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
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">เบี้ยขยัน (บาท/วัน)</label>
                  <input
                    type="number"
                    value={storeSettingsForm.allowance_amount}
                    onChange={(e) => setStoreSettingsForm({ ...storeSettingsForm, allowance_amount: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              {/* Map Picker on Mobile Executive */}
              <div className="pt-2">
                <label className="block text-[11px] font-bold text-slate-700 mb-1.5">แผนที่ปักหมุดจุดร้านค้า (Leaflet Map Picker)</label>
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
                  onStoreNameChange={(name) => {
                    setStoreSettingsForm((prev: any) => ({
                      ...prev,
                      store_name: name
                    }));
                  }}
                  onRadiusChange={(r) => {
                    setStoreSettingsForm((prev: any) => ({
                      ...prev,
                      radius_meters: r
                    }));
                  }}
                  onSave={handleSaveSettings}
                  isSaving={settingsLoading}
                />
              </div>

              <button
                onClick={handleSaveSettings}
                disabled={settingsLoading}
                className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-xs active:scale-98 flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{settingsLoading ? 'กำลังบันทึกลงฐานข้อมูล...' : 'บันทึกการตั้งค่านโยบายและพิกัดร้าน'}</span>
              </button>
            </div>

            {/* Security Logs */}
            <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>บันทึกความปลอดภัย (Security Logs)</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 text-[11px] text-slate-500 text-center">
                {violationLogs.length === 0 ? 'ไม่มีประวัติความผิดปกติ ทุกอย่างปลอดภัย 100%' : `พบ ${violationLogs.length} รายการ`}
              </div>
            </div>

            {/* Logout Button in Settings Tab */}
            <button
              onClick={handleLogout}
              className="w-full py-3.5 rounded-2xl bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-600 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-98"
            >
              <LogOut className="w-4 h-4" />
              <span>ออกจากระบบผู้บริหาร (Logout)</span>
            </button>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* BOTTOM FLOATING NAVIGATION TABS (Mobile Only)                 */}
      {/* ------------------------------------------------------------- */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-4 py-2 shadow-lg">
        <div className="max-w-lg mx-auto flex items-center justify-around">
          {[
            { id: 'overview', label: 'ภาพรวม', icon: TrendingUp },
            { id: 'staff', label: 'ลูกน้อง', icon: Users },
            { id: 'leaves', label: 'ใบลา', icon: Calendar, badge: pendingLeavesCount },
            { id: 'settings', label: 'ตั้งค่า', icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all relative ${
                  isActive ? 'text-blue-600 font-black' : 'text-slate-400 hover:text-slate-600 font-medium'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 bg-amber-500 text-white font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center border border-white">
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px]">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

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
                  <label className="block text-slate-700 mb-1">รหัส PIN / รหัสผ่าน: <span className="text-rose-500">*</span></label>
                  <input
                    type="password"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    placeholder="เช่น 1234 หรือรหัสผ่าน"
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
    </div>
  );
}
