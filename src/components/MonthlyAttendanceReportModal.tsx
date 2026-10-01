'use client';

import React, { useState, useMemo, useRef } from 'react';
import { 
  Printer, 
  X, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Building2, 
  User, 
  ShieldCheck, 
  Coins, 
  ChevronLeft, 
  ChevronRight,
  AlertTriangle,
  FileSpreadsheet,
  Check,
  Download,
  Image as ImageIcon,
  FileText,
  Loader2
} from 'lucide-react';
import { thaiBahtText } from '@/lib/thai-baht';

interface MonthlyAttendanceReportModalProps {
  employee: any | null;
  attendanceLogs: any[];
  leaveRequests?: any[];
  isOpen: boolean;
  onClose: () => void;
  storeSettings?: {
    store_name?: string;
    store_address?: string;
    store_phone?: string;
    standard_time?: string;
    late_deadline?: string;
  };
}

export default function MonthlyAttendanceReportModal({
  employee,
  attendanceLogs,
  leaveRequests = [],
  isOpen,
  onClose,
  storeSettings
}: MonthlyAttendanceReportModalProps) {
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedMonth, setSelectedMonth] = useState(9); // 0-indexed: 9 = October
  const [printCopyMode, setPrintCopyMode] = useState<'ORIGINAL' | 'COPY' | 'BOTH'>('BOTH');
  const [employeeAckNote, setEmployeeAckNote] = useState('ข้าพเจ้าได้ตรวจสอบเวลาเข้า-ออกงาน และยอดเบี้ยขยันประจำเดือนแล้ว ขอยืนยันว่าถูกต้องสมบูรณ์');
  const [isAckChecked, setIsAckChecked] = useState(true);
  const [isExportingPng, setIsExportingPng] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const printAreaRef = useRef<HTMLDivElement>(null);

  const thaiMonthNames = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  const monthStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
  const thaiMonthYearStr = `${thaiMonthNames[selectedMonth]} ${selectedYear + 543}`;

  // 1. Filter Logs & Approved Leaves for Employee in this Month
  const daysInMonth = useMemo(() => {
    return new Date(selectedYear, selectedMonth + 1, 0).getDate();
  }, [selectedYear, selectedMonth]);

  const monthlyReportData = useMemo(() => {
    if (!employee) return [];

    const empId = employee.id || employee.employee_code;
    const empLogs = (attendanceLogs || []).filter((l: any) => {
      const matchEmp = l.employee_id === employee.id || l.employee?.id === employee.id || l.employee?.employee_code === employee.employee_code;
      if (!matchEmp) return false;
      if (!l.check_in_time) return false;
      return l.check_in_time.startsWith(monthStr);
    });

    // Filter approved leaves for this employee
    const empApprovedLeaves = (leaveRequests || []).filter((lr: any) => {
      const matchEmp = lr.employee_id === employee.id || lr.employee?.id === employee.id || lr.employee?.employee_code === employee.employee_code;
      if (!matchEmp) return false;
      return lr.status === 'APPROVED';
    });

    const mapByDay = new Map<number, any>();
    empLogs.forEach((l: any) => {
      const day = new Date(l.check_in_time).getDate();
      mapByDay.set(day, l);
    });

    const todayDate = new Date();
    const todayYear = todayDate.getFullYear();
    const todayMonth = todayDate.getMonth();
    const todayDay = todayDate.getDate();

    const rows = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(selectedYear, selectedMonth, d);
      const dayOfWeek = dateObj.getDay(); // 0 = Sun
      const dayOfWeekThai = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'][dayOfWeek];
      const dateStr = `${d} ${thaiMonthNames[selectedMonth].substring(0, 3)}.`;
      const dateStrIso = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

      const isFuture = selectedYear > todayYear || 
        (selectedYear === todayYear && selectedMonth > todayMonth) || 
        (selectedYear === todayYear && selectedMonth === todayMonth && d > todayDay);

      const log = mapByDay.get(d);
      let status: 'PRESENT' | 'LATE' | 'LEAVE' | 'ABSENT' | 'PENDING' = 'PENDING';
      let checkInStr = '-';
      let checkOutStr = '-';
      let distanceStr = '-';
      let allowance = 0;
      let note = '';

      if (log) {
        if (log.status === 'PRESENT') {
          status = 'PRESENT';
          allowance = 50;
        } else if (log.status === 'LATE') {
          status = 'LATE';
          allowance = 0;
          note = 'มาสาย';
        } else {
          status = 'PRESENT';
          allowance = 50;
        }

        if (log.check_in_time) {
          checkInStr = new Date(log.check_in_time).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';
        }
        if (log.check_out_time) {
          checkOutStr = new Date(log.check_out_time).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';
        }
        if (log.distance_from_store) {
          distanceStr = `${Number(log.distance_from_store).toFixed(1)} ม.`;
        }
      } else {
        // Check if there is an APPROVED leave for this day
        const matchedLeave = empApprovedLeaves.find((lr: any) => {
          const start = lr.start_date ? lr.start_date.substring(0, 10) : '';
          const end = lr.end_date ? lr.end_date.substring(0, 10) : start;
          return dateStrIso >= start && dateStrIso <= end;
        });

        if (matchedLeave) {
          status = 'LEAVE';
          const typeName = matchedLeave.leave_type === 'SICK' 
            ? 'ลาป่วย' 
            : matchedLeave.leave_type === 'BUSINESS' 
            ? 'ลากิจ' 
            : matchedLeave.leave_type === 'VACATION' 
            ? 'พักร้อน' 
            : 'ลางาน';
          note = matchedLeave.reason ? `วันหยุด (${typeName}: ${matchedLeave.reason})` : `วันหยุด (${typeName} อนุมัติแล้ว)`;
          allowance = 0;
        } else if (isFuture) {
          status = 'PENDING';
          note = '-';
        } else {
          status = 'ABSENT';
          note = 'ขาดงาน / ไม่ได้ลงเวลา';
        }
      }

      rows.push({
        day: d,
        dayOfWeekThai,
        dateStr,
        status,
        checkInStr,
        checkOutStr,
        distanceStr,
        allowance,
        note,
        rawLog: log
      });
    }

    return rows;
  }, [employee, attendanceLogs, leaveRequests, selectedYear, selectedMonth, daysInMonth, monthStr]);

  // Compute KPI Summary Totals
  const onTimeCount = monthlyReportData.filter((r) => r.status === 'PRESENT').length;
  const lateCount = monthlyReportData.filter((r) => r.status === 'LATE').length;
  const leaveCount = monthlyReportData.filter((r) => r.status === 'LEAVE').length;
  const absentCount = monthlyReportData.filter((r) => r.status === 'ABSENT').length;
  const totalAllowance = onTimeCount * 50;
  const allowanceThaiText = thaiBahtText(totalAllowance);

  if (!isOpen || !employee) return null;

  const now = new Date();
  const printDateStr = now.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const printTimeStr = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

  const storeName = storeSettings?.store_name || 'ศูนย์บริการสีแสงยางยนต์ (YOKOHAMA NAYA COSMIS)';
  const storeAddress = storeSettings?.store_address || 'สาขาศรีสะเกษ ถ.ศรีสะเกษ-อุบล ต.โพธิ์ อ.เมือง จ.ศรีสะเกษ 33000';
  const storePhone = storeSettings?.store_phone || '045-612-888, 081-999-9999';

  const docNumber = `ATT-${selectedYear}${String(selectedMonth + 1).padStart(2, '0')}-${employee.employee_code || '01'}`;

  const handlePrint = () => {
    window.print();
  };

  const handleExportPNG = async () => {
    if (!printAreaRef.current) return;
    setIsExportingPng(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const sheets = printAreaRef.current.querySelectorAll('.a4-print-sheet');
      if (!sheets || sheets.length === 0) return;

      for (let i = 0; i < sheets.length; i++) {
        const sheetEl = sheets[i] as HTMLElement;
        const canvas = await html2canvas(sheetEl, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
          windowWidth: 1024,
        });
        const suffix = sheets.length > 1 ? (i === 0 ? '-ORIGINAL' : '-COPY') : '';
        const link = document.createElement('a');
        link.download = `Attendance-Report-${employee.employee_code || 'ID'}-${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}${suffix}.png`;
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

      const sheets = printAreaRef.current.querySelectorAll('.a4-print-sheet');
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
          windowWidth: 1024,
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.98);
        if (i > 0) {
          pdf.addPage('a4', 'portrait');
        }
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      }

      pdf.save(`Attendance-Report-${employee.employee_code || 'ID'}-${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}.pdf`);
    } catch (e: any) {
      alert('เกิดข้อผิดพลาดในการบันทึก PDF: ' + e.message);
    } finally {
      setIsExportingPdf(false);
    }
  };

  /**
   * Sub-renderer for a single Report Sheet (Engineered for Exact ISO 216 A4 Fit)
   */
  const renderReportSheet = (versionType: 'ORIGINAL' | 'COPY', isFirstPageInDual: boolean = false) => {
    const isOriginal = versionType === 'ORIGINAL';
    const copyLabel = isOriginal ? 'ต้นฉบับ / ORIGINAL' : 'สำเนา / COPY';
    const subDesc = isOriginal ? 'สำหรับฝ่ายบริหาร & บุคคล' : 'สำหรับพนักงาน';

    return (
      <div 
        key={versionType}
        className={`w-full max-w-[210mm] mx-auto bg-white text-slate-900 px-6 py-5 shadow-2xl border border-slate-200 flex flex-col justify-between relative font-sans a4-print-sheet ${
          isFirstPageInDual ? 'print-page-break mb-6' : ''
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

        {/* ----------------------------------------------------------- */}
        {/* TOP RIGHT BADGE: ต้นฉบับ / สำเนา                         */}
        {/* ----------------------------------------------------------- */}
        <div className="absolute top-4 right-6 flex flex-col items-end pointer-events-none select-none z-10">
          <div className="border border-rose-600 rounded px-2.5 py-0.5 bg-rose-50/95 text-center shadow-2xs">
            <span className="text-[10.5px] font-black font-mono uppercase tracking-wider text-rose-600 block leading-tight">
              ● {copyLabel}
            </span>
            <span className="text-[8px] font-sans font-bold text-rose-500 block leading-tight">
              {subDesc}
            </span>
          </div>
          <div className="mt-0.5 text-[7.5px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-300">
            ✓ OFFICIAL TIME REPORT
          </div>
        </div>

        {/* TOP CONTENT WRAPPER */}
        <div className="space-y-2">
          
          {/* 1. Header Information with Official Store Logo */}
          <div className="border-b-2 border-slate-900 pb-2">
            <div className="flex items-center gap-3 pr-32">
              <img 
                src="/images/official-store-logo.png" 
                alt="สีแสงยางยนต์ YOKOHAMA NAYA COSMIS" 
                className="h-9 w-auto object-contain shrink-0" 
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="px-1.5 py-0.2 rounded bg-slate-900 text-white font-mono font-bold text-[8px] uppercase">
                    ATTENDANCE TIMESHEET
                  </span>
                  <span className="text-[9px] font-bold text-slate-700 font-mono">
                    สาขาศรีสะเกษ • ศูนย์บริการมาตรฐาน
                  </span>
                </div>
                <h1 className="text-[13px] font-black text-slate-900 tracking-tight leading-tight truncate">
                  {storeName}
                </h1>
                <p className="text-[8.5px] text-slate-600 leading-tight truncate mt-0.5">
                  {storeAddress} • โทร: {storePhone}
                </p>
              </div>
            </div>

            <div className="pt-1.5 flex items-center justify-between gap-2 border-t border-slate-200 mt-1.5">
              <div>
                <h2 className="text-xs font-black text-slate-900 uppercase tracking-wide leading-tight">
                  รายงานสรุปเวลาการปฏิบัติงานและเบี้ยขยันประจำเดือน
                </h2>
                <span className="text-[8px] font-mono text-slate-500 font-bold">
                  MONTHLY ATTENDANCE &amp; INCENTIVE ALLOWANCE REPORT
                </span>
              </div>
              <div className="text-right font-mono text-[9px] leading-tight shrink-0">
                <div>
                  <span className="text-slate-500">เลขที่เอกสาร: </span>
                  <span className="font-bold text-slate-900">{docNumber}</span>
                </div>
                <div>
                  <span className="text-slate-500">รอบประจำเดือน: </span>
                  <span className="font-bold text-slate-900">{thaiMonthYearStr}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Employee Info & Core Status Summary Cards (4-Column Balanced Bar) */}
          <div className="grid grid-cols-4 gap-2 font-sans text-xs">
            
            {/* Employee Info */}
            <div className="bg-slate-50 rounded-lg p-1.5 border border-slate-200 flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-slate-200 border border-slate-300 overflow-hidden flex items-center justify-center shrink-0">
                {employee.avatar_url ? (
                  <img src={employee.avatar_url} alt={employee.full_name || employee.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="font-black text-slate-700 font-sans text-[11px]">
                    {(employee.nickname || employee.full_name || employee.name || '?').charAt(0)}
                  </span>
                )}
              </div>
              <div className="min-w-0 leading-tight">
                <div className="font-bold text-[10px] text-slate-900 truncate">
                  {employee.full_name || employee.name}
                  {employee.nickname && <span className="text-slate-500 font-normal"> ({employee.nickname})</span>}
                </div>
                <div className="text-slate-600 text-[8px] truncate mt-0.5">
                  รหัส: <strong className="font-mono text-slate-900 font-black">[{employee.employee_code || employee.code || '-'}]</strong> • {employee.role || 'พนักงาน'}
                </div>
              </div>
            </div>

            {/* Status 1: มาตรงเวลา (ปกติ) */}
            <div className="bg-emerald-50/80 rounded-lg p-1.5 border border-emerald-200 flex items-center justify-between">
              <div>
                <div className="text-emerald-800 font-bold text-[8.5px] flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                  <span>ตรงเวลา (+50฿)</span>
                </div>
                <div className="text-xs font-black font-mono text-emerald-900 leading-none mt-0.5">
                  {onTimeCount} <span className="text-[8.5px] font-sans font-bold">วัน</span>
                </div>
              </div>
              <div className="text-right font-mono">
                <span className="text-[7.5px] text-emerald-700 block">เบี้ยขยัน</span>
                <span className="text-[10px] font-black text-emerald-800">฿{totalAllowance.toLocaleString()}</span>
              </div>
            </div>

            {/* Status 2: มาสาย */}
            <div className="bg-amber-50/80 rounded-lg p-1.5 border border-amber-200 flex items-center justify-between">
              <div>
                <div className="text-amber-800 font-bold text-[8.5px] flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                  <span>มาสาย</span>
                </div>
                <div className="text-xs font-black font-mono text-amber-900 leading-none mt-0.5">
                  {lateCount} <span className="text-[8.5px] font-sans font-bold">วัน</span>
                </div>
              </div>
              <div className="text-right text-[8px] font-sans text-amber-700">
                {lateCount > 0 ? 'หลัง 07:40 น.' : '✓ ไม่มีสาย'}
              </div>
            </div>

            {/* Status 3: วันหยุด / ลาได้รับอนุมัติ */}
            <div className="bg-blue-50/80 rounded-lg p-1.5 border border-blue-200 flex items-center justify-between">
              <div>
                <div className="text-blue-800 font-bold text-[8.5px] flex items-center gap-1">
                  <Calendar className="w-2.5 h-2.5 text-blue-600 shrink-0" />
                  <span>วันหยุด (อนุมัติ)</span>
                </div>
                <div className="text-xs font-black font-mono text-blue-900 leading-none mt-0.5">
                  {leaveCount} <span className="text-[8.5px] font-sans font-bold">วัน</span>
                </div>
              </div>
              <div className="text-right text-[8px] font-sans text-blue-700">
                {leaveCount > 0 ? 'อนุมัติแล้ว' : 'ไม่มีวันลา'}
              </div>
            </div>

          </div>

          {/* 3. Daily Attendance Breakdown Table */}
          <div className="space-y-0.5">
            <div className="flex items-center justify-between text-[8.5px] font-bold text-slate-800 border-b border-slate-200 pb-0.5">
              <span>📅 ตารางบันทึกการลงเวลาทำงานรายวัน ({thaiMonthYearStr})</span>
              <span className="font-mono font-normal text-slate-500 text-[8px]">รวม {daysInMonth} วัน</span>
            </div>

            <div className="rounded-md border border-slate-800 overflow-hidden text-[8.5px]">
              <table className="w-full text-left font-mono border-collapse table-fixed">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold font-sans text-[8.5px]">
                    <th className="py-1 px-1.5 text-center w-[13%] border-r border-slate-700 whitespace-nowrap">วันที่</th>
                    <th className="py-1 px-1.5 text-center w-[12%] border-r border-slate-700 whitespace-nowrap">เวลาเข้า</th>
                    <th className="py-1 px-1.5 text-center w-[12%] border-r border-slate-700 whitespace-nowrap">เวลาออก</th>
                    <th className="py-1 px-1.5 text-center w-[11%] border-r border-slate-700 whitespace-nowrap">ระยะ GPS</th>
                    <th className="py-1 px-1.5 text-center w-[16%] border-r border-slate-700 whitespace-nowrap">สถานะ</th>
                    <th className="py-1 px-1.5 text-right w-[12%] border-r border-slate-700 whitespace-nowrap">เบี้ยขยัน</th>
                    <th className="py-1 px-1.5 font-sans w-[24%] whitespace-nowrap">หมายเหตุ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-[8px] leading-tight">
                  {monthlyReportData.map((row) => (
                    <tr key={row.day} className={`${row.status === 'LATE' ? 'bg-amber-50/50' : row.status === 'LEAVE' ? 'bg-blue-50/50' : row.status === 'PRESENT' ? 'bg-white' : 'bg-slate-50/40'}`}>
                      <td className="py-[1.5px] px-1.5 text-center font-bold text-slate-800 border-r border-slate-200 whitespace-nowrap">
                        {row.day} {row.dayOfWeekThai}
                      </td>
                      <td className="py-[1.5px] px-1.5 text-center font-bold text-slate-900 border-r border-slate-200 whitespace-nowrap">
                        {row.checkInStr}
                      </td>
                      <td className="py-[1.5px] px-1.5 text-center text-slate-600 border-r border-slate-200 whitespace-nowrap">
                        {row.checkOutStr}
                      </td>
                      <td className="py-[1.5px] px-1.5 text-center text-slate-500 text-[7.5px] border-r border-slate-200 whitespace-nowrap">
                        {row.distanceStr}
                      </td>
                      <td className="py-[1.5px] px-1.5 text-center border-r border-slate-200 whitespace-nowrap">
                        {row.status === 'PRESENT' && (
                          <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold text-[7.5px] font-sans inline-block">
                            ● ตรงเวลา
                          </span>
                        )}
                        {row.status === 'LATE' && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold text-[7.5px] font-sans inline-block">
                            ▲ สาย
                          </span>
                        )}
                        {row.status === 'LEAVE' && (
                          <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 font-bold text-[7.5px] font-sans inline-block">
                            🏖️ วันหยุด
                          </span>
                        )}
                        {row.status === 'ABSENT' && (
                          <span className="px-1.5 py-0.2 rounded bg-rose-50 text-rose-600 font-medium text-[7.5px] font-sans border border-rose-200 inline-block">
                            ขาดงาน
                          </span>
                        )}
                        {row.status === 'PENDING' && (
                          <span className="text-slate-400 text-[7.5px] font-sans">-</span>
                        )}
                      </td>
                      <td className="py-[1.5px] px-1.5 text-right font-bold text-slate-900 font-mono border-r border-slate-200 whitespace-nowrap">
                        {row.allowance > 0 ? `+${row.allowance}฿` : '-'}
                      </td>
                      <td className="py-[1.5px] px-1.5 text-slate-500 font-sans text-[7.5px] truncate">
                        {row.note || '-'}
                      </td>
                    </tr>
                  ))}
                  
                  {/* Total Row */}
                  <tr className="bg-slate-100 font-bold border-t-2 border-slate-900 text-[8.5px]">
                    <td colSpan={4} className="py-1 px-1.5 font-sans border-r border-slate-200 whitespace-nowrap">
                      <span className="text-slate-900">รวมยอดเบี้ยขยันสุทธิ: </span>
                      <span className="text-slate-600 font-normal text-[7.5px]">( {allowanceThaiText} )</span>
                    </td>
                    <td className="py-1 px-1.5 text-center font-sans text-emerald-800 border-r border-slate-200 text-[8px] whitespace-nowrap">
                      {onTimeCount} วันตรงเวลา
                    </td>
                    <td className="py-1 px-1.5 text-right font-mono font-black text-[9.5px] text-emerald-800 border-r border-slate-200 whitespace-nowrap">
                      ฿{totalAllowance.toLocaleString()}
                    </td>
                    <td className="py-1 px-1.5 font-sans text-[7.5px] text-slate-600 whitespace-nowrap">
                      โอนพร้อมเงินเดือน
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. Employee Acknowledgment Note */}
          <div className="p-1.5 rounded bg-slate-50 border border-slate-200 text-[8px] text-slate-700 font-sans leading-tight">
            <span className="font-bold text-slate-900">📝 บันทึกรับทราบ: </span>
            <span className="text-slate-600">
              {employeeAckNote || 'ข้าพเจ้าขอรับรองว่าได้ตรวจสอบประวัติเวลาทำงานและเบี้ยขยันประจำเดือนแล้ว ขอยืนยันว่าถูกต้องตามความเป็นจริง'}
            </span>
          </div>

        </div>

        {/* BOTTOM SECTION (Signatures + Footer) */}
        <div className="space-y-1.5 pt-1.5">
          
          {/* 5. SIGNATURE SECTION (CEO ซ้าย • พนักงาน ขวา) */}
          <div className="border-t-2 border-slate-900 grid grid-cols-2 gap-4 text-[8.5px] font-sans pt-1.5">
            
            {/* Left Column: ฝ่าย CEO */}
            <div className="flex flex-col items-center justify-between h-16 p-1.5 rounded-lg border border-dashed border-slate-300 text-center bg-slate-50/40">
              <span className="text-[8px] font-bold text-slate-700 uppercase tracking-wider">
                ฝ่ายผู้บริหาร / CEO (ผู้ตรวจสอบ &amp; อนุมัติ)
              </span>

              <div className="w-full space-y-0.5">
                <div className="border-b border-slate-800 w-3/4 mx-auto pt-2"></div>
                <div>
                  <div className="font-bold text-slate-900 text-[8.5px]">
                    ( ท่านประธานกรรมการบริหาร / CEO )
                  </div>
                  <div className="text-[7.5px] font-mono text-slate-500">
                    รหัส: [ SI01 ] • วันที่: ......./......./...........
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: ฝ่ายพนักงาน */}
            <div className="flex flex-col items-center justify-between h-16 p-1.5 rounded-lg border border-dashed border-slate-300 text-center">
              <span className="text-[8px] font-bold text-slate-700 uppercase tracking-wider">
                ฝ่ายพนักงาน (ผู้รับทราบ &amp; ยืนยันเวลา)
              </span>

              <div className="w-full space-y-0.5">
                <div className="border-b border-slate-800 w-3/4 mx-auto pt-2"></div>
                <div>
                  <div className="font-bold text-slate-900 text-[8.5px]">
                    ( {employee.full_name || employee.name || '...................................................'} )
                  </div>
                  <div className="text-[7.5px] font-mono text-slate-500">
                    รหัส: [ {employee.employee_code || employee.code || '-'} ] • วันที่: ......./......./...........
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="pt-1 border-t border-slate-200 flex items-center justify-between text-[7.5px] font-mono text-slate-400">
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
          #printable-attendance-container, #printable-attendance-container * {
            visibility: visible !important;
          }
          #printable-attendance-container {
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
          .a4-print-sheet {
            width: 210mm !important;
            height: 297mm !important;
            min-height: 297mm !important;
            max-height: 297mm !important;
            margin: 0 !important;
            padding: 5mm 6mm !important;
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
        <div className="no-print flex flex-col lg:flex-row lg:items-center justify-between gap-4 px-6 py-4 border-b border-neutral-800/80 bg-neutral-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-white">รายงานสรุปเวลาการปฏิบัติงานประจำเดือน (รายบุคคล)</h3>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 text-[10px] font-mono font-bold">
                  {employee.employee_code} • {employee.full_name || employee.name}
                </span>
              </div>
              <p className="text-[11px] font-mono text-neutral-400">
                รอบเดือน: {thaiMonthYearStr} • ตรวจสอบสถานะปกติ/สาย และยอดเบี้ยขยัน
              </p>
            </div>
          </div>

          {/* Month Navigator & Print Version Selector */}
          <div className="flex flex-wrap items-center gap-2.5">
            
            {/* Month Navigator */}
            <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-xl p-1 font-mono text-xs text-white">
              <button
                onClick={() => {
                  if (selectedMonth === 0) {
                    setSelectedMonth(11);
                    setSelectedYear((y) => y - 1);
                  } else {
                    setSelectedMonth((m) => m - 1);
                  }
                }}
                className="p-1 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors"
                title="เดือนก่อนหน้า"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2.5 font-bold">{thaiMonthNames[selectedMonth].substring(0, 3)} {selectedYear + 543}</span>
              <button
                onClick={() => {
                  if (selectedMonth === 11) {
                    setSelectedMonth(0);
                    setSelectedYear((y) => y + 1);
                  } else {
                    setSelectedMonth((m) => m + 1);
                  }
                }}
                className="p-1 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors"
                title="เดือนถัดไป"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Print Version Selector */}
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

            {/* Action Buttons: Print, PNG, PDF */}
            <div className="flex items-center gap-1.5 font-mono text-xs">
              <button
                onClick={handleExportPNG}
                disabled={isExportingPng || isExportingPdf}
                className="px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                title="บันทึกภาพเอกสารเป็นไฟล์รูปภาพ PNG คมชัดสูง"
              >
                {isExportingPng ? <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" /> : <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />}
                <span className="hidden sm:inline">บันทึก</span> PNG
              </button>

              <button
                onClick={handleExportPDF}
                disabled={isExportingPng || isExportingPdf}
                className="px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                title="บันทึกเอกสารเป็นไฟล์ PDF พร้อมสั่งพิมพ์"
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
        </div>

        {/* Optional Editable Acknowledgment Bar (In Modal) */}
        <div className="no-print px-6 py-2.5 bg-neutral-900/90 border-b border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2 text-neutral-300">
            <span className="text-amber-400">✏️ กรอกบันทึกพนักงานรับทราบ:</span>
            <input
              type="text"
              value={employeeAckNote}
              onChange={(e) => setEmployeeAckNote(e.target.value)}
              placeholder="ระบุข้อความรับทราบของพนักงาน..."
              className="px-3 py-1 bg-neutral-950 border border-neutral-700 rounded-lg text-white font-sans text-xs w-72 sm:w-96 focus:outline-none focus:border-amber-400"
            />
          </div>

          <span className="text-neutral-400 text-[11px]">
            * ข้อความนี้จะปรากฏในช่องรับทราบของเอกสารที่สั่งพิมพ์
          </span>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-[#0a0a0c]">
          <div ref={printAreaRef} id="printable-attendance-container">
            {/* If BOTH, render Sheet 1 (ต้นฉบับ) + Sheet 2 (สำเนา) */}
            {printCopyMode === 'BOTH' && (
              <>
                {renderReportSheet('ORIGINAL', true)}
                {renderReportSheet('COPY', false)}
              </>
            )}

            {/* If ORIGINAL only */}
            {printCopyMode === 'ORIGINAL' && renderReportSheet('ORIGINAL', false)}

            {/* If COPY only */}
            {printCopyMode === 'COPY' && renderReportSheet('COPY', false)}
          </div>
        </div>

        {/* Modal Bottom Action Bar (Hidden when printing) */}
        <div className="no-print p-4 sm:p-5 border-t border-neutral-800 bg-neutral-950 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs font-mono text-neutral-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>
              รูปแบบพิมพ์: <strong className="text-rose-400 font-bold">{printCopyMode === 'BOTH' ? 'พิมพ์ทั้ง 2 แผ่น (ต้นฉบับ + สำเนา)' : printCopyMode === 'ORIGINAL' ? 'พิมพ์เฉพาะ ต้นฉบับ' : 'พิมพ์เฉพาะ สำเนา'}</strong> • {thaiMonthYearStr}
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
