'use client';

import { useState, useEffect } from 'react';

export type AppTheme = 'dark' | 'light';

export function useAppTheme() {
  const [theme, setTheme] = useState<AppTheme>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('yokohama_app_theme') as AppTheme | null;
    if (saved === 'light' || saved === 'dark') {
      setTheme(saved);
      document.documentElement.classList.toggle('dark', saved === 'dark');
      document.documentElement.classList.toggle('light', saved === 'light');
    } else {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    }
    setMounted(true);

    const handleThemeChange = (e: CustomEvent<AppTheme>) => {
      setTheme(e.detail);
      document.documentElement.classList.toggle('dark', e.detail === 'dark');
      document.documentElement.classList.toggle('light', e.detail === 'light');
    };

    window.addEventListener('yokohama-theme-change' as any, handleThemeChange as any);
    return () => {
      window.removeEventListener('yokohama-theme-change' as any, handleThemeChange as any);
    };
  }, []);

  const toggleTheme = () => {
    const nextTheme: AppTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('yokohama_app_theme', nextTheme);
    document.documentElement.classList.toggle('dark', nextTheme === 'dark');
    document.documentElement.classList.toggle('light', nextTheme === 'light');
    window.dispatchEvent(new CustomEvent('yokohama-theme-change', { detail: nextTheme }));
  };

  return { theme, toggleTheme, isDark: theme === 'dark', mounted };
}
