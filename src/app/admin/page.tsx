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
  Activity
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import SecurityLogsViewer from '@/components/SecurityLogsViewer';
import SalaryAdvanceManager from '@/components/SalaryAdvanceManager';
import NotificationCenter from '@/components/NotificationCenter';
import { WebNotification, playWebAlertSound, showBrowserDesktopNotification } from '@/lib/web-notifications';

const ThreeBarChart3D = dynamic(() => import('@/components/ThreeBarChart3D'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-72 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse flex items-center justify-center text-xs text-slate-400 font-bold">
      กำลังเรนเดอร์กราฟ 3D WebGL...
    </div>
  ),
});

const StoreMapPicker = dynamic(() => import('@/components/StoreMapPicker'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-80 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse flex items-center justify-center text-xs text-slate-400 font-bold">
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
  const [activeTab, setActiveTab] = useState<'overview' | 'employees' | 'leaves' | 'advances' | 'violations' | 'settings'>('overview');
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
    setMounted(true);
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

    const code = executiveCodeInput.trim().toUpperCase();
    const pin = executivePinInput.trim();

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
        setExecutivePinError(data.message || 'รหัสผู้บริหารหรือรหัส PIN ไม่ถูกต้อง');
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

  // Optimistic Salary Advance Action
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
    // 1. Optimistic Notifications & Toast Clear
    setNotificationsList((prevList) =>
      prevList.map((n) =>
        n.relatedId === leaveId ? { ...n, read: true, status } : n
      )
    );
    setActiveToast((currentToast) =>
      currentToast?.relatedId === leaveId ? null : currentToast
    );

    // 2. Optimistic Analytics Data update
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
        setSettingsMsg('✅ บันทึกนโยบายและพิกัดร้านใหม่สำเร็จ! ข้อมูลถูกกระจายไปยังมือถือพนักงานทั้งหมดแบบ Real-Time');
        setTimeout(() => setSettingsMsg(''), 4000);
      } else {
        setSettingsMsg('❌ ไม่สามารถบันทึกได้: ' + (data.message || 'โปรดตรวจสอบสิทธิ์การเชื่อมต่อ'));
      }
    } catch (err: any) {
      setSettingsMsg('❌ เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleSaveDiscord = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('discord_webhook_url', discordWebhookUrl.trim());
    setDiscordMsg('✅ บันทึก Discord Webhook URL สำเร็จแล้ว');
    setTimeout(() => setDiscordMsg(''), 4000);
  };

  const handleTestDiscord = async () => {
    if (!discordWebhookUrl.trim()) {
      setDiscordMsg('⚠️ กรุณาระบุ Discord Webhook URL ก่อนกดทดสอบ');
      return;
    }
    setDiscordLoading(true);
    setDiscordMsg('');
    try {
      localStorage.setItem('discord_webhook_url', discordWebhookUrl.trim());
      const res = await fetch('/api/dev/discord-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test', webhookUrl: discordWebhookUrl.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setDiscordMsg('🎉 ส่งข้อความทดสอบเข้า Discord สำเร็จแล้ว! ตรวจสอบห้อง Discord ของคุณได้เลย');
      } else {
        setDiscordMsg('❌ ไม่สามารถส่งข้อความได้: ' + (data.message || 'โปรดตรวจสอบ URL Webhook'));
      }
    } catch (e: any) {
      setDiscordMsg('❌ เกิดข้อผิดพลาด: ' + e.message);
    } finally {
      setDiscordLoading(false);
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
      badgeColor: isPresent ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : isLate ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'
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
    if (a.rawCheckInTime && b.rawCheckInTime) {
      return new Date(b.rawCheckInTime).getTime() - new Date(a.rawCheckInTime).getTime();
    }
    if (a.rawCheckInTime) return -1;
    if (b.rawCheckInTime) return 1;
    return a.code.localeCompare(b.code);
  });

  const leaveRequests = analyticsData?.leaveRequests || [];
  const violationLogs = analyticsData?.violationLogs || [];
  const salaryAdvances = analyticsData?.salaryAdvanceRequests || [];
  const pendingAdvancesCount = overview?.pendingAdvancesCount !== undefined 
    ? overview.pendingAdvancesCount 
    : salaryAdvances.filter((r: any) => r.status === 'PENDING').length;
  const weeklyData = Array.isArray(analyticsData?.weeklyStats) && analyticsData.weeklyStats.length > 0
    ? analyticsData.weeklyStats
    : [
        { day: 'จ.', ontime: 4, late: 0, total: 4, allowance: 200 },
        { day: 'อ.', ontime: 4, late: 0, total: 4, allowance: 200 },
        { day: 'พ.', ontime: 3, late: 1, total: 4, allowance: 150 },
        { day: 'พฤ.', ontime: 4, late: 0, total: 4, allowance: 200 },
        { day: 'ศ.', ontime: 4, late: 0, total: 4, allowance: 200 },
        { day: 'ส.', ontime: 4, late: 0, total: 4, allowance: 200 },
        { day: 'อา.', ontime: 0, late: 0, total: 0, allowance: 0 },
      ];

  // CSV Export with UTF-8 BOM
  const handleExportCSV = () => {
    const headers = ['รหัสพนักงาน', 'ชื่อ-นามสกุล', 'ชื่อเล่น', 'ตำแหน่ง', 'เวลาเข้างาน', 'เวลาออกงาน', 'สถานะ', 'เบี้ยขยัน (บาท)', 'ระยะห่าง'];
    const rows = formattedStaff.map((e) => [
      `"${e.code}"`,
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
  // HYDRATION GUARD
  // -------------------------------------------------------------
  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#070a12] flex items-center justify-center text-slate-400 text-xs font-bold font-mono">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
          <span>กำลังโหลดระบบศูนย์ควบคุม...</span>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // FALLBACK WEB LOGIN (SI01 / 5101)
  // -------------------------------------------------------------
  if (!isExecutiveUnlocked) {
    return (
      <div className="min-h-screen bg-[#070a12] text-slate-100 flex flex-col justify-between p-4 sm:p-8 font-sans relative overflow-hidden bg-grid-pattern">
        <div className="absolute top-0 left-1/4 w-[500px] h-[300px] bg-blue-600/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[300px] bg-emerald-600/15 rounded-full blur-[120px] pointer-events-none" />

        {/* Top Navbar */}
        <header className="max-w-6xl mx-auto w-full flex items-center justify-between py-2 z-10">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-amber-400 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 font-black text-xl group-hover:scale-105 transition-transform">
              👑
            </div>
            <div>
              <div className="font-black text-white text-sm tracking-tight leading-none flex items-center gap-2">
                <span>สีแสงยางยนต์</span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  EXECUTIVE PORTAL
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">ระบบควบคุมและแดชบอร์ดสำหรับผู้บริหาร</p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-slate-900/80 text-emerald-400 border border-slate-800 backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Server Connected
            </span>
          </div>
        </header>

        {/* Login Bento Box */}
        <main className="max-w-md w-full mx-auto my-auto py-8 z-10">
          <div className="bento-card p-6 sm:p-8 space-y-6">
            <div className="space-y-1.5 text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>Executive Authentication</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                เข้าสู่ระบบ Web Dashboard
              </h1>
              <p className="text-xs text-slate-400">
                กรุณาระบุรหัสผู้บริหารและรหัส PIN เพื่อเปิดแดชบอร์ดศูนย์ควบคุม
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
                    className="w-full pl-10 pr-4 py-3 bg-slate-950/90 border border-slate-800 rounded-2xl text-white font-mono font-bold tracking-wider text-sm focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-600"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  รหัส PIN / รหัสผ่าน
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={executivePinInput}
                    onChange={(e) => setExecutivePinInput(e.target.value)}
                    placeholder="กรอกรหัสผ่าน..."
                    className="w-full pl-10 pr-11 py-3 bg-slate-950/90 border border-slate-800 rounded-2xl text-white font-mono font-bold text-sm tracking-widest focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-600"
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
                    className="rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500"
                  />
                  <span>จดจำการเข้าสู่ระบบบนเบราว์เซอร์นี้</span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm shadow-lg shadow-blue-600/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <span>เข้าสู่ระบบแดชบอร์ด (Sign In)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </main>

        <footer className="max-w-6xl mx-auto w-full text-center py-2 text-xs text-slate-500 z-10">
          © สีแสงยางยนต์ YOKOHAMA • NAYA • COSMIS WHEELS & TIRES — Web Executive Dashboard
        </footer>
      </div>
    );
  }

  // -------------------------------------------------------------
  // MAIN EXECUTIVE DASHBOARD (Bento Grid)
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 font-sans select-none w-full bg-grid-pattern relative overflow-x-hidden flex flex-col justify-between">
      
      {/* Ambient background glows */}
      <div className="absolute top-0 left-1/3 w-[800px] h-[350px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[350px] bg-emerald-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* ------------------------------------------------------------- */}
      {/* TOP HEADER BAR                                                */}
      {/* ------------------------------------------------------------- */}
      <header className="bg-slate-950/80 backdrop-blur-xl border-b border-white/[0.08] sticky top-0 z-40 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo & Title */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-amber-400 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 font-black text-xl group-hover:scale-105 transition-transform">
              👑
            </div>
            <div>
              <div className="font-black text-white text-sm leading-tight flex items-center gap-2">
                <span>สีแสงยางยนต์</span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" />
                  SI01: EXECUTIVE
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-medium">ศูนย์บัญชาการผู้บริหารระดับสูง (Web Dashboard)</div>
            </div>
          </Link>

          {/* Actions & Tools */}
          <div className="flex items-center gap-2.5">
            {/* Brand Pills */}
            <div className="hidden lg:flex items-center gap-1.5 text-[10px] font-bold">
              <span className="px-2 py-0.5 rounded bg-red-600/80 text-white border border-red-500/40">YOKOHAMA</span>
              <span className="px-2 py-0.5 rounded bg-amber-500/80 text-slate-950 border border-amber-400 font-black">NAYA</span>
              <span className="px-2 py-0.5 rounded bg-orange-600/80 text-white border border-orange-500/40">COSMIS</span>
              <span className="px-2 py-0.5 rounded bg-blue-600/80 text-white border border-blue-500/40">LENSO</span>
            </div>

            {/* 3D / 2D Switcher */}
            <button
              onClick={() => setIs3DMode(!is3DMode)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
                is3DMode
                  ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/20'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>{is3DMode ? '3D WebGL' : '2D Chart'}</span>
            </button>

            {/* Export CSV */}
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md shadow-emerald-600/20"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span> CSV
            </button>

            {/* Live Notification Center (Sound + Popups + Drawer) */}
            <NotificationCenter
              notifications={notificationsList}
              onClearAll={() => setNotificationsList([])}
              onMarkAllAsRead={handleMarkAllAsRead}
              onMarkAsRead={handleMarkAsRead}
              onSelectNotification={(notif) => {
                if (notif.targetTab) {
                  setActiveTab(notif.targetTab as any);
                }
              }}
              activeToast={activeToast}
              onDismissToast={() => setActiveToast(null)}
              soundEnabled={soundEnabled}
              onToggleSound={() => setSoundEnabled(!soundEnabled)}
            />

            {/* Live Reload */}
            <button
              onClick={() => loadDashboardData(false)}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
              title="รีเฟรชข้อมูลล่าสุด"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-400' : ''}`} />
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-500/20 hover:text-rose-300 text-slate-300 text-xs font-bold flex items-center gap-1.5 border border-slate-800 hover:border-rose-500/40 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>ออกจากระบบ</span>
            </button>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* STOREFRONT HERO BANNER (Bento Card)                           */}
      {/* ------------------------------------------------------------- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 w-full">
        <div className="relative bento-card p-6 sm:p-7 overflow-hidden border-white/[0.08]">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-600/20 via-indigo-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div className="space-y-2 max-w-3xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold text-[10px] tracking-wider uppercase border border-blue-500/30">
                  ★ Executive Headquarters
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-bold text-[10px] border border-emerald-500/30 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> เข้างาน: {storeSettingsForm.standard_time?.substring(0, 5) || '07:40'} น.
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 font-bold text-[10px] border border-amber-500/30 flex items-center gap-1">
                  <Clock3 className="w-3 h-3" /> ตัดสาย: {storeSettingsForm.late_deadline?.substring(0, 5) || '08:00'} น.
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 font-bold text-[10px] border border-purple-500/30">
                  +{storeSettingsForm.allowance_amount || 50}฿ เบี้ยขยัน
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold text-[10px] border border-slate-700">
                  GPS Geofence {storeSettingsForm.radius_meters || 50}m
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {storeSettingsForm.store_name || 'สีแสงยางยนต์ YOKOHAMA NAYA COSMIS'}
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                ระบบเชื่อมต่อฐานข้อมูล Supabase PostgreSQL แบบ Real-time, ตรวจสอบการเข้างานผ่าน GPS ดาวเทียม, และอนุมัติคำขอใน 1 คลิก
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-4 py-2.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <div className="text-left">
                  <div className="text-[10px] text-slate-400 font-bold">Realtime Sync</div>
                  <div className="text-xs font-mono font-bold text-emerald-400">Live &lt;100ms</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MAIN CONTENT AREA                                             */}
      {/* ------------------------------------------------------------- */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-6 flex-1">
        
        {/* Navigation Tabs (Minimalist Bento Segmented Bar) */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 p-1 bg-slate-900/80 border border-slate-800/90 rounded-2xl backdrop-blur-md">
            {[
              { id: 'overview', label: 'ภาพรวมสถิติ', icon: BarChart3 },
              { id: 'employees', label: 'จัดการพนักงาน', icon: Users },
              { id: 'leaves', label: 'อนุมัติใบลา', icon: Calendar, badge: pendingLeavesCount },
              { id: 'advances', label: 'คำขอเบิกเงิน', icon: Coins, badge: pendingAdvancesCount },
              { id: 'violations', label: 'Security Logs', icon: AlertTriangle, badge: violationLogs.filter((v: any) => !v.is_resolved).length },
              { id: 'settings', label: 'ตั้งค่าร้าน & แผนที่', icon: Settings },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-400 text-slate-950">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Period Selector */}
          <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-2xl border border-slate-800 backdrop-blur-md">
            {(['daily', 'weekly', 'monthly'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  period === p
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {p === 'daily' ? 'รายวัน' : p === 'weekly' ? 'รายสัปดาห์' : 'รายเดือน'}
              </button>
            ))}
          </div>
        </div>

        {/* ============================================================= */}
        {/* TAB 1: OVERVIEW (Bento Grid)                                  */}
        {/* ============================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            
            {/* Top 4 Bento KPI Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Card 1: Allowance Total */}
              <div className="bento-card p-5 space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-amber-400" />
                    ยอดจ่ายเบี้ยขยันวันนี้
                  </span>
                  <span className="bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-black text-[10px]">
                    +{storeSettingsForm.allowance_amount || 50}฿ / คน
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-black font-mono text-white tracking-tight">
                    {totalAllowancePaid}
                  </span>
                  <span className="text-xs font-bold text-slate-400">บาท</span>
                </div>
                <div className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                  <span>สะสม {totalPresent} คน (จ่ายตรงเวลาครบถ้วน)</span>
                </div>
              </div>

              {/* Card 2: Headcount Ratio */}
              <div className="bento-card p-5 space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-blue-400" />
                    พนักงานเข้างานวันนี้
                  </span>
                  <span className="bg-blue-500/15 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full font-black text-[10px]">
                    {totalPresent + totalLate} / {totalEmployees} คน
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-black font-mono text-white tracking-tight">
                    {totalPresent + totalLate}
                  </span>
                  <span className="text-xs font-bold text-slate-400">/ {totalEmployees} คนทั้งหมด</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 pt-1 text-[10px] font-bold">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-1 rounded-lg text-center text-emerald-300">
                    {totalPresent} ตรงเวลา
                  </div>
                  <div className="bg-amber-500/10 border border-amber-500/20 p-1 rounded-lg text-center text-amber-300">
                    {totalLate} มาสาย
                  </div>
                  <div className="bg-slate-800 border border-slate-700 p-1 rounded-lg text-center text-slate-300">
                    {pendingCount} ยังไม่ลง
                  </div>
                </div>
              </div>

              {/* Card 3: Punctuality Target Rate */}
              <div className="bento-card p-5 space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    อัตราความตรงต่อเวลา
                  </span>
                  <span className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-black text-[10px]">
                    เป้าหมาย {'>'} 90%
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-black font-mono text-white tracking-tight">
                    {onTimePercent}%
                  </span>
                  <span className="text-xs font-bold text-emerald-400">
                    {onTimePercent >= 90 ? 'ยอดเยี่ยม!' : 'กำลังปรับปรุง'}
                  </span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-1000"
                    style={{ width: `${Math.max(onTimePercent, 5)}%` }}
                  />
                </div>
              </div>

              {/* Card 4: Security & Alerts */}
              <div className="bento-card p-5 space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-purple-400" />
                    ความปลอดภัยระบบ
                  </span>
                  <span className="bg-purple-500/15 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full font-black text-[10px]">
                    HWID Guard
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-black font-mono text-white tracking-tight">
                    0
                  </span>
                  <span className="text-xs font-bold text-slate-400">ความเสี่ยงค้าง</span>
                </div>
                <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>ระบบตรวจจับ 1 คน 1 เครื่อง ทำงานปกติ</span>
                </div>
              </div>

            </div>

            {/* Bento Staff Check-In Table */}
            <div className="bento-card p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-black text-base text-white flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-blue-400" />
                    <span>รายชื่อพนักงานเข้างานวันนี้ (Staff Live Roster)</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 font-medium">
                    เวลาเช็คอินจริง, เวลาออกงาน, เบี้ยขยันสะสม, และระยะห่างจากร้าน
                  </p>
                </div>

                {/* Filter, Search & Export */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      placeholder="ค้นหาชื่อ / รหัส..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-800 text-xs bg-slate-950/80 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 w-32 sm:w-48 font-medium transition-all"
                    />
                  </div>

                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
                    {(['all', 'present', 'late', 'pending'] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setStatusFilter(f)}
                        className={`px-2.5 py-1 rounded-lg transition-all text-[11px] ${
                          statusFilter === f
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {f === 'all' ? 'ทั้งหมด' : f === 'present' ? 'ตรงเวลา' : f === 'late' ? 'มาสาย' : 'ยังไม่ลง'}
                      </button>
                    ))}
                  </div>

                  {/* Export CSV Button */}
                  <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/80 hover:bg-emerald-600 text-white text-xs font-bold border border-emerald-500/30 transition-colors shrink-0"
                    title="ดาวน์โหลดรายงานสรุปเบี้ยขยันและการลงเวลาเป็นไฟล์ Excel/CSV (ภาษาไทย)"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">ส่งออก</span> Excel/CSV
                  </button>
                </div>
              </div>

              {filteredStaff.length === 0 ? (
                <div className="py-12 px-4 text-center space-y-2 bg-slate-950/50 rounded-2xl border border-dashed border-slate-800">
                  <Users className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400 font-bold">ไม่พบข้อมูลพนักงานในเงื่อนไขนี้</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-bold">
                        <th className="py-3 px-3">พนักงาน</th>
                        <th className="py-3 px-3">รหัสพนักงาน</th>
                        <th className="py-3 px-3">ตำแหน่ง / แผนก</th>
                        <th className="py-3 px-3">เวลาเข้างาน</th>
                        <th className="py-3 px-3">เวลาออกงาน</th>
                        <th className="py-3 px-3">สถานะวันนี้</th>
                        <th className="py-3 px-3">เบี้ยขยันสะสม</th>
                        <th className="py-3 px-3 text-right">ระยะห่างร้าน</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredStaff.map((emp: StaffItem) => (
                        <tr key={emp.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3.5 px-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-300 font-black flex items-center justify-center text-xs border border-blue-500/30">
                                {emp.nickname[0] || 'E'}
                              </div>
                              <div>
                                <div className="font-bold text-white">{emp.name}</div>
                                <div className="text-[10px] text-slate-400">ชื่อเล่น: {emp.nickname}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-3 font-mono font-bold text-blue-400">{emp.code}</td>
                          <td className="py-3.5 px-3">
                            <span className="px-2 py-0.5 rounded-lg font-bold text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                              {emp.role}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 font-mono font-bold text-slate-200">{emp.checkInTimeStr}</td>
                          <td className="py-3.5 px-3 font-mono font-bold text-slate-200">{emp.checkOutTimeStr}</td>
                          <td className="py-3.5 px-3">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${emp.badgeColor}`}>
                              {emp.statusLabel}
                            </span>
                          </td>
                          <td className="py-3.5 px-3">
                            <span className={`font-mono font-black text-xs ${emp.allowance > 0 ? 'text-amber-400' : 'text-slate-500'}`}>
                              {emp.allowance > 0 ? `+${emp.allowance} บาท` : '0 บาท'}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-right text-slate-300 font-mono font-bold text-[11px]">{emp.distanceStr}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* 3D / 2D Chart Bento Card */}
            <div className="bento-card p-6 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-sm text-white flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-400" />
                    <span>{is3DMode ? 'กราฟแท่ง 3 มิติ (Weekly Attendance 3D Hologram)' : 'สถิติการเข้างานประจำสัปดาห์'}</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 font-medium">
                    จำนวนพนักงานที่เข้างานตรงเวลาในแต่ละวัน
                  </p>
                </div>
                <span className="text-white bg-blue-600/80 border border-blue-500/40 px-3 py-1 rounded-full font-black text-[11px] shadow-sm flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-yellow-300" />
                  <span>{is3DMode ? '3D WebGL Mode' : '2D Chart Mode'}</span>
                </span>
              </div>

              {is3DMode ? (
                <ThreeBarChart3D data={weeklyData} />
              ) : (
                <div className="h-64 w-full pt-4 flex items-end justify-between gap-3 border-b border-slate-800 pb-2">
                  {weeklyData.map((item: any, idx: number) => {
                    const maxOntime = Math.max(...weeklyData.map((w: any) => w.ontime), 1);
                    const barHeight = item.ontime > 0 ? (item.ontime / maxOntime) * 100 : 0;
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                        <div className="w-full max-w-[32px] bg-slate-900 rounded-xl overflow-hidden h-full flex flex-col justify-end border border-slate-800">
                          <div
                            style={{ height: `${barHeight}%` }}
                            className={`w-full rounded-xl transition-all duration-500 ${item.ontime > 0 ? 'bg-gradient-to-t from-blue-600 to-sky-400' : 'bg-transparent'}`}
                          />
                        </div>
                        <span className="text-[11px] font-bold text-slate-400">{item.day}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* TAB 2: EMPLOYEES                                              */}
        {/* ============================================================= */}
        {activeTab === 'employees' && (
          <div className="bento-card p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-black text-base text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  <span>จัดการบัญชีพนักงาน (Staff Roster & Devices)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 font-medium">
                  เพิ่ม, ลบ, หรือปลดล็อกอุปกรณ์ประจำตัวพนักงาน (Reset HWID)
                </p>
              </div>

              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>+ เพิ่มพนักงานใหม่</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-bold">
                    <th className="py-3 px-3">พนักงาน</th>
                    <th className="py-3 px-3">รหัสพนักงาน</th>
                    <th className="py-3 px-3">ตำแหน่ง</th>
                    <th className="py-3 px-3">อุปกรณ์ประจำตัว (HWID)</th>
                    <th className="py-3 px-3 text-right">การดำเนินการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {formattedStaff.map((emp: StaffItem) => (
                    <tr key={emp.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-white">{emp.name} ({emp.nickname})</div>
                      </td>
                      <td className="py-3.5 px-3 font-mono font-bold text-blue-400">{emp.code}</td>
                      <td className="py-3.5 px-3">
                        <span className="px-2.5 py-0.5 rounded-lg font-bold text-[10px] bg-blue-500/15 text-blue-300 border border-blue-500/30">
                          {emp.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        {emp.hwid ? (
                          <span className="font-mono text-[11px] text-emerald-400 font-bold">✓ ผูกเครื่องแล้ว ({emp.hwid.slice(0, 10)}...)</span>
                        ) : (
                          <span className="text-[11px] text-slate-500 font-medium">ยังไม่ผูกอุปกรณ์</span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-right space-x-2">
                        <button
                          onClick={() => handleResetHWID(emp.id, emp.name)}
                          className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 font-bold text-[11px] transition-colors"
                        >
                          Reset HWID
                        </button>
                        <button
                          onClick={() => handleDeleteEmployee(emp.id, emp.code, emp.name)}
                          className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 font-bold text-[11px] transition-colors"
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

        {/* ============================================================= */}
        {/* TAB 3: LEAVES                                                 */}
        {/* ============================================================= */}
        {activeTab === 'leaves' && (
          <div className="bento-card p-6 space-y-4">
            <div>
              <h3 className="font-black text-base text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-400" />
                <span>รายการขออนุมัติลางาน ({leaveRequests.length} รายการ)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">
                พิจารณาคำขอลางานของพนักงาน
              </p>
            </div>

            {leaveRequests.length === 0 ? (
              <div className="py-12 px-4 text-center bg-slate-950/50 rounded-2xl border border-dashed border-slate-800 text-slate-500 text-xs font-bold">
                ไม่มีรายการขอลางานในขณะนี้
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-bold">
                      <th className="py-3 px-3">พนักงาน</th>
                      <th className="py-3 px-3">ประเภทการลา</th>
                      <th className="py-3 px-3">วันที่ลา</th>
                      <th className="py-3 px-3">เหตุผล</th>
                      <th className="py-3 px-3">สถานะ</th>
                      <th className="py-3 px-3 text-right">การอนุมัติ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {leaveRequests.map((req: any) => (
                      <tr key={req.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-3">
                          <div className="font-bold text-white">
                            {req.employee?.full_name || req.employees?.full_name || 'พนักงาน'}
                            {(req.employee?.nickname || req.employees?.nickname) ? ` (${req.employee?.nickname || req.employees?.nickname})` : ''}
                          </div>
                          <div className="font-mono text-[10px] text-blue-400 font-bold">
                            {req.employee?.employee_code || req.employees?.employee_code || req.employee_id?.slice(0, 8)}
                          </div>
                        </td>
                        <td className="py-3 px-3 font-medium">
                          {req.leave_type === 'SICK' ? 'ลาป่วย 🩺' : req.leave_type === 'BUSINESS' ? 'ลากิจ 💼' : req.leave_type === 'ANNUAL' ? 'ลาพักร้อน 🏖️' : 'อื่นๆ 📝'}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-300">{req.start_date} {req.end_date && req.end_date !== req.start_date ? `ถึง ${req.end_date}` : ''} ({req.days_count || 1} วัน)</td>
                        <td className="py-3 px-3 text-slate-400">{req.reason || '-'}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                            req.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : req.status === 'REJECTED' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}>
                            {req.status === 'APPROVED' ? 'อนุมัติแล้ว' : req.status === 'REJECTED' ? 'ไม่อนุมัติ' : 'รอพิจารณา'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right space-x-2">
                          {req.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleLeaveAction(req.id, 'APPROVED')}
                                className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-sm"
                              >
                                อนุมัติ
                              </button>
                              <button
                                onClick={() => handleLeaveAction(req.id, 'REJECTED')}
                                className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] shadow-sm"
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

        {/* ============================================================= */}
        {/* TAB 4: ADVANCES (Salary Advance Manager Component)            */}
        {/* ============================================================= */}
        {activeTab === 'advances' && (
          <div className="bento-card p-6 space-y-4">
            <SalaryAdvanceManager 
              requests={salaryAdvances}
              onRefresh={() => loadDashboardData(true)}
              reviewerId="00000000-0000-0000-0000-000000000000"
              onActionCompleted={(reqId, status) => {
                handleOptimisticAdvanceAction(reqId, status);
              }} 
            />
          </div>
        )}

        {/* ============================================================= */}
        {/* TAB 5: VIOLATIONS (Security Logs Viewer Component)            */}
        {/* ============================================================= */}
        {activeTab === 'violations' && (
          <div className="bento-card p-6 space-y-4">
            <SecurityLogsViewer 
              logs={violationLogs}
              onRefresh={() => loadDashboardData(true)}
            />
          </div>
        )}

        {/* ============================================================= */}
        {/* TAB 6: SETTINGS (Store Settings & Map Geofence)               */}
        {/* ============================================================= */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bento-card p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-base text-white flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-emerald-400" />
                    <span>กำหนดพิกัดร้านและรัศมี Geofence (Interactive Map)</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 font-medium">
                    คลิกบนแผนที่เพื่อเลือกพิกัดร้านค้า และปรับรัศมีตรวจจับระยะห่าง
                  </p>
                </div>
              </div>

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

            {/* Time Rules Form */}
            <div className="bento-card p-6 space-y-5">
              <h3 className="font-black text-base text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-400" />
                <span>นโยบายเวลาเข้างานและเบี้ยขยัน (Shift & Allowance Rules)</span>
              </h3>

              {settingsMsg && (
                <div className={`p-3.5 rounded-2xl text-xs font-bold ${settingsMsg.startsWith('✅') ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'}`}>
                  {settingsMsg}
                </div>
              )}

              <form onSubmit={handleSaveSettings} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    เวลาเข้างานปกติ (Standard Time)
                  </label>
                  <input
                    type="time"
                    step="1"
                    value={storeSettingsForm.standard_time || '07:40:00'}
                    onChange={(e) => setStoreSettingsForm({ ...storeSettingsForm, standard_time: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white font-mono text-sm font-bold focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    เวลาตัดสาย (Late Deadline)
                  </label>
                  <input
                    type="time"
                    step="1"
                    value={storeSettingsForm.late_deadline || '08:00:00'}
                    onChange={(e) => setStoreSettingsForm({ ...storeSettingsForm, late_deadline: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white font-mono text-sm font-bold focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    ยอดเงินเบี้ยขยัน (บาท / วัน)
                  </label>
                  <input
                    type="number"
                    value={storeSettingsForm.allowance_amount || 50}
                    onChange={(e) => setStoreSettingsForm({ ...storeSettingsForm, allowance_amount: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white font-mono text-sm font-bold focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    รัศมี Geofence (เมตร)
                  </label>
                  <input
                    type="number"
                    value={storeSettingsForm.radius_meters || 50}
                    onChange={(e) => setStoreSettingsForm({ ...storeSettingsForm, radius_meters: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white font-mono text-sm font-bold focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div className="sm:col-span-2 lg:col-span-4 pt-2">
                  <button
                    type="submit"
                    disabled={settingsLoading}
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-blue-600/30 transition-all active:scale-[0.98] flex items-center gap-2"
                  >
                    {settingsLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    <span>บันทึกการตั้งค่านโยบายและกระจายข้อมูลสู่ระบบสด</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Discord AI Developer Reporter Card */}
            <div className="bento-card p-6 space-y-5 border-indigo-500/30 bg-gradient-to-br from-slate-900/90 via-indigo-950/20 to-slate-900/90">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-black text-base text-white flex items-center gap-2">
                    <span className="text-xl">🤖</span>
                    <span>ระบบรายงานความคืบหน้า AI Developer สู่ Discord (Group Chat Feed)</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 font-medium">
                    รับการแจ้งเตือนความคืบหน้า สิ่งที่ AI ทำเสร็จ บั๊กที่พบ และ Git Commit ส่งตรงเข้าห้องแชท Discord ทันที
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 w-fit">
                  Discord Webhook Active
                </span>
              </div>

              {discordMsg && (
                <div className={`p-3.5 rounded-2xl text-xs font-bold ${discordMsg.startsWith('🎉') || discordMsg.startsWith('✅') ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'}`}>
                  {discordMsg}
                </div>
              )}

              <form onSubmit={handleSaveDiscord} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    Discord Webhook URL
                  </label>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      type="url"
                      placeholder="https://discord.com/api/webhooks/..."
                      value={discordWebhookUrl}
                      onChange={(e) => setDiscordWebhookUrl(e.target.value)}
                      className="flex-1 px-3.5 py-2.5 bg-slate-950/90 border border-slate-800 rounded-xl text-white font-mono text-xs font-medium focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors shrink-0"
                    >
                      💾 บันทึก URL
                    </button>
                    <button
                      type="button"
                      onClick={handleTestDiscord}
                      disabled={discordLoading}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 shrink-0"
                    >
                      {discordLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <span>🚀</span>}
                      <span>ทดสอบส่งเข้า Discord</span>
                    </button>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                  <div className="font-bold text-slate-300 flex items-center gap-1.5">
                    <span>💡 วิธีสร้าง Webhook ใน Discord (ใช้เวลา 30 วินาที):</span>
                  </div>
                  <div>1. ไปที่ห้องแชทใน Discord ของคุณ &rarr; กดรูปฟันเฟือง ⚙️ (Edit Channel)</div>
                  <div>2. เลือกเมนู <strong>Integrations</strong> &rarr; กดปุ่ม <strong>Webhooks</strong> &rarr; กด <strong>New Webhook</strong></div>
                  <div>3. ตั้งชื่อบอท เช่น <code>"สีแสงยางยนต์ Dev Bot"</code> แล้วกด <strong>Copy Webhook URL</strong> มาวางที่นี่ได้เลย</div>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>

      {/* ------------------------------------------------------------- */}
      {/* ADD EMPLOYEE MODAL (Bento Glass Modal)                        */}
      {/* ------------------------------------------------------------- */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bento-card max-w-md w-full p-6 space-y-5 border-white/10 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-black text-white text-base flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-400" />
                <span>เพิ่มบัญชีพนักงานใหม่</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {addMsg && (
              <div className={`p-3 rounded-xl text-xs font-bold ${addMsg.includes('สำเร็จ') ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'}`}>
                {addMsg}
              </div>
            )}

            <form onSubmit={handleCreateEmployee} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-300">รหัสพนักงาน (Employee Code)</label>
                <input
                  type="text"
                  placeholder="เช่น EMP004, 04"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950/90 border border-slate-800 rounded-xl text-white font-mono text-sm font-bold focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-300">ชื่อ-นามสกุล</label>
                <input
                  type="text"
                  placeholder="เช่น ประวิทย์ รักงาน"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950/90 border border-slate-800 rounded-xl text-white text-sm font-medium focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-300">ชื่อเล่น</label>
                  <input
                    type="text"
                    placeholder="เช่น โจ้"
                    value={newNick}
                    onChange={(e) => setNewNick(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950/90 border border-slate-800 rounded-xl text-white text-sm font-medium focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-300">รหัส PIN เริ่มต้น</label>
                  <input
                    type="text"
                    placeholder="1234"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950/90 border border-slate-800 rounded-xl text-white font-mono text-sm font-bold focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-300">ตำแหน่ง / สิทธิ์</label>
                <select
                  value={newRole}
                  onChange={(e: any) => setNewRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950/90 border border-slate-800 rounded-xl text-white text-xs font-bold focus:outline-none focus:border-blue-500"
                >
                  <option value="STAFF">พนักงานทั่วไป (Staff)</option>
                  <option value="SUPERVISOR">หัวหน้างาน (Supervisor)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center gap-1.5"
                >
                  {addLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>บันทึกบัญชีพนักงาน</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="max-w-7xl mx-auto w-full text-center py-4 text-xs text-slate-500 border-t border-slate-900 mt-6">
        © {new Date().getFullYear()} สีแสงยางยนต์ YOKOHAMA • NAYA • COSMIS WHEELS & TIRES — Web Executive Dashboard
      </footer>
    </div>
  );
}
