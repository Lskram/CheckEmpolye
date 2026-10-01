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
  ShieldAlert,
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
  EyeOff,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import SecurityLogsViewer from '@/components/SecurityLogsViewer';
import SalaryAdvanceManager from '@/components/SalaryAdvanceManager';
import NotificationCenter from '@/components/NotificationCenter';
import { WebNotification, playWebAlertSound, showBrowserDesktopNotification } from '@/lib/web-notifications';

const StoreMapPicker = dynamic(() => import('@/components/StoreMapPicker'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-64 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse flex items-center justify-center text-xs text-slate-400 font-bold">
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

  // Navigation Tabs: overview, staff, leaves, advances, violations, settings
  const [activeTab, setActiveTab] = useState<'overview' | 'staff' | 'leaves' | 'advances' | 'violations' | 'settings'>('overview');
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;
  const hasLoadedSettingsRef = useRef(false);

  // Live Data & Loading
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExecutiveUnlocked, setIsExecutiveUnlocked] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);

  // Executive Login Fallback State
  const [executiveCodeInput, setExecutiveCodeInput] = useState('');
  const [executivePinInput, setExecutivePinInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

  // Store Settings
  const [storeSettingsForm, setStoreSettingsForm] = useState<any>({
    store_name: 'สีแสงยางยนต์ (YOKOHAMA NAYA COSMIS)',
    store_lat: 15.110412,
    store_lng: 104.358434,
    radius_meters: 50,
    standard_time: '07:40:00',
    late_deadline: '08:00:00',
    allowance_amount: 50,
  });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState('');

  // Notification & Audio Alerts
  const [notificationsList, setNotificationsList] = useState<WebNotification[]>([]);
  const [activeToast, setActiveToast] = useState<WebNotification | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const prevDataRef = useRef<{
    logMap: Map<string, any>;
    advanceMap: Map<string, any>;
    leaveMap: Map<string, any>;
    violationMap: Map<string, any>;
    isFirstLoad: boolean;
  }>({
    logMap: new Map(),
    advanceMap: new Map(),
    leaveMap: new Map(),
    violationMap: new Map(),
    isFirstLoad: true,
  });

  const triggerNotification = (notif: Omit<WebNotification, 'id' | 'time' | 'timestamp' | 'read'>) => {
    const time = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const fullNotif: WebNotification = {
      ...notif,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      time,
      timestamp: Date.now(),
      read: false,
    };

    setNotificationsList((prev) => [fullNotif, ...prev.slice(0, 49)]);
    setActiveToast(fullNotif);

    if (soundEnabled) {
      playWebAlertSound(notif.type);
    }
    showBrowserDesktopNotification(notif.title, notif.message);

    setTimeout(() => {
      setActiveToast((current) => (current?.id === fullNotif.id ? null : current));
    }, 7000);
  };

  // Update Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr({
        time: now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
        dateThai: now.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
      });
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auth Guard
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
    setMounted(true);
  }, []);

  // Data Fetching & Smart Diff Detection (Realtime Audio & Toast)
  const loadDashboardData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics?period=${period}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success && data.data) {
        const d = data.data;
        setAnalyticsData(d);
        if (d.settings) {
          if (!hasLoadedSettingsRef.current || activeTabRef.current !== 'settings') {
            setStoreSettingsForm(d.settings);
            hasLoadedSettingsRef.current = true;
          }
        }

        // Smart Diff Engine for Real-Time Sound & Popups
        if (prevDataRef.current.isFirstLoad) {
          d.attendanceLogs?.forEach((l: any) => prevDataRef.current.logMap.set(l.id, l));
          d.salaryAdvanceRequests?.forEach((a: any) => prevDataRef.current.advanceMap.set(a.id, a));
          d.leaveRequests?.forEach((lv: any) => prevDataRef.current.leaveMap.set(lv.id, lv));
          d.violationLogs?.forEach((v: any) => prevDataRef.current.violationMap.set(v.id, v));
          prevDataRef.current.isFirstLoad = false;
        } else {
          const logs: any[] = d.attendanceLogs || [];
          const advances: any[] = d.salaryAdvanceRequests || [];
          const leaves: any[] = d.leaveRequests || [];
          const violations: any[] = d.violationLogs || [];
          const employees: any[] = d.employees || [];
          const empMap = new Map(employees.map((e) => [e.id, e]));

          // 1. Detect New Salary Advances
          advances.forEach((adv: any) => {
            const prevAdv = prevDataRef.current.advanceMap.get(adv.id);
            const emp = empMap.get(adv.employee_id) || {};
            const empName = emp.nickname || emp.full_name || 'พนักงาน';
            const empCode = emp.employee_code ? `(${emp.employee_code})` : '';

            if (!prevAdv) {
              triggerNotification({
                type: 'advance',
                relatedId: adv.id,
                status: adv.status,
                title: `💵 มีคำขอเบิกเงินใหม่ (${Number(adv.amount).toLocaleString()} บาท)`,
                message: `คุณ ${empName} ${empCode} ขอยอด ${Number(adv.amount).toLocaleString()}฿ (เหตุผล: ${adv.reason || '-'})`,
                targetTab: 'advances',
              });
            } else if (prevAdv.status !== adv.status) {
              setNotificationsList((prevList) =>
                prevList.map((n) =>
                  n.relatedId === adv.id ? { ...n, read: true, status: adv.status } : n
                )
              );
            }
          });

          // 2. Detect New Check-in / Check-out Logs
          logs.forEach((log: any) => {
            const prevLog = prevDataRef.current.logMap.get(log.id);
            const emp = empMap.get(log.employee_id) || {};
            const empName = emp.nickname || emp.full_name || 'พนักงาน';
            const empCode = emp.employee_code ? `(${emp.employee_code})` : '';

            if (!prevLog) {
              const timeStr = log.check_in_time ? new Date(log.check_in_time).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '-';
              const statusText = log.status === 'PRESENT' ? 'ตรงเวลา (+50฿)' : 'มาสาย';
              triggerNotification({
                type: 'checkin',
                relatedId: log.id,
                title: `🟢 คุณ ${empName} ${empCode} ลงเวลาเข้างานแล้ว`,
                message: `เวลา ${timeStr} น. • ระยะห่างร้าน ${Number(log.distance_from_store || 0).toFixed(1)} ม. (${statusText})`,
                targetTab: 'overview',
              });
            } else if (!prevLog.check_out_time && log.check_out_time) {
              const timeStr = new Date(log.check_out_time).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
              triggerNotification({
                type: 'checkout',
                relatedId: log.id,
                title: `🏁 คุณ ${empName} ${empCode} ลงชื่อออกงานแล้ว`,
                message: `เวลาออกงาน: ${timeStr} น. • ทำงาน: ${log.work_hours || '-'} ชม.`,
                targetTab: 'overview',
              });
            }
          });

          // 3. Detect New Leave Requests
          leaves.forEach((lv: any) => {
            const prevLv = prevDataRef.current.leaveMap.get(lv.id);
            const emp = empMap.get(lv.employee_id) || {};
            const empName = emp.nickname || emp.full_name || 'พนักงาน';
            const empCode = emp.employee_code ? `(${emp.employee_code})` : '';

            if (!prevLv) {
              triggerNotification({
                type: 'leave',
                relatedId: lv.id,
                status: lv.status,
                title: `📄 มีการยื่นใบลาใหม่!`,
                message: `คุณ ${empName} ${empCode} ยื่นลาประเภท ${lv.leave_type || 'ทั่วไป'} (เหตุผล: ${lv.reason || '-'})`,
                targetTab: 'leaves',
              });
            } else if (prevLv.status !== lv.status) {
              setNotificationsList((prevList) =>
                prevList.map((n) =>
                  n.relatedId === lv.id ? { ...n, read: true, status: lv.status } : n
                )
              );
            }
          });

          // 4. Detect New Violations
          violations.forEach((v: any) => {
            const prevV = prevDataRef.current.violationMap.get(v.id);
            if (!prevV) {
              triggerNotification({
                type: 'violation',
                relatedId: v.id,
                title: `🚨 ตรวจพบความผิดปกติ (${v.violation_type || 'Security'})`,
                message: v.description || 'ตรวจพบการกระทำผิดเงื่อนไขความปลอดภัย',
                targetTab: 'violations',
              });
            }
          });

          // Update cache maps
          logs.forEach((l: any) => prevDataRef.current.logMap.set(l.id, l));
          advances.forEach((a: any) => prevDataRef.current.advanceMap.set(a.id, a));
          leaves.forEach((lv: any) => prevDataRef.current.leaveMap.set(lv.id, lv));
          violations.forEach((v: any) => prevDataRef.current.violationMap.set(v.id, v));
        }
      }
    } catch (e) {
      console.error('Mobile Executive fetch error:', e);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isExecutiveUnlocked) return;
    loadDashboardData(false);

    let channel: any = null;
    if (isSupabaseConfigured && supabase) {
      channel = supabase
        .channel('executive-mobile-room')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance_logs' }, () => loadDashboardData(true))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'salary_advance_requests' }, () => loadDashboardData(true))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'violation_logs' }, () => loadDashboardData(true))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'leave_requests' }, () => loadDashboardData(true))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, () => loadDashboardData(true))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'store_settings' }, () => loadDashboardData(true))
        .subscribe();
    }

    const timer = setInterval(() => loadDashboardData(true), 3500);
    return () => {
      if (channel) supabase?.removeChannel(channel);
      clearInterval(timer);
    };
  }, [isExecutiveUnlocked, period]);

  // Auth Handlers
  const handleExecutiveLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setExecutivePinError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeCode: executiveCodeInput.trim().toUpperCase(), pinCode: executivePinInput.trim() }),
      });
      const data = await res.json();

      if (data.success && data.data) {
        if (data.data.role === 'ADMIN' || data.data.employee_code === 'SI01') {
          localStorage.setItem('executive_auth_token', 'true');
          localStorage.setItem('attendance_employee_profile', JSON.stringify(data.data));
          setIsExecutiveUnlocked(true);
        } else {
          setExecutivePinError('บัญชีนี้ไม่มีสิทธิ์ระดับผู้บริหาร');
        }
      } else {
        setExecutivePinError(data.message || 'รหัสผู้บริหารหรือรหัส PIN ไม่ถูกต้อง');
      }
    } catch (err: any) {
      setExecutivePinError('เกิดข้อผิดพลาด: ' + err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('executive_auth_token');
    localStorage.removeItem('attendance_employee_profile');
    setIsExecutiveUnlocked(false);
  };

  const handleMarkAsRead = (id: string) => {
    setNotificationsList((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const handleMarkAllAsRead = () => {
    setNotificationsList((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // Optimistic Salary Advance Action (1-Click Approval with Badge Auto-Clear)
  const handleOptimisticAdvanceAction = (requestId: string, newStatus: 'APPROVED' | 'REJECTED') => {
    setNotificationsList((prevList) =>
      prevList.map((n) =>
        n.relatedId === requestId ? { ...n, read: true, status: newStatus } : n
      )
    );
    setActiveToast((currentToast) =>
      currentToast?.relatedId === requestId ? null : currentToast
    );
    setAnalyticsData((prev: any) => {
      if (!prev) return prev;
      const updatedAdvances = (prev.salaryAdvanceRequests || []).map((req: any) =>
        req.id === requestId
          ? { ...req, status: newStatus, reviewed_at: new Date().toISOString() }
          : req
      );
      const newPendingCount = updatedAdvances.filter((r: any) => r.status === 'PENDING').length;
      return {
        ...prev,
        salaryAdvanceRequests: updatedAdvances,
        overview: {
          ...prev.overview,
          pendingAdvancesCount: newPendingCount,
        },
      };
    });
    loadDashboardData(true);
  };

  // 1-Click Leave Action with Instant Badge Clearing
  const handleLeaveAction = async (leaveId: string, status: 'APPROVED' | 'REJECTED') => {
    // Optimistic UI update
    setNotificationsList((prevList) =>
      prevList.map((n) =>
        n.relatedId === leaveId ? { ...n, read: true, status } : n
      )
    );
    setActiveToast((currentToast) =>
      currentToast?.relatedId === leaveId ? null : currentToast
    );
    setAnalyticsData((prev: any) => {
      if (!prev) return prev;
      const updatedLeaves = (prev.leaveRequests || []).map((req: any) =>
        req.id === leaveId
          ? { ...req, status }
          : req
      );
      const newPendingCount = updatedLeaves.filter((r: any) => r.status === 'PENDING').length;
      return {
        ...prev,
        leaveRequests: updatedLeaves,
        overview: {
          ...prev.overview,
          pendingLeavesCount: newPendingCount,
        },
      };
    });

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
      }
    } catch (e) {}
  };

  // Reset HWID
  const handleResetHWID = async (id: string, name: string) => {
    if (!confirm(`ปลดล็อกอุปกรณ์ (Reset HWID) สำหรับ "${name}" หรือไม่?`)) return;
    try {
      const res = await fetch('/api/admin/employee', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, clearHWID: true }),
      });
      const data = await res.json();
      if (data.success) {
        alert('ปลดล็อกอุปกรณ์สำเร็จ');
        loadDashboardData(true);
      }
    } catch (e) {}
  };

  const handleDeleteEmployee = async (id: string, code: string, name: string) => {
    if (code === 'SI01') return;
    if (!confirm(`ยืนยันการลบ "${name}" หรือไม่?`)) return;
    try {
      const res = await fetch(`/api/admin/employee?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) loadDashboardData(true);
    } catch (e) {}
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
        setSettingsMsg('✅ บันทึกพิกัดและนโยบายร้านสำเร็จ!');
        setTimeout(() => setSettingsMsg(''), 3500);
      } else {
        setSettingsMsg('❌ ไม่สามารถบันทึกได้');
      }
    } catch (err: any) {
      setSettingsMsg('❌ ผิดพลาด: ' + err.message);
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

  const rawStaffList = (analyticsData?.allowanceReports || []).filter((emp: any) => emp.role !== 'ADMIN');
  const formattedStaff: StaffItem[] = rawStaffList.map((emp: any): StaffItem => {
    const status: 'PRESENT' | 'LATE' | 'PENDING' = emp.todayStatus || (emp.presentCount > 0 ? 'PRESENT' : emp.lateCount > 0 ? 'LATE' : 'PENDING');
    const isPresent = status === 'PRESENT';
    const isLate = status === 'LATE';
    return {
      id: emp.employeeId,
      code: emp.employeeCode,
      name: emp.fullName,
      nickname: emp.nickname || '-',
      role: emp.role === 'SUPERVISOR' ? 'หัวหน้างาน' : 'พนักงาน',
      status,
      allowance: emp.todayAllowance !== undefined ? emp.todayAllowance : (emp.totalAllowance || 0),
      hwid: emp.hwid || null,
      statusLabel: isPresent ? 'ตรงเวลา (+50฿)' : isLate ? 'มาสาย' : 'ยังไม่ลงเวลา',
      checkInTimeStr: emp.todayCheckInTime && emp.todayCheckInTime !== '-' ? emp.todayCheckInTime : (isPresent ? '07:45' : isLate ? '08:15' : '-'),
      rawCheckInTime: emp.todayRawCheckInTime || null,
      distanceStr: emp.todayDistance && emp.todayDistance !== '-' ? emp.todayDistance : '-',
      badgeColor: isPresent ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : isLate ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'
    };
  });

  const leaveRequests = analyticsData?.leaveRequests || [];
  const violationLogs = analyticsData?.violationLogs || [];

  // CSV Export
  const handleExportCSV = () => {
    const headers = ['รหัสพนักงาน', 'ชื่อ-นามสกุล', 'ชื่อเล่น', 'สถานะ', 'เบี้ยขยัน (บาท)'];
    const rows = formattedStaff.map((e) => [
      `"${e.code}"`,
      `"${e.name}"`,
      `"${e.nickname}"`,
      `"${e.statusLabel}"`,
      e.allowance,
    ]);
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `สรุปรายวัน_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // -------------------------------------------------------------
  // HYDRATION GUARD
  // -------------------------------------------------------------
  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#070a12] flex items-center justify-center text-slate-400 text-xs font-bold font-mono">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
          <span>กำลังโหลดระบบผู้บริหาร...</span>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // FALLBACK LOGIN
  // -------------------------------------------------------------
  if (!isExecutiveUnlocked) {
    return (
      <div className="min-h-screen bg-[#070a12] text-slate-100 flex flex-col justify-center items-center p-6 font-sans bg-grid-pattern relative">
        <div className="bento-card max-w-sm w-full p-6 space-y-6">
          <div className="text-center space-y-1">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-blue-500/25 font-black text-2xl">
              👑
            </div>
            <h2 className="text-xl font-black text-white pt-2">เข้าสู่ระบบผู้บริหาร (Mobile)</h2>
            <p className="text-xs text-slate-400">ระบุรหัสผู้บริหารและรหัส PIN</p>
          </div>

          {executivePinError && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold">
              {executivePinError}
            </div>
          )}

          <form onSubmit={handleExecutiveLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-300">รหัสผู้บริหาร</label>
              <input
                type="text"
                value={executiveCodeInput}
                onChange={(e) => setExecutiveCodeInput(e.target.value.toUpperCase())}
                placeholder="เช่น SI01"
                className="w-full px-3.5 py-2.5 bg-slate-950/90 border border-slate-800 rounded-xl text-white font-mono font-bold text-sm focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-300">รหัส PIN 4 หลัก</label>
              <input
                type={showPassword ? 'text' : 'password'}
                maxLength={4}
                value={executivePinInput}
                onChange={(e) => setExecutivePinInput(e.target.value)}
                placeholder="••••"
                className="w-full px-3.5 py-2.5 bg-slate-950/90 border border-slate-800 rounded-xl text-center text-lg font-mono font-bold tracking-widest text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-sm shadow-lg shadow-blue-600/30 transition-all active:scale-[0.98]"
            >
              เข้าสู่ระบบ
            </button>
          </form>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // MAIN VIEW
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen w-full bg-[#070a12] flex flex-col justify-between select-none font-sans text-slate-100 pb-24 bg-grid-pattern relative">
      
      {/* Scrollable Container */}
      <div className="flex-1 px-4 pt-4 space-y-4 max-w-lg mx-auto w-full">
        
        {/* Bento Hero Card */}
        <div className="bento-card p-5 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{timeStr.dateThai}</span>
            </div>
            <div className="flex items-center gap-2">
              <NotificationCenter
                notifications={notificationsList}
                onClearAll={() => setNotificationsList([])}
                onMarkAllAsRead={handleMarkAllAsRead}
                onMarkAsRead={handleMarkAsRead}
                onSelectNotification={(notif) => {
                  if (notif.targetTab) setActiveTab(notif.targetTab as any);
                }}
                activeToast={activeToast}
                onDismissToast={() => setActiveToast(null)}
                soundEnabled={soundEnabled}
                onToggleSound={() => setSoundEnabled(!soundEnabled)}
              />
              <span className="font-mono font-bold bg-slate-950/90 text-white px-2.5 py-1 rounded-xl border border-slate-800 text-[11px]">
                {timeStr.time}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div>
              <div className="text-[11px] text-slate-400 font-bold">พนักงานเข้างานวันนี้</div>
              <div className="text-3xl font-black font-mono text-white tracking-tight">
                {totalPresent + totalLate} <span className="text-sm font-normal text-slate-400">/ {totalEmployees} คน</span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-[11px] text-slate-400 font-bold">เบี้ยขยันจ่ายวันนี้</div>
              <div className="text-2xl font-black font-mono text-amber-400">
                +{totalAllowancePaid} <span className="text-xs text-slate-400 font-normal">บาท</span>
              </div>
            </div>
          </div>

          {/* 3 Pillar Summary */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-center text-xs">
            <div className="bg-slate-950/80 rounded-xl p-2 border border-slate-800">
              <div className="font-black text-sm font-mono text-emerald-400">{totalPresent}</div>
              <div className="text-[10px] text-slate-400 font-bold">ตรงเวลา</div>
            </div>
            <div className="bg-slate-950/80 rounded-xl p-2 border border-slate-800">
              <div className="font-black text-sm font-mono text-amber-400">{totalLate}</div>
              <div className="text-[10px] text-slate-400 font-bold">มาสาย</div>
            </div>
            <div className="bg-slate-950/80 rounded-xl p-2 border border-slate-800">
              <div className="font-black text-sm font-mono text-slate-400">{pendingCount}</div>
              <div className="text-[10px] text-slate-400 font-bold">ยังไม่ลง</div>
            </div>
          </div>
        </div>

        {/* Minimalist Sub-Tab Navigation */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 p-1 bg-slate-900/80 rounded-2xl border border-slate-800 backdrop-blur-md">
          {[
            { id: 'overview', label: 'ภาพรวม', icon: TrendingUp },
            { id: 'staff', label: 'ลูกน้อง', icon: Users },
            { id: 'leaves', label: 'ใบลา', icon: Calendar, badge: pendingLeavesCount },
            { id: 'advances', label: 'เบิกเงิน', icon: Coins },
            { id: 'violations', label: 'Security', icon: Shield },
            { id: 'settings', label: 'ตั้งค่าร้าน', icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-amber-400 text-slate-950">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="bento-card p-4 space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
                  <span>ความตรงเวลา</span>
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="text-2xl font-black font-mono text-white">{onTimeRate}%</div>
                <div className="text-[10px] text-slate-400">{onTimeRate >= 90 ? 'ตรงตามเป้าหมาย' : 'ต่ำกว่าเป้าหมาย'}</div>
              </div>

              <div className="bento-card p-4 space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
                  <span>คำขอลาค้าง</span>
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div className="text-2xl font-black font-mono text-white">{pendingLeavesCount}</div>
                <div className="text-[10px] text-slate-400">รอการพิจารณา</div>
              </div>
            </div>

            {/* Quick Staff Status List */}
            <div className="bento-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-black text-white">สถานะเข้างานลูกน้อง</span>
                </div>
                <button
                  onClick={() => setActiveTab('staff')}
                  className="text-xs text-blue-400 font-bold hover:underline"
                >
                  ดูทั้งหมด ({formattedStaff.length}) →
                </button>
              </div>

              <div className="space-y-2">
                {formattedStaff.map((emp) => (
                  <div
                    key={emp.id}
                    className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-300 font-black text-xs flex items-center justify-center border border-blue-500/30">
                        {emp.nickname[0] || 'U'}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">
                          {emp.name} ({emp.nickname})
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {emp.code} • {emp.checkInTimeStr}
                        </div>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${emp.badgeColor}`}>
                      {emp.statusLabel}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Export CSV */}
            <button
              onClick={handleExportCSV}
              className="w-full py-3 rounded-xl bento-card border-slate-800 hover:border-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>ดาวน์โหลดรายงานสรุป (Excel / CSV)</span>
            </button>
          </div>
        )}

        {/* TAB 2: STAFF */}
        {activeTab === 'staff' && (
          <div className="space-y-3">
            <div className="space-y-2">
              {formattedStaff.map((emp) => (
                <div key={emp.id} className="bento-card p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-300 font-black text-xs flex items-center justify-center border border-blue-500/30">
                        {emp.nickname[0] || 'U'}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-white">{emp.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{emp.code} • {emp.nickname}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-300 border border-blue-500/30">
                      {emp.role}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                    <div className="text-[10px] text-slate-400">
                      อุปกรณ์: {emp.hwid ? <span className="text-emerald-400 font-bold">ผูกแล้ว</span> : 'ยังไม่ผูก'}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleResetHWID(emp.id, emp.name)}
                        className="px-2 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-bold"
                      >
                        Reset HWID
                      </button>
                      <button
                        onClick={() => handleDeleteEmployee(emp.id, emp.code, emp.name)}
                        className="px-2 py-1 rounded-lg bg-rose-500/15 text-rose-300 border border-rose-500/30 text-[10px] font-bold"
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

        {/* TAB 3: LEAVES */}
        {activeTab === 'leaves' && (
          <div className="space-y-3">
            {leaveRequests.length === 0 ? (
              <div className="p-8 text-center bento-card text-slate-400 text-xs font-bold">
                ไม่มีรายการขอลางานในขณะนี้
              </div>
            ) : (
              <div className="space-y-2">
                {leaveRequests.map((req: any) => (
                  <div key={req.id} className="bento-card p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-white">
                          {req.employee?.full_name || req.employees?.full_name || 'พนักงาน'}
                        </span>
                        <span className="ml-1.5 font-mono text-[10px] text-blue-400 font-bold">
                          [{req.employee?.employee_code || req.employees?.employee_code || req.employee_id?.slice(0, 8)}]
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        {req.leave_type === 'SICK' ? 'ลาป่วย 🩺' : req.leave_type === 'BUSINESS' ? 'ลากิจ 💼' : req.leave_type === 'ANNUAL' ? 'ลาพักร้อน 🏖️' : 'อื่นๆ 📝'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">
                      {req.start_date} {req.end_date && req.end_date !== req.start_date ? `ถึง ${req.end_date}` : ''} ({req.days_count || 1} วัน) • <span className="italic text-slate-300">"{req.reason || 'ไม่ระบุเหตุผล'}"</span>
                    </div>
                    {req.status === 'PENDING' && (
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                        <button
                          onClick={() => handleLeaveAction(req.id, 'APPROVED')}
                          className="px-3 py-1 rounded-lg bg-emerald-600 text-white font-bold text-xs"
                        >
                          อนุมัติ
                        </button>
                        <button
                          onClick={() => handleLeaveAction(req.id, 'REJECTED')}
                          className="px-3 py-1 rounded-lg bg-rose-600 text-white font-bold text-xs"
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

        {/* TAB 4: ADVANCES */}
        {activeTab === 'advances' && (
          <div className="bento-card p-4">
            <SalaryAdvanceManager 
              requests={analyticsData?.salaryAdvanceRequests || []}
              onRefresh={() => loadDashboardData(true)}
              reviewerId="00000000-0000-0000-0000-000000000000"
              onActionCompleted={handleOptimisticAdvanceAction}
            />
          </div>
        )}

        {/* TAB 5: VIOLATIONS */}
        {activeTab === 'violations' && (
          <div className="bento-card p-4">
            <SecurityLogsViewer 
              logs={violationLogs}
              onRefresh={() => loadDashboardData(true)}
              isMobileCompact={true}
            />
          </div>
        )}

        {/* TAB 6: SETTINGS */}
        {activeTab === 'settings' && (
          <div className="space-y-4">
            <div className="bento-card p-4 space-y-3">
              <h3 className="font-black text-sm text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span>พิกัดร้านและ Geofence</span>
              </h3>
              <StoreMapPicker
                lat={Number(storeSettingsForm.store_lat) || 15.110412}
                lng={Number(storeSettingsForm.store_lng) || 104.358434}
                radius={Number(storeSettingsForm.radius_meters) || 50}
                storeName={storeSettingsForm.store_name}
                onChange={(lat, lng) => {
                  setStoreSettingsForm((prev: any) => ({
                    ...prev,
                    store_lat: lat,
                    store_lng: lng,
                  }));
                }}
                onStoreNameChange={(name) => {
                  setStoreSettingsForm((prev: any) => ({
                    ...prev,
                    store_name: name,
                  }));
                }}
                onRadiusChange={(radius) => {
                  setStoreSettingsForm((prev: any) => ({
                    ...prev,
                    radius_meters: radius,
                  }));
                }}
                onSave={handleSaveSettings}
                isSaving={settingsLoading}
              />
            </div>

            <div className="bento-card p-4 space-y-3">
              <h3 className="font-black text-sm text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                <span>นโยบายเวลาเข้างาน</span>
              </h3>

              {settingsMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                  {settingsMsg}
                </div>
              )}

              <form onSubmit={handleSaveSettings} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300">เวลาเข้างาน</label>
                    <input
                      type="time"
                      value={storeSettingsForm.standard_time || '07:40:00'}
                      onChange={(e) => setStoreSettingsForm({ ...storeSettingsForm, standard_time: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-xs font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300">ตัดสาย</label>
                    <input
                      type="time"
                      value={storeSettingsForm.late_deadline || '08:00:00'}
                      onChange={(e) => setStoreSettingsForm({ ...storeSettingsForm, late_deadline: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-xs font-bold"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={settingsLoading}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow-md shadow-blue-600/30"
                >
                  {settingsLoading ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
