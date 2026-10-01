'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Coins, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  TrendingUp, 
  RefreshCw,
  Sparkles,
  Award,
  Zap,
  Sun,
  Moon,
  Shield,
  ArrowLeft
} from 'lucide-react';
import { useAppTheme } from '@/lib/theme';
import EmployeeBottomNav from '@/components/EmployeeBottomNav';
import NetworkGuard from '@/components/NetworkGuard';

export default function EmployeeStatsPage() {
  const router = useRouter();
  const { isDark, toggleTheme } = useAppTheme();
  const [employee, setEmployee] = useState<any>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [statsData, setStatsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('attendance_employee_profile');
    if (!saved) {
      router.push('/employee/login');
      return;
    }
    try {
      const parsed = JSON.parse(saved);
      setEmployee(parsed);
      loadStats(parsed.id, currentDate.getMonth() + 1, currentDate.getFullYear());
    } catch (e) {
      router.push('/employee/login');
    }
  }, []);

  const loadStats = async (empId: string, month: number, year: number) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/employee/stats?id=${empId}&month=${month}&year=${year}`);
      const data = await res.json();
      if (data.success) {
        setStatsData(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const changeMonth = (offset: number) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1);
    setCurrentDate(newDate);
    if (employee?.id) {
      loadStats(employee.id, newDate.getMonth() + 1, newDate.getFullYear());
    }
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(
        <div 
          key={`blank-${i}`} 
          className="h-11 rounded-2xl opacity-10" 
        />
      );
    }

    for (let day = 1; day <= totalDaysInMonth; day++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const event = statsData?.calendarEvents?.[dateKey];

      let dayStyle = 'bg-white/90 border border-slate-300/90 text-slate-900 font-black shadow-xs hover:bg-white';

      if (event) {
        if (event.status === 'PRESENT') {
          dayStyle = 'bg-emerald-100/95 border-2 border-emerald-600 text-emerald-950 font-black shadow-md';
        } else if (event.status === 'LATE') {
          dayStyle = 'bg-amber-100/95 border-2 border-amber-600 text-amber-950 font-black shadow-md';
        } else if (event.type === 'LEAVE') {
          dayStyle = 'bg-blue-100/95 border-2 border-blue-600 text-blue-950 font-black shadow-md';
        }
      }

      days.push(
        <div
          key={day}
          className={`h-11 rounded-2xl flex flex-col items-center justify-between p-1 text-xs relative transition-all ${dayStyle}`}
        >
          <span className="text-[11px] font-black text-slate-900 leading-none drop-shadow-xs">{day}</span>
          {event ? (
            <span className={`text-[9px] font-mono font-black tracking-tight px-1 py-0.2 rounded leading-none ${
              event.status === 'PRESENT' ? 'bg-emerald-600 text-white font-black' :
              event.status === 'LATE' ? 'bg-amber-600 text-white font-black' :
              'bg-blue-600 text-white font-black'
            }`}>
              {event.status === 'PRESENT' ? '+50฿' : event.status === 'LATE' ? 'สาย' : 'ลา'}
            </span>
          ) : (
            <span className="w-1 h-1 rounded-full bg-slate-500/60"></span>
          )}
        </div>
      );
    }

    return days;
  };

  const thaiMonths = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  return (
    <div className={`min-h-screen w-full flex flex-col justify-between max-w-md mx-auto shadow-2xl relative overflow-hidden pb-28 font-sans transition-colors duration-300 ${
      isDark ? 'bg-[#090d16] text-slate-100' : 'bg-[#eef2f7] text-slate-800'
    }`}>
      
      {/* Network Guard */}
      <NetworkGuard />

      {/* Header */}
      <header className={`px-4 pt-4 pb-3 flex items-center justify-between sticky top-0 z-30 transition-colors ${
        isDark ? 'bg-[#0f1626]/90 border-b border-white/5 backdrop-blur-xl' : 'bg-white/90 border-b border-slate-200 backdrop-blur-xl shadow-xs'
      }`}>
        <div className="flex items-center gap-2.5">
          <Link
            href="/employee"
            className={`p-2 rounded-xl border transition-all active:scale-90 ${
              isDark ? 'bg-slate-800 border-white/10 text-slate-300 hover:text-white' : 'bg-slate-100 border-slate-300 text-slate-700'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="font-bold text-sm">ปฏิทิน & เบี้ยเลี้ยงสะสม</h1>
            <p className="text-[11px] text-slate-400 font-mono">
              {employee?.fullName || employee?.full_name} ({employee?.employeeCode || employee?.employee_code})
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => loadStats(employee?.id, currentDate.getMonth() + 1, currentDate.getFullYear())}
            className={`p-2 rounded-xl border transition-all active:scale-90 ${
              isDark ? 'bg-slate-800 border-white/10 text-slate-300 hover:text-white' : 'bg-slate-100 border-slate-300 text-slate-700'
            }`}
            title="รีเฟรชข้อมูล"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-500' : ''}`} />
          </button>
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-xl border transition-all active:scale-90 ${
              isDark ? 'bg-slate-800 border-white/10 text-yellow-300' : 'bg-slate-100 border-slate-300 text-slate-700'
            }`}
            title="สลับโหมด Dark / Light"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 flex-1 space-y-4 relative z-10">
        
        {/* Top Monthly Allowance & KPI Hero Summary Card */}
        <div className="p-4 rounded-3xl text-white shadow-xl relative overflow-hidden group border border-emerald-500/30 bg-[#061e16]">
          {/* Background Image with Controlled 30-40% Opacity */}
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-40 pointer-events-none transition-transform duration-700 group-hover:scale-110"
            style={{ backgroundImage: `url('/images/stats-allowance-bg.jpg')` }}
          />
          {/* Soft Frosted Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/75 via-emerald-900/70 to-[#061e16]/85 pointer-events-none" />

          <div className="relative z-10 space-y-3">
            {/* Card Header with Integrated Month Switcher */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-emerald-200 text-xs font-semibold">
                <Coins className="w-4 h-4 text-yellow-300 drop-shadow-md" />
                <span className="drop-shadow-sm">เบี้ยเลี้ยงสะสมประจำเดือน</span>
              </div>
              
              {/* Month Navigator Capsule */}
              <div className="flex items-center gap-1 bg-black/40 border border-white/15 px-1.5 py-0.5 rounded-full backdrop-blur-md">
                <button
                  onClick={() => changeMonth(-1)}
                  className="p-1 rounded-full text-slate-300 hover:text-white transition-transform active:scale-90"
                  title="เดือนก่อนหน้า"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-bold text-white px-1">
                  {thaiMonths[currentDate.getMonth()]} {currentDate.getFullYear() + 543}
                </span>
                <button
                  onClick={() => changeMonth(1)}
                  className="p-1 rounded-full text-slate-300 hover:text-white transition-transform active:scale-90"
                  title="เดือนถัดไป"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Total Allowance Main Highlight */}
            <div className="flex items-baseline justify-between pt-1">
              <div>
                <div className="text-3xl font-black tracking-tight text-white drop-shadow-md">
                  ฿{statsData?.summary?.totalAllowance || 0} <span className="text-xs font-normal text-emerald-200">บาท</span>
                </div>
                <div className="text-[11px] text-emerald-200 flex items-center gap-1 mt-1 font-medium drop-shadow-sm">
                  <Zap className="w-3.5 h-3.5 text-yellow-300" />
                  ตรงเวลา {statsData?.summary?.presentDays || 0} วัน (+50฿/วัน)
                </div>
              </div>

              {/* On-Time Rate Pill */}
              <div className="text-right">
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-2xl bg-blue-500/20 border border-blue-400/30 text-cyan-300 backdrop-blur-md">
                  <TrendingUp className="w-3.5 h-3.5 text-cyan-300" />
                  <span className="text-xs font-black">{statsData?.summary?.onTimeRate || 0}% ตรงเวลา</span>
                </div>
                <div className="text-[10px] text-slate-300 mt-1 space-x-1.5 font-mono">
                  <span>สาย: <b className="text-amber-300">{statsData?.summary?.lateDays || 0}</b></span>
                  <span>•</span>
                  <span>ลา: <b className="text-blue-300">{statsData?.summary?.leaveDays || 0}</b></span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar Grid (0% Dark Overlay / 100% Full Clarity with Bold Black Text) */}
        <div className="p-4 rounded-3xl relative overflow-hidden shadow-2xl border border-slate-300/80 bg-white/75 backdrop-blur-sm space-y-3">
          {/* Custom Calendar Background Image with 100% Full Clarity */}
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-100 pointer-events-none transition-transform duration-700"
            style={{ backgroundImage: `url('/images/stats-calendar-bg.jpg')` }}
          />

          <div className="relative z-10 space-y-3">
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black text-slate-900 mb-1">
              <span className="text-rose-600 font-black">อา</span>
              <span className="text-slate-900 font-black">จ</span>
              <span className="text-slate-900 font-black">อ</span>
              <span className="text-slate-900 font-black">พ</span>
              <span className="text-slate-900 font-black">พฤ</span>
              <span className="text-slate-900 font-black">ศ</span>
              <span className="text-blue-700 font-black">ส</span>
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {renderCalendar()}
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-900 pt-3 border-t border-slate-400/40 font-bold">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shadow-sm"></span> ตรงเวลา (+50฿)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-600 shadow-sm"></span> สาย (0฿)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-sm"></span> ลาหยุด
              </span>
            </div>
          </div>
        </div>

      </main>

      {/* SMART AUTO-HIDE BOTTOM NAVIGATION BAR */}
      <EmployeeBottomNav currentTab="calendar" />
    </div>
  );
}
