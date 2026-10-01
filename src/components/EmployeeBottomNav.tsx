'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Clock, Calendar, FileText, Coins, Sparkles, Sun, Moon } from 'lucide-react';
import { useAppTheme } from '@/lib/theme';

interface EmployeeBottomNavProps {
  currentTab?: 'checkin' | 'calendar' | 'leave' | 'advance';
}

export default function EmployeeBottomNav({ currentTab }: EmployeeBottomNavProps) {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const [employee, setEmployee] = useState<any>(null);
  const lastScrollY = useRef(0);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);
  const { isDark, toggleTheme } = useAppTheme();

  // Load employee profile for center avatar badge
  useEffect(() => {
    try {
      const saved = localStorage.getItem('attendance_employee_profile');
      if (saved) {
        setEmployee(JSON.parse(saved));
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // Determine active tab
  const active = currentTab || (
    pathname?.includes('/employee/advance') ? 'advance' :
    pathname?.includes('/employee/leave') ? 'leave' :
    pathname?.includes('/employee/stats') ? 'calendar' :
    'checkin'
  );

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDelta = currentScrollY - lastScrollY.current;

      if (currentScrollY < 50) {
        setIsVisible(true);
        lastScrollY.current = currentScrollY;
        return;
      }

      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 50) {
        setIsVisible(true);
        lastScrollY.current = currentScrollY;
        return;
      }

      if (scrollDelta > 12 && isVisible) {
        setIsVisible(false);
      } else if (scrollDelta < -8 && !isVisible) {
        setIsVisible(true);
      }

      lastScrollY.current = currentScrollY;

      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
      scrollTimeout.current = setTimeout(() => {
        setIsVisible(true);
      }, 1500);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    };
  }, [isVisible]);

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 max-w-md mx-auto px-4 pb-4 pointer-events-none transition-all duration-300 ease-out ${
        isVisible
          ? 'translate-y-0 opacity-100'
          : 'translate-y-28 opacity-0'
      }`}
    >
      <div className="relative pointer-events-auto">
        {/* Curved Floating Bar with Center Indentation */}
        <nav className={`relative rounded-3xl px-3 py-2 flex items-center justify-between transition-all duration-300 ${
          isDark 
            ? 'neumorph-dark bg-[#0f1626]/95 border-white/10 text-slate-100 shadow-2xl shadow-black/80' 
            : 'neumorph-light bg-[#f1f4f9]/95 border-white/90 text-slate-700 shadow-2xl shadow-slate-300/60'
        }`}>
          
          {/* Tab 1: Check-in */}
          <Link
            href="/employee"
            className={`flex-1 flex flex-col items-center py-1.5 px-1 rounded-2xl transition-all duration-200 active:scale-90 ${
              active === 'checkin'
                ? isDark
                  ? 'text-white neumorph-dark-inset font-bold text-blue-400'
                  : 'text-blue-600 neumorph-light-inset font-bold'
                : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className={`w-5 h-5 ${active === 'checkin' ? 'text-blue-500' : ''}`} />
            <span className="text-[10px] mt-0.5 font-medium">ลงเวลา</span>
          </Link>

          {/* Tab 2: Calendar */}
          <Link
            href="/employee/stats"
            className={`flex-1 flex flex-col items-center py-1.5 px-1 rounded-2xl transition-all duration-200 active:scale-90 ${
              active === 'calendar'
                ? isDark
                  ? 'text-white neumorph-dark-inset font-bold text-blue-400'
                  : 'text-blue-600 neumorph-light-inset font-bold'
                : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar className={`w-5 h-5 ${active === 'calendar' ? 'text-blue-500' : ''}`} />
            <span className="text-[10px] mt-0.5 font-medium">ปฏิทิน</span>
          </Link>

          {/* Center Raised Profile Avatar Action Button */}
          <div className="relative -top-5 mx-1 flex flex-col items-center">
            <Link
              href="/employee"
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-transform active:scale-90 cursor-pointer ${
                isDark 
                  ? 'neumorph-btn-raised-dark text-blue-400 border-2 border-blue-500/40 shadow-xl shadow-blue-950/60' 
                  : 'neumorph-btn-raised-light text-blue-600 border-2 border-blue-400/40 shadow-lg shadow-blue-200/60'
              }`}
              title="โปรไฟล์พนักงาน / หน้าหลัก"
            >
              <div className={`w-11 h-11 rounded-full flex items-center justify-center font-black text-xs uppercase shadow-md ${
                isDark 
                  ? 'bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-blue-500/40 ring-2 ring-white/20' 
                  : 'bg-gradient-to-tr from-blue-500 via-indigo-500 to-sky-400 text-white shadow-blue-500/30 ring-2 ring-white/80'
              }`}>
                {employee?.nickname ? employee.nickname.slice(0, 2) : (employee?.full_name || employee?.fullName ? (employee.full_name || employee.fullName).slice(0, 2) : (employee?.employee_code || employee?.employeeCode ? (employee.employee_code || employee.employeeCode) : 'EM'))}
              </div>
            </Link>
            <span className={`text-[9px] font-bold font-mono px-1.5 py-0.2 rounded-full -mt-1.5 relative z-10 shadow-sm ${
              isDark ? 'bg-slate-900/95 text-blue-300 border border-blue-400/40' : 'bg-white/95 text-blue-600 border border-blue-300'
            }`}>
              {employee?.employee_code || employee?.employeeCode || 'ME'}
            </span>
          </div>

          {/* Tab 3: Leave */}
          <Link
            href="/employee/leave"
            className={`flex-1 flex flex-col items-center py-1.5 px-1 rounded-2xl transition-all duration-200 active:scale-90 ${
              active === 'leave'
                ? isDark
                  ? 'text-white neumorph-dark-inset font-bold text-blue-400'
                  : 'text-blue-600 neumorph-light-inset font-bold'
                : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className={`w-5 h-5 ${active === 'leave' ? 'text-blue-500' : ''}`} />
            <span className="text-[10px] mt-0.5 font-medium">ยื่นใบลา</span>
          </Link>

          {/* Tab 4: Advance */}
          <Link
            href="/employee/advance"
            className={`flex-1 flex flex-col items-center py-1.5 px-1 rounded-2xl transition-all duration-200 active:scale-90 ${
              active === 'advance'
                ? isDark
                  ? 'text-white neumorph-dark-inset font-bold text-blue-400'
                  : 'text-blue-600 neumorph-light-inset font-bold'
                : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Coins className={`w-5 h-5 ${active === 'advance' ? 'text-blue-500' : ''}`} />
            <span className="text-[10px] mt-0.5 font-medium">เบิกเงิน</span>
          </Link>

        </nav>
      </div>
    </div>
  );
}
