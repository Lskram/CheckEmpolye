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
  Shield
} from 'lucide-react';
import { useAppTheme } from '@/lib/theme';
import EmployeeBottomNav from '@/components/EmployeeBottomNav';

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

      let dayStyle = isDark 
        ? 'neumorph-tile-dark text-slate-300' 
        : 'neumorph-tile-light text-slate-700';

      if (event) {
        if (event.status === 'PRESENT') {
          dayStyle = isDark 
            ? 'bg-emerald-500/20 border-2 border-emerald-400 text-emerald-300 font-bold shadow-md shadow-emerald-500/20' 
            : 'bg-emerald-100 border-2 border-emerald-500 text-emerald-800 font-bold shadow-sm';
        } else if (event.status === 'LATE') {
          dayStyle = isDark 
            ? 'bg-amber-500/20 border-2 border-amber-400 text-amber-300 font-bold shadow-md shadow-amber-500/20' 
            : 'bg-amber-100 border-2 border-amber-500 text-amber-800 font-bold shadow-sm';
        } else if (event.type === 'LEAVE') {
          dayStyle = isDark 
            ? 'bg-blue-500/20 border-2 border-blue-400 text-blue-300 font-bold shadow-md shadow-blue-500/20' 
            : 'bg-blue-100 border-2 border-blue-500 text-blue-800 font-bold shadow-sm';
        }
      }

      days.push(
        <div
          key={day}
          className={`h-11 rounded-2xl flex flex-col items-center justify-between p-1 text-xs relative transition-all ${dayStyle}`}
        >
          <span className="text-[11px] font-bold leading-none">{day}</span>
          {event ? (
            <span className={`text-[9px] font-mono font-black tracking-tight px-1 py-0.2 rounded leading-none ${
              event.status === 'PRESENT' ? 'bg-emerald-500/30 text-emerald-200' :
              event.status === 'LATE' ? 'bg-amber-500/30 text-amber-200' :
              'bg-blue-500/30 text-blue-200'
            }`}>
              {event.status === 'PRESENT' ? '+50฿' : event.status === 'LATE' ? 'สาย' : 'ลา'}
            </span>
          ) : (
            <span className="w-1 h-1 rounded-full bg-slate-400/40"></span>
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
      
      {/* Header */}
      <header className={`px-5 pt-4 pb-3 flex items-center justify-between sticky top-0 z-30 transition-colors ${
        isDark ? 'bg-[#0f1626]/90 border-b border-white/5 backdrop-blur-xl' : 'bg-white/90 border-b border-slate-200 backdrop-blur-xl shadow-xs'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shadow-sm">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-sm">ปฏิทิน & เบี้ยเลี้ยงสะสม</h1>
            <p className="text-[11px] text-slate-400 font-mono">
              {employee?.fullName} ({employee?.employeeCode})
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-xl border transition-all active:scale-90 ${
              isDark ? 'bg-slate-800 border-white/10 text-yellow-300' : 'bg-slate-100 border-slate-300 text-slate-700'
            }`}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={() => loadStats(employee?.id, currentDate.getMonth() + 1, currentDate.getFullYear())}
            className={`p-2 rounded-xl border transition-all active:scale-90 ${
              isDark ? 'bg-slate-800 border-white/10 text-slate-300' : 'bg-slate-100 border-slate-300 text-slate-700'
            }`}
            title="รีเฟรชข้อมูล"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-500' : ''}`} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 flex-1 space-y-4 relative z-10">
        
        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-3">
          {/* Allowance Card */}
          <div className="p-4 rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-xl shadow-emerald-950/30 relative overflow-hidden">
            <div className="flex items-center justify-between text-emerald-100 text-xs mb-1 font-semibold">
              <span>เบี้ยเลี้ยงสะสม</span>
              <Coins className="w-4 h-4 text-yellow-300" />
            </div>
            <div className="text-2xl font-black my-1">
              {statsData?.summary?.totalAllowance || 0} <span className="text-xs font-normal">บาท</span>
            </div>
            <div className="text-[10px] text-emerald-100 flex items-center gap-1 mt-1 font-medium">
              <Zap className="w-3 h-3 text-yellow-300" />
              ตรงเวลา {statsData?.summary?.presentDays || 0} วัน (50฿/วัน)
            </div>
          </div>

          {/* On-Time Rate */}
          <div className={`p-4 rounded-3xl ${isDark ? 'neumorph-dark' : 'neumorph-light'} flex flex-col justify-between`}>
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1 font-semibold">
                <span>อัตราตรงเวลา</span>
                <TrendingUp className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl font-black text-blue-500 my-1">
                {statsData?.summary?.onTimeRate || 0}<span className="text-xs font-bold">%</span>
              </div>
            </div>
            <div className="text-[10px] text-slate-400 flex items-center gap-1.5 flex-wrap">
              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-500 font-bold">
                สาย {statsData?.summary?.lateDays || 0}
              </span>
              <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-500 font-bold">
                ลา {statsData?.summary?.leaveDays || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Month Navigator */}
        <div className={`flex items-center justify-between px-3 py-2 rounded-2xl ${isDark ? 'neumorph-dark' : 'neumorph-light'} text-xs font-bold`}>
          <button
            onClick={() => changeMonth(-1)}
            className={`p-2 rounded-xl transition-all active:scale-90 ${isDark ? 'neumorph-tile-dark' : 'neumorph-tile-light'}`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 font-bold">
            <CalendarIcon className="w-4 h-4 text-blue-500" />
            <span>
              {thaiMonths[currentDate.getMonth()]} {currentDate.getFullYear() + 543}
            </span>
          </div>
          <button
            onClick={() => changeMonth(1)}
            className={`p-2 rounded-xl transition-all active:scale-90 ${isDark ? 'neumorph-tile-dark' : 'neumorph-tile-light'}`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className={`p-4 rounded-3xl ${isDark ? 'neumorph-dark' : 'neumorph-light'} space-y-3`}>
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 mb-1">
            <span className="text-rose-500">อา</span>
            <span>จ</span>
            <span>อ</span>
            <span>พ</span>
            <span>พฤ</span>
            <span>ศ</span>
            <span className="text-blue-500">ส</span>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {renderCalendar()}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-3 border-t border-slate-500/10 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> ตรงเวลา (+50฿)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span> สาย (0฿)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span> ลาหยุด
            </span>
          </div>
        </div>

      </main>

      {/* SMART AUTO-HIDE BOTTOM NAVIGATION BAR */}
      <EmployeeBottomNav currentTab="calendar" />
    </div>
  );
}
