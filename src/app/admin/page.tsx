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
import ExecutiveAnalyticsDashboard from '@/components/ExecutiveAnalyticsDashboard';
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
  // 1. EXECUTIVE AUTH LOCK SCREEN (Vercel Style Deep Obsidian)
  // -------------------------------------------------------------
  if (!isExecutiveUnlocked) {
    return (
      <div className="min-h-screen bg-black text-white font-sans flex flex-col justify-between p-4 sm:p-8 select-none relative vercel-bg">
        <header className="max-w-5xl mx-auto w-full flex items-center justify-between py-4 border-b border-neutral-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center font-black text-xl shadow-md">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 75 65">
                <path d="M37.5 0L75 65H0z" />
              </svg>
            </div>
            <div>
              <div className="font-bold text-base sm:text-lg text-white">สีแสงยางยนต์ YOKOHAMA</div>
              <div className="text-xs font-mono text-neutral-400">Executive Console Gate // Vercel</div>
            </div>
          </div>
          <Link href="/" className="text-xs font-mono font-bold text-neutral-400 hover:text-white transition-colors flex items-center gap-1.5 px-4 py-2 rounded-full bg-neutral-900 border border-neutral-800">
            ← หน้าหลัก Portal
          </Link>
        </header>

        <main className="flex-1 flex items-center justify-center py-10">
          <div className="max-w-lg w-full vercel-card p-8 sm:p-10 space-y-7 shadow-2xl border border-neutral-800 bg-[#0a0a0a]">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-neutral-900 border border-neutral-800 text-white flex items-center justify-center mx-auto text-2xl font-bold shadow-inner">
                <Lock className="w-6 h-6 text-neutral-200" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">เข้าสู่ระบบผู้บริหาร (Console)</h2>
              <p className="text-xs font-mono text-neutral-400">กรุณาระบุรหัสผู้บริหารและ PIN เพื่อเข้าสู่แผงควบคุมหลัก</p>
            </div>

            {executivePinError && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono font-bold flex items-center gap-3">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{executivePinError}</span>
              </div>
            )}

            <form onSubmit={handleExecutiveLogin} className="space-y-5 font-mono text-xs">
              <div className="space-y-1.5">
                <label className="block font-bold text-neutral-300">รหัสผู้บริหาร (Executive Code)</label>
                <input
                  type="text"
                  value={executiveCodeInput}
                  onChange={(e) => setExecutiveCodeInput(e.target.value.toUpperCase())}
                  placeholder="เช่น SI01 (หรือเว้นว่างได้)"
                  className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-white font-mono font-bold text-sm focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-neutral-300">รหัส PIN หรือ Password</label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-xs font-mono text-neutral-400 hover:text-white flex items-center gap-1.5"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-neutral-400" />}
                    <span>{showPassword ? 'ซ่อนรหัส' : 'แสดงรหัส'}</span>
                  </button>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={executivePinInput}
                  onChange={(e) => setExecutivePinInput(e.target.value)}
                  placeholder="•••• (รหัสเริ่มต้น: 1234)"
                  className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-sm font-mono font-bold tracking-widest focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all"
                  required
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 text-xs font-mono text-neutral-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberSession}
                    onChange={(e) => setRememberSession(e.target.checked)}
                    className="w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-white focus:ring-white"
                  />
                  <span>จดจำการเข้าสู่ระบบบนเครื่องนี้</span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-full vercel-btn-primary font-bold text-sm shadow-lg shadow-white/10 active:scale-[0.98] flex items-center justify-center gap-2 tracking-wide font-mono"
              >
                <span>เข้าสู่ระบบแดชบอร์ด (Unlock)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </main>

        <footer className="max-w-5xl mx-auto w-full text-center py-4 text-xs font-mono text-neutral-500 border-t border-neutral-800/80">
          ▲ Powered by Vercel Design System • สีแสงยางยนต์ (YOKOHAMA NAYA COSMIS)
        </footer>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 2. MAIN VERCEL PROJECT CONSOLE DASHBOARD
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col antialiased vercel-bg selection:bg-white selection:text-black">
      
      {/* ----------------------------------------------------------- */}
      {/* TOP HEADER BAR (Vercel Project Header & Breadcrumbs)        */}
      {/* ----------------------------------------------------------- */}
      <header className="border-b border-neutral-800/80 backdrop-blur-md h-16 sticky top-0 z-40 px-6 flex items-center justify-between bg-black/80">
        
        {/* Left: Vercel Logo + Project Breadcrumb */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-white text-black flex items-center justify-center font-black group-hover:scale-105 transition-all">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 75 65">
                <path d="M37.5 0L75 65H0z" />
              </svg>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono">
              <span className="text-neutral-400 hover:text-white">สีแสงยางยนต์</span>
              <span className="text-neutral-600">/</span>
              <span className="font-bold text-white">attendance-console</span>
            </div>
          </Link>

          {/* Live Status Pill */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-950 border border-neutral-800 text-xs font-mono text-neutral-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 font-bold">● Production</span>
            <span className="text-neutral-600">•</span>
            <span className="text-neutral-400">24ms</span>
          </div>
        </div>

        {/* Right Tools: Ask AI, Notifications, Avatar */}
        <div className="flex items-center gap-3 font-mono text-xs">
          
          {/* Ask AI / Discord War Room Pill */}
          <Link
            href="/admin/war-room"
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 font-bold shadow-sm transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden md:inline">War Room AI</span>
          </Link>

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
          <div className="flex items-center gap-2.5 pl-2 border-l border-neutral-800">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 p-1.5 rounded-full hover:bg-neutral-900 transition-colors"
              title="ออกจากระบบ"
            >
              <div className="w-7 h-7 rounded-full bg-neutral-800 text-white font-black text-xs flex items-center justify-center border border-neutral-700">
                👑
              </div>
              <span className="font-bold text-neutral-300 hidden lg:inline">ท่านประธาน</span>
              <LogOut className="w-3.5 h-3.5 text-neutral-500 hover:text-rose-400" />
            </button>
          </div>
        </div>
      </header>

      {/* ----------------------------------------------------------- */}
      {/* VERCEL PROJECT NAVIGATION TABS BAR                          */}
      {/* ----------------------------------------------------------- */}
      <div className="border-b border-neutral-800/80 px-6 flex items-center gap-1 overflow-x-auto select-none bg-neutral-950/40 font-mono text-xs">
        {[
          { id: 'overview', label: 'Overview // ภาพรวม', icon: BarChart3 },
          { id: 'employees', label: 'Workforce // พนักงาน', icon: Users, badge: totalEmployees },
          { id: 'advances', label: 'Salary Advances // เบิกเงิน', icon: Coins, badge: pendingAdvancesCount },
          { id: 'leaves', label: 'Leaves // การลา', icon: Calendar, badge: pendingLeavesCount },
          { id: 'violations', label: 'Security // HWID Logs', icon: Shield },
          { id: 'settings', label: 'Store & Geofence // พิกัด', icon: Settings },
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
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-bold transition-all shrink-0 ${
                isActive
                  ? 'border-white text-white'
                  : 'border-transparent text-neutral-400 hover:text-white hover:border-neutral-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-neutral-800 border border-neutral-700 text-white text-[10px]">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ----------------------------------------------------------- */}
      {/* MAIN WORKSPACE CANVAS (Vercel Deep Obsidian)                */}
      {/* ----------------------------------------------------------- */}
      <div className="flex-1 p-6 sm:p-8 lg:p-10 space-y-8 max-w-7xl mx-auto w-full">

        {/* Léo Parpeix / Vercel Header Action Ribbon */}
        <div className="border-b border-neutral-800 pb-5 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-mono text-neutral-400 block mb-1">
              PROJECT // yokohama-attendance-engine • {storeSettingsForm.store_name}
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight uppercase">
              {activeTab === 'overview' && 'STAFF & ATTENDANCE'}
              {activeTab === 'employees' && 'EMPLOYEE MANAGEMENT'}
              {activeTab === 'advances' && 'SALARY ADVANCE MANAGER'}
              {activeTab === 'leaves' && 'LEAVE REQUESTS HUB'}
              {activeTab === 'violations' && 'SECURITY & VIOLATIONS'}
              {activeTab === 'settings' && 'STORE POLICY & GEOFENCE'}
            </h1>
            <p className="text-xs font-mono text-neutral-400 mt-1 uppercase">
              STANDARD: {storeSettingsForm.standard_time?.substring(0, 5)} • LATE CUTOFF: {storeSettingsForm.late_deadline?.substring(0, 5)} • GEOFENCE: {storeSettingsForm.radius_meters || 50}M
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 font-mono text-xs">
            {/* 3D WebGL Hologram Toggle */}
            <button
              onClick={() => setIs3DMode(!is3DMode)}
              className="px-4 py-2.5 rounded-full bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700 font-bold transition-all flex items-center gap-2"
            >
              <Box className="w-3.5 h-3.5 text-blue-400" />
              <span>{is3DMode ? '2D View' : '3D Hologram ↗'}</span>
            </button>

            {/* Export CSV */}
            <button
              onClick={handleExportCSV}
              className="px-4 py-2.5 rounded-full bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700 font-bold transition-all flex items-center gap-2"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV 📥</span>
            </button>

            {/* Add Employee (Vercel White Pill) */}
            <button
              onClick={() => setShowAddModal(true)}
              className="px-5 py-2.5 vercel-btn-primary font-bold transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4 text-black" />
              <span>+ เพิ่มพนักงาน</span>
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* TAB 1: OVERVIEW & ANALYTICS DASHBOARD CONTAINER           */}
        {/* ========================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-8">

            {/* 1. EXECUTIVE ANALYTICS GRAPH DASHBOARD (Sparklines, Stacked Bar & Donut) */}
            <ExecutiveAnalyticsDashboard 
              overview={overview} 
              weeklyStats={weeklyData} 
              employees={analyticsData?.employees || []} 
              attendanceLogs={analyticsData?.attendanceLogs || []} 
              salaryAdvances={salaryAdvances} 
              leaveRequests={leaveRequests}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />

            {/* 2. 3D WebGL Chart Hologram (Optional Toggle) */}
            {is3DMode && (
              <div className="vercel-card p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                  <div>
                    <span className="text-xs font-mono text-blue-400">
                      3D SPATIAL DATA // WEBGL INTERACTIVE
                    </span>
                    <h3 className="font-bold text-lg text-white flex items-center gap-2">
                      <Box className="w-5 h-5 text-purple-400" />
                      <span>ATTENDANCE HOLOGRAM VISUALIZER</span>
                    </h3>
                  </div>
                  <span className="text-xs font-mono font-bold text-neutral-500">
                    🖱️ DRAG TO ROTATE 360°
                  </span>
                </div>
                <ThreeBarChart3D data={weeklyData} />
              </div>
            )}

            {/* 3. VERCEL WORKFORCE CATALOG & ATTENDANCE ROSTER */}
            <div className="vercel-card overflow-hidden">
              <div className="p-6 border-b border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-neutral-950/80">
                <div>
                  <span className="text-xs font-mono text-purple-400 font-bold">INDEX // 01 • REAL-TIME WORKFORCE CATALOG</span>
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">STAFF APPLICATIONS & CHECK-INS</h2>
                  <p className="text-xs font-mono text-neutral-400 mt-0.5">ตารางรายชื่อและการลงเวลาพนักงานประจำสาขา</p>
                </div>

                {/* Filter Search Input */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <input
                    id="search-input-field"
                    type="text"
                    placeholder="SEARCH STAFF, ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 rounded-full border border-neutral-800 text-xs bg-black text-white placeholder:text-neutral-500 focus:outline-none focus:border-white w-64 font-mono font-bold transition-all shadow-xs uppercase"
                  />
                </div>
              </div>

              {/* Table (Vercel Style Grid) */}
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead>
                    <tr className="border-b border-neutral-800 bg-neutral-950/60 text-neutral-400 uppercase tracking-wider">
                      <th className="py-3.5 px-5 font-bold">APPLICATION / STAFF</th>
                      <th className="py-3.5 px-5 font-bold">STATUS</th>
                      <th className="py-3.5 px-5 font-bold">TELEMETRY</th>
                      <th className="py-3.5 px-5 font-bold">ROLE & DEVICE</th>
                      <th className="py-3.5 px-5 text-right font-bold">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800 bg-black/40">
                    {filteredStaff.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-sm text-neutral-500 font-bold">
                          ไม่พบรายชื่อพนักงานที่ตรงกับเงื่อนไข
                        </td>
                      </tr>
                    ) : (
                      filteredStaff.map((emp, idx) => (
                        <tr key={emp.id} className="editorial-row group">
                          
                          {/* 1. Index & Name */}
                          <td className="py-3.5 px-5">
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-xs font-bold text-neutral-500 select-none">
                                [{String(idx + 1).padStart(2, '0')}]
                              </span>
                              <div>
                                <div className="font-bold text-sm text-white group-hover:text-blue-400 transition-colors flex items-center gap-1.5">
                                  <span>{emp.name}</span>
                                  <span className="text-neutral-500 text-xs">({emp.nickname})</span>
                                </div>
                                <div className="text-[11px] text-neutral-500 font-mono">
                                  CODE: {emp.code}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* 2. Status */}
                          <td className="py-3.5 px-5">
                            {emp.status === 'PRESENT' && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold font-mono">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                <span>ตรงเวลา (+50฿)</span>
                              </span>
                            )}
                            {emp.status === 'LATE' && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[11px] font-bold font-mono">
                                <span className="w-2 h-2 rounded-full bg-amber-400" />
                                <span>มาสาย (Late)</span>
                              </span>
                            )}
                            {emp.status === 'PENDING' && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-neutral-800 text-neutral-400 border border-neutral-700 text-[11px] font-bold font-mono">
                                <span className="w-2 h-2 rounded-full bg-neutral-500" />
                                <span>ยังไม่ลงเวลา</span>
                              </span>
                            )}
                          </td>

                          {/* 3. Access Telemetry */}
                          <td className="py-3.5 px-5">
                            <div className="space-y-0.5">
                              <div className="text-xs font-bold text-blue-400 font-mono">
                                IN: {emp.checkInTimeStr}
                              </div>
                              <div className="text-neutral-500 font-mono text-[11px]">
                                DIST: {emp.distanceStr}
                              </div>
                            </div>
                          </td>

                          {/* 4. Guide Role & HWID */}
                          <td className="py-3.5 px-5">
                            <div className="space-y-0.5">
                              <div className="text-xs font-bold text-neutral-300">
                                {emp.role}
                              </div>
                              <div className="text-[11px] font-mono text-neutral-500 uppercase">
                                HWID: {emp.hwid ? 'LOCKED ✓' : 'UNBOUND'}
                              </div>
                            </div>
                          </td>

                          {/* 5. Action */}
                          <td className="py-3.5 px-5 text-right">
                            <div className="inline-flex items-center gap-2">
                              <button
                                onClick={() => handleResetHWID(emp.id, emp.name)}
                                className="px-3 py-1 rounded-md bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700 text-xs font-bold font-mono transition-all"
                                title="ปลดล็อกอุปกรณ์ (Reset HWID)"
                              >
                                Reset HWID
                              </button>
                              <button
                                onClick={() => handleDeleteEmployee(emp.id, emp.code, emp.name)}
                                className="p-1.5 rounded-md hover:bg-rose-500/10 text-neutral-500 hover:text-rose-400 transition-colors"
                                title="ลบพนักงาน"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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

            {/* 4. SECONDARY SECTION: ADVANCES & GEOFENCE */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Card 1: 1-Click Salary Advance Approvals */}
              <div className="vercel-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 text-amber-400 flex items-center justify-center font-bold">
                      <Coins className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-white">คำขอเบิกเงินด่วนรออนุมัติ</h3>
                      <p className="text-xs font-mono text-neutral-400">หักลบในรอบเงินเดือนอัตโนมัติ</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono text-xs font-bold">
                    {salaryAdvances.filter((a: any) => a.status === 'PENDING').length} รายการ
                  </span>
                </div>

                <div className="space-y-2.5 max-h-52 overflow-y-auto">
                  {salaryAdvances.filter((a: any) => a.status === 'PENDING').length === 0 ? (
                    <div className="p-6 text-center text-xs font-mono text-neutral-500 bg-black/40 rounded-xl border border-dashed border-neutral-800">
                      ไม่มีรายการขอเบิกเงินที่ค้างอยู่
                    </div>
                  ) : (
                    salaryAdvances.filter((a: any) => a.status === 'PENDING').map((adv: any) => (
                      <div key={adv.id} className="p-3.5 bg-black/60 rounded-xl border border-neutral-800 flex items-center justify-between gap-3 font-mono text-xs">
                        <div>
                          <div className="font-bold text-white">
                            {adv.employee?.full_name || 'พนักงาน'} ({Number(adv.amount).toLocaleString()}฿)
                          </div>
                          <div className="text-neutral-400 truncate max-w-[200px] text-[11px]">{adv.reason || '-'}</div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleOptimisticAdvanceAction(adv.id, 'APPROVED')}
                            className="px-3 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                          >
                            อนุมัติ
                          </button>
                          <button
                            onClick={() => handleOptimisticAdvanceAction(adv.id, 'REJECTED')}
                            className="px-3 py-1 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 font-bold"
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
              <div className="vercel-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 text-purple-400 flex items-center justify-center font-bold">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-white">Geofence Radar ({storeSettingsForm.radius_meters || 50}m)</h3>
                      <p className="text-xs font-mono text-neutral-400">{storeSettingsForm.store_name}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setActiveTab('settings');
                      setSubTab('geofence');
                    }}
                    className="text-xs font-mono text-purple-400 font-bold hover:underline"
                  >
                    [ ปรับพิกัด → ]
                  </button>
                </div>

                <div className="p-4 bg-black/60 rounded-xl border border-neutral-800 text-xs space-y-2 font-mono text-neutral-300">
                  <div>Lat: {Number(storeSettingsForm.store_lat || 15.110481).toFixed(6)}</div>
                  <div>Lng: {Number(storeSettingsForm.store_lng || 104.358552).toFixed(6)}</div>
                  <div className="text-emerald-400 font-sans font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    ซิงค์พิกัดกับมือถือพนักงานแบบ Real-time
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
            <div className="vercel-card p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white">จัดการบัญชีพนักงาน</h2>
                  <p className="text-xs font-mono text-neutral-400 mt-0.5">เพิ่ม, ลบ, หรือปลดล็อกอุปกรณ์ประจำตัวพนักงาน (Reset HWID)</p>
                </div>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-5 py-2.5 vercel-btn-primary text-xs font-mono font-bold flex items-center gap-2"
                >
                  <Plus className="w-4 h-4 text-black" />
                  <span>+ เพิ่มพนักงาน</span>
                </button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-neutral-800">
                <table className="w-full text-left font-mono text-xs">
                  <thead>
                    <tr className="border-b border-neutral-800 bg-neutral-950 text-neutral-400 uppercase tracking-wider">
                      <th className="py-3.5 px-4 font-bold">พนักงาน</th>
                      <th className="py-3.5 px-4 font-bold">รหัสพนักงาน</th>
                      <th className="py-3.5 px-4 font-bold">ตำแหน่ง</th>
                      <th className="py-3.5 px-4 font-bold">HWID Lock</th>
                      <th className="py-3.5 px-4 text-right font-bold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800 bg-black/40">
                    {formattedStaff.map((emp) => (
                      <tr key={emp.id} className="editorial-row hover:bg-neutral-900/60">
                        <td className="py-3.5 px-4 font-bold text-sm text-white">
                          {emp.name} ({emp.nickname})
                        </td>
                        <td className="py-3.5 px-4 font-bold text-blue-400">{emp.code}</td>
                        <td className="py-3.5 px-4 text-neutral-300">{emp.role}</td>
                        <td className="py-3.5 px-4 text-neutral-400 text-xs">
                          {emp.hwid ? (
                            <span className="text-emerald-400 font-bold">{emp.hwid}</span>
                          ) : (
                            <span className="text-neutral-500">ยังไม่ผูกเครื่อง</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-2">
                          <button
                            onClick={() => handleResetHWID(emp.id, emp.name)}
                            className="px-3 py-1.5 rounded-md bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700 font-bold"
                          >
                            Reset HWID
                          </button>
                          <button
                            onClick={() => handleDeleteEmployee(emp.id, emp.code, emp.name)}
                            className="px-3 py-1.5 rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold"
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
            <div className="vercel-card p-6 sm:p-8 space-y-6">
              <h2 className="text-xl sm:text-2xl font-black text-white">อนุมัติคำขอลางาน</h2>
              {leaveRequests.length === 0 ? (
                <div className="py-14 text-center text-neutral-500 text-xs font-mono bg-black/40 rounded-xl border border-dashed border-neutral-800">
                  ไม่มีรายการขอลางานในขณะนี้
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-neutral-800">
                  <table className="w-full text-left font-mono text-xs">
                    <thead>
                      <tr className="border-b border-neutral-800 bg-neutral-950 text-neutral-400 uppercase tracking-wider">
                        <th className="py-3.5 px-4 font-bold">พนักงาน</th>
                        <th className="py-3.5 px-4 font-bold">ประเภท</th>
                        <th className="py-3.5 px-4 font-bold">วันที่ลา</th>
                        <th className="py-3.5 px-4 font-bold">เหตุผล</th>
                        <th className="py-3.5 px-4 font-bold">สถานะ</th>
                        <th className="py-3.5 px-4 text-right font-bold">การอนุมัติ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800 bg-black/40">
                      {leaveRequests.map((req: any) => (
                        <tr key={req.id} className="editorial-row hover:bg-neutral-900/60">
                          <td className="py-3.5 px-4 font-bold text-white">
                            {req.employee?.full_name || 'พนักงาน'}
                          </td>
                          <td className="py-3.5 px-4 text-neutral-300">
                            {req.leave_type === 'SICK' ? 'ลาป่วย 🩺' : req.leave_type === 'BUSINESS' ? 'ลากิจ 💼' : 'พักร้อน 🏖️'}
                          </td>
                          <td className="py-3.5 px-4 text-neutral-400">{req.start_date} ({req.days_count || 1} วัน)</td>
                          <td className="py-3.5 px-4 text-neutral-400">{req.reason || '-'}</td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              req.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : req.status === 'REJECTED' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            }`}>
                              {req.status === 'APPROVED' ? 'อนุมัติแล้ว' : req.status === 'REJECTED' ? 'ไม่อนุมัติ' : 'รอพิจารณา'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-2">
                            {req.status === 'PENDING' && (
                              <>
                                <button
                                  onClick={() => handleLeaveAction(req.id, 'APPROVED')}
                                  className="px-3 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                                >
                                  อนุมัติ
                                </button>
                                <button
                                  onClick={() => handleLeaveAction(req.id, 'REJECTED')}
                                  className="px-3 py-1 rounded-md bg-rose-600 hover:bg-rose-500 text-white font-bold"
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
            <div className="vercel-card p-6 sm:p-8 space-y-6">
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
            <div className="vercel-card p-6 sm:p-8 space-y-6">
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
              <div className="vercel-card p-6 sm:p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
                      <MapPin className="w-6 h-6 text-purple-400" />
                      <span>พิกัดร้านและ Geofence (Leaflet Map)</span>
                    </h2>
                    <p className="text-xs font-mono text-neutral-400 mt-0.5">คลิกหรือลากหมุดบนแผนที่เพื่ออัปเดตจุดลงเวลาของพนักงาน</p>
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
              <div className="vercel-card p-6 sm:p-8 space-y-6">
                <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
                  <Clock className="w-6 h-6 text-purple-400" />
                  <span>นโยบายเวลาเข้างานและเบี้ยขยัน</span>
                </h2>

                {settingsMsg && (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
                    {settingsMsg}
                  </div>
                )}

                <form onSubmit={handleSaveSettings} className="space-y-5 font-mono text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div>
                      <label className="block font-bold text-neutral-300 mb-1.5">เวลาเข้างานปกติ</label>
                      <input
                        type="time"
                        value={storeSettingsForm.standard_time || '07:40:00'}
                        onChange={(e) => setStoreSettingsForm({ ...storeSettingsForm, standard_time: e.target.value })}
                        className="w-full p-3 bg-neutral-950 border border-neutral-800 rounded-xl text-sm font-bold text-white focus:border-white"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-neutral-300 mb-1.5">เวลาตัดสาย (Grace Period)</label>
                      <input
                        type="time"
                        value={storeSettingsForm.late_deadline || '08:00:00'}
                        onChange={(e) => setStoreSettingsForm({ ...storeSettingsForm, late_deadline: e.target.value })}
                        className="w-full p-3 bg-neutral-950 border border-neutral-800 rounded-xl text-sm font-bold text-white focus:border-white"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-neutral-300 mb-1.5">เบี้ยขยันต่อวัน (บาท)</label>
                      <input
                        type="number"
                        value={storeSettingsForm.allowance_amount || 50}
                        onChange={(e) => setStoreSettingsForm({ ...storeSettingsForm, allowance_amount: Number(e.target.value) })}
                        className="w-full p-3 bg-neutral-950 border border-neutral-800 rounded-xl text-sm font-bold text-white focus:border-white"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={settingsLoading}
                    className="px-6 py-3 vercel-btn-primary text-xs font-bold"
                  >
                    {settingsLoading ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า (Save Changes)'}
                  </button>
                </form>
              </div>

            </div>
          )}

        </div>

      {/* ADD EMPLOYEE MODAL (Vercel Style) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="max-w-lg w-full p-8 rounded-2xl vercel-card bg-[#0a0a0a] border border-neutral-800 shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-white">เพิ่มพนักงานใหม่</h3>
              <button onClick={() => setShowAddModal(false)} className="text-neutral-400 hover:text-white text-base font-bold">
                ✕
              </button>
            </div>

            {addMsg && (
              <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-mono font-bold">
                {addMsg}
              </div>
            )}

            <form onSubmit={handleCreateEmployee} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block font-bold text-neutral-300 mb-1.5">รหัสพนักงาน *</label>
                <input
                  type="text"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  placeholder="เช่น EMP-003"
                  className="w-full p-3 bg-neutral-950 border border-neutral-800 rounded-xl font-bold text-white focus:border-white"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-neutral-300 mb-1.5">ชื่อ-นามสกุล *</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="เช่น สมชาย สายใจดี"
                  className="w-full p-3 bg-neutral-950 border border-neutral-800 rounded-xl font-bold text-white focus:border-white"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-neutral-300 mb-1.5">ชื่อเล่น</label>
                <input
                  type="text"
                  value={newNick}
                  onChange={(e) => setNewNick(e.target.value)}
                  placeholder="เช่น ชาย"
                  className="w-full p-3 bg-neutral-950 border border-neutral-800 rounded-xl font-bold text-white focus:border-white"
                />
              </div>
              <div>
                <label className="block font-bold text-neutral-300 mb-1.5">รหัส PIN / รหัสผ่าน *</label>
                <input
                  type="password"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="1234"
                  className="w-full p-3 bg-neutral-950 border border-neutral-800 rounded-xl font-bold text-center tracking-widest text-base text-white focus:border-white"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-full bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-bold text-xs"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="px-5 py-2 vercel-btn-primary font-bold text-xs"
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
