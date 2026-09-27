'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Clock, Calendar, FileText, Coins } from 'lucide-react';

interface EmployeeBottomNavProps {
  currentTab?: 'checkin' | 'calendar' | 'leave' | 'advance';
}

export default function EmployeeBottomNav({ currentTab }: EmployeeBottomNavProps) {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

  // Determine active tab based on prop or current URL pathname
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

      // Always show when near top or bottom
      if (currentScrollY < 60) {
        setIsVisible(true);
        lastScrollY.current = currentScrollY;
        return;
      }

      // Check if user reached bottom of page
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 50) {
        setIsVisible(true);
        lastScrollY.current = currentScrollY;
        return;
      }

      // Hide when scrolling DOWN more than 12px
      if (scrollDelta > 12 && isVisible) {
        setIsVisible(false);
      }
      // Reveal when scrolling UP more than 8px
      else if (scrollDelta < -8 && !isVisible) {
        setIsVisible(true);
      }

      lastScrollY.current = currentScrollY;

      // Auto-show after user stops scrolling for 1.5 seconds
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

  const navItems = [
    {
      id: 'checkin',
      href: '/employee',
      label: 'เช็คเวลา',
      icon: Clock,
    },
    {
      id: 'calendar',
      href: '/employee/stats',
      label: 'ปฏิทิน',
      icon: Calendar,
    },
    {
      id: 'leave',
      href: '/employee/leave',
      label: 'ยื่นใบลา',
      icon: FileText,
    },
    {
      id: 'advance',
      href: '/employee/advance',
      label: 'ขอเบิกเงิน',
      icon: Coins,
    },
  ];

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 max-w-md mx-auto px-4 pb-4 pointer-events-none transition-all duration-300 ease-out ${
        isVisible
          ? 'translate-y-0 opacity-100'
          : 'translate-y-24 opacity-0'
      }`}
    >
      <nav className="pointer-events-auto bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-3xl px-3 py-2 flex items-center justify-around shadow-xl shadow-slate-900/10">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex-1 flex flex-col items-center py-1.5 px-2 rounded-2xl transition-all duration-200 active:scale-95 ${
                isActive
                  ? 'text-blue-600 font-black'
                  : 'text-slate-400 hover:text-slate-600 font-medium'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 scale-105'
                    : 'bg-transparent text-slate-400'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-[10px] mt-1 tracking-tight leading-none">
                {item.label}
              </span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1 animate-pulse" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
