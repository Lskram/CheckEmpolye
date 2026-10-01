'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Camera, 
  Upload, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Image as ImageIcon,
  User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
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
  const { isDark } = useAppTheme();

  // Photo Upload States
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoUploadMsg, setPhotoUploadMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  // Load employee profile for center avatar badge
  const loadProfile = () => {
    try {
      const saved = localStorage.getItem('attendance_employee_profile');
      if (saved) {
        setEmployee(JSON.parse(saved));
      }
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    loadProfile();
    const handleStorageUpdate = () => loadProfile();
    window.addEventListener('storage', handleStorageUpdate);
    window.addEventListener('employee_profile_updated', handleStorageUpdate);
    return () => {
      window.removeEventListener('storage', handleStorageUpdate);
      window.removeEventListener('employee_profile_updated', handleStorageUpdate);
    };
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

  // Handle Photo Selection
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setPhotoUploadMsg({ type: 'error', text: 'ขนาดไฟล์ภาพต้องไม่เกิน 5 MB' });
      return;
    }
    setSelectedPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPhotoPreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
    setPhotoUploadMsg(null);
  };

  // Upload Photo to Supabase & Update Database
  const handleUploadPhoto = async () => {
    const empId = employee?.id || employee?.employeeId;
    if (!empId || !photoPreview) return;
    setIsUploadingPhoto(true);
    setPhotoUploadMsg(null);
    try {
      const res = await fetch('/api/employee/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: empId,
          base64Image: photoPreview,
          fileName: selectedPhotoFile?.name || `avatar_${empId}.jpg`,
          mimeType: selectedPhotoFile?.type || 'image/jpeg',
        }),
      });

      const data = await res.json();
      if (data.success && data.data?.avatarUrl) {
        const updatedEmp = {
          ...employee,
          avatar_url: data.data.avatarUrl,
        };
        setEmployee(updatedEmp);
        localStorage.setItem('attendance_employee_profile', JSON.stringify(updatedEmp));
        window.dispatchEvent(new Event('employee_profile_updated'));
        setPhotoUploadMsg({ type: 'success', text: '✓ บันทึกรูปโปรไฟล์เรียบร้อยแล้ว!' });
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
        setTimeout(() => {
          setIsPhotoModalOpen(false);
          setPhotoPreview(null);
          setSelectedPhotoFile(null);
          setPhotoUploadMsg(null);
        }, 1200);
      } else {
        setPhotoUploadMsg({ type: 'error', text: data.message || 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ' });
      }
    } catch (err: any) {
      setPhotoUploadMsg({ type: 'error', text: 'เชื่อมต่อเซิร์ฟเวอร์ขัดข้อง: ' + err.message });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  return (
    <>
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
              <img 
                src="/images/nav-clock.png" 
                alt="ลงเวลา" 
                className={`w-6 h-6 object-contain drop-shadow-md transition-all ${
                  active === 'checkin' ? 'scale-110 drop-shadow-[0_4px_6px_rgba(59,130,246,0.5)]' : 'opacity-85 hover:opacity-100'
                }`}
              />
              <span className="text-[10px] mt-1 font-bold">ลงเวลา</span>
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
              <img 
                src="/images/nav-calendar.png" 
                alt="ปฏิทิน" 
                className={`w-6 h-6 object-contain drop-shadow-md transition-all ${
                  active === 'calendar' ? 'scale-110 drop-shadow-[0_4px_6px_rgba(59,130,246,0.5)]' : 'opacity-85 hover:opacity-100'
                }`}
              />
              <span className="text-[10px] mt-1 font-bold">ปฏิทิน</span>
            </Link>

            {/* Center Raised Profile Avatar Action Button (Click to Open Photo Settings) */}
            <div className="relative -top-5 mx-1 flex flex-col items-center">
              <button
                type="button"
                onClick={() => setIsPhotoModalOpen(true)}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-transform active:scale-90 cursor-pointer group ${
                  isDark 
                    ? 'neumorph-btn-raised-dark text-blue-400 border-2 border-blue-500/40 shadow-xl shadow-blue-950/60' 
                    : 'neumorph-btn-raised-light text-blue-600 border-2 border-blue-400/40 shadow-lg shadow-blue-200/60'
                }`}
                title="แตะเพื่อตั้งค่ารูปโปรไฟล์พนักงาน"
              >
                <div className={`w-11 h-11 rounded-full flex items-center justify-center font-black text-xs uppercase shadow-md overflow-hidden relative ${
                  isDark 
                    ? 'bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-blue-500/40 ring-2 ring-white/20' 
                    : 'bg-gradient-to-tr from-blue-500 via-indigo-500 to-sky-400 text-white shadow-blue-500/30 ring-2 ring-white/80'
                }`}>
                  {employee?.avatar_url ? (
                    <img 
                      src={employee.avatar_url} 
                      alt={employee?.full_name || employee?.fullName || 'Profile'} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    employee?.nickname ? employee.nickname.slice(0, 2) : (employee?.full_name || employee?.fullName ? (employee.full_name || employee.fullName).slice(0, 2) : (employee?.employee_code || employee?.employeeCode ? (employee.employee_code || employee.employeeCode) : 'EM'))
                  )}
                  {/* Subtle Camera Overlay Hint on Hover */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>
              </button>
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
              <img 
                src="/images/nav-leave.png" 
                alt="ยื่นใบลา" 
                className={`w-6 h-6 object-contain drop-shadow-md transition-all ${
                  active === 'leave' ? 'scale-110 drop-shadow-[0_4px_6px_rgba(59,130,246,0.5)]' : 'opacity-85 hover:opacity-100'
                }`}
              />
              <span className="text-[10px] mt-1 font-bold">ยื่นใบลา</span>
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
              <img 
                src="/images/nav-advance.png" 
                alt="เบิกเงิน" 
                className={`w-6 h-6 object-contain drop-shadow-md transition-all ${
                  active === 'advance' ? 'scale-110 drop-shadow-[0_4px_6px_rgba(59,130,246,0.5)]' : 'opacity-85 hover:opacity-100'
                }`}
              />
              <span className="text-[10px] mt-1 font-bold">เบิกเงิน</span>
            </Link>

          </nav>
        </div>
      </div>

      {/* Hidden File Inputs for Gallery and Camera */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handlePhotoSelect}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="user"
        onChange={handlePhotoSelect}
        className="hidden"
      />

      {/* Profile Photo Upload Modal */}
      <AnimatePresence>
        {isPhotoModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`max-w-sm w-full p-6 rounded-3xl shadow-2xl space-y-4 text-center ${
                isDark ? 'bg-slate-900 border border-white/10 text-white' : 'bg-white border border-slate-200 text-slate-800'
              }`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
                    <Camera className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-sm">ตั้งค่ารูปโปรไฟล์พนักงาน</h3>
                    <p className="text-[10px] text-slate-400">
                      {employee?.fullName || employee?.full_name} ({employee?.employeeCode || employee?.employee_code})
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsPhotoModalOpen(false);
                    setPhotoPreview(null);
                    setSelectedPhotoFile(null);
                    setPhotoUploadMsg(null);
                  }}
                  className="p-1 rounded-xl text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Avatar Preview Circle */}
              <div className="flex flex-col items-center py-1">
                <div className="relative group">
                  <div className={`w-28 h-28 rounded-full overflow-hidden border-4 ${
                    photoPreview ? 'border-emerald-500 shadow-xl shadow-emerald-500/20' : 'border-blue-500/40 shadow-xl shadow-blue-500/20'
                  } bg-slate-800 flex items-center justify-center text-3xl font-black transition-all`}>
                    {photoPreview ? (
                      <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : employee?.avatar_url ? (
                      <img src={employee.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-blue-400 uppercase">
                        {employee?.nickname ? employee.nickname.slice(0, 2) : (employee?.full_name || employee?.fullName ? (employee.full_name || employee.fullName).slice(0, 2) : 'EM')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Gallery & Camera Choice Buttons */}
                <div className="grid grid-cols-2 gap-2 w-full mt-4">
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="py-2.5 px-3 rounded-2xl bg-blue-500/15 hover:bg-blue-500/25 border border-blue-400/30 text-blue-400 text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>เลือกจากแกลเลอรี</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="py-2.5 px-3 rounded-2xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-400/30 text-purple-400 text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>ถ่ายรูปด้วยกล้อง</span>
                  </button>
                </div>

                <p className="text-[11px] text-slate-400 mt-2">
                  {selectedPhotoFile ? `เลือกแล้ว: ${selectedPhotoFile.name}` : 'เลือกรูปภาพจากแกลเลอรีในเครื่องเพื่อตั้งเป็นรูปโปรไฟล์'}
                </p>
              </div>

              {photoUploadMsg && (
                <div className={`p-3 rounded-2xl text-xs flex items-center gap-1.5 justify-center font-medium ${
                  photoUploadMsg.type === 'success' 
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' 
                    : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                }`}>
                  {photoUploadMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  <span>{photoUploadMsg.text}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsPhotoModalOpen(false);
                    setPhotoPreview(null);
                    setSelectedPhotoFile(null);
                    setPhotoUploadMsg(null);
                  }}
                  className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all active:scale-95"
                >
                  ✕ ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleUploadPhoto}
                  disabled={!photoPreview || isUploadingPhoto}
                  className="py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isUploadingPhoto ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  <span>{isUploadingPhoto ? 'กำลังบันทึก...' : 'บันทึกรูปโปรไฟล์'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

