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
  Layers,
  Image as ImageIcon,
  Loader2
} from 'lucide-react';
import { SalaryAdvanceRequest } from '@/lib/types';
import { thaiBahtText } from '@/lib/thai-baht';

export { thaiBahtText };

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

export default function CashAdvanceReceiptModal({
  request,
  isOpen,
  onClose,
  storeSettings
}: CashAdvanceReceiptModalProps) {
  const [printCopyMode, setPrintCopyMode] = useState<'ORIGINAL' | 'COPY' | 'BOTH'>('BOTH');
  const [isExportingPng, setIsExportingPng] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
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

  const handleExportPNG = async () => {
    if (!printAreaRef.current) return;
    setIsExportingPng(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const sheets = printAreaRef.current.querySelectorAll('.a4-voucher-sheet');
      if (!sheets || sheets.length === 0) return;

      for (let i = 0; i < sheets.length; i++) {
        const sheetEl = sheets[i] as HTMLElement;
        const canvas = await html2canvas(sheetEl, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
        });
        const suffix = sheets.length > 1 ? (i === 0 ? '-ORIGINAL' : '-COPY') : '';
        const link = document.createElement('a');
        link.download = `CashAdvance-${docNumber}-${emp?.employee_code || 'ID'}${suffix}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      }
    } catch (e: any) {
      alert('เกิดข้อผิดพลาดในการบันทึกภาพ PNG: ' + e.message);
    } finally {
      setIsExportingPng(false);
    }
  };

  const handleExportPDF = async () => {
    if (!printAreaRef.current) return;
    setIsExportingPdf(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const sheets = printAreaRef.current.querySelectorAll('.a4-voucher-sheet');
      if (!sheets || sheets.length === 0) {
        throw new Error('ไม่พบข้อมูลเอกสารสำหรับการพิมพ์');
      }

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });
      const pdfWidth = 210;
      const pdfHeight = 297;

      for (let i = 0; i < sheets.length; i++) {
        const sheetEl = sheets[i] as HTMLElement;
        const canvas = await html2canvas(sheetEl, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.98);
        if (i > 0) {
          pdf.addPage('a4', 'portrait');
        }
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      }

      pdf.save(`CashAdvance-${docNumber}-${emp?.employee_code || 'ID'}.pdf`);
    } catch (e: any) {
      alert('เกิดข้อผิดพลาดในการบันทึก PDF: ' + e.message);
    } finally {
      setIsExportingPdf(false);
    }
  };

  /**
   * Helper sub-component to render a single voucher sheet (ต้นฉบับ or สำเนา)
   * Engineered for Exact ISO 216 A4 Dimensions (210mm x 297mm)
   */
  const renderVoucherSheet = (versionType: 'ORIGINAL' | 'COPY', isFirstPageInDual: boolean = false) => {
    const isOriginal = versionType === 'ORIGINAL';
    const copyLabel = isOriginal ? 'ต้นฉบับ / ORIGINAL' : 'สำเนา / COPY';
    const subDesc = isOriginal ? 'สำหรับฝ่ายบัญชีและการเงิน' : 'สำหรับพนักงานผู้รับเงิน';

    return (
      <div 
        key={versionType}
        className={`w-full max-w-[210mm] mx-auto bg-white text-slate-900 px-8 py-7 shadow-2xl border border-slate-200 flex flex-col justify-between relative font-sans a4-voucher-sheet ${
          isFirstPageInDual ? 'print-page-break mb-8' : ''
        }`}
        style={{
          boxSizing: 'border-box',
          width: '210mm',
          height: '297mm',
          maxHeight: '297mm',
          overflow: 'hidden'
        }}
      >
        {/* Watermark Seal */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-[0.025] select-none">
          <Building2 className="w-80 h-80 text-slate-900" />
        </div>

        {/* TOP CONTENT WRAPPER */}
        <div className="space-y-4">
          
          {/* 1. Header Information with Store Logo & Red Stamp */}
          <div className="border-b-2 border-slate-900 pb-3">
            <div className="flex items-start justify-between gap-4">
              
              {/* Left Side: Logo + Store Name + Address */}
              <div className="flex items-center gap-3.5 min-w-0">
                <img 
                  src="/images/official-store-logo.png" 
                  alt="สีแสงยางยนต์ YOKOHAMA NAYA COSMIS" 
                  className="h-11 w-auto object-contain shrink-0" 
                />
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded bg-slate-900 text-white font-mono font-bold text-[8.5px] uppercase">
                      OFFICIAL VOUCHER
                    </span>
                    <span className="text-[10px] font-bold text-slate-700 font-mono">
                      สาขาศรีสะเกษ • ศูนย์บริการมาตรฐาน
                    </span>
                  </div>
                  <h1 className="text-sm sm:text-base font-black text-slate-900 tracking-tight leading-normal overflow-visible pt-0.5">
                    {storeName}
                  </h1>
                  <p className="text-[10px] text-slate-600 leading-normal overflow-visible">
                    {storeAddress} • โทร: {storePhone}
                  </p>
                </div>
              </div>

              {/* Right Side: Red Stamp Badge */}
              <div className="flex flex-col items-end shrink-0 select-none">
                <div className="border-2 border-rose-600 rounded-md px-3 py-1 bg-rose-50/95 text-center shadow-xs">
                  <span className="text-xs font-black font-mono uppercase tracking-wider text-rose-600 block leading-tight">
                    ● {copyLabel}
                  </span>
                  <span className="text-[9px] font-sans font-bold text-rose-500 block leading-tight mt-0.5">
                    {subDesc}
                  </span>
                </div>
                <div className="mt-1 text-[8.5px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
                  ✓ APPROVED • อนุมัติแล้ว
                </div>
              </div>

            </div>

            {/* Document Title & Metadata */}
            <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-200 mt-2">
              <div>
                <h2 className="text-[13px] sm:text-sm font-black text-slate-900 uppercase tracking-wide leading-normal">
                  ใบสำคัญจ่ายเงิน / ใบรับเงินเบิกเงินล่วงหน้า
                </h2>
                <span className="text-[8.5px] font-mono text-slate-500 font-bold">
                  CASH ADVANCE PAYMENT VOUCHER &amp; RECEIPT
                </span>
              </div>
              <div className="text-right font-mono text-[9.5px] leading-tight shrink-0">
                <div>
                  <span className="text-slate-500">เลขที่เอกสาร: </span>
                  <span className="font-bold text-slate-900">{docNumber}</span>
                </div>
                <div>
                  <span className="text-slate-500">วันที่ทำรายการ: </span>
                  <span className="font-bold text-slate-900">{formattedDate}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Employee Info & ID Card */}
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 grid grid-cols-2 gap-4 text-xs font-sans">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-slate-200 border border-slate-300 overflow-hidden flex items-center justify-center shrink-0">
                {emp?.avatar_url ? (
                  <img src={emp.avatar_url} alt={emp?.full_name || 'พนักงาน'} className="w-full h-full object-cover" />
                ) : (
                  <span className="font-black text-slate-700 font-sans text-sm">
                    {(emp?.nickname || emp?.full_name || '?').charAt(0)}
                  </span>
                )}
              </div>
              <div className="min-w-0 space-y-0.5">
                <div className="text-slate-500 font-medium text-[9.5px]">ข้อมูลพนักงานผู้ขอเบิก:</div>
                <div className="font-bold text-[11.5px] text-slate-900 leading-normal overflow-visible">
                  {emp?.full_name || 'ไม่ระบุชื่อพนักงาน'}
                  {emp?.nickname && <span className="text-slate-500 font-normal"> ({emp.nickname})</span>}
                </div>
                <div className="text-slate-600 text-[9.5px] leading-normal overflow-visible">
                  ตำแหน่ง: {emp?.role || 'พนักงานประจำศูนย์บริการ'}
                </div>
              </div>
            </div>

            <div className="space-y-1 sm:border-l sm:border-slate-200 sm:pl-4">
              <div className="text-slate-500 font-medium text-[9.5px]">รหัสประจำตัวพนักงาน (Employee ID):</div>
              <div className="inline-flex items-center gap-2 font-mono">
                <span className="px-2.5 py-0.5 bg-slate-900 text-white font-black text-xs rounded-md shadow-2xs">
                  {emp?.employee_code || '-'}
                </span>
                <span className="text-[9px] text-slate-500 font-sans">
                  (รหัสยืนยันตัวตนในระบบ)
                </span>
              </div>
              <div className="text-slate-600 text-[9.5px]">
                <span className="font-semibold">วันที่ส่งคำขอ:</span> {formattedDate}
              </div>
            </div>
          </div>

          {/* 3. Purpose & Agenda (หัวข้อวาระการขอเบิกเงิน) */}
          <div className="space-y-1.5">
            <h3 className="text-[10px] font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200 pb-0.5 flex items-center gap-1.5">
              <span>📋</span>
              <span>หัวข้อวาระ / รายละเอียดและเหตุผลความจำเป็น</span>
            </h3>

            <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200 text-[10px] space-y-1">
              <div className="flex items-start gap-2">
                <span className="font-bold text-slate-900 shrink-0">วาระการขอเบิก:</span>
                <span className="text-slate-800 leading-relaxed font-sans">
                  {request.reason || 'ขอเบิกเงินเดือนล่วงหน้าเพื่อใช้จ่ายฉุกเฉิน'}
                </span>
              </div>

              {request.needed_before_date && (
                <div className="flex items-center gap-2 text-slate-600 text-[9.5px] pt-1 border-t border-slate-200/80 font-mono">
                  <span className="font-semibold font-sans">กำหนดวันจำเป็นต้องใช้เงิน:</span>
                  <span>{new Date(request.needed_before_date).toLocaleDateString('th-TH')}</span>
                </div>
              )}
            </div>
          </div>

          {/* 4. Amount Table & Baht Text */}
          <div className="space-y-1.5">
            <h3 className="text-[10px] font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200 pb-0.5 flex items-center gap-1.5">
              <span>💵</span>
              <span>รายการจำนวนเงินที่ได้รับอนุมัติ (Payment Amount)</span>
            </h3>

            <div className="rounded-xl border border-slate-900 overflow-hidden text-[10px]">
              <table className="w-full text-left font-sans border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold text-[9.5px]">
                    <th className="py-2 px-3.5 w-12 text-center border-r border-slate-700 font-mono">ลำดับ</th>
                    <th className="py-2 px-3.5 border-r border-slate-700">รายการจ่ายเงิน</th>
                    <th className="py-2 px-3.5 text-center border-r border-slate-700 w-36">งวดรอบหักเงินคืน</th>
                    <th className="py-2 px-3.5 text-right w-36 font-mono">จำนวนเงิน (บาท)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-[10px]">
                  <tr>
                    <td className="py-2.5 px-3.5 font-mono font-bold text-slate-500 text-center border-r border-slate-200">1</td>
                    <td className="py-2.5 px-3.5 border-r border-slate-200">
                      <div className="font-bold text-slate-900">เงินเดือนเบิกล่วงหน้า (Salary Advance)</div>
                      <div className="text-[9px] text-slate-500">สวัสดิการพนักงานศูนย์บริการสีแสงยางยนต์</div>
                    </td>
                    <td className="py-2.5 px-3.5 text-center font-mono text-slate-700 border-r border-slate-200">
                      รอบเงินเดือนถัดไป
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-mono font-black text-xs text-slate-900">
                      {amountFormatted}
                    </td>
                  </tr>
                  <tr className="bg-slate-50 font-bold border-t-2 border-slate-900">
                    <td colSpan={2} className="py-2.5 px-3.5 border-r border-slate-200">
                      <div className="text-slate-600 font-normal text-[9px]">จำนวนเงินตัวอักษร:</div>
                      <div className="text-slate-900 font-bold text-[11px]">
                        ( {amountThaiText} )
                      </div>
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-bold text-slate-900 border-r border-slate-200">
                      ยอดรวมสุทธิ:
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-mono font-black text-sm text-slate-900">
                      ฿{amountFormatted}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 5. Terms & Condition Statement */}
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[9px] text-slate-600 space-y-0.5 leading-relaxed font-sans">
            <div className="font-bold text-slate-800 flex items-center gap-1">
              <span>📝</span>
              <span>ข้อตกลงและคำรับรองของผู้รับเงิน:</span>
            </div>
            <p>
              ข้าพเจ้าขอรับรองว่าได้รับเงินเบิกล่วงหน้าตามจำนวนเงินข้างต้นครบถ้วนสมบูรณ์แล้ว และยินยอมให้บริษัทฯ ทำการหักเงินจำนวนดังกล่าวออกจากเงินเดือนประจำงวดถัดไปตามระเบียบข้อบังคับการทำงานของบริษัทฯ ทุกประการ
            </p>
          </div>

        </div>

        {/* BOTTOM SECTION (Signatures + Footer - Tall & Spacious) */}
        <div className="space-y-3 pt-2">
          
          {/* 6. SIGNATURE SECTION (CEO ซ้าย • พนักงาน ขวา - สูงโปร่งมีที่เซ็นชัดเจน) */}
          <div className="border-t-2 border-slate-900 grid grid-cols-2 gap-6 text-[9.5px] font-sans pt-3">
            
            {/* Left Column: ฝ่าย CEO / ผู้บริหาร (ผู้อนุมัติจ่าย) */}
            <div className="flex flex-col items-center justify-between h-36 p-3.5 rounded-xl border-2 border-dashed border-slate-300 text-center bg-slate-50/40">
              <span className="text-[9px] font-bold text-slate-700 uppercase tracking-wider">
                ฝ่ายผู้บริหาร / CEO (ผู้อนุมัติจ่าย)
              </span>

              <div className="w-full space-y-1.5">
                <div className="border-b border-slate-800 w-4/5 mx-auto pt-8"></div>
                <div>
                  <div className="font-bold text-slate-900 text-[10.5px]">
                    ( ท่านประธานกรรมการบริหาร / CEO )
                  </div>
                  <div className="text-[9px] font-mono text-slate-500 mt-0.5">
                    รหัส: [ SI01 ] • วันที่: .......... / .......... / ................
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: ฝ่ายพนักงาน (ผู้รับเงิน) */}
            <div className="flex flex-col items-center justify-between h-36 p-3.5 rounded-xl border-2 border-dashed border-slate-300 text-center">
              <span className="text-[9px] font-bold text-slate-700 uppercase tracking-wider">
                ฝ่ายพนักงาน (ผู้รับเงิน)
              </span>

              <div className="w-full space-y-1.5">
                <div className="border-b border-slate-800 w-4/5 mx-auto pt-8"></div>
                <div>
                  <div className="font-bold text-slate-900 text-[10.5px]">
                    ( {emp?.full_name || '...................................................'} )
                  </div>
                  <div className="text-[9px] font-mono text-slate-500 mt-0.5">
                    รหัส: [ {emp?.employee_code || '-'} ] • วันที่: .......... / .......... / ................
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Footer Notice on Print Sheet */}
          <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between text-[8px] font-mono text-slate-400">
            <div>
              ▲ พิมพ์เมื่อ: {printDateStr} เวลา {printTimeStr} น. • ระบบศูนย์บริการสีแสงยางยนต์
            </div>
            <div>
              {copyLabel} • {docNumber}
            </div>
          </div>

        </div>

      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/80 backdrop-blur-md transition-all">
      
      {/* Print Specific CSS (Strict ISO 216 A4 Dimensions) */}
      <style jsx global>{`
        @page {
          size: A4 portrait;
          margin: 0;
        }
        @media print {
          html, body {
            width: 210mm !important;
            height: 297mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
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
            width: 210mm !important;
            margin: 0 auto !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .print-page-break {
            page-break-after: always !important;
            break-after: page !important;
          }
          .a4-voucher-sheet {
            width: 210mm !important;
            height: 297mm !important;
            min-height: 297mm !important;
            max-height: 297mm !important;
            margin: 0 !important;
            padding: 6mm 8mm !important;
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            overflow: hidden !important;
            box-sizing: border-box !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="relative w-full max-w-5xl bg-[#111113] border border-neutral-800 rounded-3xl shadow-2xl flex flex-col max-h-[94vh] overflow-hidden">
        
        {/* Modal Top Control Bar (Hidden when printing) */}
        <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4 border-b border-neutral-800/80 bg-neutral-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold">
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

          {/* Print Version Selector & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <div className="flex items-center p-1 bg-neutral-900 border border-neutral-800 rounded-xl text-[11px]">
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
              onClick={handleExportPNG}
              disabled={isExportingPng || isExportingPdf}
              className="px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 font-bold flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
              title="บันทึกรูปภาพ PNG คมชัดสูง"
            >
              {isExportingPng ? <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" /> : <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />}
              <span className="hidden sm:inline">บันทึก</span> PNG
            </button>
            <button
              onClick={handleExportPDF}
              disabled={isExportingPng || isExportingPdf}
              className="px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 font-bold flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
              title="บันทึกไฟล์ PDF พร้อมพิมพ์"
            >
              {isExportingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-400" /> : <FileText className="w-3.5 h-3.5 text-rose-400" />}
              <span className="hidden sm:inline">บันทึก</span> PDF
            </button>

            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-white/10 transition-all active:scale-95"
            >
              <Printer className="w-3.5 h-3.5 text-black" />
              <span>สั่งพิมพ์ A4</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center text-xs transition-colors ml-1"
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

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto font-mono text-xs">
            <button
              onClick={handleExportPNG}
              disabled={isExportingPng || isExportingPdf}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 font-bold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              {isExportingPng ? <Loader2 className="w-4 h-4 animate-spin text-emerald-400" /> : <ImageIcon className="w-4 h-4 text-emerald-400" />}
              <span>บันทึก PNG</span>
            </button>
            <button
              onClick={handleExportPDF}
              disabled={isExportingPng || isExportingPdf}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 font-bold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              {isExportingPdf ? <Loader2 className="w-4 h-4 animate-spin text-rose-400" /> : <FileText className="w-4 h-4 text-rose-400" />}
              <span>บันทึก PDF</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-white/10 transition-all active:scale-95"
            >
              <Printer className="w-4 h-4 text-black" />
              <span>🖨️ สั่งพิมพ์ A4</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
