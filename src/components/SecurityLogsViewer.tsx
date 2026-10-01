'use client';

import { useState } from 'react';
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
  ChevronDown
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
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Summary counts
  const totalLogs = logs.length;
  const unresolvedLogs = logs.filter((l) => !l.is_resolved);
  const hwidOverlapCount = logs.filter((l) => l.violation_type === 'HWID_OVERLAP').length;
  const deviceMismatchCount = logs.filter((l) => l.violation_type === 'DEVICE_MISMATCH').length;
  const geofenceBlockedCount = logs.filter((l) => l.violation_type === 'OUT_OF_GEOFENCE_BLOCKED').length;
  const invalidPinCount = logs.filter((l) => l.violation_type === 'INVALID_PIN_ATTEMPTS').length;

  // Filtered Logs
  const filteredLogs = logs.filter((log) => {
    // Status filter
    if (statusFilter === 'unresolved' && log.is_resolved) return false;
    if (statusFilter === 'resolved' && !log.is_resolved) return false;

    // Type filter
    if (typeFilter !== 'all' && log.violation_type !== typeFilter) return false;

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
        setActionMessage('✓ รับทราบและปิดเคสเรียบร้อย');
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
        setActionMessage('✓ ปิดเคสความปลอดภัยทั้งหมดเรียบร้อย');
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

  // Format Date in Thai
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
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="space-y-5">
      {/* ------------------------------------------------------------- */}
      {/* HEADER & SUMMARY DASHBOARD                                    */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h3 className="font-black text-base sm:text-lg text-slate-900">
                ระบบวิเคราะห์ความปลอดภัย & ป้องกันทุจริตลงเวลา
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              วิเคราะห์พฤติกรรมเสี่ยง เช่น ฝากเช็คอินแทนกัน (Buddy Punching), ล็อกอินเครื่องอื่น, และเช็คอินนอกพิกัด
            </p>
          </div>

          <div className="flex items-center gap-2">
            {unresolvedLogs.length > 0 && (
              <button
                onClick={handleResolveAll}
                disabled={actionLoadingId === 'all'}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{actionLoadingId === 'all' ? 'กำลังบันทึก...' : '✓ รับทราบทั้งหมด'}</span>
              </button>
            )}
            <button
              onClick={onRefresh}
              className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors"
              title="รีเฟรชข้อมูล"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {actionMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fadeIn">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* 4 Summary Stat Metric Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          {/* HWID Overlap */}
          <div 
            onClick={() => setTypeFilter(typeFilter === 'HWID_OVERLAP' ? 'all' : 'HWID_OVERLAP')}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
              typeFilter === 'HWID_OVERLAP' 
                ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-400/30' 
                : 'bg-rose-50/50 border-rose-100 hover:bg-rose-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-rose-800 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-rose-600" />
                ใช้อุปกรณ์ซ้ำ
              </span>
              <span className="text-lg font-black font-mono text-rose-700">{hwidOverlapCount}</span>
            </div>
            <div className="text-[10px] text-rose-600 font-medium mt-1">สงสัยฝากกดแทน</div>
          </div>

          {/* Device Mismatch */}
          <div 
            onClick={() => setTypeFilter(typeFilter === 'DEVICE_MISMATCH' ? 'all' : 'DEVICE_MISMATCH')}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
              typeFilter === 'DEVICE_MISMATCH' 
                ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400/30' 
                : 'bg-amber-50/50 border-amber-100 hover:bg-amber-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-amber-800 flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5 text-amber-600" />
                เครื่องไม่ตรง
              </span>
              <span className="text-lg font-black font-mono text-amber-700">{deviceMismatchCount}</span>
            </div>
            <div className="text-[10px] text-amber-600 font-medium mt-1">ล็อกอินเครื่องอื่น</div>
          </div>

          {/* Geofence Blocked */}
          <div 
            onClick={() => setTypeFilter(typeFilter === 'OUT_OF_GEOFENCE_BLOCKED' ? 'all' : 'OUT_OF_GEOFENCE_BLOCKED')}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
              typeFilter === 'OUT_OF_GEOFENCE_BLOCKED' 
                ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-400/30' 
                : 'bg-blue-50/50 border-blue-100 hover:bg-blue-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-blue-800 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                นอกพื้นที่ร้าน
              </span>
              <span className="text-lg font-black font-mono text-blue-700">{geofenceBlockedCount}</span>
            </div>
            <div className="text-[10px] text-blue-600 font-medium mt-1">บล็อกพิกัดแล้ว</div>
          </div>

          {/* Invalid PIN */}
          <div 
            onClick={() => setTypeFilter(typeFilter === 'INVALID_PIN_ATTEMPTS' ? 'all' : 'INVALID_PIN_ATTEMPTS')}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
              typeFilter === 'INVALID_PIN_ATTEMPTS' 
                ? 'bg-slate-100 border-slate-300 ring-2 ring-slate-400/30' 
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-slate-800 flex items-center gap-1">
                <Key className="w-3.5 h-3.5 text-slate-600" />
                รหัสผ่านผิด
              </span>
              <span className="text-lg font-black font-mono text-slate-700">{invalidPinCount}</span>
            </div>
            <div className="text-[10px] text-slate-500 font-medium mt-1">กรอก PIN ไม่ถูก</div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* FILTER & SEARCH BAR                                           */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาชื่อพนักงาน หรือรหัส..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {/* Status Filter */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-[11px] font-bold shrink-0">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                statusFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              ทั้งหมด ({totalLogs})
            </button>
            <button
              onClick={() => setStatusFilter('unresolved')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                statusFilter === 'unresolved' ? 'bg-rose-500 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              รอดำเนินการ ({unresolvedLogs.length})
            </button>
            <button
              onClick={() => setStatusFilter('resolved')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                statusFilter === 'resolved' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              ปิดเคสแล้ว
            </button>
          </div>

          {/* Clear Filter if active */}
          {(typeFilter !== 'all' || statusFilter !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setTypeFilter('all');
                setStatusFilter('all');
                setSearchQuery('');
              }}
              className="text-[11px] font-bold text-rose-600 hover:underline px-2 shrink-0"
            >
              ล้างตัวกรอง
            </button>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* INCIDENT LOG CARDS LIST                                       */}
      {/* ------------------------------------------------------------- */}
      {filteredLogs.length === 0 ? (
        <div className="py-14 px-4 text-center bg-white rounded-3xl border border-dashed border-slate-200 shadow-2xs space-y-2">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-xl">
            ✓
          </div>
          <div className="font-black text-slate-800 text-sm">
            {logs.length === 0 ? 'ไม่พบบันทึกความผิดปกติ ทุกอย่างปลอดภัย 100%' : 'ไม่พบรายการที่ตรงกับเงื่อนไขการค้นหา'}
          </div>
          <p className="text-xs text-slate-400">
            ระบบป้องกันการลงเวลาแทนกันและตรวจสอบพิกัด GPS ตลอด 24 ชม.
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

            return (
              <div
                key={log.id}
                className={`bg-white rounded-3xl border transition-all shadow-xs overflow-hidden ${explanation.borderColor} ${
                  isUnresolved ? 'ring-2 ring-opacity-30' : 'opacity-85'
                }`}
              >
                {/* Top Banner with Type & Timestamp */}
                <div className={`p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 ${explanation.bgColor}`}>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className={`px-2.5 py-1 rounded-xl text-[11px] font-black ${explanation.badgeColor}`}>
                      {explanation.badgeLabel}
                    </span>
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {formatThaiDateTime(log.created_at)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {log.is_resolved ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-600" />
                        ตรวจสอบแล้ว (Resolved)
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-rose-600" />
                        รอดำเนินการ (Pending Review)
                      </span>
                    )}
                  </div>
                </div>

                {/* Main Body */}
                <div className="p-5 sm:p-6 space-y-4">
                  {/* Title & Meaning */}
                  <div>
                    <h4 className="font-black text-sm sm:text-base text-slate-900 leading-snug">
                      {explanation.title}
                    </h4>
                    <p className="text-xs text-slate-600 mt-1">
                      <span className="font-bold text-slate-700">ความหมาย:</span> {explanation.meaning}
                    </p>
                  </div>

                  {/* Context Comparison Box: User A vs User B (Crucial for Buddy Punching!) */}
                  {isOverlap && (
                    <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3 shadow-md">
                      <div className="text-[11px] font-black text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-rose-400" />
                        <span>เปรียบเทียบพนักงานที่ใช้อุปกรณ์เดียวกัน (Cross-Account Detection)</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Person 1: Logged in now */}
                        <div className="p-3 rounded-xl bg-slate-800 border border-rose-500/30 space-y-1">
                          <div className="text-[10px] text-rose-300 font-bold">👤 พนักงานที่พยายามล็อกอิน:</div>
                          <div className="font-black text-sm text-white">
                            {emp1 ? `${emp1.full_name} (${emp1.nickname || '-'})` : 'ไม่ทราบชื่อ'}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            รหัสพนักงาน: <span className="text-amber-400 font-bold">{emp1?.employee_code || '-'}</span>
                          </div>
                        </div>

                        {/* Person 2: Original Phone Owner */}
                        <div className="p-3 rounded-xl bg-slate-800 border border-slate-700 space-y-1">
                          <div className="text-[10px] text-amber-300 font-bold">📱 เจ้าของเครื่องเดิมที่เคยผูกไว้:</div>
                          <div className="font-black text-sm text-white">
                            {emp2 ? `${emp2.full_name} (${emp2.nickname || '-'})` : 'ไม่ทราบชื่อ'}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            รหัสพนักงาน: <span className="text-amber-400 font-bold">{emp2?.employee_code || '-'}</span>
                          </div>
                        </div>
                      </div>

                      {log.hwid && (
                        <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2 pt-1 border-t border-slate-800">
                          <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                          <span>Hardware ID เครื่องร่วม: <span className="text-slate-200 font-bold">{log.hwid}</span></span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Device Mismatch Context */}
                  {isMismatch && (
                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-300 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                        <Smartphone className="w-4 h-4 text-amber-600" />
                        <span>พนักงาน: {emp1?.full_name} ({emp1?.employee_code}) - เครื่องประจำตัวไม่ตรง</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                        <div className="p-2 rounded-lg bg-white border border-amber-200">
                          <span className="text-slate-500">เครื่องที่ผูกไว้เดิม:</span>{' '}
                          <span className="font-bold text-slate-800">{emp1?.hwid || 'ยังไม่เคยผูก'}</span>
                        </div>
                        <div className="p-2 rounded-lg bg-white border border-amber-200">
                          <span className="text-slate-500">เครื่องใหม่ที่พยายามเข้า:</span>{' '}
                          <span className="font-bold text-rose-600">{log.hwid || 'UNKNOWN'}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Risk Analysis & Behavior Explanation Box */}
                  <div className={`p-4 rounded-2xl border text-xs space-y-1.5 ${
                    isOverlap ? 'bg-rose-50 border-rose-200 text-rose-950' :
                    isMismatch ? 'bg-amber-50 border-amber-200 text-amber-950' :
                    'bg-slate-50 border-slate-200 text-slate-800'
                  }`}>
                    <div className="font-black text-[11px] flex items-center gap-1.5 text-slate-900">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      <span>บทวิเคราะห์พฤติกรรมและความเสี่ยง (Risk & Behavior Analysis):</span>
                    </div>
                    <p className="font-medium leading-relaxed">
                      {explanation.riskAnalysis}
                    </p>
                    <div className="text-[11px] text-slate-600 pt-1 border-t border-slate-200/60 flex items-start gap-1">
                      <span className="font-bold text-slate-800">💡 คำแนะนำ:</span>
                      <span>{explanation.recommendation}</span>
                    </div>
                  </div>

                  {/* Action Buttons Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    <div className="text-[11px] text-slate-400 font-mono">
                      Log ID: #{log.id.slice(0, 8).toUpperCase()}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Reset HWID Button if Mismatch or Overlap */}
                      {(isMismatch || isOverlap) && emp1 && (
                        <button
                          onClick={() => handleResetHWID(emp1.id, emp1.full_name)}
                          disabled={actionLoadingId === `hwid-${emp1.id}`}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-amber-50 hover:text-amber-800 text-slate-700 text-xs font-bold flex items-center gap-1.5 border border-slate-200 transition-colors"
                        >
                          <Unlock className="w-3.5 h-3.5 text-amber-600" />
                          <span>{actionLoadingId === `hwid-${emp1.id}` ? 'กำลังปลดล็อก...' : `🔓 ปลดล็อกเครื่อง (${emp1.nickname || emp1.employee_code})`}</span>
                        </button>
                      )}

                      {/* Resolve Case Button */}
                      {!log.is_resolved ? (
                        <button
                          onClick={() => handleResolve(log.id)}
                          disabled={actionLoadingId === log.id}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{actionLoadingId === log.id ? 'กำลังบันทึก...' : '✓ รับทราบ / ปิดเคส'}</span>
                        </button>
                      ) : (
                        <button
                          disabled
                          className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-400 text-xs font-bold flex items-center gap-1.5 cursor-not-allowed"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>ปิดเคสแล้ว</span>
                        </button>
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
