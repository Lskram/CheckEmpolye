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
  Clock
} from 'lucide-react';
import { SalaryAdvanceRequest } from '@/lib/types';

interface SalaryAdvanceManagerProps {
  requests: SalaryAdvanceRequest[];
  onRefresh: () => void;
  reviewerId: string;
  onActionCompleted?: (id: string, status: 'APPROVED' | 'REJECTED') => void;
}

export default function SalaryAdvanceManager({ 
  requests, 
  onRefresh, 
  reviewerId,
  onActionCompleted 
}: SalaryAdvanceManagerProps) {
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  // Reject Modal State
  const [rejectingItem, setRejectingItem] = useState<SalaryAdvanceRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Summary Metrics
  const totalCount = requests.length;
  const pendingList = requests.filter((r) => r.status === 'PENDING');
  const approvedList = requests.filter((r) => r.status === 'APPROVED');
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

  const handleApprove = async (id: string, empName: string, amount: number) => {
    if (!confirm(`ยืนยันการ "อนุมัติ" ให้ ${empName} เบิกเงินล่วงหน้า ${amount.toLocaleString()} บาท หรือไม่?`)) return;

    setActionLoadingId(id);
    try {
      const res = await fetch('/api/advance-request', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          status: 'APPROVED',
          reviewedBy: reviewerId,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setActionMsg(`✓ อนุมัติการขอเบิกเงิน ${amount.toLocaleString()} บาท ของ ${empName} เรียบร้อย`);
        setTimeout(() => setActionMsg(null), 4000);
        if (onActionCompleted) {
          onActionCompleted(id, 'APPROVED');
        }
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
        setActionMsg(`ปฏิเสธคำขอเบิกเงินของ ${rejectingItem.employee?.full_name} เรียบร้อย`);
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

  return (
    <div className="space-y-5">
      {/* Top Header & Metrics */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <Coins className="w-5 h-5" />
              </div>
              <h3 className="font-black text-base sm:text-lg text-slate-900">
                ระบบอนุมัติขอเบิกเงินล่วงหน้า (Salary Advance)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              ตรวจสอบและอนุมัติคำขอเบิกเงินล่วงหน้าของพนักงาน โดยยอดที่อนุมัติจะถูกนำไปหักลบในรอบเงินเดือนอัตโนมัติ
            </p>
          </div>

          <button
            onClick={onRefresh}
            className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors w-fit"
            title="รีเฟรชข้อมูล"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {actionMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fadeIn">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionMsg}</span>
          </div>
        )}

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Pending */}
          <div 
            onClick={() => setStatusFilter(statusFilter === 'pending' ? 'all' : 'pending')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              statusFilter === 'pending'
                ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400/30'
                : 'bg-amber-50/50 border-amber-100 hover:bg-amber-50'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold text-amber-800">
              <span className="flex items-center gap-1.5">
                <Clock3 className="w-4 h-4 text-amber-600" />
                รอพิจารณาอนุมัติ
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-mono text-[11px] font-black">
                {pendingList.length} รายการ
              </span>
            </div>
            <div className="text-2xl font-black font-mono text-amber-900 mt-2">
              {totalPendingAmount.toLocaleString()} <span className="text-xs font-sans font-bold">บาท</span>
            </div>
          </div>

          {/* Approved Total */}
          <div 
            onClick={() => setStatusFilter(statusFilter === 'approved' ? 'all' : 'approved')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              statusFilter === 'approved'
                ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-400/30'
                : 'bg-emerald-50/50 border-emerald-100 hover:bg-emerald-50'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold text-emerald-800">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                อนุมัติแล้วสะสม
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 font-mono text-[11px] font-black">
                {approvedList.length} รายการ
              </span>
            </div>
            <div className="text-2xl font-black font-mono text-emerald-900 mt-2">
              {totalApprovedAmount.toLocaleString()} <span className="text-xs font-sans font-bold">บาท</span>
            </div>
          </div>

          {/* Total Requests */}
          <div 
            onClick={() => setStatusFilter('all')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-slate-100 border-slate-300 ring-2 ring-slate-400/30'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-slate-500" />
                คำขอทั้งหมด
              </span>
              <span className="text-slate-500 font-mono text-[11px] font-bold">
                รวมทุกสถานะ
              </span>
            </div>
            <div className="text-2xl font-black font-mono text-slate-900 mt-2">
              {totalCount} <span className="text-xs font-sans font-bold">รายการ</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาชื่อพนักงาน, รหัส, เหตุผล..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-[11px] font-bold">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 rounded-lg transition-all ${
              statusFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            ทั้งหมด ({totalCount})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1 rounded-lg transition-all ${
              statusFilter === 'pending' ? 'bg-amber-500 text-slate-950 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            รอพิจารณา ({pendingList.length})
          </button>
          <button
            onClick={() => setStatusFilter('approved')}
            className={`px-3 py-1 rounded-lg transition-all ${
              statusFilter === 'approved' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            อนุมัติแล้ว
          </button>
          <button
            onClick={() => setStatusFilter('rejected')}
            className={`px-3 py-1 rounded-lg transition-all ${
              statusFilter === 'rejected' ? 'bg-rose-500 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            ไม่อนุมัติ
          </button>
        </div>
      </div>

      {/* Requests List */}
      {filteredList.length === 0 ? (
        <div className="py-14 px-4 text-center bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400 text-xs font-bold space-y-1">
          <Coins className="w-10 h-10 text-slate-300 mx-auto" />
          <div>ไม่พบรายการคำขอเบิกเงินล่วงหน้าที่ตรงกับเงื่อนไข</div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredList.map((item) => {
            const isPending = item.status === 'PENDING';
            const isApproved = item.status === 'APPROVED';
            const isRejected = item.status === 'REJECTED';
            const emp = item.employee;

            return (
              <div
                key={item.id}
                className={`bg-white rounded-3xl border p-5 sm:p-6 transition-all shadow-xs space-y-3 ${
                  isPending
                    ? 'border-amber-300 ring-2 ring-amber-400/20'
                    : isApproved
                    ? 'border-emerald-200'
                    : 'border-slate-200 opacity-80'
                }`}
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 font-black text-sm flex items-center justify-center border border-amber-200">
                      {emp?.nickname?.charAt(0) || emp?.full_name?.charAt(0) || 'พ'}
                    </div>
                    <div>
                      <div className="font-black text-sm text-slate-900 flex items-center gap-2">
                        <span>{emp ? emp.full_name : 'ไม่ทราบชื่อ'}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {emp?.nickname ? `(${emp.nickname})` : ''} {emp?.employee_code}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>วันที่ขอเบิก: {new Date(item.request_date).toLocaleDateString('th-TH')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xl font-black font-mono text-slate-900">
                        {Number(item.amount).toLocaleString()} <span className="text-xs font-sans font-bold">บาท</span>
                      </div>
                    </div>

                    <div>
                      {isPending && (
                        <span className="px-3 py-1 rounded-xl text-xs font-black bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                          <Clock3 className="w-3.5 h-3.5 text-amber-600" />
                          รออนุมัติ
                        </span>
                      )}
                      {isApproved && (
                        <span className="px-3 py-1 rounded-xl text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          อนุมัติแล้ว
                        </span>
                      )}
                      {isRejected && (
                        <span className="px-3 py-1 rounded-xl text-xs font-black bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          ไม่อนุมัติ
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Reason & Details */}
                <div className="space-y-1.5 text-xs">
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-slate-700">
                    <span className="font-bold text-slate-900">เหตุผลความจำเป็น:</span> {item.reason}
                  </div>

                  {item.needed_before_date && (
                    <div className="text-xs text-amber-900 bg-amber-50 px-3 py-1.5 rounded-xl font-medium w-fit border border-amber-200/60 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>จำเป็นต้องใช้เงินก่อนวันที่: <span className="font-bold">{new Date(item.needed_before_date).toLocaleDateString('th-TH')}</span></span>
                    </div>
                  )}

                  {isRejected && item.rejection_reason && (
                    <div className="p-2.5 bg-rose-50 text-rose-800 rounded-xl border border-rose-200 text-xs">
                      <span className="font-bold">เหตุผลที่ไม่อนุมัติ:</span> {item.rejection_reason}
                    </div>
                  )}
                </div>

                {/* Action Buttons for Pending Items */}
                {isPending && (
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => setRejectingItem(item)}
                      disabled={actionLoadingId === item.id}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-200"
                    >
                      <X className="w-4 h-4 text-rose-500" />
                      <span>ปฏิเสธคำขอ</span>
                    </button>

                    <button
                      onClick={() => handleApprove(item.id, emp?.full_name || emp?.employee_code || '', Number(item.amount))}
                      disabled={actionLoadingId === item.id}
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all active:scale-98"
                    >
                      <Check className="w-4 h-4" />
                      <span>{actionLoadingId === item.id ? 'กำลังบันทึก...' : '✓ อนุมัติการเบิกเงิน'}</span>
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 rounded-3xl bg-white border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-600">
                <XCircle className="w-5 h-5" />
                <h4 className="font-black text-sm text-slate-900">ปฏิเสธคำขอเบิกเงินล่วงหน้า</h4>
              </div>
              <button
                onClick={() => {
                  setRejectingItem(null);
                  setRejectReason('');
                }}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              ปฏิเสธคำขอเบิกเงินของ <span className="font-bold text-slate-900">{rejectingItem.employee?.full_name}</span> จำนวน{' '}
              <span className="font-bold text-rose-600">{Number(rejectingItem.amount).toLocaleString()} บาท</span>
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ระบุเหตุผลที่ไม่อนุมัติ: <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="เช่น ยอดเงินเกินเพดานที่กำหนด, เพิ่งเบิกไปเมื่อสัปดาห์ก่อน ฯลฯ"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-rose-500"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setRejectingItem(null);
                  setRejectReason('');
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={actionLoadingId === rejectingItem.id}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs"
              >
                {actionLoadingId === rejectingItem.id ? 'กำลังบันทึก...' : 'ยืนยันการปฏิเสธ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
