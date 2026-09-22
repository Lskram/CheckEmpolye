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
  Menu
} from 'lucide-react';

export default function EmployeeStatsPage() {
  const router = useRouter();
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
      days.push(<div key={`blank-${i}`} className="h-10 rounded-xl bg-slate-50 opacity-40" />);
    }

    for (let day = 1; day <= totalDaysInMonth; day++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const event = statsData?.calendarEvents?.[dateKey];

      let dayStyle = 'bg-slate-50 text-slate-600 border-slate-100';

      if (event) {
        if (event.status === 'PRESENT') {
          dayStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold';
        } else if (event.status === 'LATE') {
          dayStyle = 'bg-amber-50 text-amber-700 border-amber-200 font-bold';
        } else if (event.type === 'LEAVE') {
          dayStyle = 'bg-blue-50 text-blue-700 border-blue-200 font-bold';
        }
      }

      days.push(
        <div
          key={day}
          className={`h-11 rounded-xl border flex flex-col items-center justify-between p-1 text-xs relative ${dayStyle}`}
        >
          <span className="text-[11px]">{day}</span>
          {event ? (
            <span className="text-[9px] font-mono leading-none">
              {event.status === 'PRESENT' ? '+50฿' : event.status === 'LATE' ? 'สาย' : 'ลา'}
            </span>
          ) : (
            <span className="w-1 h-1 rounded-full bg-slate-200"></span>
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
    <div className="min-h-screen bg-[#f1f5f9] text-slate-800 flex flex-col justify-between max-w-md mx-auto shadow-2xl pb-24">
      {/* Header */}
      <header className="bg-white px-5 pt-4 pb-3 flex items-center justify-between border-b border-slate-100 shadow-xs sticky top-0 z-30">
        <div>
          <h1 className="font-bold text-base text-slate-900">ปฏิทิน & เบี้ยเลี้ยงสะสม</h1>
          <p className="text-xs text-slate-500">
            {employee?.fullName} ({employee?.employeeCode})
          </p>
        </div>
        <button
          onClick={() => loadStats(employee?.id, currentDate.getMonth() + 1, currentDate.getFullYear())}
          className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:text-blue-600 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </header>

      {/* Main Content */}
      <main className="p-4 flex-1 space-y-4">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-3">
          {/* Allowance */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-sky-500 text-white shadow-md shadow-blue-500/20">
            <div className="flex items-center justify-between text-sky-100 text-xs mb-1">
              <span>เบี้ยเลี้ยงสะสมเดือนนี้</span>
              <Coins className="w-4 h-4 text-yellow-300" />
            </div>
            <div className="text-2xl font-black">
              {statsData?.summary?.totalAllowance || 0} <span className="text-sm font-semibold text-sky-200">บาท</span>
            </div>
            <div className="text-[10px] text-sky-100 mt-1">
              ตรงเวลา {statsData?.summary?.presentDays || 0} วัน (50฿/วัน)
            </div>
          </div>

          {/* On-Time Rate */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
              <span>อัตราความตรงต่อเวลา</span>
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-blue-600">
              {statsData?.summary?.onTimeRate || 0}<span className="text-sm font-bold">%</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              สาย {statsData?.summary?.lateDays || 0} วัน • ลา {statsData?.summary?.leaveDays || 0} วัน
            </div>
          </div>
        </div>

        {/* Month Navigator */}
        <div className="flex items-center justify-between p-2 rounded-2xl bg-white border border-slate-200/80 shadow-xs text-xs font-bold">
          <button
            onClick={() => changeMonth(-1)}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-slate-800">
            {thaiMonths[currentDate.getMonth()]} {currentDate.getFullYear() + 543}
          </span>
          <button
            onClick={() => changeMonth(1)}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Calendar Card */}
        <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3">
          {/* Days of week */}
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-slate-400 mb-1">
            <span className="text-rose-500">อา</span>
            <span>จ</span>
            <span>อ</span>
            <span>พ</span>
            <span>พฤ</span>
            <span>ศ</span>
            <span className="text-blue-600">ส</span>
          </div>

          {/* Days cells */}
          <div className="grid grid-cols-7 gap-1.5">
            {renderCalendar()}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-3 border-t border-slate-100">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> ตรงเวลา (+50฿)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span> มาสาย (0฿)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span> ลาหยุด
            </span>
          </div>
        </div>
      </main>

      {/* 5-Tab Navigation matching Screenshot */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-slate-200/90 px-3 py-2 flex items-center justify-around z-30 shadow-lg">
        <Link href="/employee" className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-slate-600 text-[10px] py-1">
          <div className="w-6 h-6 flex items-center justify-center"><Clock className="w-4 h-4" /></div>
          <span>เข้างาน</span>
        </Link>
        <Link href="/employee/stats" className="flex flex-col items-center gap-0.5 text-blue-600 font-bold text-[10px] py-1">
          <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center text-blue-600"><CalendarIcon className="w-4 h-4" /></div>
          <span>ปฏิทิน</span>
          <span className="w-1 h-1 rounded-full bg-blue-600"></span>
        </Link>
        <Link href="/employee/stats" className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-slate-600 text-[10px] py-1">
          <div className="w-6 h-6 flex items-center justify-center"><Coins className="w-4 h-4" /></div>
          <span>เบี้ยเลี้ยง</span>
        </Link>
        <Link href="/employee/leave" className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-slate-600 text-[10px] py-1">
          <div className="w-6 h-6 flex items-center justify-center"><FileText className="w-4 h-4" /></div>
          <span>คำขอลา</span>
        </Link>
        <Link href="/admin" className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-slate-600 text-[10px] py-1">
          <div className="w-6 h-6 flex items-center justify-center"><Menu className="w-4 h-4" /></div>
          <span>ผู้บริหาร</span>
        </Link>
      </nav>
    </div>
  );
}
