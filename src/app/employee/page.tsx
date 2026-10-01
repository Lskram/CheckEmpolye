'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { 
  Shield, 
  Bell, 
  Calendar, 
  CreditCard, 
  Clock, 
  Menu, 
  CheckCircle2, 
  AlertCircle, 
  Sliders, 
  RefreshCw, 
  FileText, 
  MapPin, 
  ChevronRight, 
  LogOut,
  Navigation2,
  Radio,
  Crosshair,
  Lock,
  Tag,
  Timer,
  AlertTriangle,
  X,
  Sparkles,
  Coins,
  Sun,
  Moon,
  Zap,
  TrendingUp,
  Folder,
  Layers,
  ArrowUpRight,
  WifiOff,
  CloudSync,
  UploadCloud
} from 'lucide-react';
import { calculateHaversineDistance } from '@/lib/geofence';
import { getDeviceHWID } from '@/lib/hwid';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { getLiveHardwarePosition, watchLivePosition, LiveLocationResult } from '@/lib/location';
import { MobileNotificationService } from '@/lib/mobile-notifications';
import { playWebAlertSound } from '@/lib/web-notifications';
import { useAppTheme } from '@/lib/theme';
import { 
  saveOfflineAction, 
  syncPendingActions, 
  initOfflineSyncListeners, 
  getPendingOfflineActions 
} from '@/lib/offline-sync';
import EmployeeBottomNav from '@/components/EmployeeBottomNav';

export default function ExactEmployeeApp() {
  const router = useRouter();
  const { isDark, toggleTheme } = useAppTheme();

  // Employee Profile & HWID
  const [employee, setEmployee] = useState<any>(null);
  const [hwid, setHwid] = useState('');
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // Live Real-Time Clock
  const [time, setTime] = useState({
    hhmm: '07:40',
    ss: '00',
    dateThai: 'วันจันทร์, 1 มกราคม 2024',
    rawTimeStr: '07:40:00',
  });

  // Store Settings & Geofence (Live Synced from Supabase DB)
  const [storeSettings, setStoreSettings] = useState<any>({
    store_name: 'สีแสงยางยนต์ (YOKOHAMA NAYA COSMIS)',
    store_lat: 15.110412,
    store_lng: 104.358434,
    radius_meters: 50,
    standard_time: '07:40',
    late_deadline: '08:00',
    allowance_amount: 50,
  });
  const storeSettingsRef = useRef(storeSettings);
  storeSettingsRef.current = storeSettings;

  // Real Hardware Satellite GPS Coordinates & Accuracy
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(null);
  const currentCoordsRef = useRef(currentCoords);
  currentCoordsRef.current = currentCoords;

  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsProvider, setGpsProvider] = useState<'capacitor' | 'browser' | 'fallback'>('capacitor');

  // Check-in & Check-out State & Results
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkInResult, setCheckInResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeHistoryTab, setActiveHistoryTab] = useState<'in' | 'out' | 'leave'>('in');

  // Offline Sync State
  const [pendingOfflineCount, setPendingOfflineCount] = useState(0);
  const [isSyncingOffline, setIsSyncingOffline] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // In-App Floating Notification Banner State
  const [mobileToast, setMobileToast] = useState<{
    type: 'checkin' | 'checkout';
    title: string;
    message: string;
    isLate?: boolean;
    timeStr: string;
  } | null>(null);

  useEffect(() => {
    if (mobileToast) {
      const timer = setTimeout(() => {
        setMobileToast(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [mobileToast]);

  // Request Notification Permissions on Mount & Init Offline Engine
  useEffect(() => {
    MobileNotificationService.requestPermission();
    const cleanupOffline = initOfflineSyncListeners();

    // Check initial online status
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      getPendingOfflineActions().then(p => setPendingOfflineCount(p.length));

      const handleOnlineStatus = () => setIsOnline(navigator.onLine);
      const handleOfflineStatus = () => setIsOnline(false);
      const handleQueueChanged = (e: any) => {
        setPendingOfflineCount(e.detail?.pendingCount || 0);
      };

      window.addEventListener('online', handleOnlineStatus);
      window.addEventListener('offline', handleOfflineStatus);
      window.addEventListener('yokohama-offline-queue-changed' as any, handleQueueChanged);

      return () => {
        cleanupOffline();
        window.removeEventListener('online', handleOnlineStatus);
        window.removeEventListener('offline', handleOfflineStatus);
        window.removeEventListener('yokohama-offline-queue-changed' as any, handleQueueChanged);
      };
    }
  }, []);

  // Safeguard: Check-out Confirmation Modal
  const [showCheckOutConfirmModal, setShowCheckOutConfirmModal] = useState(false);

  // Live Working Stopwatch Counter (ชั่วโมง:นาที:วินาที สดๆ)
  const [liveWorkDuration, setLiveWorkDuration] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
    totalSeconds: 0,
    text: '00:00:00',
  });

  // Recalculate Distance Helper
  const recalculateDistance = useCallback((coords?: { lat: number; lng: number } | null, settings?: any) => {
    const effectiveCoords = coords || currentCoordsRef.current;
    const effectiveSettings = settings || storeSettingsRef.current;

    if (!effectiveCoords?.lat || !effectiveCoords?.lng || !effectiveSettings?.store_lat || !effectiveSettings?.store_lng) {
      return;
    }

    const storeLat = Number(effectiveSettings.store_lat);
    const storeLng = Number(effectiveSettings.store_lng);
    if (isNaN(storeLat) || isNaN(storeLng)) return;

    const dist = calculateHaversineDistance(
      { latitude: effectiveCoords.lat, longitude: effectiveCoords.lng },
      { latitude: storeLat, longitude: storeLng }
    );
    setDistance(dist);
  }, []);

  // 1. Authenticate Employee Profile & Fetch Today's Live Database Attendance State
  useEffect(() => {
    const saved = localStorage.getItem('attendance_employee_profile');
    if (!saved) {
      router.push('/employee/login');
      return;
    }
    try {
      const parsed = JSON.parse(saved);
      setEmployee(parsed);
      setIsAuthChecking(false);

      // Load today's check-in / check-out status from Supabase DB
      fetch(`/api/check-in?employeeId=${parsed.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.hasCheckedIn && data.data) {
            setCheckInResult(data.data);
          }
        })
        .catch(err => {
          console.warn('Could not fetch existing check-in from DB:', err);
        });

    } catch (e) {
      router.push('/employee/login');
    }
  }, [router]);

  // 2. HWID Device ID Acquisition
  useEffect(() => {
    const currentHWID = getDeviceHWID();
    setHwid(currentHWID);
  }, []);

  // 3. Real-Time Bangkok Clock Tick
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const thaiDays = ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'];
      const thaiMonths = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
      ];

      const dayName = thaiDays[now.getDay()];
      const dayNum = now.getDate();
      const monthName = thaiMonths[now.getMonth()];
      const yearBuddhist = now.getFullYear() + 543;

      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const ss = String(now.getSeconds()).padStart(2, '0');

      setTime({
        hhmm: `${hh}:${mm}`,
        ss,
        dateThai: `${dayName}ที่ ${dayNum} ${monthName} ${yearBuddhist}`,
        rawTimeStr: `${hh}:${mm}:${ss}`,
      });
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // 4. Load Store Settings & Subscribe to Realtime Updates
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/admin/settings');
        const data = await res.json();
        if (data.success && data.data) {
          setStoreSettings(data.data);
          recalculateDistance(currentCoordsRef.current, data.data);
        }
      } catch (e) {
        console.error('Failed to fetch store settings:', e);
      }
    };
    fetchSettings();

    if (isSupabaseConfigured && supabase) {
      const channel = supabase
        .channel('store_settings_changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'store_settings' },
          (payload: any) => {
            if (payload.new) {
              setStoreSettings(payload.new);
              recalculateDistance(currentCoordsRef.current, payload.new);
            }
          }
        )
        .subscribe();

      return () => {
        if (supabase) supabase.removeChannel(channel);
      };
    }
  }, [recalculateDistance]);

  // 5. Hardware GPS Watcher
  useEffect(() => {
    let unwatchFn: (() => void) | null = null;

    const startHardwareGps = async () => {
      setGpsLoading(true);
      try {
        const initialPos = await getLiveHardwarePosition({
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 0,
        });

        setCurrentCoords({ lat: initialPos.latitude, lng: initialPos.longitude });
        setGpsAccuracy(initialPos.accuracy);
        setGpsProvider(initialPos.provider);
        setGpsError(null);
        recalculateDistance({ lat: initialPos.latitude, lng: initialPos.longitude }, storeSettingsRef.current);
      } catch (err: any) {
        setGpsError(err.message || 'ไม่สามารถระบุพิกัดดาวเทียมได้');
      } finally {
        setGpsLoading(false);
      }

      unwatchFn = watchLivePosition(
        (pos: LiveLocationResult) => {
          setCurrentCoords({ lat: pos.latitude, lng: pos.longitude });
          setGpsAccuracy(pos.accuracy);
          setGpsProvider(pos.provider);
          setGpsError(null);
          recalculateDistance({ lat: pos.latitude, lng: pos.longitude }, storeSettingsRef.current);
        },
        (err: any) => {
          console.warn('GPS Watch error:', err);
        }
      );
    };

    startHardwareGps();

    return () => {
      if (unwatchFn) unwatchFn();
    };
  }, [recalculateDistance]);

  // 6. Live Working Stopwatch Ticker
  useEffect(() => {
    if (!checkInResult?.rawCheckInTime || checkInResult?.checkOutTime) {
      return;
    }

    const interval = setInterval(() => {
      const start = new Date(checkInResult.rawCheckInTime).getTime();
      const now = Date.now();
      const diffSec = Math.max(0, Math.floor((now - start) / 1000));

      const hours = Math.floor(diffSec / 3600);
      const minutes = Math.floor((diffSec % 3600) / 60);
      const seconds = diffSec % 60;

      setLiveWorkDuration({
        hours,
        minutes,
        seconds,
        totalSeconds: diffSec,
        text: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [checkInResult]);

  // Manual GPS Refresh
  const handleManualRefresh = async () => {
    setGpsLoading(true);
    try {
      const pos = await getLiveHardwarePosition({
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      });
      setCurrentCoords({ lat: pos.latitude, lng: pos.longitude });
      setGpsAccuracy(pos.accuracy);
      setGpsProvider(pos.provider);
      setGpsError(null);
      recalculateDistance({ lat: pos.latitude, lng: pos.longitude }, storeSettings);
    } catch (e: any) {
      setGpsError('เกิดข้อผิดพลาดในการดึงพิกัด');
    } finally {
      setGpsLoading(false);
    }
  };

  // Manual Sync Offline Queue Trigger
  const handleTriggerManualSync = async () => {
    setIsSyncingOffline(true);
    try {
      const res = await syncPendingActions();
      if (res.syncedCount > 0) {
        playWebAlertSound('checkin');
        setMobileToast({
          type: 'checkin',
          title: '⚡ ซิงค์ข้อมูลออฟไลน์สำเร็จ!',
          message: `ซิงค์รายการลงเวลาที่ค้างไว้ ${res.syncedCount} รายการ เข้าสู่ฐานข้อมูลเรียบร้อย`,
          timeStr: time.hhmm,
        });
      }
    } finally {
      setIsSyncingOffline(false);
    }
  };

  // CHECK-IN HANDLER (With Offline IndexedDB Resilience)
  const handleCheckIn = async () => {
    if (!employee?.id && !employee?.employeeCode && !employee?.employee_code) return;
    setErrorMessage('');
    setIsCheckingIn(true);

    try {
      let freshLat = currentCoords?.lat;
      let freshLng = currentCoords?.lng;
      let freshAcc = gpsAccuracy || 5;

      try {
        const livePos = await getLiveHardwarePosition({ enableHighAccuracy: true, timeout: 6000, maximumAge: 0 });
        freshLat = livePos.latitude;
        freshLng = livePos.longitude;
        freshAcc = livePos.accuracy;
        setCurrentCoords({ lat: livePos.latitude, lng: livePos.longitude });
        setGpsAccuracy(livePos.accuracy);
        recalculateDistance({ lat: livePos.latitude, lng: livePos.longitude }, storeSettings);
      } catch (e) {
        console.warn('Using cached coordinates:', e);
      }

      if (freshLat === undefined || freshLng === undefined) {
        setErrorMessage('ไม่สามารถระบุตำแหน่ง GPS ได้ กรุณาเปิดระบบระบุตำแหน่ง');
        setIsCheckingIn(false);
        return;
      }

      const empId = employee.id || employee.employeeId;
      const payload = {
        employeeId: empId,
        latitude: freshLat,
        longitude: freshLng,
        accuracy: freshAcc,
        hwid,
      };

      // If offline, save directly to IndexedDB
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        await saveOfflineAction('CHECK_IN', payload);
        const offlineData = {
          id: `OFFLINE-${Date.now()}`,
          logReference: '#OFFLINE-PENDING',
          status: 'PRESENT',
          rawCheckInTime: new Date().toISOString(),
          rawCheckOutTime: null,
          checkInTime: time.hhmm + ' น. (ออฟไลน์)',
          allowance: 50,
          distance: distance || 0,
          isLate: false,
          employeeName: employee.fullName || employee.full_name,
        };
        setCheckInResult(offlineData);
        playWebAlertSound('checkin');
        setMobileToast({
          type: 'checkin',
          title: '📡 บันทึกเวลาเข้างานแบบออฟไลน์แล้ว',
          message: 'เน็ตของคุณหลุดชั่วขณะ ระบบบันทึกลงเครื่องและจะซิงค์ขึ้นฐานข้อมูลทันทีเมื่อต่อเน็ต',
          timeStr: time.hhmm,
        });
        setIsCheckingIn(false);
        return;
      }

      try {
        const res = await fetch('/api/check-in', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          setErrorMessage(data.message || 'การลงเวลาถูกปฏิเสธ');
          setIsCheckingIn(false);
          return;
        }

        setCheckInResult(data.data);
        playWebAlertSound('checkin');

        setMobileToast({
          type: 'checkin',
          title: data.data.status === 'PRESENT' ? '✅ ลงชื่อเข้างานสำเร็จ (ตรงเวลา)' : '⚠️ บันทึกเวลาเข้างานแล้ว (มาสาย)',
          message: `บันทึกเวลา ${data.data.checkInTime || time.hhmm} น. ${data.data.status === 'PRESENT' ? '(+50฿ เบี้ยขยัน)' : ''}`,
          isLate: data.data.status !== 'PRESENT',
          timeStr: data.data.checkInTime || time.hhmm,
        });

        MobileNotificationService.showCheckInSuccess(
          data.data.checkInTime || time.hhmm,
          data.data.status !== 'PRESENT',
          data.data.allowance || 0
        );

        if (data.data.status === 'PRESENT') {
          confetti({
            particleCount: 90,
            spread: 75,
            origin: { y: 0.5 },
            colors: ['#38bdf8', '#2563eb', '#10b981', '#fbbf24', '#ffffff'],
          });
        }
      } catch (networkErr: any) {
        // Network threw error -> Fallback to IndexedDB queue
        await saveOfflineAction('CHECK_IN', payload);
        const offlineData = {
          id: `OFFLINE-${Date.now()}`,
          logReference: '#OFFLINE-PENDING',
          status: 'PRESENT',
          rawCheckInTime: new Date().toISOString(),
          rawCheckOutTime: null,
          checkInTime: time.hhmm + ' น. (ออฟไลน์)',
          allowance: 50,
          distance: distance || 0,
          isLate: false,
          employeeName: employee.fullName || employee.full_name,
        };
        setCheckInResult(offlineData);
        playWebAlertSound('checkin');
        setMobileToast({
          type: 'checkin',
          title: '📡 บันทึกเวลาเข้างานแบบออฟไลน์แล้ว',
          message: 'การเชื่อมต่อขัดข้อง ระบบบันทึกลงเครื่องและจะซิงค์ทันทีเมื่อมีเน็ต',
          timeStr: time.hhmm,
        });
      }
    } catch (err: any) {
      setErrorMessage('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setIsCheckingIn(false);
    }
  };

  // CHECK-OUT PROMPT
  const promptCheckOut = () => {
    if (!employee?.id && !employee?.employeeCode && !employee?.employee_code) return;
    setErrorMessage('');

    const radius = Number(storeSettings?.radius_meters) || 50;
    if (distance !== null && distance > radius) {
      setErrorMessage(`🚫 อยู่นอกพื้นที่ร้าน (${distance.toFixed(1)} ม.) ไม่อนุญาตให้ลงเวลาออกงาน`);
      return;
    }

    setShowCheckOutConfirmModal(true);
  };

  // CHECK-OUT EXECUTE (With Offline IndexedDB Resilience)
  const executeCheckOut = async () => {
    setShowCheckOutConfirmModal(false);
    setIsCheckingOut(true);

    try {
      let freshLat = currentCoords?.lat;
      let freshLng = currentCoords?.lng;
      let freshAcc = gpsAccuracy || 5;

      try {
        const livePos = await getLiveHardwarePosition({ enableHighAccuracy: true, timeout: 6000, maximumAge: 0 });
        freshLat = livePos.latitude;
        freshLng = livePos.longitude;
        freshAcc = livePos.accuracy;
        setCurrentCoords({ lat: livePos.latitude, lng: livePos.longitude });
        setGpsAccuracy(livePos.accuracy);
        recalculateDistance({ lat: livePos.latitude, lng: livePos.longitude }, storeSettings);
      } catch (e) {
        console.warn('Using cached coordinates:', e);
      }

      if (freshLat === undefined || freshLng === undefined) {
        setErrorMessage('ไม่สามารถระบุพิกัดดาวเทียมได้');
        setIsCheckingOut(false);
        return;
      }

      const empId = employee.id || employee.employeeId;
      const payload = {
        employeeId: empId,
        latitude: freshLat,
        longitude: freshLng,
        accuracy: freshAcc,
        hwid,
      };

      // If offline
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        await saveOfflineAction('CHECK_OUT', payload);
        setCheckInResult((prev: any) => ({
          ...prev,
          checkOutTime: time.hhmm + ' น. (ออฟไลน์)',
          workingDuration: liveWorkDuration.text,
          rawCheckOutTime: new Date().toISOString(),
        }));
        playWebAlertSound('checkout');
        setMobileToast({
          type: 'checkout',
          title: '📡 บันทึกเวลาออกงานแบบออฟไลน์แล้ว!',
          message: 'บันทึกเวลาออกงานลงในเครื่องเรียบร้อย และจะส่งขึ้นฐานข้อมูลอัตโนมัติเมื่อต่อเน็ต',
          timeStr: time.hhmm,
        });
        setIsCheckingOut(false);
        return;
      }

      try {
        const res = await fetch('/api/check-out', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          setErrorMessage(data.message || 'การลงเวลาออกงานถูกปฏิเสธ');
          setIsCheckingOut(false);
          return;
        }

        setCheckInResult((prev: any) => ({
          ...prev,
          checkOutTime: data.data.checkOutTime,
          workingDuration: data.data.workingDuration,
          rawCheckOutTime: data.data.rawCheckOutTime,
        }));

        playWebAlertSound('checkout');
        setMobileToast({
          type: 'checkout',
          title: '🏁 ลงชื่อออกงานสำเร็จแล้ว!',
          message: `บันทึกเวลาออกงาน ${data.data.checkOutTime || time.hhmm} น.`,
          timeStr: data.data.checkOutTime || time.hhmm,
        });

        MobileNotificationService.showCheckOutSuccess(
          data.data.checkOutTime || time.hhmm,
          data.data.workHours
        );

        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.5 },
          colors: ['#a855f7', '#3b82f6', '#10b981', '#fbbf24'],
        });
      } catch (networkErr: any) {
        await saveOfflineAction('CHECK_OUT', payload);
        setCheckInResult((prev: any) => ({
          ...prev,
          checkOutTime: time.hhmm + ' น. (ออฟไลน์)',
          workingDuration: liveWorkDuration.text,
          rawCheckOutTime: new Date().toISOString(),
        }));
        playWebAlertSound('checkout');
        setMobileToast({
          type: 'checkout',
          title: '📡 บันทึกเวลาออกงานแบบออฟไลน์แล้ว!',
          message: 'การเชื่อมต่อขัดข้อง บันทึกลงเครื่องและจะซิงค์อัตโนมัติเมื่อต่อเน็ต',
          timeStr: time.hhmm,
        });
      }
    } catch (err: any) {
      setErrorMessage('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('attendance_employee_profile');
    router.push('/employee/login');
  };

  const allowedRadius = Number(storeSettings?.radius_meters) || 50;
  const isInsideRadius = distance !== null && distance <= allowedRadius;

  if (isAuthChecking) {
    return (
      <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen w-full flex flex-col justify-between select-none font-sans transition-colors duration-300 pb-28 relative overflow-x-hidden ${
      isDark ? 'bg-[#090d16] text-slate-100' : 'bg-[#eef2f7] text-slate-800'
    }`}>
      
      {/* Ambient Glows */}
      {isDark ? (
        <>
          <div className="absolute top-[-50px] left-[-50px] w-72 h-72 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-[30%] right-[-50px] w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-[-50px] left-[20%] w-72 h-72 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        </>
      ) : (
        <>
          <div className="absolute top-[-50px] left-[-50px] w-72 h-72 bg-blue-300/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-[30%] right-[-50px] w-72 h-72 bg-emerald-300/20 rounded-full blur-3xl pointer-events-none" />
        </>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 0. OFFLINE QUEUE STATUS FLOATING BADGE                        */}
      {/* ------------------------------------------------------------- */}
      {(!isOnline || pendingOfflineCount > 0) && (
        <div className="fixed top-2 left-4 right-4 z-50 max-w-md mx-auto">
          <div className="p-2.5 rounded-2xl bg-amber-500/90 text-slate-950 shadow-xl backdrop-blur-xl border border-amber-300/40 flex items-center justify-between text-xs font-bold">
            <div className="flex items-center gap-2">
              <WifiOff className="w-4 h-4 animate-bounce" />
              <span>
                {!isOnline ? '📴 โหมดออฟไลน์ (เน็ตหลุด)' : '📡 กำลังรอส่งข้อมูลเข้าเซิร์ฟเวอร์'}
                {pendingOfflineCount > 0 && ` (${pendingOfflineCount} รายการ)`}
              </span>
            </div>
            {isOnline && (
              <button
                onClick={handleTriggerManualSync}
                disabled={isSyncingOffline}
                className="px-2.5 py-1 rounded-xl bg-slate-950 text-amber-300 font-bold text-[10px] flex items-center gap-1 active:scale-95 transition-transform"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncingOffline ? 'animate-spin' : ''}`} />
                <span>{isSyncingOffline ? 'กำลังซิงค์...' : 'ซิงค์ทันที'}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* IN-APP FLOATING NOTIFICATION BANNER                           */}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        {mobileToast && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.95 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="fixed top-3 left-3 right-3 z-50 max-w-md mx-auto"
          >
            <div
              className={`p-4 rounded-3xl shadow-2xl backdrop-blur-2xl border flex items-start gap-3.5 text-white ${
                mobileToast.type === 'checkin'
                  ? mobileToast.isLate
                    ? 'bg-amber-600/90 border-amber-400/40 shadow-amber-950/60'
                    : 'bg-emerald-600/90 border-emerald-400/40 shadow-emerald-950/60'
                  : 'bg-gradient-to-r from-blue-600/90 to-indigo-700/90 border-blue-400/40 shadow-blue-950/60'
              }`}
            >
              <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 shadow-inner">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="font-black text-xs tracking-tight text-white leading-tight">
                    {mobileToast.title}
                  </h4>
                  <span className="font-mono text-[10px] bg-black/30 px-2 py-0.5 rounded-full text-white/90 shrink-0">
                    {mobileToast.timeStr} น.
                  </span>
                </div>
                <p className="text-[11px] text-white/90 mt-1 leading-snug font-medium">
                  {mobileToast.message}
                </p>
              </div>

              <button
                onClick={() => setMobileToast(null)}
                className="p-1 rounded-xl hover:bg-white/20 text-white/70 hover:text-white transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------- */}
      {/* 1. TOP DOME PROFILE & WAVE HEADER                             */}
      {/* ------------------------------------------------------------- */}
      <div className={`w-full relative z-10 pt-4 pb-2 transition-colors duration-300 ${
        isDark ? 'bg-gradient-to-b from-[#131b2e] to-[#0c121e] text-white border-b border-white/5' : 'bg-gradient-to-b from-[#18223c] to-[#0f172a] text-white shadow-md'
      }`}>
        <div className="max-w-md mx-auto px-4">
          
          {/* Top Row with Profile Dome Center */}
          <div className="flex items-center justify-between relative">
            
            {/* Left: Store Brand Pill */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 shadow-sm">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-blue-300 tracking-wider">YOKOHAMA NAYA</div>
                <div className="text-xs font-black text-white leading-none">สีแสงยางยนต์</div>
              </div>
            </div>

            {/* Center Dome Profile Avatar Notch */}
            <div className="relative -top-2 flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 p-0.5 shadow-xl shadow-blue-500/30 flex items-center justify-center">
                <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center font-black text-xs text-white uppercase">
                  {employee?.nickname ? employee.nickname.slice(0, 2) : (employee?.full_name ? employee.full_name.slice(0, 2) : 'EM')}
                </div>
              </div>
            </div>

            {/* Right: Theme Toggle & Logout */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-yellow-300 transition-transform active:scale-90 border border-white/10"
                title="สลับโหมด Dark / Light"
              >
                {isDark ? <Sun className="w-4 h-4 text-yellow-300" /> : <Moon className="w-4 h-4 text-sky-200" />}
              </button>
              <button
                onClick={handleLogout}
                className="p-2 rounded-xl bg-white/10 hover:bg-rose-500/30 text-slate-300 hover:text-rose-300 transition-transform active:scale-90 border border-white/10"
                title="ออกจากระบบ"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* User Name & Code Subtitle */}
          <div className="text-center mt-1">
            <span className="text-xs font-extrabold text-white tracking-wide">
              {employee?.full_name || employee?.fullName || 'พนักงานปฏิบัติการ'}
            </span>
            <span className="ml-1.5 font-mono text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
              {employee?.employee_code || employee?.employeeCode || 'EMP001'}
            </span>
          </div>

          {/* ========================================================= */}
          {/* "MyShift" Telemetry Card (Dynamic Geofence from DB)       */}
          {/* ========================================================= */}
          <div className="mt-3.5 p-4 rounded-3xl bg-slate-900/90 border border-white/10 shadow-2xl backdrop-blur-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-xs text-white">บันทึกกะปฏิบัติงาน (MyShift)</h3>
                  <p className="text-[10px] text-slate-400">{time.dateThai}</p>
                </div>
              </div>
              <div className="text-right font-mono">
                <div className="text-xl font-black text-white tracking-tight">{time.hhmm}<span className="text-xs text-blue-400">:{time.ss}</span></div>
              </div>
            </div>

            {/* Shift Progress Bar */}
            <div className="space-y-1 mt-2">
              <div className="flex justify-between text-[10px] text-slate-300">
                <span className="flex items-center gap-1">
                  <span>สถานะ:</span>
                  <strong className={isInsideRadius ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                    {isInsideRadius ? `📍 ในพื้นที่ร้าน (${distance?.toFixed(0)} ม. / รัศมี ${allowedRadius}ม.)` : `🚫 อยู่นอกพื้นที่ (${distance?.toFixed(0)} ม. / กำหนด ${allowedRadius}ม.)`}
                  </strong>
                </span>
                <span className="font-mono text-blue-400 font-bold">
                  {checkInResult?.checkOutTime ? 'เสร็จสิ้น 100%' : checkInResult ? `${Math.min(100, Math.round((liveWorkDuration.totalSeconds / 28800) * 100))}%` : 'ยังไม่เข้างาน'}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-white/5">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 transition-all duration-500"
                  style={{ width: checkInResult?.checkOutTime ? '100%' : checkInResult ? `${Math.min(100, Math.max(8, (liveWorkDuration.totalSeconds / 28800) * 100))}%` : '5%' }}
                />
              </div>
            </div>
          </div>

        </div>

        {/* Smooth S-Curve Wave SVG Cutout */}
        <div className="w-full overflow-hidden leading-none mt-2">
          <svg viewBox="0 0 500 40" preserveAspectRatio="none" className="w-full h-7 text-[#090d16] dark:text-[#090d16]" style={{ color: isDark ? '#090d16' : '#eef2f7' }}>
            <path d="M0,0 C150,40 350,0 500,40 L500,40 L0,40 Z" fill="currentColor" />
          </svg>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. LOWER SECTION: TACTILE NEUMORPHIC QUICK ACTION TILES       */}
      {/* ------------------------------------------------------------- */}
      <div className="max-w-md w-full mx-auto px-4 py-2 space-y-4 flex-1 relative z-10">
        
        {/* 6 Neumorphic 3D Tiles Grid */}
        <div className="grid grid-cols-3 gap-2.5">
          
          {/* Tile 1: Check-in / Main Action */}
          <button
            onClick={!checkInResult ? handleCheckIn : !checkInResult.checkOutTime ? promptCheckOut : undefined}
            disabled={isCheckingIn || isCheckingOut || (!!checkInResult && !!checkInResult.checkOutTime)}
            className={`p-3 rounded-2xl flex flex-col items-center justify-between text-center transition-all cursor-pointer ${
              isDark ? 'neumorph-tile-dark' : 'neumorph-tile-light'
            }`}
          >
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-md mb-1 ${
              !checkInResult
                ? 'bg-gradient-to-tr from-blue-600 to-cyan-500 text-white shadow-blue-500/30'
                : !checkInResult.checkOutTime
                  ? 'bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-amber-500/30'
                  : 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-emerald-500/30'
            }`}>
              {isCheckingIn || isCheckingOut ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : !checkInResult ? (
                <Zap className="w-5 h-5" />
              ) : !checkInResult.checkOutTime ? (
                <LogOut className="w-5 h-5" />
              ) : (
                <CheckCircle2 className="w-5 h-5" />
              )}
            </div>
            <div className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
              {!checkInResult ? 'เข้างาน' : !checkInResult.checkOutTime ? 'ออกงาน' : 'เสร็จสิ้น'}
            </div>
            <div className="text-[9px] text-slate-400 mt-0.5 font-mono">
              {checkInResult?.checkInTime ? checkInResult.checkInTime.slice(0, 5) : '08:00'}
            </div>
          </button>

          {/* Tile 2: Salary Advance */}
          <Link
            href="/employee/advance"
            className={`p-3 rounded-2xl flex flex-col items-center justify-between text-center transition-all ${
              isDark ? 'neumorph-tile-dark' : 'neumorph-tile-light'
            }`}
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-500 text-white flex items-center justify-center shadow-md shadow-amber-500/30 mb-1">
              <Coins className="w-5 h-5" />
            </div>
            <div className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
              เบิกเงิน
            </div>
            <div className="text-[9px] text-amber-500 font-bold mt-0.5">
              โควตา 50%
            </div>
          </Link>

          {/* Tile 3: Leave Request */}
          <Link
            href="/employee/leave"
            className={`p-3 rounded-2xl flex flex-col items-center justify-between text-center transition-all ${
              isDark ? 'neumorph-tile-dark' : 'neumorph-tile-light'
            }`}
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-purple-500/30 mb-1">
              <FileText className="w-5 h-5" />
            </div>
            <div className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
              ยื่นใบลา
            </div>
            <div className="text-[9px] text-purple-400 font-bold mt-0.5">
              ป่วย/กิจ/พักผ่อน
            </div>
          </Link>

          {/* Tile 4: Calendar / Stats */}
          <Link
            href="/employee/stats"
            className={`p-3 rounded-2xl flex flex-col items-center justify-between text-center transition-all ${
              isDark ? 'neumorph-tile-dark' : 'neumorph-tile-light'
            }`}
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/30 mb-1">
              <Calendar className="w-5 h-5" />
            </div>
            <div className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
              ปฏิทิน
            </div>
            <div className="text-[9px] text-emerald-400 font-bold mt-0.5">
              +50฿ สะสม
            </div>
          </Link>

          {/* Tile 5: Store Geofence & Settings */}
          <button
            onClick={handleManualRefresh}
            className={`p-3 rounded-2xl flex flex-col items-center justify-between text-center transition-all ${
              isDark ? 'neumorph-tile-dark' : 'neumorph-tile-light'
            }`}
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white flex items-center justify-center shadow-md shadow-sky-500/30 mb-1">
              <MapPin className="w-5 h-5" />
            </div>
            <div className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
              พิกัดร้าน
            </div>
            <div className="text-[9px] text-blue-400 font-bold mt-0.5">
              {distance !== null ? `${distance.toFixed(0)}ม.` : 'ค้นหา'}
            </div>
          </button>

          {/* Tile 6: Allowance Info */}
          <div
            className={`p-3 rounded-2xl flex flex-col items-center justify-between text-center ${
              isDark ? 'neumorph-tile-dark' : 'neumorph-tile-light'
            }`}
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-600 text-white flex items-center justify-center shadow-md shadow-rose-500/30 mb-1">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
              เบี้ยขยัน
            </div>
            <div className="text-[9px] text-rose-400 font-bold mt-0.5">
              {storeSettings?.allowance_amount || 50}฿ / วัน
            </div>
          </div>

        </div>

        {/* ----------------------------------------------------------- */}
        {/* CAPSULE DATE PIANO KEYS                                     */}
        {/* ----------------------------------------------------------- */}
        <div className={`p-3.5 rounded-3xl ${isDark ? 'neumorph-dark' : 'neumorph-light'} space-y-2`}>
          <div className="flex items-center justify-between text-xs font-bold">
            <span className={isDark ? 'text-slate-200' : 'text-slate-700'}>ประวัติเวลาสัปดาห์นี้</span>
            <span className="text-[10px] text-blue-500">ตรงเวลา = +{storeSettings?.allowance_amount || 50}฿</span>
          </div>

          <div className="grid grid-cols-5 gap-1.5 text-center">
            {/* Capsule 1 */}
            <div className={`p-2 rounded-2xl flex flex-col items-center justify-between h-20 ${
              isDark ? 'capsule-pill-dark border border-white/5' : 'capsule-pill-light border border-white/70'
            }`}>
              <span className="text-[10px] font-bold text-slate-400">จ.</span>
              <span className="text-xs font-black text-emerald-400">28</span>
              <span className="text-[8px] font-mono font-bold px-1 rounded bg-emerald-500/20 text-emerald-300">+50฿</span>
            </div>
            {/* Capsule 2 */}
            <div className={`p-2 rounded-2xl flex flex-col items-center justify-between h-20 ${
              isDark ? 'capsule-pill-dark border border-white/5' : 'capsule-pill-light border border-white/70'
            }`}>
              <span className="text-[10px] font-bold text-slate-400">อ.</span>
              <span className="text-xs font-black text-emerald-400">29</span>
              <span className="text-[8px] font-mono font-bold px-1 rounded bg-emerald-500/20 text-emerald-300">+50฿</span>
            </div>
            {/* Capsule 3 */}
            <div className={`p-2 rounded-2xl flex flex-col items-center justify-between h-20 ${
              isDark ? 'capsule-pill-dark border border-white/5' : 'capsule-pill-light border border-white/70'
            }`}>
              <span className="text-[10px] font-bold text-slate-400">พ.</span>
              <span className="text-xs font-black text-amber-400">30</span>
              <span className="text-[8px] font-mono font-bold px-1 rounded bg-amber-500/20 text-amber-300">สาย</span>
            </div>
            {/* Capsule 4: Today Active */}
            <div className={`p-2 rounded-2xl flex flex-col items-center justify-between h-20 bg-gradient-to-b from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-500/30 border border-blue-400/40`}>
              <span className="text-[10px] font-bold text-blue-200">พฤ.</span>
              <span className="text-xs font-black text-white">01</span>
              <span className="text-[8px] font-mono font-bold px-1 rounded bg-white/20 text-white">วันนี้</span>
            </div>
            {/* Capsule 5 */}
            <div className={`p-2 rounded-2xl flex flex-col items-center justify-between h-20 opacity-40 ${
              isDark ? 'capsule-pill-dark border border-white/5' : 'capsule-pill-light border border-white/70'
            }`}>
              <span className="text-[10px] font-bold text-slate-400">ศ.</span>
              <span className="text-xs font-black">02</span>
              <span className="text-[8px] text-slate-400">--</span>
            </div>
          </div>
        </div>

        {/* ----------------------------------------------------------- */}
        {/* LIVE WORKING STOPWATCH WIDGET                               */}
        {/* ----------------------------------------------------------- */}
        {checkInResult && !checkInResult.checkOutTime && (
          <div className={`p-4 rounded-3xl ${isDark ? 'neumorph-dark border-emerald-500/30' : 'neumorph-light border-emerald-400/40'} space-y-2`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                กำลังปฏิบัติหน้าที่สะสม
              </span>
              <span className="text-[10px] font-mono text-slate-400">เข้างาน: {checkInResult.checkInTime}</span>
            </div>
            <div className="flex items-center justify-center gap-2 py-1 font-mono">
              <div className={`px-3 py-1.5 rounded-xl ${isDark ? 'neumorph-dark-inset' : 'neumorph-light-inset'} text-center min-w-[56px]`}>
                <span className="text-xl font-black">{String(liveWorkDuration.hours).padStart(2, '0')}</span>
                <span className="text-[8px] text-slate-400 block font-sans">ชั่วโมง</span>
              </div>
              <span className="text-lg font-bold text-blue-400">:</span>
              <div className={`px-3 py-1.5 rounded-xl ${isDark ? 'neumorph-dark-inset' : 'neumorph-light-inset'} text-center min-w-[56px]`}>
                <span className="text-xl font-black">{String(liveWorkDuration.minutes).padStart(2, '0')}</span>
                <span className="text-[8px] text-slate-400 block font-sans">นาที</span>
              </div>
              <span className="text-lg font-bold text-blue-400">:</span>
              <div className={`px-3 py-1.5 rounded-xl ${isDark ? 'neumorph-dark-inset' : 'neumorph-light-inset'} text-center min-w-[56px]`}>
                <span className="text-xl font-black text-emerald-400">{String(liveWorkDuration.seconds).padStart(2, '0')}</span>
                <span className="text-[8px] text-slate-400 block font-sans">วินาที</span>
              </div>
            </div>
          </div>
        )}

        {/* Error Feedback */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="text-[11px] font-semibold leading-relaxed">{errorMessage}</span>
          </div>
        )}

      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. CHECK-OUT CONFIRMATION MODAL                               */}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        {showCheckOutConfirmModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`max-w-sm w-full p-6 rounded-3xl shadow-2xl space-y-4 text-center ${
                isDark ? 'bg-slate-900 border border-white/10 text-white' : 'bg-white border border-slate-200 text-slate-800'
              }`}
            >
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center shadow-inner">
                <AlertTriangle className="w-7 h-7" />
              </div>

              <div>
                <h3 className="font-black text-base">ยืนยันการลงเวลาออกงาน?</h3>
                <p className="text-xs text-slate-400 mt-1">
                  โปรดตรวจสอบเวลาทำงานของคุณก่อนยืนยัน เพื่อป้องกันการเผลอกด
                </p>
              </div>

              <div className={`p-3.5 rounded-2xl space-y-1 text-xs ${isDark ? 'bg-slate-950/80 border border-amber-500/30 text-amber-200' : 'bg-amber-50 border border-amber-200 text-amber-800'}`}>
                <div className="font-bold flex items-center justify-center gap-1.5 text-amber-400">
                  <Timer className="w-4 h-4" />
                  <span>เวลาปฏิบัติงานของคุณ:</span>
                </div>
                <div className="text-xl font-black font-mono">
                  {liveWorkDuration.hours} ชม. {liveWorkDuration.minutes} นาที {liveWorkDuration.seconds} วินาที
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCheckOutConfirmModal(false)}
                  className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all active:scale-95"
                >
                  ✕ ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={executeCheckOut}
                  disabled={isCheckingOut}
                  className="py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-black text-xs shadow-md shadow-orange-500/20 transition-all active:scale-95 flex items-center justify-center gap-1.5"
                >
                  {isCheckingOut ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>{isCheckingOut ? 'กำลังบันทึก...' : '✓ ยืนยันออกงาน'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------- */}
      {/* 4. SMART NEUMORPHIC FLOATING BOTTOM NAVIGATION BAR             */}
      {/* ------------------------------------------------------------- */}
      <EmployeeBottomNav currentTab="checkin" />
    </div>
  );
}
