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
  Check
} from 'lucide-react';
import { thaiBahtText } from '@/components/CashAdvanceReceiptModal';

interface MonthlyAttendanceReportModalProps {
  employee: any | null;
  attendanceLogs: any[];
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
  isOpen,
  onClose,
  storeSettings
}: MonthlyAttendanceReportModalProps) {
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedMonth, setSelectedMonth] = useState(9); // 0-indexed: 9 = October
  const [printCopyMode, setPrintCopyMode] = useState<'ORIGINAL' | 'COPY' | 'BOTH'>('BOTH');
  const [employeeAckNote, setEmployeeAckNote] = useState('ข้าพเจ้าได้ตรวจสอบเวลาเข้า-ออกงาน และยอดเบี้ยขยันประจำเดือนแล้ว ขอยืนยันว่าถูกต้องสมบูรณ์');
  const [isAckChecked, setIsAckChecked] = useState(true);

  const printAreaRef = useRef<HTMLDivElement>(null);

  const thaiMonthNames = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  const monthStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
  const thaiMonthYearStr = `${thaiMonthNames[selectedMonth]} ${selectedYear + 543}`;

  // 1. Filter Logs for Employee in this Month
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

    const mapByDay = new Map<number, any>();
    empLogs.forEach((l: any) => {
      const day = new Date(l.check_in_time).getDate();
      mapByDay.set(day, l);
    });

    const rows = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(selectedYear, selectedMonth, d);
      const dayOfWeek = dateObj.getDay(); // 0 = Sun
      const dayOfWeekThai = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'][dayOfWeek];
      const dateStr = `${d} ${thaiMonthNames[selectedMonth].substring(0, 3)}.`;

      const log = mapByDay.get(d);
      let status: 'PRESENT' | 'LATE' | 'ABSENT' | 'OFF' = 'OFF';
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
        // If it's a Sunday, mark as day off
        if (dayOfWeek === 0) {
          status = 'OFF';
          note = 'วันหยุดประจำสัปดาห์';
        } else {
          status = 'ABSENT';
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
  }, [employee, attendanceLogs, selectedYear, selectedMonth, daysInMonth, monthStr]);

  // Compute KPI Summary Totals
  const onTimeCount = monthlyReportData.filter((r) => r.status === 'PRESENT').length;
  const lateCount = monthlyReportData.filter((r) => r.status === 'LATE').length;
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

  /**
   * Sub-renderer for a single Report Sheet
   */
  const renderReportSheet = (versionType: 'ORIGINAL' | 'COPY', isFirstPageInDual: boolean = false) => {
    const isOriginal = versionType === 'ORIGINAL';
    const copyLabel = isOriginal ? 'ต้นฉบับ / ORIGINAL' : 'สำเนา / COPY';
    const subDesc = isOriginal ? 'สำหรับฝ่ายบริหาร & แผนกบุคคล' : 'สำหรับพนักงานประจำตัว';

    return (
      <div 
        key={versionType}
        className={`w-full max-w-4xl mx-auto bg-white text-slate-900 rounded-2xl p-8 sm:p-12 shadow-2xl border border-slate-200 space-y-6 relative overflow-hidden font-sans ${
          isFirstPageInDual ? 'print-page-break mb-8' : ''
        }`}
      >
        {/* Watermark Seal */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-[0.025] select-none">
          <Building2 className="w-96 h-96 text-slate-900" />
        </div>

        {/* ----------------------------------------------------------- */}
        {/* TOP RIGHT RED BADGE: ต้นฉบับ / สำเนา                         */}
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

          <div className="mt-1 text-[9px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
            ✓ OFFICIAL TIME REPORT
          </div>
        </div>

        {/* 1. Header Information */}
        <div className="border-b-2 border-slate-900 pb-5 space-y-2">
          <div className="space-y-1 max-w-lg">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-slate-900 text-white font-mono font-bold text-[10px] uppercase">
                ATTENDANCE TIMESHEET
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
              โทรศัพท์: {storePhone} • ระบบบันทึกเวลาทำงานและคำนวณเบี้ยขยัน
            </p>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-slate-200 mt-4">
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-wide">
                รายงานสรุปเวลาการปฏิบัติงานและเบี้ยขยันประจำเดือน
              </h2>
              <span className="text-[11px] font-mono text-slate-500 font-bold">
                MONTHLY ATTENDANCE &amp; INCENTIVE ALLOWANCE REPORT
              </span>
            </div>
            <div className="text-left sm:text-right font-mono text-xs space-y-0.5">
              <div>
                <span className="text-slate-500 font-medium">เลขที่เอกสาร: </span>
                <span className="font-bold text-slate-900">{docNumber}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium">รอบประจำเดือน: </span>
                <span className="font-bold text-slate-900">{thaiMonthYearStr}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Employee Info & 2 Core Status Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-sans text-xs">
          
          {/* Employee Info */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-1.5">
            <div className="text-slate-500 font-medium">ข้อมูลพนักงาน:</div>
            <div className="font-bold text-sm text-slate-900">
              {employee.full_name || employee.name}
              {employee.nickname && <span className="text-slate-600 font-normal"> ({employee.nickname})</span>}
            </div>
            <div className="text-slate-600">
              <span className="font-semibold">รหัสพนักงาน (ID):</span> <strong className="font-mono text-slate-900 font-black">[{employee.employee_code || employee.code || '-'}]</strong>
            </div>
            <div className="text-slate-600">
              <span className="font-semibold">ตำแหน่ง:</span> {employee.role || 'ช่างเทคนิค'}
            </div>
          </div>

          {/* Status 1: มาตรงเวลา (ปกติ) */}
          <div className="bg-emerald-50/60 rounded-xl p-4 border border-emerald-200 space-y-1">
            <div className="text-emerald-800 font-bold flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                สถานะปกติ (ตรงเวลา)
              </span>
              <span className="text-[10px] font-mono bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded font-bold">+50฿/วัน</span>
            </div>
            <div className="text-2xl font-black font-mono text-emerald-900 mt-1">
              {onTimeCount} <span className="text-xs font-sans font-bold">วัน</span>
            </div>
            <div className="text-[11px] text-emerald-700">
              เบี้ยขยันสะสม: <strong>฿{totalAllowance.toLocaleString()} บาท</strong>
            </div>
          </div>

          {/* Status 2: มาสาย */}
          <div className="bg-amber-50/60 rounded-xl p-4 border border-amber-200 space-y-1">
            <div className="text-amber-800 font-bold flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-600" />
                สถานะมาสาย
              </span>
              <span className="text-[10px] font-mono bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded font-bold">ไม่ได้รับเบี้ย</span>
            </div>
            <div className="text-2xl font-black font-mono text-amber-900 mt-1">
              {lateCount} <span className="text-xs font-sans font-bold">วัน</span>
            </div>
            <div className="text-[11px] text-amber-700">
              {lateCount > 0 ? 'หลังเวลา 07:40 น. ที่กำหนด' : '✓ ไม่มีประวัติมาสายในเดือนนี้'}
            </div>
          </div>

        </div>

        {/* 3. Daily Attendance Breakdown Table */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-800 border-b border-slate-200 pb-1">
            <span>📅 ตารางบันทึกการลงเวลาทำงานรายวัน ({thaiMonthYearStr})</span>
            <span className="font-mono font-normal text-slate-500">รวม {daysInMonth} วัน</span>
          </div>

          <div className="rounded-xl border border-slate-900 overflow-hidden text-xs">
            <table className="w-full text-left font-mono">
              <thead>
                <tr className="bg-slate-900 text-white font-bold font-sans text-[11px]">
                  <th className="py-2 px-3 text-center w-12">วันที่</th>
                  <th className="py-2 px-3">เวลาเข้างาน</th>
                  <th className="py-2 px-3">เวลาออกงาน</th>
                  <th className="py-2 px-3">ระยะ GPS</th>
                  <th className="py-2 px-3 text-center">สถานะ</th>
                  <th className="py-2 px-3 text-right">เบี้ยขยัน</th>
                  <th className="py-2 px-3 font-sans">หมายเหตุ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-[11px]">
                {monthlyReportData.map((row) => (
                  <tr key={row.day} className={`hover:bg-slate-50 ${row.status === 'LATE' ? 'bg-amber-50/30' : ''}`}>
                    <td className="py-1.5 px-3 text-center font-bold text-slate-700">
                      {row.day} ({row.dayOfWeekThai})
                    </td>
                    <td className="py-1.5 px-3 font-bold text-slate-900">
                      {row.checkInStr}
                    </td>
                    <td className="py-1.5 px-3 text-slate-600">
                      {row.checkOutStr}
                    </td>
                    <td className="py-1.5 px-3 text-slate-500 text-[10px]">
                      {row.distanceStr}
                    </td>
                    <td className="py-1.5 px-3 text-center">
                      {row.status === 'PRESENT' && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] font-sans">
                          ● ปกติ
                        </span>
                      )}
                      {row.status === 'LATE' && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px] font-sans">
                          ▲ สาย
                        </span>
                      )}
                      {row.status === 'OFF' && (
                        <span className="text-slate-400 text-[10px] font-sans">
                          วันหยุด
                        </span>
                      )}
                      {row.status === 'ABSENT' && (
                        <span className="text-slate-400 text-[10px] font-sans">
                          -
                        </span>
                      )}
                    </td>
                    <td className="py-1.5 px-3 text-right font-bold text-slate-900 font-mono">
                      {row.allowance > 0 ? `+${row.allowance}฿` : '-'}
                    </td>
                    <td className="py-1.5 px-3 text-slate-500 font-sans text-[10px]">
                      {row.note || '-'}
                    </td>
                  </tr>
                ))}
                
                {/* Total Row */}
                <tr className="bg-slate-100 font-bold border-t-2 border-slate-900 text-xs">
                  <td colSpan={4} className="py-2.5 px-3 font-sans">
                    <div>รวมยอดเบี้ยขยันสุทธิประจำเดือน:</div>
                    <div className="text-[11px] text-slate-600 font-normal">
                      ( {allowanceThaiText} )
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-center font-sans text-emerald-800">
                    {onTimeCount} วันตรงเวลา
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-black text-sm text-emerald-800">
                    ฿{totalAllowance.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 font-sans text-[10px] text-slate-600">
                    โอนพร้อมเงินเดือน
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 4. Employee Acknowledgment Section (กรอกพนักงานรับทราบ) */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1.5 leading-relaxed font-sans">
          <div className="font-bold text-slate-900 flex items-center gap-1.5">
            <span>📝</span>
            <span>ข้อความบันทึกการรับทราบของพนักงาน (Employee Acknowledgment):</span>
          </div>
          <p className="text-[11px] text-slate-600">
            {employeeAckNote || 'ข้าพเจ้าขอรับรองว่าได้ตรวจสอบประวัติการลงเวลาการปฏิบัติงานและยอดเบี้ยขยันประจำเดือนข้างต้นแล้ว และขอยืนยันว่าถูกต้องตรงตามความเป็นจริงทุกประการ'}
          </p>
        </div>

        {/* ----------------------------------------------------------- */}
        {/* 5. SIGNATURE SECTION (CEO ซ้าย • พนักงาน ขวา ตามที่ระบุ)     */}
        {/* ----------------------------------------------------------- */}
        <div className="pt-6 border-t-2 border-slate-900 grid grid-cols-2 gap-8 text-xs font-sans">
          
          {/* Left Column: ฝ่าย CEO / ผู้บริหาร (ผู้ตรวจสอบและอนุมัติ) */}
          <div className="flex flex-col items-center justify-between h-44 p-4 rounded-xl border border-dashed border-slate-300 text-center bg-slate-50/50">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              ฝ่ายผู้บริหาร / CEO (ผู้ตรวจสอบ &amp; อนุมัติ)
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

          {/* Right Column: ฝ่ายพนักงาน (ผู้รับทราบข้อมูลและยืนยันเวลา) */}
          <div className="flex flex-col items-center justify-between h-44 p-4 rounded-xl border border-dashed border-slate-300 text-center">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              ฝ่ายพนักงาน (ผู้รับทราบ &amp; ยืนยันเวลา)
            </span>

            {/* Signature blank space line */}
            <div className="w-full space-y-2">
              <div className="border-b border-slate-800 w-4/5 mx-auto pt-8"></div>
              
              <div className="space-y-0.5">
                <div className="font-bold text-slate-900">
                  ( {employee.full_name || employee.name || '...................................................'} )
                </div>
                <div className="text-[11px] font-mono text-slate-600 font-bold">
                  รหัสพนักงาน (ID): [ {employee.employee_code || employee.code || '-'} ]
                </div>
                <div className="text-[10px] text-slate-500">
                  วันที่: .......... / .......... / ................
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
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
          #printable-attendance-container, #printable-attendance-container * {
            visibility: visible !important;
          }
          #printable-attendance-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 12mm !important;
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
              <span>🖨️ สั่งพิมพ์รายงานประจำเดือน ({printCopyMode === 'BOTH' ? '2 แผ่น' : '1 แผ่น'})</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
