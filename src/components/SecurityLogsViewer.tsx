'use client';

import { useState, useMemo } from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  Smartphone, 
  MapPin, 
  Key, 
  CheckCircle2, 
  Unlock, 
  RefreshCw, 
  Search, 
  Filter, 
  Clock, 
  User, 
  Users, 
  Check, 
  ShieldCheck,
  ExternalLink,
  ChevronDown,
  Navigation,
  ArrowRight,
  History,
  Sparkles,
  Layers,
  Info,
  Trophy,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { ViolationLog, ViolationType } from '@/lib/types';
import { getSecurityExplanation } from '@/lib/security-explainer';

interface SecurityLogsViewerProps {
  logs: ViolationLog[];
  onRefresh: () => void;
  isMobileCompact?: boolean;
}

export default function SecurityLogsViewer({ logs, onRefresh, isMobileCompact = false }: SecurityLogsViewerProps) {
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unresolved' | 'resolved'>('all');
  const [overlapTimeFilter, setOverlapTimeFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPairKey, setSelectedPairKey] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // 1. Summary Counts
  const totalLogs = logs.length;
  const unresolvedLogs = logs.filter((l) => !l.is_resolved);
  const hwidOverlapCount = logs.filter((l) => l.violation_type === 'HWID_OVERLAP').length;
  const deviceMismatchCount = logs.filter((l) => l.violation_type === 'DEVICE_MISMATCH').length;
  const geofenceBlockedCount = logs.filter((l) => l.violation_type === 'OUT_OF_GEOFENCE_BLOCKED').length;
  const invalidPinCount = logs.filter((l) => l.violation_type === 'INVALID_PIN_ATTEMPTS').length;

  // Date Check Helpers
  const isDateToday = (dateStr?: string) => {
    if (!dateStr) return false;
    try {
      const d = new Date(dateStr);
      const now = new Date();
      return d.getFullYear() === now.getFullYear() &&
             d.getMonth() === now.getMonth() &&
             d.getDate() === now.getDate();
    } catch {
      return false;
    }
  };

  const isDateThisWeek = (dateStr?: string) => {
    if (!dateStr) return false;
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - d.getTime());
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      return diffDays <= 7;
    } catch {
      return false;
    }
  };

  const isDateThisMonth = (dateStr?: string) => {
    if (!dateStr) return false;
    try {
      const d = new Date(dateStr);
      const now = new Date();
      return d.getFullYear() === now.getFullYear() &&
             d.getMonth() === now.getMonth();
    } catch {
      return false;
    }
  };

  // Overlap time breakdown counts
  const allOverlapLogs = useMemo(() => logs.filter((l) => l.violation_type === 'HWID_OVERLAP'), [logs]);
  const todayOverlapCount = useMemo(() => allOverlapLogs.filter((l) => isDateToday(l.created_at)).length, [allOverlapLogs]);
  const weekOverlapCount = useMemo(() => allOverlapLogs.filter((l) => isDateThisWeek(l.created_at)).length, [allOverlapLogs]);
  const monthOverlapCount = useMemo(() => allOverlapLogs.filter((l) => isDateThisMonth(l.created_at)).length, [allOverlapLogs]);

  // Filtered Overlap Logs based on active time filter
  const activeOverlapLogs = useMemo(() => {
    return allOverlapLogs.filter((log) => {
      if (overlapTimeFilter === 'today') return isDateToday(log.created_at);
      if (overlapTimeFilter === 'week') return isDateThisWeek(log.created_at);
      if (overlapTimeFilter === 'month') return isDateThisMonth(log.created_at);
      return true;
    });
  }, [allOverlapLogs, overlapTimeFilter]);

  // 2. Compute Cross-Device Overlap Pairings Matrix (Buddy Punching Ranking)
  const overlapPairings = useMemo(() => {
    const pairsMap = new Map<string, {
      key: string;
      user1: any;
      user2: any;
      count: number;
      unresolvedCount: number;
      latestCreatedAt: string;
      latestLog: ViolationLog;
      logs: ViolationLog[];
      hwid?: string;
    }>();

    activeOverlapLogs.forEach((log) => {
      const emp1 = log.employee;
      const emp2 = log.other_employee;
      const id1 = emp1?.id || log.employee_id || 'unknown1';
      const id2 = emp2?.id || log.other_employee_id || 'unknown2';
      const pairKey = `${id1}___${id2}`;

      if (!pairsMap.has(pairKey)) {
        pairsMap.set(pairKey, {
          key: pairKey,
          user1: emp1 || { full_name: 'พนักงานไม่ทราบชื่อ', employee_code: log.employee_id || '-', nickname: '-' },
          user2: emp2 || { full_name: 'เจ้าของเครื่องเดิม', employee_code: log.other_employee_id || '-', nickname: '-' },
          count: 0,
          unresolvedCount: 0,
          latestCreatedAt: log.created_at || '',
          latestLog: log,
          logs: [],
          hwid: log.hwid,
        });
      }

      const entry = pairsMap.get(pairKey)!;
      entry.count += 1;
      if (!log.is_resolved) entry.unresolvedCount += 1;
      entry.logs.push(log);
      if (!entry.latestCreatedAt || (log.created_at && log.created_at > entry.latestCreatedAt)) {
        entry.latestCreatedAt = log.created_at || '';
        entry.latestLog = log;
      }
    });

    return Array.from(pairsMap.values()).sort((a, b) => b.count - a.count);
  }, [activeOverlapLogs]);

  // All-time top pair (Peak Pair)
  const allTimeTopPair = useMemo(() => {
    const pairsMap = new Map<string, {
      key: string;
      user1: any;
      user2: any;
      count: number;
      unresolvedCount: number;
      latestCreatedAt: string;
      latestLog: ViolationLog;
      logs: ViolationLog[];
      hwid?: string;
    }>();

    allOverlapLogs.forEach((log) => {
      const emp1 = log.employee;
      const emp2 = log.other_employee;
      const id1 = emp1?.id || log.employee_id || 'unknown1';
      const id2 = emp2?.id || log.other_employee_id || 'unknown2';
      const pairKey = `${id1}___${id2}`;

      if (!pairsMap.has(pairKey)) {
        pairsMap.set(pairKey, {
          key: pairKey,
          user1: emp1 || { full_name: 'พนักงานไม่ทราบชื่อ', employee_code: log.employee_id || '-', nickname: '-' },
          user2: emp2 || { full_name: 'เจ้าของเครื่องเดิม', employee_code: log.other_employee_id || '-', nickname: '-' },
          count: 0,
          unresolvedCount: 0,
          latestCreatedAt: log.created_at || '',
          latestLog: log,
          logs: [],
          hwid: log.hwid,
        });
      }

      const entry = pairsMap.get(pairKey)!;
      entry.count += 1;
      if (!log.is_resolved) entry.unresolvedCount += 1;
      entry.logs.push(log);
      if (!entry.latestCreatedAt || (log.created_at && log.created_at > entry.latestCreatedAt)) {
        entry.latestCreatedAt = log.created_at || '';
        entry.latestLog = log;
      }
    });

    const sorted = Array.from(pairsMap.values()).sort((a, b) => b.count - a.count);
    return sorted.length > 0 ? sorted[0] : null;
  }, [allOverlapLogs]);

  // 3. Helper: Parse Geofence Distance & GPS Coordinates
  const parseGeofenceDetails = (desc: string = '') => {
    const distMatch = desc.match(/ระยะห่าง\s*([0-9.]+)\s*เมตร/i) || desc.match(/([0-9.]+)\s*(?:m|เมตร)/i);
    const distance = distMatch ? parseFloat(distMatch[1]) : null;

    const latMatch = desc.match(/Lat:?\s*([0-9.-]+)/i);
    const lngMatch = desc.match(/Lng:?\s*([0-9.-]+)/i);
    const lat = latMatch ? parseFloat(latMatch[1]) : null;
    const lng = lngMatch ? parseFloat(lngMatch[1]) : null;

    const mapsUrl = lat && lng ? `https://www.google.com/maps?q=${lat},${lng}` : null;

    return { distance, lat, lng, mapsUrl };
  };

  // 4. Helper: Format Thai Date Time
  const formatThaiDateTime = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }) + ' น.';
    } catch {
      return dateStr;
    }
  };

  // 5. Helper: Relative Time in Thai
  const getRelativeTimeThai = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const now = new Date().getTime();
      const past = new Date(dateStr).getTime();
      const diffMs = now - past;
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHour = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHour / 24);

      if (diffSec < 60) return 'เมื่อสักครู่';
      if (diffMin < 60) return `${diffMin} นาทีที่แล้ว`;
      if (diffHour < 24) return `${diffHour} ชั่วโมงที่แล้ว`;
      if (diffDay === 1) return 'เมื่อวานนี้';
      if (diffDay < 30) return `${diffDay} วันที่แล้ว`;
      return '';
    } catch {
      return '';
    }
  };

  // 6. Filtered Logs Processing
  const filteredLogs = logs.filter((log) => {
    // Status filter
    if (statusFilter === 'unresolved' && log.is_resolved) return false;
    if (statusFilter === 'resolved' && !log.is_resolved) return false;

    // Type filter
    if (typeFilter !== 'all' && log.violation_type !== typeFilter) return false;

    // Time filter for HWID overlap logs (or when viewing security feed)
    if (overlapTimeFilter !== 'all' && (typeFilter === 'HWID_OVERLAP' || log.violation_type === 'HWID_OVERLAP')) {
      if (overlapTimeFilter === 'today' && !isDateToday(log.created_at)) return false;
      if (overlapTimeFilter === 'week' && !isDateThisWeek(log.created_at)) return false;
      if (overlapTimeFilter === 'month' && !isDateThisMonth(log.created_at)) return false;
    }

    // Selected Pair filter
    if (selectedPairKey) {
      const [id1, id2] = selectedPairKey.split('___');
      const curId1 = log.employee?.id || log.employee_id;
      const curId2 = log.other_employee?.id || log.other_employee_id;
      if (curId1 !== id1 || curId2 !== id2) return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const empName = log.employee?.full_name?.toLowerCase() || '';
      const empCode = log.employee?.employee_code?.toLowerCase() || '';
      const empNick = log.employee?.nickname?.toLowerCase() || '';
      const otherName = log.other_employee?.full_name?.toLowerCase() || '';
      const otherCode = log.other_employee?.employee_code?.toLowerCase() || '';
      const hwid = log.hwid?.toLowerCase() || '';
      const desc = log.description?.toLowerCase() || '';

      return (
        empName.includes(q) ||
        empCode.includes(q) ||
        empNick.includes(q) ||
        otherName.includes(q) ||
        otherCode.includes(q) ||
        hwid.includes(q) ||
        desc.includes(q)
      );
    }
    return true;
  });

  // Handle Resolve Single Violation
  const handleResolve = async (id: string) => {
    setActionLoadingId(id);
    try {
      const res = await fetch('/api/admin/violations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage('✓ รับทราบและปิดเคสเรียบร้อยแล้ว');
        setTimeout(() => setActionMessage(null), 4000);
        onRefresh();
      } else {
        alert('เกิดข้อผิดพลาด: ' + data.message);
      }
    } catch (e: any) {
      alert('เกิดข้อผิดพลาด: ' + e.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Resolve All
  const handleResolveAll = async () => {
    if (!confirm('ยืนยันการกด "รับทราบและปิดเคสทั้งหมด" หรือไม่?')) return;
    setActionLoadingId('all');
    try {
      const res = await fetch('/api/admin/violations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolveAll: true }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage('✓ ปิดเคสความปลอดภัยทั้งหมดเรียบร้อยแล้ว');
        setTimeout(() => setActionMessage(null), 4000);
        onRefresh();
      } else {
        alert('เกิดข้อผิดพลาด: ' + data.message);
      }
    } catch (e: any) {
      alert('เกิดข้อผิดพลาด: ' + e.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Reset HWID for Employee
  const handleResetHWID = async (employeeId: string, empName: string) => {
    if (!confirm(`ยืนยันการ "ปลดล็อกเครื่องประจำตัว" ให้ ${empName} หรือไม่?\n\nพนักงานจะสามารถใช้โทรศัพท์เครื่องใหม่ในการล็อกอินเพื่อผูกเครื่องใหม่ได้ทันที`)) return;
    setActionLoadingId(`hwid-${employeeId}`);
    try {
      const res = await fetch('/api/admin/employee', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: employeeId, clearHWID: true }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage(`✓ ปลดล็อกเครื่องให้ ${empName} เรียบร้อยแล้ว`);
        setTimeout(() => setActionMessage(null), 4000);
        onRefresh();
      } else {
        alert('เกิดข้อผิดพลาด: ' + data.message);
      }
    } catch (e: any) {
      alert('เกิดข้อผิดพลาด: ' + e.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">

      {/* ============================================================= */}
      {/* 1. HERO INTELLIGENCE HEADER CARD (Vercel Obsidian)            */}
      {/* ============================================================= */}
      <div className="p-6 sm:p-7 rounded-2xl bg-neutral-950 border border-neutral-800 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Ambient Top Line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-rose-500 via-amber-500 to-blue-500 opacity-80" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center font-bold">
                <ShieldAlert className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  ประวัติด้านความปลอดภัย & บันทึกการลงเวลาผิดปกติ
                </h2>
                <p className="text-xs text-neutral-400 font-sans mt-0.5">
                  ระบบวิเคราะห์พฤติกรรมเสี่ยง ตรวจจับการฝากกดแทนกัน (Buddy Punching), การเปลี่ยนเครื่อง, และพิกัดนอกร้าน
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {unresolvedLogs.length > 0 && (
              <button
                onClick={handleResolveAll}
                disabled={actionLoadingId === 'all'}
                className="px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold font-sans flex items-center gap-1.5 transition-all shadow-lg shadow-emerald-950/40"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{actionLoadingId === 'all' ? 'กำลังบันทึก...' : `✓ รับทราบทั้งหมด (${unresolvedLogs.length})`}</span>
              </button>
            )}
            <button
              onClick={onRefresh}
              className="p-2.5 rounded-full bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700 transition-colors"
              title="รีเฟรชข้อมูล"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Feedback Message Toast */}
        {actionMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* 4 Metric Summary Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-1">
          {/* HWID Overlap Tile */}
          <div 
            onClick={() => {
              setTypeFilter(typeFilter === 'HWID_OVERLAP' ? 'all' : 'HWID_OVERLAP');
              setSelectedPairKey(null);
            }}
            className={`p-4 rounded-xl border transition-all cursor-pointer select-none ${
              typeFilter === 'HWID_OVERLAP' 
                ? 'bg-rose-500/15 border-rose-500/50 shadow-lg shadow-rose-950/40' 
                : 'bg-neutral-900/80 border-neutral-800 hover:border-rose-500/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5 font-sans">
                <Users className="w-4 h-4 text-rose-400" />
                ใช้อุปกรณ์ซ้ำ
              </span>
              <span className="text-xl font-black font-mono text-rose-400">{hwidOverlapCount}</span>
            </div>
            <div className="text-[11px] text-neutral-400 font-sans mt-1">สงสัยฝากกดแทน (ทับเครื่อง)</div>
          </div>

          {/* Device Mismatch Tile */}
          <div 
            onClick={() => {
              setTypeFilter(typeFilter === 'DEVICE_MISMATCH' ? 'all' : 'DEVICE_MISMATCH');
              setSelectedPairKey(null);
            }}
            className={`p-4 rounded-xl border transition-all cursor-pointer select-none ${
              typeFilter === 'DEVICE_MISMATCH' 
                ? 'bg-amber-500/15 border-amber-500/50 shadow-lg shadow-amber-950/40' 
                : 'bg-neutral-900/80 border-neutral-800 hover:border-amber-500/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5 font-sans">
                <Smartphone className="w-4 h-4 text-amber-400" />
                เครื่องไม่ตรง
              </span>
              <span className="text-xl font-black font-mono text-amber-400">{deviceMismatchCount}</span>
            </div>
            <div className="text-[11px] text-neutral-400 font-sans mt-1">พยายามเข้าจากเครื่องใหม่</div>
          </div>

          {/* Geofence Blocked Tile */}
          <div 
            onClick={() => {
              setTypeFilter(typeFilter === 'OUT_OF_GEOFENCE_BLOCKED' ? 'all' : 'OUT_OF_GEOFENCE_BLOCKED');
              setSelectedPairKey(null);
            }}
            className={`p-4 rounded-xl border transition-all cursor-pointer select-none ${
              typeFilter === 'OUT_OF_GEOFENCE_BLOCKED' 
                ? 'bg-blue-500/15 border-blue-500/50 shadow-lg shadow-blue-950/40' 
                : 'bg-neutral-900/80 border-neutral-800 hover:border-blue-500/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5 font-sans">
                <MapPin className="w-4 h-4 text-blue-400" />
                นอกพื้นที่ร้าน
              </span>
              <span className="text-xl font-black font-mono text-blue-400">{geofenceBlockedCount}</span>
            </div>
            <div className="text-[11px] text-neutral-400 font-sans mt-1">บล็อกพิกัดเกิน 50 เมตร</div>
          </div>

          {/* Invalid PIN Tile */}
          <div 
            onClick={() => {
              setTypeFilter(typeFilter === 'INVALID_PIN_ATTEMPTS' ? 'all' : 'INVALID_PIN_ATTEMPTS');
              setSelectedPairKey(null);
            }}
            className={`p-4 rounded-xl border transition-all cursor-pointer select-none ${
              typeFilter === 'INVALID_PIN_ATTEMPTS' 
                ? 'bg-neutral-800 border-neutral-700 shadow-lg shadow-black/40' 
                : 'bg-neutral-900/80 border-neutral-800 hover:border-neutral-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-300 flex items-center gap-1.5 font-sans">
                <Key className="w-4 h-4 text-neutral-400" />
                รหัสผ่านผิด
              </span>
              <span className="text-xl font-black font-mono text-neutral-300">{invalidPinCount}</span>
            </div>
            <div className="text-[11px] text-neutral-400 font-sans mt-1">กรอกรหัส PIN ไม่ถูกต้อง</div>
          </div>
        </div>
      </div>

      {/* ============================================================= */}
      {/* 2. DEDICATED BUDDY PUNCHING SUMMARY MATRIX (ใครล็อคทับใครกี่ครั้ง) */}
      {/* ============================================================= */}
      <div className="p-6 sm:p-7 rounded-2xl bg-neutral-950 border border-neutral-800 shadow-xl space-y-6">
        
        {/* Header Ribbon */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-rose-400" />
              <h3 className="font-bold text-base sm:text-lg text-white">
                สรุปคู่ที่มีการล็อกอินทับเครื่องกัน (Buddy Punching Pairing Matrix)
              </h3>
            </div>
            <p className="text-xs text-neutral-400 font-sans mt-0.5">
              แสดงความถี่และรายชื่อพนักงานที่นำโทรศัพท์เครื่องเดียวกันมาใช้ลงชื่อเข้าใช้งาน
            </p>
          </div>

          {selectedPairKey && (
            <button
              onClick={() => setSelectedPairKey(null)}
              className="px-3.5 py-1.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-bold flex items-center gap-1.5 transition-all hover:bg-rose-500/30"
            >
              <span>✕ ยกเลิกการกรองคู่นี้</span>
            </button>
          )}
        </div>

        {/* ----------------------------------------------------------- */}
        {/* TIME BREAKDOWN & PEAK ANALYTICS (มากสุด • วันนี้ • สัปดาห์นี้ • เดือนนี้) */}
        {/* ----------------------------------------------------------- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          
          {/* Card 1: มากที่สุด (Peak Pair / Top Offender) */}
          <div 
            onClick={() => allTimeTopPair && setSelectedPairKey(selectedPairKey === allTimeTopPair.key ? null : allTimeTopPair.key)}
            className={`p-4 rounded-xl border transition-all cursor-pointer select-none bg-gradient-to-br from-rose-950/40 via-neutral-900 to-neutral-900 ${
              allTimeTopPair && selectedPairKey === allTimeTopPair.key
                ? 'border-rose-500 ring-2 ring-rose-500/30 shadow-lg shadow-rose-950/40'
                : 'border-rose-500/40 hover:border-rose-500/70 hover:scale-[1.01]'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold text-rose-400">
              <span className="flex items-center gap-1.5 font-sans">
                <Trophy className="w-4 h-4 text-amber-400" />
                มากที่สุด (อันดับ 1)
              </span>
              <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-mono text-[10px] font-black border border-rose-500/40">
                PEAK
              </span>
            </div>

            <div className="mt-2 space-y-1">
              <div className="text-2xl font-black font-mono text-white flex items-baseline gap-1.5">
                <span>{allTimeTopPair ? allTimeTopPair.count : 0}</span>
                <span className="text-xs font-sans text-neutral-400 font-normal">ครั้งสะสม</span>
              </div>
              {allTimeTopPair ? (
                <div className="text-[11px] text-rose-300 font-sans truncate font-bold">
                  {allTimeTopPair.user1?.nickname || allTimeTopPair.user1?.employee_code || '02'} ➔ {allTimeTopPair.user2?.nickname || allTimeTopPair.user2?.employee_code || '01'}
                </div>
              ) : (
                <div className="text-[11px] text-neutral-500 font-sans">ยังไม่มีข้อมูล</div>
              )}
            </div>
          </div>

          {/* Card 2: วันนี้ (Today) */}
          <div 
            onClick={() => setOverlapTimeFilter(overlapTimeFilter === 'today' ? 'all' : 'today')}
            className={`p-4 rounded-xl border transition-all cursor-pointer select-none ${
              overlapTimeFilter === 'today'
                ? 'bg-amber-950/40 border-amber-400 ring-2 ring-amber-500/30 shadow-lg shadow-amber-950/40'
                : 'bg-neutral-900/80 border-neutral-800 hover:border-amber-500/40 hover:scale-[1.01]'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold text-amber-400">
              <span className="flex items-center gap-1.5 font-sans">
                <Sparkles className="w-4 h-4 text-amber-400" />
                ล็อกซ้อนวันนี้
              </span>
              {todayOverlapCount > 0 ? (
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              ) : (
                <span className="text-[10px] text-neutral-500 font-mono">00:00 - ปัจจุบัน</span>
              )}
            </div>

            <div className="mt-2 space-y-1">
              <div className="text-2xl font-black font-mono text-white flex items-baseline gap-1.5">
                <span className={todayOverlapCount > 0 ? 'text-amber-300' : 'text-neutral-400'}>{todayOverlapCount}</span>
                <span className="text-xs font-sans text-neutral-400 font-normal">ครั้งวันนี้</span>
              </div>
              <div className="text-[11px] text-neutral-400 font-sans">
                {todayOverlapCount > 0 ? '⚠️ ตรวจพบการล็อกทับในรอบวัน' : '🟢 ปลอดภัย ไม่พบเหตุการณ์วันนี้'}
              </div>
            </div>
          </div>

          {/* Card 3: สัปดาห์นี้ (This Week) */}
          <div 
            onClick={() => setOverlapTimeFilter(overlapTimeFilter === 'week' ? 'all' : 'week')}
            className={`p-4 rounded-xl border transition-all cursor-pointer select-none ${
              overlapTimeFilter === 'week'
                ? 'bg-blue-950/40 border-blue-400 ring-2 ring-blue-500/30 shadow-lg shadow-blue-950/40'
                : 'bg-neutral-900/80 border-neutral-800 hover:border-blue-500/40 hover:scale-[1.01]'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold text-blue-400">
              <span className="flex items-center gap-1.5 font-sans">
                <Calendar className="w-4 h-4 text-blue-400" />
                สัปดาห์นี้
              </span>
              <span className="text-[10px] text-neutral-500 font-mono">รอบ 7 วัน</span>
            </div>

            <div className="mt-2 space-y-1">
              <div className="text-2xl font-black font-mono text-white flex items-baseline gap-1.5">
                <span className={weekOverlapCount > 0 ? 'text-blue-300' : 'text-neutral-400'}>{weekOverlapCount}</span>
                <span className="text-xs font-sans text-neutral-400 font-normal">ครั้งในสัปดาห์</span>
              </div>
              <div className="text-[11px] text-neutral-400 font-sans">
                สถิติย้อนหลัง 7 วันล่าสุด
              </div>
            </div>
          </div>

          {/* Card 4: เดือนนี้ (This Month) */}
          <div 
            onClick={() => setOverlapTimeFilter(overlapTimeFilter === 'month' ? 'all' : 'month')}
            className={`p-4 rounded-xl border transition-all cursor-pointer select-none ${
              overlapTimeFilter === 'month'
                ? 'bg-purple-950/40 border-purple-400 ring-2 ring-purple-500/30 shadow-lg shadow-purple-950/40'
                : 'bg-neutral-900/80 border-neutral-800 hover:border-purple-500/40 hover:scale-[1.01]'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold text-purple-400">
              <span className="flex items-center gap-1.5 font-sans">
                <History className="w-4 h-4 text-purple-400" />
                เดือนนี้
              </span>
              <span className="text-[10px] text-neutral-500 font-mono">ต.ค. 2569</span>
            </div>

            <div className="mt-2 space-y-1">
              <div className="text-2xl font-black font-mono text-white flex items-baseline gap-1.5">
                <span className={monthOverlapCount > 0 ? 'text-purple-300' : 'text-neutral-400'}>{monthOverlapCount}</span>
                <span className="text-xs font-sans text-neutral-400 font-normal">ครั้งเดือนนี้</span>
              </div>
              <div className="text-[11px] text-neutral-400 font-sans">
                ยอดสะสมประจำเดือนปัจจุบัน
              </div>
            </div>
          </div>

        </div>

        {/* Time Range Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-neutral-900/70 rounded-xl border border-neutral-800 text-xs font-mono">
          <div className="flex items-center gap-2 text-neutral-400">
            <Filter className="w-4 h-4 text-neutral-500" />
            <span>กรองช่วงเวลาที่แสดง:</span>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-neutral-950 rounded-lg border border-neutral-800 text-[11px]">
            <button
              onClick={() => setOverlapTimeFilter('all')}
              className={`px-3 py-1 rounded-md font-bold transition-all ${
                overlapTimeFilter === 'all' ? 'bg-white text-black shadow-xs' : 'text-neutral-400 hover:text-white'
              }`}
            >
              ทั้งหมด ({allOverlapLogs.length})
            </button>
            <button
              onClick={() => setOverlapTimeFilter('today')}
              className={`px-3 py-1 rounded-md font-bold transition-all ${
                overlapTimeFilter === 'today' ? 'bg-amber-400 text-black shadow-xs' : 'text-neutral-400 hover:text-white'
              }`}
            >
              วันนี้ ({todayOverlapCount})
            </button>
            <button
              onClick={() => setOverlapTimeFilter('week')}
              className={`px-3 py-1 rounded-md font-bold transition-all ${
                overlapTimeFilter === 'week' ? 'bg-blue-400 text-black shadow-xs' : 'text-neutral-400 hover:text-white'
              }`}
            >
              สัปดาห์นี้ ({weekOverlapCount})
            </button>
            <button
              onClick={() => setOverlapTimeFilter('month')}
              className={`px-3 py-1 rounded-md font-bold transition-all ${
                overlapTimeFilter === 'month' ? 'bg-purple-400 text-black shadow-xs' : 'text-neutral-400 hover:text-white'
              }`}
            >
              เดือนนี้ ({monthOverlapCount})
            </button>
          </div>
        </div>

        {overlapPairings.length === 0 ? (
          <div className="p-6 rounded-xl bg-neutral-900/50 border border-dashed border-neutral-800 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto text-lg font-bold">
              ✓
            </div>
            <div className="text-sm font-bold text-white">ไม่พบประวัติการล็อกอินทับเครื่องในช่วงเวลานี้</div>
            <p className="text-xs text-neutral-400 font-sans">
              พนักงานทุกคนใช้งานโทรศัพท์ประจำตัว 1 คน 1 เครื่องอย่างถูกต้อง
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {overlapPairings.map((pair, idx) => {
              const isSelected = selectedPairKey === pair.key;
              const isPeak = allTimeTopPair?.key === pair.key;
              const relative = getRelativeTimeThai(pair.latestCreatedAt);

              return (
                <div
                  key={pair.key}
                  className={`p-4 rounded-xl border transition-all relative overflow-hidden flex flex-col justify-between space-y-3.5 ${
                    isSelected 
                      ? 'bg-rose-950/20 border-rose-500/60 ring-1 ring-rose-500/40 shadow-lg' 
                      : 'bg-neutral-900/90 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  {/* Pair Header & Frequency Badge */}
                  <div className="flex items-center justify-between gap-2 border-b border-neutral-800 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-neutral-500">#{idx + 1}</span>
                      {isPeak && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold font-sans flex items-center gap-1">
                          <Trophy className="w-3 h-3 text-amber-400" />
                          <span>อันดับ 1 ล็อกทับบ่อยสุด</span>
                        </span>
                      )}
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold font-sans">
                        ตรวจพบ {pair.count} ครั้ง
                      </span>
                    </div>

                    {pair.unresolvedCount > 0 ? (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                        🚨 รอเคลียร์ {pair.unresolvedCount} ครั้ง
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                        ✓ ปิดเคสแล้วทั้งหมด
                      </span>
                    )}
                  </div>

                  {/* Visual 2-Person Transfer Diagram */}
                  <div className="grid grid-cols-1 sm:grid-cols-11 gap-2 items-center text-xs">
                    {/* User 1: Who Attempted */}
                    <div className="sm:col-span-5 p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 space-y-1">
                      <div className="text-[10px] text-rose-400 font-bold flex items-center gap-1 font-sans">
                        <User className="w-3 h-3 text-rose-400" />
                        <span>ผู้พยายามล็อกอิน:</span>
                      </div>
                      <div className="font-bold text-white text-xs truncate">
                        {pair.user1?.full_name || 'ไม่ทราบชื่อ'}
                      </div>
                      <div className="text-[10px] text-neutral-400 font-mono">
                        รหัส: <strong className="text-amber-400 font-bold">{pair.user1?.employee_code || '-'}</strong> ({pair.user1?.nickname || '-'})
                      </div>
                    </div>

                    {/* Middle Arrow */}
                    <div className="sm:col-span-1 flex items-center justify-center text-neutral-500 py-1 sm:py-0">
                      <ArrowRight className="w-4 h-4 text-rose-400 animate-pulse hidden sm:block" />
                      <span className="text-[10px] text-neutral-400 sm:hidden">⬇ ใช้เครื่องของ ⬇</span>
                    </div>

                    {/* User 2: Original Phone Owner */}
                    <div className="sm:col-span-5 p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 space-y-1">
                      <div className="text-[10px] text-amber-400 font-bold flex items-center gap-1 font-sans">
                        <Smartphone className="w-3 h-3 text-amber-400" />
                        <span>เจ้าของเครื่องที่ผูกไว้:</span>
                      </div>
                      <div className="font-bold text-white text-xs truncate">
                        {pair.user2?.full_name || 'ไม่ทราบชื่อ'}
                      </div>
                      <div className="text-[10px] text-neutral-400 font-mono">
                        รหัส: <strong className="text-amber-400 font-bold">{pair.user2?.employee_code || '-'}</strong> ({pair.user2?.nickname || '-'})
                      </div>
                    </div>
                  </div>

                  {/* Timestamp & Quick Action Toolbar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-neutral-800 text-[11px] font-sans">
                    <div className="text-neutral-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-neutral-500" />
                      <span>ล่าสุด: {formatThaiDateTime(pair.latestCreatedAt)} {relative && `(${relative})`}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedPairKey(isSelected ? null : pair.key)}
                        className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-rose-600 text-white'
                            : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700'
                        }`}
                      >
                        {isSelected ? '✓ กำลังแสดงคู่นี้' : `🔍 ดู ${pair.count} รายการ`}
                      </button>

                      {pair.user1?.id && (
                        <button
                          onClick={() => handleResetHWID(pair.user1.id, pair.user1.full_name)}
                          disabled={actionLoadingId === `hwid-${pair.user1.id}`}
                          className="px-2.5 py-1 rounded-md bg-neutral-800 hover:bg-amber-900/30 text-amber-400 border border-neutral-700 hover:border-amber-500/40 text-xs font-bold"
                          title="ปลดล็อกเครื่องประจำตัว"
                        >
                          <Unlock className="w-3 h-3 inline mr-1" />
                          ปลดล็อก
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ============================================================= */}
      {/* 3. FILTER & SEARCH CONTROLS                                   */}
      {/* ============================================================= */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-4 rounded-xl bg-neutral-950 border border-neutral-800 shadow-md">
        {/* Search Field */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาชื่อพนักงาน, รหัส, หรือคำอธิบาย..."
            className="w-full pl-10 pr-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs font-sans text-white placeholder:text-neutral-500 focus:outline-none focus:border-white transition-colors"
          />
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 font-sans text-xs">
          {/* Status Segment */}
          <div className="flex items-center bg-neutral-900 p-1 rounded-lg border border-neutral-800 shrink-0">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-md font-bold transition-all ${
                statusFilter === 'all' ? 'bg-white text-black shadow-xs' : 'text-neutral-400 hover:text-white'
              }`}
            >
              ทั้งหมด ({totalLogs})
            </button>
            <button
              onClick={() => setStatusFilter('unresolved')}
              className={`px-3 py-1 rounded-md font-bold transition-all ${
                statusFilter === 'unresolved' ? 'bg-rose-600 text-white shadow-xs' : 'text-neutral-400 hover:text-white'
              }`}
            >
              รอดำเนินการ ({unresolvedLogs.length})
            </button>
            <button
              onClick={() => setStatusFilter('resolved')}
              className={`px-3 py-1 rounded-md font-bold transition-all ${
                statusFilter === 'resolved' ? 'bg-emerald-600 text-white shadow-xs' : 'text-neutral-400 hover:text-white'
              }`}
            >
              ปิดเคสแล้ว
            </button>
          </div>

          {/* Reset Filters */}
          {(typeFilter !== 'all' || statusFilter !== 'all' || searchQuery || selectedPairKey) && (
            <button
              onClick={() => {
                setTypeFilter('all');
                setStatusFilter('all');
                setSearchQuery('');
                setSelectedPairKey(null);
              }}
              className="px-3 py-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 text-xs font-bold shrink-0 transition-colors"
            >
              ล้างตัวกรองทั้งหมด
            </button>
          )}
        </div>
      </div>

      {/* ============================================================= */}
      {/* 4. CHRONOLOGICAL INCIDENT LOG FEED (บันทึกเหตุการณ์อย่างละเอียด) */}
      {/* ============================================================= */}
      {filteredLogs.length === 0 ? (
        <div className="py-16 px-4 text-center rounded-2xl bg-neutral-950 border border-dashed border-neutral-800 space-y-2">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto text-xl font-bold">
            ✓
          </div>
          <div className="font-bold text-white text-base">
            {logs.length === 0 ? 'ไม่พบบันทึกความผิดปกติ ระบบปลอดภัย 100%' : 'ไม่พบรายการที่ตรงกับเงื่อนไขการค้นหา'}
          </div>
          <p className="text-xs text-neutral-400 font-sans">
            ระบบตรวจสอบการลงเวลาแทนกันและตำแหน่งพิกัด GPS ตลอด 24 ชั่วโมง
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredLogs.map((log) => {
            const explanation = getSecurityExplanation(log);
            const isUnresolved = !log.is_resolved;
            const emp1 = log.employee;
            const emp2 = log.other_employee;
            const isOverlap = log.violation_type === 'HWID_OVERLAP';
            const isMismatch = log.violation_type === 'DEVICE_MISMATCH';
            const isGeofence = log.violation_type === 'OUT_OF_GEOFENCE_BLOCKED';
            const relativeTime = getRelativeTimeThai(log.created_at);

            const geofence = isGeofence ? parseGeofenceDetails(log.description) : null;

            return (
              <div
                key={log.id}
                className={`rounded-2xl border transition-all overflow-hidden bg-[#0c0c0c] shadow-lg ${
                  isUnresolved ? 'border-neutral-700' : 'border-neutral-800/80 opacity-80'
                }`}
              >
                {/* Header Banner */}
                <div className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 bg-neutral-950">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold font-sans ${explanation.badgeColor}`}>
                      {explanation.badgeLabel}
                    </span>
                    <span className="text-xs font-bold text-neutral-300 flex items-center gap-1.5 font-sans">
                      <Clock className="w-3.5 h-3.5 text-neutral-400" />
                      <span>{formatThaiDateTime(log.created_at)}</span>
                      {relativeTime && (
                        <span className="text-[11px] text-neutral-500 font-normal">({relativeTime})</span>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {log.is_resolved ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 font-sans">
                        <Check className="w-3 h-3 text-emerald-400" />
                        ตรวจสอบแล้ว (Resolved)
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1 font-sans animate-pulse">
                        <AlertTriangle className="w-3 h-3 text-rose-400" />
                        รอดำเนินการ (Pending)
                      </span>
                    )}
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-5 sm:p-6 space-y-4 font-sans text-xs">
                  {/* Title & Core Meaning */}
                  <div>
                    <h4 className="font-bold text-sm sm:text-base text-white leading-snug">
                      {explanation.title}
                    </h4>
                    <p className="text-xs text-neutral-400 mt-1">
                      <strong className="text-neutral-300">ความหมาย:</strong> {explanation.meaning}
                    </p>
                  </div>

                  {/* 1. If OVERLAP: Side-by-Side Pairing Detail */}
                  {isOverlap && (
                    <div className="p-4 rounded-xl bg-neutral-950 border border-rose-500/30 text-white space-y-3 shadow-inner">
                      <div className="text-[11px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-rose-400" />
                        <span>เปรียบเทียบพนักงานที่ใช้อุปกรณ์เดียวกัน (Cross-Account Pairing)</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Person 1: Logged in now */}
                        <div className="p-3 rounded-lg bg-neutral-900 border border-rose-500/30 space-y-1">
                          <div className="text-[10px] text-rose-300 font-bold flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span>ผู้พยายามล็อกอิน:</span>
                          </div>
                          <div className="font-bold text-sm text-white">
                            {emp1 ? `${emp1.full_name} (${emp1.nickname || '-'})` : 'ไม่ทราบชื่อ'}
                          </div>
                          <div className="text-[11px] text-neutral-400 font-mono">
                            รหัสพนักงาน: <strong className="text-amber-400">{emp1?.employee_code || '-'}</strong>
                          </div>
                        </div>

                        {/* Person 2: Original Phone Owner */}
                        <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-700 space-y-1">
                          <div className="text-[10px] text-amber-300 font-bold flex items-center gap-1">
                            <Smartphone className="w-3 h-3" />
                            <span>เจ้าของเครื่องเดิมที่ผูกไว้:</span>
                          </div>
                          <div className="font-bold text-sm text-white">
                            {emp2 ? `${emp2.full_name} (${emp2.nickname || '-'})` : 'ไม่ทราบชื่อ'}
                          </div>
                          <div className="text-[11px] text-neutral-400 font-mono">
                            รหัสพนักงาน: <strong className="text-amber-400">{emp2?.employee_code || '-'}</strong>
                          </div>
                        </div>
                      </div>

                      {log.hwid && (
                        <div className="text-[11px] text-neutral-400 font-mono flex items-center gap-2 pt-1 border-t border-neutral-800">
                          <Smartphone className="w-3.5 h-3.5 text-neutral-500" />
                          <span>Hardware ID ประจำเครื่อง: <span className="text-neutral-200 font-bold">{log.hwid}</span></span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 2. If GEOFENCE: Location & Google Maps Card */}
                  {isGeofence && (
                    <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-500/30 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-500/20 pb-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-blue-300">
                          <MapPin className="w-4 h-4 text-blue-400" />
                          <span>พิกัดการลงเวลานอกพื้นที่ร้าน (Geofence Alert)</span>
                        </div>

                        {geofence?.mapsUrl && (
                          <a
                            href={geofence.mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] flex items-center gap-1 transition-all shadow-xs shrink-0"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>🗺️ เปิดดูบน Google Maps</span>
                          </a>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-mono">
                        <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800">
                          <div className="text-[10px] text-neutral-400 font-sans">ระยะห่างจริงจากร้าน:</div>
                          <div className="text-sm font-black text-rose-400 mt-0.5">
                            📍 {geofence?.distance ? `${geofence.distance.toFixed(1)} เมตร` : 'เกินระยะกำหนด'}
                          </div>
                        </div>

                        <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800">
                          <div className="text-[10px] text-neutral-400 font-sans">รัศมีร้านที่อนุญาต:</div>
                          <div className="text-sm font-bold text-emerald-400 mt-0.5">
                            ✓ ไม่เกิน 50.0 เมตร
                          </div>
                        </div>

                        <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800">
                          <div className="text-[10px] text-neutral-400 font-sans">พิกัดดาวเทียม (GPS):</div>
                          <div className="text-[11px] font-bold text-neutral-300 mt-0.5 truncate">
                            {geofence?.lat && geofence?.lng ? `${geofence.lat.toFixed(6)}, ${geofence.lng.toFixed(6)}` : 'ตรวจจับจาก Geolocation'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 3. If DEVICE MISMATCH */}
                  {isMismatch && (
                    <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                        <Smartphone className="w-4 h-4 text-amber-400" />
                        <span>พนักงาน: {emp1?.full_name} (รหัส: {emp1?.employee_code}) - อุปกรณ์ที่ใช้ไม่ตรงกับที่ลงทะเบียน</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                        <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800">
                          <span className="text-neutral-400 font-sans">เครื่องที่ผูกไว้เดิม:</span>{' '}
                          <span className="font-bold text-emerald-400">{emp1?.hwid || 'ยังไม่เคยผูก'}</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800">
                          <span className="text-neutral-400 font-sans">เครื่องใหม่ที่พยายามเข้า:</span>{' '}
                          <span className="font-bold text-rose-400">{log.hwid || 'UNKNOWN'}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Risk Analysis & Recommendation */}
                  <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 text-xs space-y-2">
                    <div className="font-bold text-neutral-200 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      <span>บทวิเคราะห์พฤติกรรมและความเสี่ยง (Risk & Behavior Analysis):</span>
                    </div>
                    <p className="text-neutral-300 leading-relaxed font-sans">
                      {explanation.riskAnalysis}
                    </p>
                    <div className="text-[11px] text-neutral-400 pt-1.5 border-t border-neutral-800 flex items-start gap-1 font-sans">
                      <strong className="text-emerald-400">💡 คำแนะนำ:</strong>
                      <span>{explanation.recommendation}</span>
                    </div>
                  </div>

                  {/* Action Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-neutral-800">
                    <div className="text-[11px] text-neutral-500 font-mono">
                      Log ID: #{log.id.slice(0, 8).toUpperCase()}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Reset HWID Button */}
                      {(isMismatch || isOverlap) && emp1?.id && (
                        <button
                          onClick={() => handleResetHWID(emp1.id, emp1.full_name)}
                          disabled={actionLoadingId === `hwid-${emp1.id}`}
                          className="px-3.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700 text-xs font-bold transition-all flex items-center gap-1.5"
                        >
                          <Unlock className="w-3.5 h-3.5 text-amber-400" />
                          <span>{actionLoadingId === `hwid-${emp1.id}` ? 'กำลังปลดล็อก...' : `ปลดล็อกเครื่อง (${emp1.nickname || emp1.employee_code})`}</span>
                        </button>
                      )}

                      {/* Resolve Button */}
                      {!log.is_resolved ? (
                        <button
                          onClick={() => handleResolve(log.id)}
                          disabled={actionLoadingId === log.id}
                          className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{actionLoadingId === log.id ? 'กำลังบันทึก...' : '✓ รับทราบ / ปิดเคส'}</span>
                        </button>
                      ) : (
                        <span className="px-3 py-1.5 rounded-lg bg-neutral-900 text-neutral-500 text-xs font-bold flex items-center gap-1.5 border border-neutral-800">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>ปิดเคสแล้ว</span>
                        </span>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
