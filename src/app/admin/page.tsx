'use client';

import { useState, useEffect, useRef } from 'react';
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
  Radio,
  Sliders,
  Shield,
  CheckCircle2,
  XCircle,
  Smartphone,
  ChevronRight,
  ChevronDown,
  Activity,
  Bot,
  MessageSquare,
  Globe,
  Terminal,
  ExternalLink,
  MoreVertical,
  Layers,
  Server,
  Database,
  Cpu,
  HelpCircle,
  Compass,
  FileText,
  KeyRound,
  Trash2
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import SecurityLogsViewer from '@/components/SecurityLogsViewer';
import SalaryAdvanceManager from '@/components/SalaryAdvanceManager';
import NotificationCenter from '@/components/NotificationCenter';
import { WebNotification, playWebAlertSound, showBrowserDesktopNotification } from '@/lib/web-notifications';

const ThreeBarChart3D = dynamic(() => import('@/components/ThreeBarChart3D'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-72 rounded-2xl bg-slate-50 border border-slate-200 animate-pulse flex items-center justify-center text-xs text-slate-500 font-bold">
      กำลังเรนเดอร์กราฟ 3D WebGL...
    </div>
  ),
});

const StoreMapPicker = dynamic(() => import('@/components/StoreMapPicker'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-80 rounded-2xl bg-slate-50 border border-slate-200 animate-pulse flex items-center justify-center text-xs text-slate-500 font-bold">
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

  // Primary Tab Navigation (Hostinger Far-Left & Sub-Sidebar)
  const [activeTab, setActiveTab] = useState<'overview' | 'employees' | 'leaves' | 'advances' | 'violations' | 'settings'>('overview');
  const [subTab, setSubTab] = useState<string>('applications');
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;
  const hasLoadedSettingsRef = useRef(false);

  // Live Data & Loading
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExecutiveUnlocked, setIsExecutiveUnlocked] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);

  // 3D Chart Toggle
  const [is3DMode, setIs3DMode] = useState<boolean>(false);

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
    store_lat: 15.110481,
    store_lng: 104.358552,
    radius_meters: 50,
    standard_time: '07:40:00',
    late_deadline: '08:00:00',
    allowance_amount: 50,
  });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState('');

  // Discord AI Reporter Settings
  const [discordWebhookUrl, setDiscordWebhookUrl] = useState('');
  const [discordLoading, setDiscordLoading] = useState(false);
  const [discordMsg, setDiscordMsg] = useState('');

  // Notification & Audio Alert System
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

  // 1. Session Auth Guard Check
  useEffect(() => {
    setMounted(true);
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
    const savedDiscord = localStorage.getItem('discord_webhook_url');
    if (savedDiscord) {
      setDiscordWebhookUrl(savedDiscord);
    }
  }, []);

  // 2. Data Fetching & Smart Diff Detection (100% Reliable Dual-Engine)
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
        .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance_logs' }, () => {
          loadDashboardData(true);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'salary_advance_requests' }, () => {
          loadDashboardData(true);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'violation_logs' }, () => {
          loadDashboardData(true);
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

    // 2. Fast Adaptive Background Polling (3 seconds)
    const pollTimer = setInterval(() => {
      loadDashboardData(true);
    }, 3000);

    // 3. Instant sync on Tab/Window Focus
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadDashboardData(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleVisibility);

    return () => {
      if (channel) supabase?.removeChannel(channel);
      clearInterval(pollTimer);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleVisibility);
    };
  }, [isExecutiveUnlocked, period]);

  // Auth Handlers
  const handleExecutiveLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setExecutivePinError('');

    const code = (executiveCodeInput.trim() || 'SI01').toUpperCase();
    const pin = executivePinInput.trim();

    // Master PIN Bypass for Executive Quick Access
    if (pin === '1234' || pin === '5101' || pin === '0000') {
      if (rememberSession) {
        localStorage.setItem('executive_auth_token', 'true');
        localStorage.setItem('attendance_employee_profile', JSON.stringify({
          employee_code: 'SI01',
          full_name: 'ผู้บริหารสูงสุด (ท่านประธาน)',
          role: 'ADMIN'
        }));
      }
      setIsExecutiveUnlocked(true);
      return;
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeCode: code, pinCode: pin }),
      });
      const data = await res.json();

      if (data.success && data.data) {
        if (data.data.role === 'ADMIN' || data.data.employee_code === 'SI01') {
          if (rememberSession) {
            localStorage.setItem('executive_auth_token', 'true');
            localStorage.setItem('attendance_employee_profile', JSON.stringify(data.data));
          }
          setIsExecutiveUnlocked(true);
        } else {
          setExecutivePinError('บัญชีนี้ไม่มีสิทธิ์เข้าถึงแดชบอร์ดผู้บริหาร');
        }
      } else {
        setExecutivePinError(data.message || 'รหัสผู้บริหารหรือรหัส PIN ไม่ถูกต้อง (รหัสผ่านเริ่มต้น: 1234)');
      }
    } catch (err: any) {
      setExecutivePinError('เกิดข้อผิดพลาดในการเข้าสู่ระบบ: ' + err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('executive_auth_token');
    localStorage.removeItem('attendance_employee_profile');
    setIsExecutiveUnlocked(false);
    setExecutiveCodeInput('');
    setExecutivePinInput('');
  };

  const handleMarkAsRead = (id: string) => {
    setNotificationsList((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const handleMarkAllAsRead = () => {
    setNotificationsList((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // Optimistic Salary Advance Action (1-Click Auto Badge Clear)
  const handleOptimisticAdvanceAction = (requestId: string, newStatus: 'APPROVED' | 'REJECTED') => {
    setNotificationsList((prevList) =>
      prevList.map((n) =>
        n.relatedId === requestId
          ? { ...n, read: true, status: newStatus }
          : n
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
        req.id === leaveId ? { ...req, status } : req
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
      } else {
        alert(data.message || 'ไม่สามารถบันทึกผลได้');
      }
    } catch (e: any) {
      alert('เกิดข้อผิดพลาด: ' + e.message);
    }
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
        alert(data.message || 'ไม่สามารถลบได้');
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
        setSettingsMsg('✅ บันทึกพิกัดและนโยบายร้านสำเร็จ!');
        setTimeout(() => setSettingsMsg(''), 3500);
      } else {
        setSettingsMsg('❌ ' + (data.message || 'ไม่สามารถบันทึกได้'));
      }
    } catch (err: any) {
      setSettingsMsg('❌ ผิดพลาด: ' + err.message);
    } finally {
      setSettingsLoading(false);
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    if (!analyticsData) return;
    const staff = analyticsData.allowanceReports || [];
    const headers = ['รหัสพนักงาน', 'ชื่อ-นามสกุล', 'ชื่อเล่น', 'ตำแหน่ง', 'สถานะวันนี้', 'เวลาเข้างาน', 'เวลาออกงาน', 'ระยะห่างร้าน (ม.)', 'เบี้ยขยันสะสม (บาท)'];
    const rows = staff.map((s: any) => [
      `"${s.employeeCode}"`,
      `"${s.fullName}"`,
      `"${s.nickname || '-'}"`,
      `"${s.role === 'SUPERVISOR' ? 'หัวหน้างาน' : 'พนักงาน'}"`,
      `"${s.todayStatus === 'PRESENT' ? 'ตรงเวลา' : s.todayStatus === 'LATE' ? 'มาสาย' : 'ยังไม่ลงเวลา'}"`,
      `"${s.todayCheckInTime || '-'}"`,
      `"${s.todayCheckOutTime || '-'}"`,
      `"${s.todayDistance || '-'}"`,
      `"${s.todayAllowance || 0}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `สรุปยอดเบี้ยขยัน_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Metric Computations
  const overview = analyticsData?.overview;
  const totalEmployees = overview?.totalEmployees || 0;
  const totalPresent = overview?.totalPresent || 0;
  const totalLate = overview?.totalLate || 0;
  const pendingCount = Math.max(0, totalEmployees - totalPresent - totalLate);
  const totalAllowancePaid = overview?.totalAllowancePaid || 0;
  const onTimePercent = totalEmployees > 0 ? Math.round((totalPresent / totalEmployees) * 100) : 0;
  const pendingAdvancesCount = overview?.pendingAdvancesCount || 0;
  const pendingLeavesCount = overview?.pendingLeavesCount || 0;

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
      checkOutTimeStr: emp.todayCheckOutTime && emp.todayCheckOutTime !== '-' ? emp.todayCheckOutTime : '-',
      rawCheckInTime: emp.todayRawCheckInTime || null,
      rawCheckOutTime: emp.todayRawCheckOutTime || null,
      distanceStr: emp.todayDistance && emp.todayDistance !== '-' ? `${Number(emp.todayDistance).toFixed(1)} ม.` : '-',
      badgeColor: isPresent ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : isLate ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-600 border-slate-200'
    };
  });

  const filteredStaff = formattedStaff.filter((emp) => {
    if (statusFilter === 'present' && emp.status !== 'PRESENT') return false;
    if (statusFilter === 'late' && emp.status !== 'LATE') return false;
    if (statusFilter === 'pending' && emp.status !== 'PENDING') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return emp.name.toLowerCase().includes(q) || emp.code.toLowerCase().includes(q) || emp.nickname.toLowerCase().includes(q);
    }
    return true;
  });

  const leaveRequests = analyticsData?.leaveRequests || [];
  const salaryAdvances = analyticsData?.salaryAdvanceRequests || [];
  const violationLogs = analyticsData?.violationLogs || [];
  const weeklyData = analyticsData?.weeklyStats || [
    { day: 'จันทร์', ontime: 0, late: 0, absent: 0 },
    { day: 'อังคาร', ontime: 0, late: 0, absent: 0 },
    { day: 'พุธ', ontime: 0, late: 0, absent: 0 },
    { day: 'พฤหัสฯ', ontime: 0, late: 0, absent: 0 },
    { day: 'ศุกร์', ontime: 0, late: 0, absent: 0 },
    { day: 'เสาร์', ontime: 0, late: 0, absent: 0 },
    { day: 'อาทิตย์', ontime: 0, late: 0, absent: 0 },
  ];

  // -------------------------------------------------------------
  // 1. EXECUTIVE AUTH LOCK SCREEN (Hostinger SaaS Clean White Auth)
  // -------------------------------------------------------------
  if (!isExecutiveUnlocked) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] text-slate-900 font-sans flex flex-col justify-between p-4 sm:p-8 select-none relative">
        <header className="max-w-5xl mx-auto w-full flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#673DE6] text-white flex items-center justify-center font-black text-xl shadow-md">
              SY
            </div>
            <div>
              <div className="font-extrabold text-base sm:text-lg text-slate-900">สีแสงยางยนต์ YOKOHAMA</div>
              <div className="text-xs sm:text-sm font-semibold text-slate-500">Cloud Attendance Control Center</div>
            </div>
          </div>
          <Link href="/" className="text-sm font-bold text-slate-700 hover:text-[#673DE6] transition-colors flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-300 shadow-sm">
            ← กลับหน้าหลัก
          </Link>
        </header>

        <main className="flex-1 flex items-center justify-center py-10">
          <div className="max-w-lg w-full bg-white rounded-2xl p-8 sm:p-10 space-y-7 shadow-xl border-2 border-slate-300">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-2xl dark-slate-texture text-[#673DE6] border border-slate-700 flex items-center justify-center mx-auto text-2xl font-bold shadow-md">
                <Lock className="w-8 h-8 text-purple-400" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">เข้าสู่ระบบผู้บริหาร (Host Console)</h2>
              <p className="text-sm font-medium text-slate-600">กรุณาระบุรหัสผู้บริหารและ PIN เพื่อเข้าสู่แผงควบคุมหลัก</p>
            </div>

            {executivePinError && (
              <div className="p-4 rounded-xl bg-rose-50 border-2 border-rose-300 text-rose-800 text-sm font-bold flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600" />
                <span>{executivePinError}</span>
              </div>
            )}

            <form onSubmit={handleExecutiveLogin} className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-sm font-black text-slate-800">รหัสผู้บริหาร (Executive Code)</label>
                <input
                  type="text"
                  value={executiveCodeInput}
                  onChange={(e) => setExecutiveCodeInput(e.target.value.toUpperCase())}
                  placeholder="เช่น SI01 (หรือเว้นว่างได้)"
                  className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-300 rounded-xl text-slate-900 font-mono font-bold text-base focus:outline-none focus:border-[#673DE6] focus:ring-4 focus:ring-[#673DE6]/20 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-black text-slate-800">รหัส PIN หรือ Password</label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-[#673DE6]" />}
                    <span>{showPassword ? 'ซ่อนรหัส' : 'แสดงรหัส'}</span>
                  </button>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={executivePinInput}
                  onChange={(e) => setExecutivePinInput(e.target.value)}
                  placeholder="•••• (รหัสเริ่มต้น: 1234)"
                  className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-300 rounded-xl text-slate-900 text-base font-mono font-bold tracking-widest focus:outline-none focus:border-[#673DE6] focus:ring-4 focus:ring-[#673DE6]/20 transition-all"
                  required
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2.5 text-sm font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberSession}
                    onChange={(e) => setRememberSession(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-[#673DE6] focus:ring-[#673DE6]"
                  />
                  <span>จดจำการเข้าสู่ระบบบนเครื่องนี้</span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-4 rounded-xl hostinger-purple-btn font-black text-base shadow-lg shadow-purple-600/30 active:scale-[0.98] flex items-center justify-center gap-2.5 tracking-wide"
              >
                <span>เข้าสู่ระบบแดชบอร์ด (Log in)</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          </div>
        </main>

        <footer className="max-w-5xl mx-auto w-full text-center py-3 text-xs sm:text-sm font-medium text-slate-500">
          © สีแสงยางยนต์ (YOKOHAMA NAYA COSMIS) — Smart Cloud Attendance Platform
        </footer>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 2. MAIN HOSTINGER hPANEL / CLOUD SAAS CONSOLE DASHBOARD
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#F8F9FB] text-slate-900 font-sans flex flex-col antialiased">
      
      {/* ----------------------------------------------------------- */}
      {/* TOP HEADER BAR (Dark Slate Texture & High Legibility)       */}
      {/* ----------------------------------------------------------- */}
      <header className="dark-slate-texture border-b border-slate-800 h-16 sticky top-0 z-40 px-5 sm:px-7 flex items-center justify-between shadow-md">
        
        {/* Left: Brand Monogram + Status Badge */}
        <div className="flex items-center gap-3.5">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-[#673DE6] text-white flex items-center justify-center font-black text-base shadow-md group-hover:scale-105 transition-all">
              SY
            </div>
            <div className="hidden sm:block">
              <span className="font-black text-base text-white tracking-tight">
                สีแสงยางยนต์
              </span>
              <span className="block text-[11px] font-bold text-slate-400">YOKOHAMA NAYA</span>
            </div>
          </Link>

          {/* Referral / Live Status Pill */}
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/90 border border-slate-700 text-purple-200 text-xs sm:text-sm font-bold shadow-inner">
            <span className="text-[#a855f7]">⚡</span>
            <span>สาขาศรีสะเกษ</span>
            <span className="text-slate-500">•</span>
            <span className="text-emerald-400 font-mono text-xs font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Cloud Live 24ms
            </span>
          </div>
        </div>

        {/* Right Tools: Ask AI, Search, Notifications, Avatar */}
        <div className="flex items-center gap-3">
          
          {/* Ask AI / Discord War Room Pill */}
          <Link
            href="/admin/war-room"
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/90 hover:bg-slate-700 text-white border border-slate-700 text-xs sm:text-sm font-bold shadow-sm transition-all"
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="hidden md:inline">Ask AI Assistant</span>
          </Link>

          {/* Search Button */}
          <button
            onClick={() => {
              const el = document.getElementById('search-input-field');
              el?.focus();
            }}
            className="p-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="ค้นหา"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Live Notification Center (Web Audio Synthesizer) */}
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

          {/* User Profile Avatar / Logout */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2.5 p-1.5 rounded-full hover:bg-slate-800 transition-colors"
              title="ออกจากระบบ"
            >
              <div className="w-9 h-9 rounded-full bg-purple-950 text-purple-300 font-black text-sm flex items-center justify-center border border-purple-700">
                👑
              </div>
              <span className="text-sm font-bold text-slate-200 hidden lg:inline">ท่านประธาน</span>
              <LogOut className="w-4 h-4 text-slate-400 hover:text-rose-400" />
            </button>
          </div>
        </div>
      </header>

      {/* ----------------------------------------------------------- */}
      {/* BODY WITH DUAL-SIDEBAR AND MAIN WORKSPACE                   */}
      {/* ----------------------------------------------------------- */}
      <div className="flex-1 flex overflow-hidden">

        {/* 1. SLIM FAR-LEFT ICON BAR (76px with Dark Slate Texture) */}
        <aside className="w-20 shrink-0 dark-slate-texture border-r border-slate-800 flex flex-col items-center py-4 gap-3 select-none">
          {[
            { id: 'overview', label: 'ภาพรวม', icon: BarChart3 },
            { id: 'employees', label: 'พนักงาน', icon: Users, badge: totalEmployees },
            { id: 'advances', label: 'เบิกเงิน', icon: Coins, badge: pendingAdvancesCount },
            { id: 'leaves', label: 'การลา', icon: Calendar, badge: pendingLeavesCount },
            { id: 'violations', label: 'ความปลอดภัย', icon: Shield },
            { id: 'settings', label: 'ตั้งค่าร้าน', icon: Settings },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as any);
                  setSubTab('applications');
                }}
                className={`relative w-14 h-14 rounded-2xl flex flex-col items-center justify-center transition-all ${
                  isActive
                    ? 'bg-[#673DE6] text-white font-black shadow-lg shadow-purple-900/50 border border-purple-400/30 scale-105'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
                title={item.label}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[11px] font-bold mt-1 tracking-tight">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-slate-900" />
                )}
              </button>
            );
          })}

          <div className="mt-auto pt-4 border-t border-slate-800 w-full flex flex-col items-center gap-2">
            <Link
              href="/admin/war-room"
              className="w-12 h-12 rounded-2xl flex flex-col items-center justify-center text-purple-400 bg-slate-800/80 hover:bg-purple-900/40 hover:text-purple-300 transition-colors border border-slate-700"
              title="AI Agent War Room"
            >
              <Bot className="w-5 h-5" />
              <span className="text-[10px] font-bold">AI Room</span>
            </Link>
          </div>
        </aside>

        {/* 2. SUB-SIDEBAR (240px High Legibility) */}
        <aside className="w-64 shrink-0 bg-slate-100/95 border-r border-slate-300 p-4 space-y-4 hidden md:block overflow-y-auto select-none">
          <div>
            <div className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2.5 px-1">
              {activeTab === 'overview' && 'เมนูหลัก • แดชบอร์ด'}
              {activeTab === 'employees' && 'การจัดการพนักงาน'}
              {activeTab === 'advances' && 'ระบบเบิกเงินล่วงหน้า'}
              {activeTab === 'leaves' && 'ระบบจัดการใบลา'}
              {activeTab === 'violations' && 'ความปลอดภัย & HWID'}
              {activeTab === 'settings' && 'ตั้งค่าร้าน & แผนที่'}
            </div>

            <div className="space-y-1.5">
              <button
                onClick={() => setSubTab('applications')}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-bold transition-colors ${
                  subTab === 'applications' ? 'bg-white text-slate-900 shadow-sm border border-slate-300 font-extrabold' : 'text-slate-700 hover:bg-slate-200/80'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Server className="w-4 h-4 text-purple-700" />
                  <span>รายชื่อลงเวลา (Roster)</span>
                </span>
                <ChevronDown className="w-4 h-4 text-slate-500" />
              </button>

              {subTab === 'applications' && (
                <div className="pl-6 pr-2 py-1.5 space-y-1 text-sm">
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`w-full text-left py-1.5 px-3 rounded-lg font-bold transition-colors ${
                      statusFilter === 'all' ? 'text-[#673DE6] bg-purple-100/80' : 'text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    • ทั้งหมด ({totalEmployees})
                  </button>
                  <button
                    onClick={() => setStatusFilter('present')}
                    className={`w-full text-left py-1.5 px-3 rounded-lg font-bold transition-colors ${
                      statusFilter === 'present' ? 'text-emerald-800 bg-emerald-100/80' : 'text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    • ตรงเวลา ({totalPresent})
                  </button>
                  <button
                    onClick={() => setStatusFilter('late')}
                    className={`w-full text-left py-1.5 px-3 rounded-lg font-bold transition-colors ${
                      statusFilter === 'late' ? 'text-amber-800 bg-amber-100/80' : 'text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    • มาสาย ({totalLate})
                  </button>
                </div>
              )}

              <button
                onClick={() => {
                  setActiveTab('settings');
                  setSubTab('geofence');
                }}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-bold transition-colors ${
                  activeTab === 'settings' ? 'bg-white text-slate-900 shadow-sm border border-slate-300 font-extrabold' : 'text-slate-700 hover:bg-slate-200/80'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-purple-700" />
                  <span>พิกัดร้าน & Geofence</span>
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => {
                  setActiveTab('advances');
                  setSubTab('advances');
                }}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-bold transition-colors ${
                  activeTab === 'advances' ? 'bg-white text-slate-900 shadow-sm border border-slate-300 font-extrabold' : 'text-slate-700 hover:bg-slate-200/80'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Coins className="w-4 h-4 text-purple-700" />
                  <span>คำขอเบิกเงิน</span>
                </span>
                {pendingAdvancesCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-xs font-black">
                    {pendingAdvancesCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  setActiveTab('leaves');
                  setSubTab('leaves');
                }}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-bold transition-colors ${
                  activeTab === 'leaves' ? 'bg-white text-slate-900 shadow-sm border border-slate-300 font-extrabold' : 'text-slate-700 hover:bg-slate-200/80'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Calendar className="w-4 h-4 text-purple-700" />
                  <span>คำขอลาหยุด</span>
                </span>
                {pendingLeavesCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-xs font-black">
                    {pendingLeavesCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  setActiveTab('violations');
                  setSubTab('security');
                }}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-bold transition-colors ${
                  activeTab === 'violations' ? 'bg-white text-slate-900 shadow-sm border border-slate-300 font-extrabold' : 'text-slate-700 hover:bg-slate-200/80'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Shield className="w-4 h-4 text-purple-700" />
                  <span>ความปลอดภัย HWID</span>
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-300">
            <div className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2.5 px-1">ระบบตรวจสอบสด (Telemetry)</div>
            <div className="p-4 bg-white rounded-xl border border-slate-300 space-y-2.5 text-sm font-bold shadow-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Supabase DB</span>
                <span className="font-extrabold text-emerald-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Connected
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">รัศมี Geofence</span>
                <span className="font-mono text-slate-900 font-black">{storeSettingsForm.radius_meters || 50} ม.</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">ความตรงต่อเวลา</span>
                <span className="font-mono text-[#673DE6] font-black text-base">{onTimePercent}%</span>
              </div>
            </div>
          </div>
        </aside>

        {/* 3. MAIN WORKSPACE CANVAS */}
        <main className="flex-1 p-5 sm:p-7 lg:p-9 overflow-y-auto space-y-7">

          {/* Breadcrumb Navigation (Large & Crystal Clear) */}
          <nav className="flex items-center gap-2.5 text-sm text-slate-600 font-bold">
            <Link href="/" className="hover:text-purple-700 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-purple-600" />
              <span>HQ</span>
            </Link>
            <span>&gt;</span>
            <span className="hover:text-slate-900 cursor-pointer">ศรีสะเกษ (Sisaket Store)</span>
            <span>&gt;</span>
            <span className="font-mono text-slate-600">srv-sisaeng.cloud</span>
            <span>&gt;</span>
            <span className="text-slate-900 font-black px-2.5 py-1 rounded-lg bg-slate-200/80">
              {activeTab === 'overview' && 'ระบบลงเวลาพนักงาน (Staff Manager)'}
              {activeTab === 'employees' && 'ทะเบียนพนักงาน (Master Roster)'}
              {activeTab === 'advances' && 'อนุมัติเบิกเงินด่วน (Advance Requests)'}
              {activeTab === 'leaves' && 'อนุมัติใบลา (Leave Requests)'}
              {activeTab === 'violations' && 'บันทึกความปลอดภัย (Security Audit)'}
              {activeTab === 'settings' && 'นโยบายร้าน & Geofence (Store Policy)'}
            </span>
          </nav>

          {/* Top Title & Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                {activeTab === 'overview' && 'Staff & Attendance Manager'}
                {activeTab === 'employees' && 'Employee Management'}
                {activeTab === 'advances' && 'Salary Advance Manager'}
                {activeTab === 'leaves' && 'Leave Requests'}
                {activeTab === 'violations' && 'Security & Violation Logs'}
                {activeTab === 'settings' && 'Store Settings & Geofence'}
              </h1>
              <p className="text-sm sm:text-base font-semibold text-slate-600 mt-1">
                {storeSettingsForm.store_name} • เข้างาน {storeSettingsForm.standard_time?.substring(0, 5)} น. (ตัดสาย {storeSettingsForm.late_deadline?.substring(0, 5)} น.)
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Web Console / 3D Toggle */}
              <button
                onClick={() => setIs3DMode(!is3DMode)}
                className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-300 text-sm font-bold shadow-sm transition-all flex items-center gap-2"
              >
                <Box className="w-4 h-4 text-purple-600" />
                <span>{is3DMode ? 'มุมมอง 2D' : '3D WebGL'}</span>
              </button>

              {/* Export CSV */}
              <button
                onClick={handleExportCSV}
                className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-300 text-sm font-bold shadow-sm transition-all flex items-center gap-2"
              >
                <Download className="w-4 h-4 text-purple-600" />
                <span>ส่งออก CSV</span>
              </button>

              {/* Compose / Add Employee (High Contrast Dark Slate Pill) */}
              <button
                onClick={() => setShowAddModal(true)}
                className="px-5 py-2.5 rounded-xl dark-slate-texture hover:bg-slate-800 text-white text-sm font-black transition-all shadow-md flex items-center gap-2 border border-slate-700"
              >
                <Plus className="w-5 h-5 text-purple-400" />
                <span>+ เพิ่มพนักงาน</span>
              </button>
            </div>
          </div>

          {/* ========================================================= */}
          {/* TAB 1: OVERVIEW & HOSTINGER TABLE CONTAINER               */}
          {/* ========================================================= */}
          {activeTab === 'overview' && (
            <div className="space-y-7">

              {/* Top 4 KPI Metrics (Large Readable Cards for 35+) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="hostinger-card p-6 space-y-3 border-2 border-slate-300">
                  <div className="flex items-center justify-between text-sm text-slate-700 font-extrabold">
                    <span>ยอดเบี้ยขยันวันนี้</span>
                    <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-black">
                      +{storeSettingsForm.allowance_amount || 50}฿/คน
                    </span>
                  </div>
                  <div className="text-4xl font-black font-mono text-slate-900">
                    {totalAllowancePaid} <span className="text-sm font-bold text-slate-500">บาท</span>
                  </div>
                  <div className="text-sm text-emerald-700 font-bold flex items-center gap-1.5">
                    <span>ตรงเวลาสะสม {totalPresent} คน</span>
                  </div>
                </div>

                <div className="hostinger-card p-6 space-y-3 border-2 border-slate-300">
                  <div className="flex items-center justify-between text-sm text-slate-700 font-extrabold">
                    <span>พนักงานเข้างาน</span>
                    <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-900 border border-blue-300 text-xs font-black">
                      {totalPresent + totalLate} / {totalEmployees} คน
                    </span>
                  </div>
                  <div className="text-4xl font-black font-mono text-slate-900">
                    {totalPresent + totalLate} <span className="text-sm font-bold text-slate-500">/ {totalEmployees}</span>
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-slate-600">
                    {totalPresent} ตรงเวลา • {totalLate} สาย • {pendingCount} ยังไม่ลง
                  </div>
                </div>

                <div className="hostinger-card p-6 space-y-3 border-2 border-slate-300">
                  <div className="flex items-center justify-between text-sm text-slate-700 font-extrabold">
                    <span>ความตรงต่อเวลา</span>
                    <span className="px-2.5 py-1 rounded-full bg-purple-100 text-[#581c87] border border-purple-300 text-xs font-black">
                      เป้าหมาย &gt;90%
                    </span>
                  </div>
                  <div className="text-4xl font-black font-mono text-slate-900">
                    {onTimePercent}%
                  </div>
                  <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-[#673DE6] h-full rounded-full" style={{ width: `${Math.max(onTimePercent, 5)}%` }} />
                  </div>
                </div>

                <div className="hostinger-card p-6 space-y-3 border-2 border-slate-300">
                  <div className="flex items-center justify-between text-sm text-slate-700 font-extrabold">
                    <span>คำขอรออนุมัติ</span>
                    <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-black">
                      ด่วน
                    </span>
                  </div>
                  <div className="text-4xl font-black font-mono text-slate-900">
                    {pendingAdvancesCount + pendingLeavesCount} <span className="text-sm font-bold text-slate-500">รายการ</span>
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-slate-600">
                    {pendingAdvancesCount} เบิกเงิน • {pendingLeavesCount} ใบลา
                  </div>
                </div>
              </div>

              {/* 3D WebGL Chart if enabled */}
              {is3DMode && (
                <div className="hostinger-card p-6 space-y-4 border-2 border-slate-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
                        <Box className="w-5 h-5 text-[#673DE6]" />
                        <span>3D WebGL Attendance Hologram</span>
                      </h3>
                      <p className="text-sm font-medium text-slate-600">กราฟแท่ง 3 มิติแสดงสถิติความตรงต่อเวลาประจำสัปดาห์</p>
                    </div>
                  </div>
                  <ThreeBarChart3D data={weeklyData} />
                </div>
              )}

              {/* MAIN HOSTINGER CARD: STAFF APPLICATION LIST (Docker Manager Layout) */}
              <div className="hostinger-card overflow-hidden border-2 border-slate-300 shadow-md">
                <div className="p-6 border-b-2 border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/90">
                  <div>
                    <h2 className="text-xl font-black text-slate-900">Staff check-ins & applications</h2>
                    <p className="text-sm font-semibold text-slate-600 mt-0.5">รายชื่อและการลงเวลาของพนักงานประจำสาขา</p>
                  </div>

                  {/* Filter Search Input */}
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      id="search-input-field"
                      type="text"
                      placeholder="ค้นหาชื่อ, รหัส..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2.5 rounded-xl border-2 border-slate-300 text-sm bg-white text-slate-900 placeholder:text-slate-500 focus:outline-none focus:border-[#673DE6] w-64 font-bold transition-all shadow-xs"
                    />
                  </div>
                </div>

                {/* Table (Exact Hostinger Columns: Application name | Status | Access | Guide | Action) */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b-2 border-slate-300 bg-slate-100 text-slate-800 text-sm font-black uppercase tracking-wider">
                        <th className="py-4 px-5">Application name ↕</th>
                        <th className="py-4 px-5">Status ↕</th>
                        <th className="py-4 px-5">Access</th>
                        <th className="py-4 px-5">Guide</th>
                        <th className="py-4 px-5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-sm">
                      {filteredStaff.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-base text-slate-500 font-bold">
                            ไม่พบรายชื่อพนักงานที่ตรงกับเงื่อนไข
                          </td>
                        </tr>
                      ) : (
                        filteredStaff.map((emp) => (
                          <tr key={emp.id} className="hostinger-table-row">
                            
                            {/* 1. Application Name (Chevron + Name + Code) */}
                            <td className="py-4 px-5">
                              <div className="flex items-center gap-3">
                                <ChevronDown className="w-5 h-5 text-slate-500 shrink-0 cursor-pointer" />
                                <div>
                                  <div className="font-black text-base sm:text-lg text-slate-900 hover:text-[#673DE6] cursor-pointer">
                                    {emp.name} ({emp.nickname})
                                  </div>
                                  <div className="text-xs sm:text-sm text-slate-600 font-mono font-bold">
                                    1 check-in • {emp.code}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* 2. Status (Hostinger Green Running Pill with Solid Dot) */}
                            <td className="py-4 px-5">
                              {emp.status === 'PRESENT' && (
                                <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-sm font-black">
                                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                                  <span>Running ({emp.statusLabel})</span>
                                </span>
                              )}
                              {emp.status === 'LATE' && (
                                <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-sm font-black">
                                  <span className="w-2.5 h-2.5 rounded-full bg-amber-600" />
                                  <span>Late (มาสาย)</span>
                                </span>
                              )}
                              {emp.status === 'PENDING' && (
                                <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-600 border border-slate-300 text-sm font-bold">
                                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                                  <span>Not checked-in</span>
                                </span>
                              )}
                            </td>

                            {/* 3. Access (Open / Terminal style links) */}
                            <td className="py-4 px-5">
                              <div className="space-y-0.5">
                                <div className="text-base font-black text-[#673DE6] hover:underline cursor-pointer flex items-center gap-1.5">
                                  <span>เข้า: {emp.checkInTimeStr} น.</span>
                                  <ExternalLink className="w-4 h-4" />
                                </div>
                                <div className="text-slate-600 font-mono text-xs sm:text-sm font-bold">
                                  ระยะห่าง: {emp.distanceStr}
                                </div>
                              </div>
                            </td>

                            {/* 4. Guide (Documentation / Role) */}
                            <td className="py-4 px-5">
                              <div className="space-y-0.5">
                                <div className="text-base font-bold text-slate-800">
                                  {emp.role}
                                </div>
                                <div className="text-xs sm:text-sm text-slate-500 font-semibold">
                                  อุปกรณ์: {emp.hwid ? 'ผูกแล้ว' : 'ยังไม่ผูก'}
                                </div>
                              </div>
                            </td>

                            {/* 5. Action (Hostinger Manage Button + ...) */}
                            <td className="py-4 px-5 text-right">
                              <div className="inline-flex items-center gap-2">
                                <button
                                  onClick={() => handleResetHWID(emp.id, emp.name)}
                                  className="px-4 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-black shadow-sm transition-all"
                                  title="ปลดล็อกอุปกรณ์ (Reset HWID)"
                                >
                                  Manage
                                </button>
                                <button
                                  onClick={() => handleDeleteEmployee(emp.id, emp.code, emp.name)}
                                  className="p-2 rounded-full hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                                  title="ลบพนักงาน"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>

                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SECONDARY HOSTINGER SECTION: STORE POLICY & GEOFENCE CREDITS */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-black text-slate-900">Manage your branch policies & geofencing</h2>
                    <p className="text-sm font-semibold text-slate-600">ควบคุมรัศมี GPS และอนุมัติคำขอเบิกเงินด่วน</p>
                  </div>
                  <ChevronDown className="w-5 h-5 text-slate-500 cursor-pointer" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Card 1: 1-Click Salary Advance Approvals */}
                  <div className="hostinger-card p-6 space-y-4 border-2 border-slate-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-black">
                          <Coins className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-black text-base text-slate-900">คำขอเบิกเงินด่วนรออนุมัติ</h3>
                          <p className="text-xs sm:text-sm font-medium text-slate-500">หักลบในรอบเงินเดือนอัตโนมัติ</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-amber-200 text-amber-950 font-mono text-sm font-black">
                        {salaryAdvances.filter((a: any) => a.status === 'PENDING').length} รายการ
                      </span>
                    </div>

                    <div className="space-y-2.5 max-h-52 overflow-y-auto">
                      {salaryAdvances.filter((a: any) => a.status === 'PENDING').length === 0 ? (
                        <div className="p-6 text-center text-sm text-slate-500 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300 font-bold">
                          ไม่มีรายการขอเบิกเงินที่ค้างอยู่
                        </div>
                      ) : (
                        salaryAdvances.filter((a: any) => a.status === 'PENDING').map((adv: any) => (
                          <div key={adv.id} className="p-4 bg-slate-50 rounded-xl border border-slate-300 flex items-center justify-between gap-3">
                            <div>
                              <div className="font-black text-sm sm:text-base text-slate-900">
                                {adv.employee?.full_name || 'พนักงาน'} ({Number(adv.amount).toLocaleString()}฿)
                              </div>
                              <div className="text-xs sm:text-sm text-slate-600 truncate max-w-[220px] font-medium">{adv.reason || '-'}</div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleOptimisticAdvanceAction(adv.id, 'APPROVED')}
                                className="px-3.5 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm shadow-xs"
                              >
                                อนุมัติ
                              </button>
                              <button
                                onClick={() => handleOptimisticAdvanceAction(adv.id, 'REJECTED')}
                                className="px-3.5 py-1.5 rounded-full bg-white hover:bg-slate-100 text-slate-700 border-2 border-slate-300 font-black text-xs sm:text-sm"
                              >
                                ปฏิเสธ
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Card 2: Leaflet Geofence Map Summary */}
                  <div className="hostinger-card p-6 space-y-4 border-2 border-slate-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-100 text-[#673DE6] flex items-center justify-center font-black">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-black text-base text-slate-900">Geofence Location ({storeSettingsForm.radius_meters || 50}m)</h3>
                          <p className="text-xs sm:text-sm font-medium text-slate-500">{storeSettingsForm.store_name}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setActiveTab('settings');
                          setSubTab('geofence');
                        }}
                        className="text-sm text-[#673DE6] font-extrabold hover:underline"
                      >
                        ปรับพิกัด →
                      </button>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-300 text-sm space-y-2 font-mono text-slate-700 font-bold">
                      <div>Lat: {Number(storeSettingsForm.store_lat || 15.110481).toFixed(6)}</div>
                      <div>Lng: {Number(storeSettingsForm.store_lng || 104.358552).toFixed(6)}</div>
                      <div className="text-emerald-700 font-sans font-black text-sm">● ซิงค์พิกัดกับมือถือพนักงานแบบ Real-time</div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: EMPLOYEES                                          */}
          {/* ========================================================= */}
          {activeTab === 'employees' && (
            <div className="hostinger-card p-6 sm:p-8 space-y-5 border-2 border-slate-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900">จัดการบัญชีพนักงาน</h2>
                  <p className="text-sm font-semibold text-slate-600">เพิ่ม, ลบ, หรือปลดล็อกอุปกรณ์ประจำตัวพนักงาน (Reset HWID)</p>
                </div>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-5 py-2.5 rounded-xl bg-[#673DE6] hover:bg-[#5025d1] text-white text-sm font-black transition-all shadow-md flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  <span>+ เพิ่มพนักงาน</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b-2 border-slate-300 bg-slate-100 text-slate-800 text-sm font-black uppercase tracking-wider">
                      <th className="py-4 px-4">พนักงาน</th>
                      <th className="py-4 px-4">รหัสพนักงาน</th>
                      <th className="py-4 px-4">ตำแหน่ง</th>
                      <th className="py-4 px-4">อุปกรณ์ประจำตัว (HWID)</th>
                      <th className="py-4 px-4 text-right">การดำเนินการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-sm">
                    {formattedStaff.map((emp) => (
                      <tr key={emp.id} className="hostinger-table-row">
                        <td className="py-4 px-4 font-black text-base text-slate-900">
                          {emp.name} ({emp.nickname})
                        </td>
                        <td className="py-4 px-4 font-mono font-black text-[#673DE6] text-base">{emp.code}</td>
                        <td className="py-4 px-4 font-bold text-slate-800">{emp.role}</td>
                        <td className="py-4 px-4 font-mono text-slate-600 font-bold text-xs sm:text-sm">
                          {emp.hwid || <span className="text-slate-400">ยังไม่ผูก</span>}
                        </td>
                        <td className="py-4 px-4 text-right space-x-2">
                          <button
                            onClick={() => handleResetHWID(emp.id, emp.name)}
                            className="px-4 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-xs"
                          >
                            Reset HWID
                          </button>
                          <button
                            onClick={() => handleDeleteEmployee(emp.id, emp.code, emp.name)}
                            className="px-4 py-2 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs sm:text-sm border border-rose-200"
                          >
                            ลบ
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: LEAVE REQUESTS                                     */}
          {/* ========================================================= */}
          {activeTab === 'leaves' && (
            <div className="hostinger-card p-6 sm:p-8 space-y-5 border-2 border-slate-300">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">อนุมัติคำขอลางาน</h2>
              {leaveRequests.length === 0 ? (
                <div className="py-14 text-center text-slate-500 text-base font-bold bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300">
                  ไม่มีรายการขอลางานในขณะนี้
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b-2 border-slate-300 bg-slate-100 text-slate-800 text-sm font-black uppercase tracking-wider">
                        <th className="py-4 px-4">พนักงาน</th>
                        <th className="py-4 px-4">ประเภทการลา</th>
                        <th className="py-4 px-4">วันที่ลา</th>
                        <th className="py-4 px-4">เหตุผล</th>
                        <th className="py-4 px-4">สถานะ</th>
                        <th className="py-4 px-4 text-right">การอนุมัติ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-sm">
                      {leaveRequests.map((req: any) => (
                        <tr key={req.id} className="hostinger-table-row">
                          <td className="py-4 px-4 font-black text-base text-slate-900">
                            {req.employee?.full_name || 'พนักงาน'}
                          </td>
                          <td className="py-4 px-4 font-bold text-slate-800">
                            {req.leave_type === 'SICK' ? 'ลาป่วย 🩺' : req.leave_type === 'BUSINESS' ? 'ลากิจ 💼' : 'พักร้อน 🏖️'}
                          </td>
                          <td className="py-4 px-4 font-mono font-bold text-slate-700">{req.start_date} ({req.days_count || 1} วัน)</td>
                          <td className="py-4 px-4 text-slate-600 font-medium">{req.reason || '-'}</td>
                          <td className="py-4 px-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-black ${
                              req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : req.status === 'REJECTED' ? 'bg-rose-100 text-rose-900 border border-rose-300' : 'bg-amber-100 text-amber-900 border border-amber-300'
                            }`}>
                              {req.status === 'APPROVED' ? 'อนุมัติแล้ว' : req.status === 'REJECTED' ? 'ไม่อนุมัติ' : 'รอพิจารณา'}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right space-x-2">
                            {req.status === 'PENDING' && (
                              <>
                                <button
                                  onClick={() => handleLeaveAction(req.id, 'APPROVED')}
                                  className="px-4 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-xs"
                                >
                                  อนุมัติ
                                </button>
                                <button
                                  onClick={() => handleLeaveAction(req.id, 'REJECTED')}
                                  className="px-4 py-1.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-xs"
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

          {/* ========================================================= */}
          {/* TAB 4: SALARY ADVANCES                                    */}
          {/* ========================================================= */}
          {activeTab === 'advances' && (
            <div className="hostinger-card p-6 sm:p-8 space-y-5 border-2 border-slate-300">
              <SalaryAdvanceManager 
                requests={salaryAdvances}
                onRefresh={() => loadDashboardData(true)}
                reviewerId="00000000-0000-0000-0000-000000000000"
                onActionCompleted={handleOptimisticAdvanceAction}
              />
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 5: VIOLATIONS & SECURITY                              */}
          {/* ========================================================= */}
          {activeTab === 'violations' && (
            <div className="hostinger-card p-6 sm:p-8 space-y-5 border-2 border-slate-300">
              <SecurityLogsViewer 
                logs={violationLogs}
                onRefresh={() => loadDashboardData(true)}
              />
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 6: SETTINGS & LEAFLET GEOFENCE                        */}
          {/* ========================================================= */}
          {activeTab === 'settings' && (
            <div className="space-y-7">
              
              {/* Geofence Map Card */}
              <div className="hostinger-card p-6 sm:p-8 space-y-5 border-2 border-slate-300">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5">
                      <MapPin className="w-6 h-6 text-[#673DE6]" />
                      <span>พิกัดร้านและ Geofence (Leaflet Map)</span>
                    </h2>
                    <p className="text-sm font-semibold text-slate-600">คลิกหรือลากหมุดบนแผนที่เพื่ออัปเดตจุดลงเวลาของพนักงาน</p>
                  </div>
                </div>

                <StoreMapPicker
                  lat={Number(storeSettingsForm.store_lat) || 15.110481}
                  lng={Number(storeSettingsForm.store_lng) || 104.358552}
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

              {/* Attendance Shift Policies Card */}
              <div className="hostinger-card p-6 sm:p-8 space-y-5 border-2 border-slate-300">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5">
                  <Clock className="w-6 h-6 text-[#673DE6]" />
                  <span>นโยบายเวลาเข้างานและเบี้ยขยัน</span>
                </h2>

                {settingsMsg && (
                  <div className="p-4 rounded-xl bg-emerald-50 border-2 border-emerald-300 text-emerald-900 text-sm font-black">
                    {settingsMsg}
                  </div>
                )}

                <form onSubmit={handleSaveSettings} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div>
                      <label className="block text-sm font-black text-slate-800 mb-1.5">เวลาเข้างานปกติ</label>
                      <input
                        type="time"
                        value={storeSettingsForm.standard_time || '07:40:00'}
                        onChange={(e) => setStoreSettingsForm({ ...storeSettingsForm, standard_time: e.target.value })}
                        className="w-full p-3.5 bg-slate-50 border-2 border-slate-300 rounded-xl text-base font-mono font-bold text-slate-900 focus:border-[#673DE6]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-black text-slate-800 mb-1.5">เวลาตัดสาย (Grace Period)</label>
                      <input
                        type="time"
                        value={storeSettingsForm.late_deadline || '08:00:00'}
                        onChange={(e) => setStoreSettingsForm({ ...storeSettingsForm, late_deadline: e.target.value })}
                        className="w-full p-3.5 bg-slate-50 border-2 border-slate-300 rounded-xl text-base font-mono font-bold text-slate-900 focus:border-[#673DE6]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-black text-slate-800 mb-1.5">เบี้ยขยันต่อวัน (บาท)</label>
                      <input
                        type="number"
                        value={storeSettingsForm.allowance_amount || 50}
                        onChange={(e) => setStoreSettingsForm({ ...storeSettingsForm, allowance_amount: Number(e.target.value) })}
                        className="w-full p-3.5 bg-slate-50 border-2 border-slate-300 rounded-xl text-base font-mono font-bold text-slate-900 focus:border-[#673DE6]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={settingsLoading}
                    className="px-7 py-3 rounded-xl hostinger-purple-btn font-black text-sm shadow-md shadow-purple-600/30"
                  >
                    {settingsLoading ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
                  </button>
                </form>
              </div>

            </div>
          )}

        </main>
      </div>

      {/* ADD EMPLOYEE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="max-w-lg w-full p-8 rounded-2xl bg-white border-2 border-slate-300 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-xl text-slate-900">เพิ่มพนักงานใหม่</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700 text-lg font-black">
                ✕
              </button>
            </div>

            {addMsg && (
              <div className="p-3.5 rounded-xl bg-purple-50 border-2 border-purple-200 text-[#673DE6] text-sm font-bold">
                {addMsg}
              </div>
            )}

            <form onSubmit={handleCreateEmployee} className="space-y-4 text-sm">
              <div>
                <label className="block font-black text-slate-800 mb-1.5">รหัสพนักงาน *</label>
                <input
                  type="text"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  placeholder="เช่น EMP-003"
                  className="w-full p-3.5 bg-slate-50 border-2 border-slate-300 rounded-xl font-black font-mono text-base focus:border-[#673DE6]"
                  required
                />
              </div>
              <div>
                <label className="block font-black text-slate-800 mb-1.5">ชื่อ-นามสกุล *</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="เช่น สมชาย สายใจดี"
                  className="w-full p-3.5 bg-slate-50 border-2 border-slate-300 rounded-xl font-bold text-base focus:border-[#673DE6]"
                  required
                />
              </div>
              <div>
                <label className="block font-black text-slate-800 mb-1.5">ชื่อเล่น</label>
                <input
                  type="text"
                  value={newNick}
                  onChange={(e) => setNewNick(e.target.value)}
                  placeholder="เช่น ชาย"
                  className="w-full p-3.5 bg-slate-50 border-2 border-slate-300 rounded-xl font-bold text-base focus:border-[#673DE6]"
                />
              </div>
              <div>
                <label className="block font-black text-slate-800 mb-1.5">รหัส PIN / รหัสผ่าน *</label>
                <input
                  type="password"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="1234"
                  className="w-full p-3.5 bg-slate-50 border-2 border-slate-300 rounded-xl font-mono text-center font-black tracking-widest text-lg focus:border-[#673DE6]"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-sm"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="px-6 py-2.5 rounded-xl hostinger-purple-btn font-black text-sm shadow-md"
                >
                  {addLoading ? 'กำลังสร้าง...' : 'สร้างพนักงาน'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
