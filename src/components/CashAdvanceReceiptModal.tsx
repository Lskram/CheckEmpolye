'use client';

import React, { useState, useRef } from 'react';
import { 
  Printer, 
  X, 
  CheckCircle2, 
  FileText, 
  Building2, 
  Calendar, 
  User, 
  DollarSign, 
  ShieldCheck, 
  Coins, 
  Clock,
  ArrowRight,
  Download,
  Share2,
  Copy,
  Layers
} from 'lucide-react';
import { SalaryAdvanceRequest } from '@/lib/types';

interface CashAdvanceReceiptModalProps {
  request: SalaryAdvanceRequest | null;
  isOpen: boolean;
  onClose: () => void;
  storeSettings?: {
    store_name?: string;
    store_address?: string;
    store_phone?: string;
  };
}

/**
 * Helper to convert number to Thai Baht text (บาทถ้วน)
 */
export function thaiBahtText(num: number | string): string {
  const number = parseFloat(String(num));
  if (isNaN(number) || number === 0) return 'ศูนย์บาทถ้วน';

  const digits = ['ศูนย์', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
  const positions = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];

  const convertGroup = (nStr: string): string => {
    let res = '';
    const len = nStr.length;
    for (let i = 0; i < len; i++) {
      const digit = parseInt(nStr.charAt(i), 10);
      const pos = len - i - 1;
      if (digit !== 0) {
        if (pos === 1 && digit === 1) {
          res += 'สิบ';
        } else if (pos === 1 && digit === 2) {
          res += 'ยี่สิบ';
        } else if (pos === 0 && digit === 1 && len > 1 && parseInt(nStr.slice(0, -1), 10) > 0) {
          res += 'เอ็ด';
        } else {
          res += digits[digit] + positions[pos];
        }
      }
    }
    return res;
  };

  const [intPart, decPart] = number.toFixed(2).split('.');
  let result = '';

  if (parseInt(intPart, 10) === 0) {
    result = '';
  } else if (intPart.length > 6) {
    const millionGroup = intPart.slice(0, -6);
    const lowerGroup = intPart.slice(-6);
    result = convertGroup(millionGroup) + 'ล้าน' + convertGroup(lowerGroup) + 'บาท';
  } else {
    result = convertGroup(intPart) + 'บาท';
  }

  const satang = parseInt(decPart, 10);
  if (satang === 0) {
    result += 'ถ้วน';
  } else {
    result += convertGroup(decPart) + 'สตางค์';
  }

  return result;
}

export default function CashAdvanceReceiptModal({
  request,
  isOpen,
  onClose,
  storeSettings
}: CashAdvanceReceiptModalProps) {
  const [printCopyMode, setPrintCopyMode] = useState<'ORIGINAL' | 'COPY' | 'BOTH'>('BOTH');
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !request) return null;

  const emp = request.employee;
  const amount = Number(request.amount) || 0;
  const amountFormatted = amount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const amountThaiText = thaiBahtText(amount);

  const requestDateObj = new Date(request.request_date || request.created_at || Date.now());
  const formattedDate = requestDateObj.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const now = new Date();
  const printDateStr = now.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const printTimeStr = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

  // Generate Document ID: VCH-YYYYMMDD-ID
  const yearMonthDay = now.toISOString().slice(0, 10).replace(/-/g, '');
  const docNumber = `VCH-${yearMonthDay}-${request.id ? request.id.slice(0, 6).toUpperCase() : '001'}`;

  const storeName = storeSettings?.store_name || 'ศูนย์บริการสีแสงยางยนต์ (YOKOHAMA NAYA COSMIS)';
  const storeAddress = storeSettings?.store_address || 'สาขาศรีสะเกษ ถ.ศรีสะเกษ-อุบล ต.โพธิ์ อ.เมือง จ.ศรีสะเกษ 33000';
  const storePhone = storeSettings?.store_phone || '045-612-888, 081-999-9999';

  const handlePrint = () => {
    window.print();
  };

  /**
   * Helper sub-component to render a single voucher sheet (ต้นฉบับ or สำเนา)
   */
  const renderVoucherSheet = (versionType: 'ORIGINAL' | 'COPY', isFirstPageInDual: boolean = false) => {
    const isOriginal = versionType === 'ORIGINAL';
    const copyLabel = isOriginal ? 'ต้นฉบับ / ORIGINAL' : 'สำเนา / COPY';
    const subDesc = isOriginal ? 'สำหรับฝ่ายบัญชีและการเงิน' : 'สำหรับพนักงานผู้รับเงิน';

    return (
      <div 
        key={versionType}
        className={`w-full max-w-3xl mx-auto bg-white text-slate-900 rounded-2xl p-8 sm:p-12 shadow-2xl border border-slate-200 space-y-8 relative overflow-hidden font-sans ${
          isFirstPageInDual ? 'print-page-break mb-8' : ''
        }`}
      >
        {/* Watermark Seal */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-[0.03] select-none">
          <Building2 className="w-96 h-96 text-slate-900" />
        </div>

        {/* ----------------------------------------------------------- */}
        {/* TOP RIGHT RED STAMP: ต้นฉบับ / สำเนา (ตามที่ระบุ)             */}
        {/* ----------------------------------------------------------- */}
        <div className="absolute top-6 right-6 sm:top-8 sm:right-10 flex flex-col items-end pointer-events-none select-none">
          <div className="border-2 border-rose-600 rounded-lg px-3 py-1 bg-rose-50/80 shadow-xs text-center">
            <span className="text-xs sm:text-sm font-black font-mono uppercase tracking-wider text-rose-600 block">
              ● {copyLabel}
            </span>
            <span className="text-[9px] font-sans font-bold text-rose-500 block">
              {subDesc}
            </span>
          </div>

          {/* Approved Sub-tag */}
          <div className="mt-1 text-[9px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
            ✓ APPROVED • อนุมัติแล้ว
          </div>
        </div>

        {/* 1. Header Section */}
        <div className="border-b-2 border-slate-900 pb-5 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-1 max-w-md">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-slate-900 text-white font-mono font-bold text-[10px] uppercase">
                  OFFICIAL VOUCHER
                </span>
                <span className="text-xs font-bold text-slate-600 font-mono">
                  สาขาศรีสะเกษ
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {storeName}
              </h1>
              <p className="text-xs text-slate-600 leading-relaxed">
                {storeAddress} <br />
                โทรศัพท์: {storePhone} • ระบบบริหารงานบุคคลและสวัสดิการ
              </p>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-slate-200 mt-4">
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-wide">
                ใบสำคัญจ่ายเงิน / ใบรับเงินเบิกเงินล่วงหน้า
              </h2>
              <span className="text-[11px] font-mono text-slate-500 font-bold">
                CASH ADVANCE PAYMENT VOUCHER &amp; RECEIPT
              </span>
            </div>
            <div className="text-left sm:text-right font-mono text-xs space-y-0.5">
              <div>
                <span className="text-slate-500 font-medium">เลขที่เอกสาร: </span>
                <span className="font-bold text-slate-900">{docNumber}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium">วันที่ทำรายการ: </span>
                <span className="font-bold text-slate-900">{formattedDate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Employee Info & ID */}
        <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
          <div className="space-y-1.5">
            <div className="text-slate-500 font-medium">ข้อมูลพนักงานผู้ขอเบิกเงิน:</div>
            <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <span>{emp?.full_name || 'ไม่ระบุชื่อพนักงาน'}</span>
              {emp?.nickname && <span className="text-slate-600 font-normal">({emp.nickname})</span>}
            </div>
            <div className="text-slate-600">
              <span className="font-semibold">ตำแหน่ง / ฝ่าย:</span> {emp?.role || 'ช่างเทคนิคประจำศูนย์บริการ'}
            </div>
          </div>

          <div className="space-y-1.5 sm:border-l sm:border-slate-200 sm:pl-5">
            <div className="text-slate-500 font-medium">รหัสประจำตัวพนักงาน (Employee ID):</div>
            <div className="inline-flex items-center gap-2 font-mono">
              <span className="px-3 py-1 bg-slate-900 text-white font-black text-sm rounded-lg shadow-2xs">
                {emp?.employee_code || '-'}
              </span>
              <span className="text-[11px] text-slate-500 font-sans">
                (รหัสยืนยันตัวตนในระบบ)
              </span>
            </div>
            <div className="text-slate-600">
              <span className="font-semibold">วันที่ส่งคำขอ:</span> {formattedDate}
            </div>
          </div>
        </div>

        {/* 3. Purpose & Agenda (หัวข้อวาระการขอเบิกเงิน) */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200 pb-1 flex items-center gap-2">
            <span>📋</span>
            <span>หัวข้อวาระ / รายละเอียดและเหตุผลความจำเป็น</span>
          </h3>

          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 text-xs space-y-2">
            <div className="flex items-start gap-2">
              <span className="font-bold text-slate-900 shrink-0">วาระการขอเบิก:</span>
              <span className="text-slate-800 leading-relaxed">
                {request.reason || 'ขอเบิกเงินเดือนล่วงหน้าเพื่อใช้จ่ายฉุกเฉิน'}
              </span>
            </div>

            {request.needed_before_date && (
              <div className="flex items-center gap-2 text-slate-600 text-[11px] pt-1 border-t border-slate-200/80">
                <span className="font-semibold">กำหนดวันจำเป็นต้องใช้เงิน:</span>
                <span>{new Date(request.needed_before_date).toLocaleDateString('th-TH')}</span>
              </div>
            )}
          </div>
        </div>

        {/* 4. Amount Table & Baht Text */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200 pb-1 flex items-center gap-2">
            <span>💵</span>
            <span>รายการจำนวนเงินที่ได้รับอนุมัติ (Payment Amount)</span>
          </h3>

          <div className="rounded-xl border border-slate-900 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-900 text-white font-bold">
                  <th className="py-2.5 px-4">ลำดับ</th>
                  <th className="py-2.5 px-4">รายการจ่ายเงิน</th>
                  <th className="py-2.5 px-4 text-center">งวดรอบหักเงินคืน</th>
                  <th className="py-2.5 px-4 text-right">จำนวนเงิน (บาท)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="py-3 px-4 font-mono font-bold text-slate-500">1</td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">เงินเดือนเบิกล่วงหน้า (Salary Advance)</div>
                    <div className="text-[11px] text-slate-500">สวัสดิการพนักงานศูนย์บริการสีแสงยางยนต์</div>
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-slate-700">
                    รอบเงินเดือนถัดไป
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-black text-sm text-slate-900">
                    {amountFormatted}
                  </td>
                </tr>
                <tr className="bg-slate-50 font-bold border-t-2 border-slate-900">
                  <td colSpan={2} className="py-3 px-4 text-xs">
                    <div className="text-slate-600 font-normal">จำนวนเงินตัวอักษร:</div>
                    <div className="text-slate-900 font-bold text-sm">
                      ( {amountThaiText} )
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">
                    ยอดรวมสุทธิ:
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-black text-base text-slate-900">
                    ฿{amountFormatted}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 5. Terms & Condition Statement */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1 leading-relaxed">
          <div className="font-bold text-slate-800 flex items-center gap-1.5">
            <span>📝</span>
            <span>ข้อตกลงและคำรับรองของผู้รับเงิน:</span>
          </div>
          <p>
            ข้าพเจ้าขอรับรองว่าได้รับเงินเบิกล่วงหน้าตามจำนวนเงินข้างต้นครบถ้วนสมบูรณ์แล้ว และยินยอมให้บริษัทฯ ทำการหักเงินจำนวนดังกล่าวออกจากเงินเดือนประจำงวดถัดไปตามระเบียบข้อบังคับการทำงานของบริษัทฯ ทุกประการ
          </p>
        </div>

        {/* ----------------------------------------------------------- */}
        {/* 6. SIGNATURE SECTION (CEO ซ้าย • พนักงาน ขวา)                */}
        {/* ----------------------------------------------------------- */}
        <div className="pt-6 border-t-2 border-slate-900 grid grid-cols-2 gap-8 text-xs font-sans">
          
          {/* Left Column: ฝ่าย CEO / ผู้บริหาร (ผู้อนุมัติจ่าย) */}
          <div className="flex flex-col items-center justify-between h-44 p-4 rounded-xl border border-dashed border-slate-300 text-center bg-slate-50/50">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              ฝ่ายผู้บริหาร / CEO (ผู้อนุมัติจ่าย)
            </span>

            {/* Signature blank space line */}
            <div className="w-full space-y-2">
              <div className="border-b border-slate-800 w-4/5 mx-auto pt-8"></div>
              
              <div className="space-y-0.5">
                <div className="font-bold text-slate-900">
                  ( ท่านประธานกรรมการบริหาร / CEO )
                </div>
                <div className="text-[11px] font-mono text-slate-600 font-bold">
                  รหัสผู้บริหาร (ID): [ SI01 ]
                </div>
                <div className="text-[10px] text-slate-500">
                  วันที่: .......... / .......... / ................
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: ฝ่ายพนักงาน (ผู้รับเงิน) */}
          <div className="flex flex-col items-center justify-between h-44 p-4 rounded-xl border border-dashed border-slate-300 text-center">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              ฝ่ายพนักงาน (ผู้รับเงิน)
            </span>

            {/* Signature blank space line */}
            <div className="w-full space-y-2">
              <div className="border-b border-slate-800 w-4/5 mx-auto pt-8"></div>
              
              <div className="space-y-0.5">
                <div className="font-bold text-slate-900">
                  ( {emp?.full_name || '...................................................'} )
                </div>
                <div className="text-[11px] font-mono text-slate-600 font-bold">
                  รหัสพนักงาน (ID): [ {emp?.employee_code || '-'} ]
                </div>
                <div className="text-[10px] text-slate-500">
                  วันที่: .......... / .......... / ................
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Notice on Print Sheet */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[10px] font-mono text-slate-400">
          <div>
            ▲ พิมพ์เมื่อ: {printDateStr} เวลา {printTimeStr} น. • ระบบศูนย์บริการสีแสงยางยนต์
          </div>
          <div>
            {copyLabel} • {docNumber}
          </div>
        </div>

      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/80 backdrop-blur-md transition-all">
      
      {/* Print Specific CSS */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-voucher-container, #printable-voucher-container * {
            visibility: visible !important;
          }
          #printable-voucher-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 15mm !important;
            background: #ffffff !important;
            color: #000000 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .print-page-break {
            page-break-after: always !important;
            break-after: page !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="relative w-full max-w-4xl bg-[#111113] border border-neutral-800 rounded-3xl shadow-2xl flex flex-col max-h-[94vh] overflow-hidden">
        
        {/* Modal Top Control Bar (Hidden when printing) */}
        <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4 border-b border-neutral-800/80 bg-neutral-950/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-white">เอกสารใบสำคัญจ่ายเงิน / ใบรับเงินเบิกล่วงหน้า</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold">
                  ✓ อนุมัติแล้ว (APPROVED)
                </span>
              </div>
              <p className="text-[11px] font-mono text-neutral-400">
                เลขที่: {docNumber} • สั่งพิมพ์ขนาด A4 พร้อมตรายางระบุต้นฉบับ/สำเนา
              </p>
            </div>
          </div>

          {/* Print Version Selector (ต้นฉบับ / สำเนา / ทั้ง 2 แบบ) */}
          <div className="flex items-center gap-2">
            <div className="flex items-center p-1 bg-neutral-900 border border-neutral-800 rounded-xl font-mono text-[11px]">
              <button
                onClick={() => setPrintCopyMode('ORIGINAL')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  printCopyMode === 'ORIGINAL' ? 'bg-rose-600 text-white shadow-xs' : 'text-neutral-400 hover:text-white'
                }`}
              >
                ต้นฉบับ
              </button>
              <button
                onClick={() => setPrintCopyMode('COPY')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  printCopyMode === 'COPY' ? 'bg-rose-600 text-white shadow-xs' : 'text-neutral-400 hover:text-white'
                }`}
              >
                สำเนา
              </button>
              <button
                onClick={() => setPrintCopyMode('BOTH')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  printCopyMode === 'BOTH' ? 'bg-white text-black shadow-xs' : 'text-neutral-400 hover:text-white'
                }`}
              >
                ทั้ง 2 แบบ
              </button>
            </div>

            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-bold font-mono flex items-center gap-2 shadow-lg shadow-white/10 transition-all active:scale-95"
            >
              <Printer className="w-4 h-4 text-black" />
              <span>สั่งพิมพ์ (Print)</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center text-xs transition-colors"
              title="ปิดหน้าต่าง"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-[#0a0a0c]">
          
          <div ref={printAreaRef} id="printable-voucher-container">
            {/* If BOTH, render Sheet 1 (ต้นฉบับ) + Sheet 2 (สำเนา) */}
            {printCopyMode === 'BOTH' && (
              <>
                {renderVoucherSheet('ORIGINAL', true)}
                {renderVoucherSheet('COPY', false)}
              </>
            )}

            {/* If ORIGINAL only */}
            {printCopyMode === 'ORIGINAL' && renderVoucherSheet('ORIGINAL', false)}

            {/* If COPY only */}
            {printCopyMode === 'COPY' && renderVoucherSheet('COPY', false)}
          </div>

        </div>

        {/* Modal Bottom Action Bar (Hidden when printing) */}
        <div className="no-print p-4 sm:p-5 border-t border-neutral-800 bg-neutral-950 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs font-mono text-neutral-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>
              รูปแบบพิมพ์ปัจจุบัน: <strong className="text-rose-400 font-bold">{printCopyMode === 'BOTH' ? 'พิมพ์ทั้ง 2 แผ่น (ต้นฉบับ + สำเนา)' : printCopyMode === 'ORIGINAL' ? 'พิมพ์เฉพาะ ต้นฉบับ' : 'พิมพ์เฉพาะ สำเนา'}</strong>
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 text-xs font-bold font-mono transition-all"
            >
              ปิดหน้าต่าง
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-black font-mono flex items-center justify-center gap-2 shadow-lg shadow-white/10 transition-all active:scale-95"
            >
              <Printer className="w-4 h-4 text-black" />
              <span>🖨️ สั่งพิมพ์ ({printCopyMode === 'BOTH' ? '2 แผ่น' : '1 แผ่น'})</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
