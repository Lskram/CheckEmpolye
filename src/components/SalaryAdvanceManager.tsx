'use client';

import { useState } from 'react';
import { 
  Coins, 
  CheckCircle2, 
  XCircle, 
  Clock3, 
  Search, 
  Filter, 
  Calendar, 
  Check, 
  X, 
  AlertCircle, 
  User, 
  DollarSign, 
  RefreshCw,
  Clock,
  FileText,
  Printer,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { SalaryAdvanceRequest } from '@/lib/types';
import CashAdvanceReceiptModal from '@/components/CashAdvanceReceiptModal';

interface SalaryAdvanceManagerProps {
  requests: SalaryAdvanceRequest[];
  onRefresh: () => void;
  reviewerId: string;
  onActionCompleted?: (id: string, status: 'APPROVED' | 'REJECTED') => void;
  storeSettings?: {
    store_name?: string;
    store_address?: string;
    store_phone?: string;
  };
}

export default function SalaryAdvanceManager({ 
  requests, 
  onRefresh, 
  reviewerId,
  onActionCompleted,
  storeSettings
}: SalaryAdvanceManagerProps) {
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [justApprovedItem, setJustApprovedItem] = useState<SalaryAdvanceRequest | null>(null);

  // Reject Modal State
  const [rejectingItem, setRejectingItem] = useState<SalaryAdvanceRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Receipt Modal State
  const [receiptModalItem, setReceiptModalItem] = useState<SalaryAdvanceRequest | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Summary Metrics
  const totalCount = requests.length;
  const pendingList = requests.filter((r) => r.status === 'PENDING');
  const approvedList = requests.filter((r) => r.status === 'APPROVED');
  const rejectedList = requests.filter((r) => r.status === 'REJECTED');
  const totalApprovedAmount = approvedList.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const totalPendingAmount = pendingList.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  // Filtered List
  const filteredList = requests.filter((r) => {
    if (statusFilter === 'pending' && r.status !== 'PENDING') return false;
    if (statusFilter === 'approved' && r.status !== 'APPROVED') return false;
    if (statusFilter === 'rejected' && r.status !== 'REJECTED') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const empName = r.employee?.full_name?.toLowerCase() || '';
      const empCode = r.employee?.employee_code?.toLowerCase() || '';
      const empNick = r.employee?.nickname?.toLowerCase() || '';
      const reason = r.reason?.toLowerCase() || '';
      return empName.includes(q) || empCode.includes(q) || empNick.includes(q) || reason.includes(q);
    }
    return true;
  });

  const handleApprove = async (item: SalaryAdvanceRequest) => {
    const empName = item.employee?.full_name || item.employee?.nickname || item.employee?.employee_code || 'พนักงาน';
    const amountNum = Number(item.amount) || 0;

    if (!confirm(`ยืนยันการ "อนุมัติ" ให้คุณ ${empName} เบิกเงินล่วงหน้า ${amountNum.toLocaleString()} บาท หรือไม่?`)) return;

    setActionLoadingId(item.id);
    try {
      const res = await fetch('/api/advance-request', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          status: 'APPROVED',
          reviewedBy: reviewerId,
        }),
      });

      const data = await res.json();
      if (data.success) {
        const updatedItem: SalaryAdvanceRequest = {
          ...item,
          status: 'APPROVED',
          reviewed_by: reviewerId,
          reviewed_at: new Date().toISOString()
        };

        setJustApprovedItem(updatedItem);
        setActionMsg(`✓ อนุมัติการขอเบิกเงิน ${amountNum.toLocaleString()} บาท ของ ${empName} เรียบร้อยแล้ว`);
        setTimeout(() => setActionMsg(null), 8000);

        if (onActionCompleted) {
          onActionCompleted(item.id, 'APPROVED');
        }
        onRefresh();

        // Optionally open receipt modal right away
        setReceiptModalItem(updatedItem);
        setIsReceiptModalOpen(true);
      } else {
        alert('เกิดข้อผิดพลาด: ' + data.message);
      }
    } catch (e: any) {
      alert('เกิดข้อผิดพลาด: ' + e.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingItem) return;
    if (!rejectReason.trim()) {
      alert('กรุณาระบุเหตุผลที่ไม่อนุมัติ');
      return;
    }

    setActionLoadingId(rejectingItem.id);
    try {
      const res = await fetch('/api/advance-request', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: rejectingItem.id,
          status: 'REJECTED',
          reviewedBy: reviewerId,
          rejectionReason: rejectReason.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setActionMsg(`ปฏิเสธคำขอเบิกเงินของ ${rejectingItem.employee?.full_name || 'พนักงาน'} เรียบร้อย`);
        setTimeout(() => setActionMsg(null), 4000);
        if (onActionCompleted) {
          onActionCompleted(rejectingItem.id, 'REJECTED');
        }
        setRejectingItem(null);
        setRejectReason('');
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

  const handleOpenReceipt = (item: SalaryAdvanceRequest) => {
    setReceiptModalItem(item);
    setIsReceiptModalOpen(true);
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header Ribbon & Metrics (Vercel Dark Obsidian) */}
      <div className="vercel-card p-6 sm:p-7 rounded-2xl border border-neutral-800 bg-[#0c0c0e] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold text-lg">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-lg sm:text-xl text-white tracking-tight flex items-center gap-2">
                  <span>ระบบอนุมัติคำขอเบิกเงินด่วน (Salary Advance Hub)</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold">
                    พร้อมพิมพ์เอกสาร A4
                  </span>
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5 font-mono">
                  ตรวจสอบ อนุมัติ และสร้างเอกสารใบสำคัญจ่ายเงิน/ใบรับเงินขนาดมาตรฐาน A4 อัตโนมัติ
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <button
              onClick={onRefresh}
              className="p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-700 hover:text-white transition-colors"
              title="รีเฟรชข้อมูล"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Action Success Notification Banner with Direct Receipt Link */}
        {actionMsg && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn shadow-lg shadow-emerald-950/40">
            <div className="flex items-center gap-2.5">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{actionMsg}</span>
            </div>
            {justApprovedItem && (
              <button
                onClick={() => handleOpenReceipt(justApprovedItem)}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-500 text-black font-black text-xs flex items-center gap-1.5 shadow-md hover:bg-emerald-400 transition-all self-end sm:self-auto"
              >
                <Printer className="w-3.5 h-3.5 text-black" />
                <span>เปิดพิมพ์เอกสารรับเงิน ➔</span>
              </button>
            )}
          </div>
        )}

        {/* 3 Metric Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1 font-mono">
          
          {/* 1. Pending */}
          <div 
            onClick={() => setStatusFilter(statusFilter === 'pending' ? 'all' : 'pending')}
            className={`p-5 rounded-2xl border transition-all cursor-pointer ${
              statusFilter === 'pending'
                ? 'bg-amber-950/30 border-amber-500/60 ring-2 ring-amber-500/20'
                : 'bg-neutral-900/50 border-neutral-800 hover:border-neutral-700'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold text-amber-400">
              <span className="flex items-center gap-2">
                <Clock3 className="w-4 h-4 text-amber-400" />
                รอพิจารณาอนุมัติ
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black">
                {pendingList.length} รายการ
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white mt-2.5 flex items-baseline gap-2">
              <span>฿{totalPendingAmount.toLocaleString()}</span>
              <span className="text-xs font-sans text-neutral-400 font-normal">บาท</span>
            </div>
          </div>

          {/* 2. Approved Total */}
          <div 
            onClick={() => setStatusFilter(statusFilter === 'approved' ? 'all' : 'approved')}
            className={`p-5 rounded-2xl border transition-all cursor-pointer ${
              statusFilter === 'approved'
                ? 'bg-emerald-950/30 border-emerald-500/60 ring-2 ring-emerald-500/20'
                : 'bg-neutral-900/50 border-neutral-800 hover:border-neutral-700'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                อนุมัติแล้วสะสม
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black">
                {approvedList.length} รายการ
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white mt-2.5 flex items-baseline gap-2">
              <span>฿{totalApprovedAmount.toLocaleString()}</span>
              <span className="text-xs font-sans text-neutral-400 font-normal">บาท</span>
            </div>
          </div>

          {/* 3. Total Requests */}
          <div 
            onClick={() => setStatusFilter('all')}
            className={`p-5 rounded-2xl border transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-neutral-900 border-neutral-600 ring-2 ring-neutral-500/20'
                : 'bg-neutral-900/50 border-neutral-800 hover:border-neutral-700'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold text-neutral-300">
              <span className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-neutral-400" />
                คำขอทั้งหมด
              </span>
              <span className="text-neutral-500 text-[10px] font-bold">
                รวมทุกสถานะ
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white mt-2.5 flex items-baseline gap-2">
              <span>{totalCount}</span>
              <span className="text-xs font-sans text-neutral-400 font-normal">รายการ</span>
            </div>
          </div>

        </div>
      </div>

      {/* 2. Filter & Search Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 font-mono text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาชื่อพนักงาน, รหัส, หรือเหตุผล..."
            className="w-full pl-10 pr-4 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:border-white transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-neutral-900 rounded-xl border border-neutral-800 text-[11px]">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              statusFilter === 'all' ? 'bg-white text-black shadow-xs' : 'text-neutral-400 hover:text-white'
            }`}
          >
            ทั้งหมด ({totalCount})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              statusFilter === 'pending' ? 'bg-amber-400 text-black shadow-xs' : 'text-neutral-400 hover:text-white'
            }`}
          >
            รอพิจารณา ({pendingList.length})
          </button>
          <button
            onClick={() => setStatusFilter('approved')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              statusFilter === 'approved' ? 'bg-emerald-400 text-black shadow-xs' : 'text-neutral-400 hover:text-white'
            }`}
          >
            อนุมัติแล้ว ({approvedList.length})
          </button>
          <button
            onClick={() => setStatusFilter('rejected')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              statusFilter === 'rejected' ? 'bg-rose-500 text-white shadow-xs' : 'text-neutral-400 hover:text-white'
            }`}
          >
            ไม่อนุมัติ ({rejectedList.length})
          </button>
        </div>
      </div>

      {/* 3. Requests List */}
      {filteredList.length === 0 ? (
        <div className="py-16 px-4 text-center rounded-2xl bg-neutral-950 border border-dashed border-neutral-800 text-neutral-500 text-xs font-mono space-y-2">
          <Coins className="w-10 h-10 text-neutral-600 mx-auto opacity-50" />
          <div className="font-bold text-neutral-400">ไม่พบรายการคำขอเบิกเงินล่วงหน้าที่ตรงกับเงื่อนไข</div>
          <p className="text-[11px] text-neutral-600">ลองเปลี่ยนตัวกรองสถานะหรือคำค้นหาด้านบน</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredList.map((item) => {
            const isPending = item.status === 'PENDING';
            const isApproved = item.status === 'APPROVED';
            const isRejected = item.status === 'REJECTED';
            const emp = item.employee;

            return (
              <div
                key={item.id}
                className={`p-6 rounded-2xl border transition-all space-y-4 bg-[#0c0c0e] ${
                  isPending
                    ? 'border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.1)]'
                    : isApproved
                    ? 'border-emerald-500/40 hover:border-emerald-500/60'
                    : 'border-neutral-800 opacity-70'
                }`}
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-neutral-900 border border-neutral-700 text-white font-mono font-black text-sm flex items-center justify-center overflow-hidden shrink-0">
                      {emp?.avatar_url ? (
                        <img src={emp.avatar_url} alt={emp?.full_name || 'พนักงาน'} className="w-full h-full object-cover" />
                      ) : (
                        <span>{emp?.employee_code || emp?.nickname?.charAt(0) || '01'}</span>
                      )}
                    </div>
                    <div>
                      <div className="font-black text-base text-white flex items-center gap-2 font-sans">
                        <span>{emp ? emp.full_name : 'ไม่ทราบชื่อพนักงาน'}</span>
                        {emp?.nickname && (
                          <span className="text-xs font-normal text-neutral-400">({emp.nickname})</span>
                        )}
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-neutral-900 text-neutral-300 border border-neutral-800">
                          รหัส: {emp?.employee_code || '-'}
                        </span>
                      </div>
                      <div className="text-xs font-mono text-neutral-400 flex items-center gap-2 mt-1">
                        <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                        <span>วันที่ขอเบิก: {new Date(item.request_date || item.created_at || Date.now()).toLocaleDateString('th-TH')}</span>
                        <span>•</span>
                        <span className="text-neutral-400">{emp?.role || 'ช่างเทคนิค'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right font-mono">
                      <div className="text-2xl font-black text-white">
                        ฿{Number(item.amount).toLocaleString()}
                      </div>
                      <div className="text-[10px] text-neutral-400">ยอดที่ขอเบิก</div>
                    </div>

                    <div>
                      {isPending && (
                        <span className="px-3 py-1 rounded-full text-xs font-mono font-black bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
                          <Clock3 className="w-3.5 h-3.5 text-amber-400" />
                          รอพิจารณา
                        </span>
                      )}
                      {isApproved && (
                        <span className="px-3 py-1 rounded-full text-xs font-mono font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          อนุมัติแล้ว ✓
                        </span>
                      )}
                      {isRejected && (
                        <span className="px-3 py-1 rounded-full text-xs font-mono font-black bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1.5">
                          <XCircle className="w-3.5 h-3.5 text-rose-400" />
                          ไม่อนุมัติ
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Reason & Agenda Details */}
                <div className="space-y-2 text-xs font-mono">
                  <div className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-800 text-neutral-300 font-sans leading-relaxed">
                    <span className="font-bold text-white font-mono">📋 เหตุผลและวาระความจำเป็น: </span> 
                    {item.reason || '-'}
                  </div>

                  {item.needed_before_date && (
                    <div className="text-xs text-amber-300 bg-amber-950/20 px-3 py-1.5 rounded-lg font-medium w-fit border border-amber-500/30 flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>จำเป็นต้องใช้เงินก่อนวันที่: <b className="text-white">{new Date(item.needed_before_date).toLocaleDateString('th-TH')}</b></span>
                    </div>
                  )}

                  {isRejected && item.rejection_reason && (
                    <div className="p-3 bg-rose-950/20 text-rose-300 rounded-xl border border-rose-500/30 text-xs">
                      <span className="font-bold text-rose-200">เหตุผลที่ไม่อนุมัติ: </span> {item.rejection_reason}
                    </div>
                  )}
                </div>

                {/* Action Section: Pending vs Approved */}
                {isPending && (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-neutral-800 font-mono text-xs">
                    <span className="text-neutral-500 text-[11px]">
                      * การอนุมัติจะอัปเดตยอดหักเงินเดือนอัตโนมัติ และสร้างเอกสารรับเงิน
                    </span>

                    <div className="flex items-center justify-end gap-2.5">
                      <button
                        onClick={() => setRejectingItem(item)}
                        disabled={actionLoadingId === item.id}
                        className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-rose-950/30 hover:text-rose-300 text-neutral-400 text-xs font-bold flex items-center gap-1.5 transition-colors border border-neutral-800 hover:border-rose-500/30"
                      >
                        <X className="w-4 h-4 text-rose-400" />
                        <span>ปฏิเสธ</span>
                      </button>

                      <button
                        onClick={() => handleApprove(item)}
                        disabled={actionLoadingId === item.id}
                        className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                      >
                        <Check className="w-4 h-4 text-black stroke-[3]" />
                        <span>{actionLoadingId === item.id ? 'กำลังบันทึก...' : '✓ อนุมัติการเบิกเงิน'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* APPROVED: Show Receipt Generator Button */}
                {isApproved && (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-neutral-800 font-mono text-xs">
                    <div className="text-emerald-400 flex items-center gap-2 text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>รายการได้รับการอนุมัติเรียบร้อย พร้อมพิมพ์ใบสำคัญรับเงิน</span>
                    </div>

                    <button
                      onClick={() => handleOpenReceipt(item)}
                      className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-emerald-300 hover:text-emerald-200 border border-emerald-500/40 text-xs font-black flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 group"
                    >
                      <FileText className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                      <span>📄 สร้างเอกสารรับเงิน / พิมพ์ใบสำคัญจ่าย (A4)</span>
                    </button>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

      {/* Reject Modal */}
      {rejectingItem && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 rounded-3xl bg-[#111113] border border-neutral-800 shadow-2xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                <XCircle className="w-5 h-5" />
                <span>ปฏิเสธคำขอเบิกเงินล่วงหน้า</span>
              </div>
              <button
                onClick={() => {
                  setRejectingItem(null);
                  setRejectReason('');
                }}
                className="w-7 h-7 rounded-full bg-neutral-900 text-neutral-400 hover:text-white flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-neutral-300 font-sans">
              ปฏิเสธคำขอเบิกเงินของ <span className="font-bold text-white">{rejectingItem.employee?.full_name}</span> จำนวน{' '}
              <span className="font-bold text-rose-400">฿{Number(rejectingItem.amount).toLocaleString()} บาท</span>
            </p>

            <div className="space-y-1.5">
              <label className="block font-bold text-neutral-300">
                ระบุเหตุผลที่ไม่อนุมัติ: <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="เช่น ยอดเงินเกินเกณฑ์กำหนด, เพิ่งเบิกไปเมื่อสัปดาห์ก่อน ฯลฯ"
                className="w-full p-3 bg-neutral-950 border border-neutral-800 rounded-xl text-white font-sans text-xs focus:outline-none focus:border-rose-500"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
              <button
                onClick={() => {
                  setRejectingItem(null);
                  setRejectReason('');
                }}
                className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-bold"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={actionLoadingId === rejectingItem.id}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black transition-all shadow-md"
              >
                {actionLoadingId === rejectingItem.id ? 'กำลังบันทึก...' : 'ยืนยันการปฏิเสธ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Print-Ready Receipt Modal */}
      <CashAdvanceReceiptModal
        request={receiptModalItem}
        isOpen={isReceiptModalOpen}
        onClose={() => {
          setIsReceiptModalOpen(false);
          setReceiptModalItem(null);
        }}
        storeSettings={storeSettings}
      />

    </div>
  );
}
