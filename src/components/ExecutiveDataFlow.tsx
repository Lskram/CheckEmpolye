'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UserPlus, 
  Smartphone, 
  MapPin, 
  ShieldAlert, 
  BellRing, 
  FileText, 
  BarChart3, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  Database, 
  Server, 
  Cpu, 
  Sparkles, 
  Layers, 
  ChevronRight,
  Play,
  RotateCcw,
  Lock,
  Zap
} from 'lucide-react';

interface FlowStep {
  id: number;
  title: string;
  subtitle: string;
  badge: string;
  badgeColor: string;
  icon: any;
  color: string;
  bgColor: string;
  borderColor: string;
  actor: 'Admin' | 'Employee' | 'System Engine' | 'External';
  dbTables: string[];
  description: string;
  details: string[];
  payloadSample: object;
}

const FLOW_STEPS: FlowStep[] = [
  {
    id: 1,
    title: '1. การจัดการบัญชีผู้ใช้',
    subtitle: 'Admin Account Provisioning',
    badge: 'Step 1',
    badgeColor: 'bg-indigo-500 text-white',
    icon: UserPlus,
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950/40',
    borderColor: 'border-indigo-200 dark:border-indigo-800',
    actor: 'Admin',
    dbTables: ['employees'],
    description: 'ผู้บริหารสร้างบัญชีพนักงานใหม่ผ่าน Admin Dashboard ระบบทำการ Hash PIN 4 หลัก และสร้าง UUID บันทึกเข้าตาราง employees โดยสถานะ device_hwid ยังเป็น NULL เพื่อรอการผูกเครื่อง',
    details: [
      'ผู้บริหารกรอกข้อมูล (รหัสพนักงาน, ชื่อ-สกุล, ชื่อเล่น, PIN 4 หลัก, ตำแหน่ง)',
      'Backend Hash รหัส PIN และสร้าง UUID บันทึกเข้าตาราง `employees`',
      'สถานะ `device_hwid` ตั้งเป็น NULL รอพนักงานเข้าใช้งานครั้งแรกเพื่อผูกเครื่อง',
    ],
    payloadSample: {
      action: 'CREATE_EMPLOYEE',
      table: 'employees',
      data: {
        employee_code: 'EMP001',
        full_name: 'สมชาย สายตรง',
        nickname: 'ชาย',
        role: 'STAFF',
        pin_hash: '$2b$10$7Z8x...hashed_pin',
        device_hwid: null,
        status: 'ACTIVE',
      },
    },
  },
  {
    id: 2,
    title: '2. การผูกอุปกรณ์และเข้าสู่ระบบครั้งแรก',
    subtitle: 'First-time HWID Binding & Auth',
    badge: 'Step 2',
    badgeColor: 'bg-purple-500 text-white',
    icon: Smartphone,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-950/40',
    borderColor: 'border-purple-200 dark:border-purple-800',
    actor: 'Employee',
    dbTables: ['employees', 'violation_logs'],
    description: 'พนักงานเปิดแอป PWA บนมือถือ ระบบคำนวณ Canvas HWID Fingerprint หากเป็นการใช้งานครั้งแรกจะทำการผูกอุปกรณ์เข้ากับบัญชี (1 เครื่อง / 1 บัญชี) เพื่อป้องกันการฝากตอกบัตร',
    details: [
      'PWA ดึง Canvas Fingerprint + User Agent สร้าง Hardware ID (HWID)',
      'กรอกรหัสพนักงานและ PIN 4 หลักเพื่อยืนยันตัวตน',
      'ระบบบันทึก HWID ลงตาราง `employees` และล็อกบัญชีไว้กับเครื่องนี้',
      'บันทึก Profile พนักงานลง LocalStorage ของเบราว์เซอร์เพื่อเข้าใช้งานสะดวกรวดเร็วในครั้งถัดไป',
    ],
    payloadSample: {
      action: 'BIND_HWID',
      employee_code: 'EMP001',
      device_hwid: 'hwid_canvas_8fa291b072c4e891',
      device_info: 'iPhone 15 Pro / iOS 17 Safari PWA',
      result: 'BOUND_SUCCESSFULLY',
    },
  },
  {
    id: 3,
    title: '3. การบันทึกเวลาทำงาน & คำนวณเบี้ยขยัน',
    subtitle: 'Check-In Processing & Business Logic',
    badge: 'Step 3',
    badgeColor: 'bg-emerald-500 text-white',
    icon: MapPin,
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/40',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
    actor: 'System Engine',
    dbTables: ['attendance_logs', 'daily_attendance_summaries'],
    description: 'เมื่อกดปุ่มเช็คอิน ระบบตรวจสอบพิกัด GPS ด้วย Haversine Formula (<= 50m) และตรวจสอบเวลาเข้างาน: หากมาก่อน 08:00 น. ได้รับเบี้ยขยัน 50 บาททันที',
    details: [
      'พนักงานกดปุ่ม "ตอกบัตรเข้างาน" บนหน้าจอ PWA',
      'ดึงพิกัด Geolocation (Lat, Lng) และคำนวณระยะห่างด้วยสูตร Haversine Formula',
      'ตรวจสอบรัศมีร้าน: ระยะห่าง <= 50 เมตร = ผ่าน (Passed)',
      'ตรวจสอบเงื่อนไขเวลา: มา <= 08:00 น. -> สถานะ ON_TIME + ได้รับเบี้ยขยัน 50 THB',
      'ถ้ามา > 08:00 น. -> สถานะ LATE + เบี้ยขยัน 0 THB',
      'บันทึก Record เข้าตาราง `attendance_logs` และอัปเดต `daily_attendance_summaries`',
    ],
    payloadSample: {
      action: 'CHECK_IN',
      employee_id: '22222222-2222-2222-2222-222222222222',
      gps: { lat: 13.7563, lng: 100.5018, distance_meters: 2.5, is_inside: true },
      timestamp: '2026-09-22T07:45:12+07:00',
      status: 'PRESENT',
      allowance_earned: 50,
      verified_hwid: true,
    },
  },
  {
    id: 4,
    title: '4. การตรวจจับและรับมือกับการทุจริต',
    subtitle: 'Violation & Fraud Detection Mechanism',
    badge: 'Step 4',
    badgeColor: 'bg-rose-500 text-white',
    icon: ShieldAlert,
    color: 'text-rose-600 dark:text-rose-400',
    bgColor: 'bg-rose-50 dark:bg-rose-950/40',
    borderColor: 'border-rose-200 dark:border-rose-800',
    actor: 'System Engine',
    dbTables: ['violation_logs'],
    description: 'หากตรวจพบ HWID ไม่ตรงกับที่ผูกไว้ (พยายามใช้เครื่องอื่น) หรืออยู่ห่างจากร้านเกิน 50m ระบบจะปฏิเสธการเช็คอิน บันทึกลง violation_logs และแจ้งเตือน Red Alert บน Dashboard ผู้บริหาร',
    details: [
      'ตรวจจับการใช้เครื่องอื่นเช็คอินแทนกัน (HWID Mismatch)',
      'ตรวจจับการเช็คอินนอกรัศมีร้าน (> 50 เมตร)',
      'ปฏิเสธการตอกบัตรทันที (Reject Transaction)',
      'บันทึกหลักฐาน (Timestamp, พิกัด GPS, HWID ปลอม) เข้าตาราง `violation_logs`',
      'แสดงแถบ Red Alert Banner บน Admin Dashboard ของผู้บริหารทันที',
    ],
    payloadSample: {
      alert: 'CRITICAL_SECURITY_VIOLATION',
      violation_type: 'HWID_MISMATCH',
      attempted_employee: 'EMP002',
      registered_hwid: 'hwid_canvas_8fa291b072c4e891',
      attempted_hwid: 'hwid_canvas_unknown_device_99',
      action_taken: 'REJECTED_AND_LOGGED',
    },
  },
  {
    id: 5,
    title: '5. การแจ้งเตือนอัตโนมัติแบบเรียลไทม์',
    subtitle: 'Automated Real-time Notifications',
    badge: 'Step 5',
    badgeColor: 'bg-amber-500 text-white',
    icon: BellRing,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/40',
    borderColor: 'border-amber-200 dark:border-amber-800',
    actor: 'External',
    dbTables: ['attendance_logs'],
    description: 'กรณีที่พนักงานมาสายเกินกำหนด (> 08:00 น.) ระบบ Backend จะส่งสัญญาณแจ้งเตือนผ่าน LINE Messaging API / LINE Notify ไปยังกลุ่มผู้บริหารทันทีเพื่อรับทราบสถานการณ์หน้างาน',
    details: [
      'ระบบตรวจพบสถานะการเข้างานเป็น LATE',
      'Backend Dispatch webhook ยิงสัญญาณไปที่ LINE Messaging API / LINE Notify',
      'ข้อความระบุ: "[แจ้งเตือนสาย] คุณวิภาดา (EMP002) เช็คอินเวลา 08:12 น. (สาย 32 นาที) เบี้ยขยัน 0 บาท"',
      'ผู้บริหารรับทราบความเคลื่อนไหวกำลังพลได้ทันทีโดยไม่ต้องเฝ้าหน้าจอ',
    ],
    payloadSample: {
      channel: 'LINE_NOTIFY_API',
      message: '🚨 แจ้งเตือนพนักงานมาสาย: EMP002 (วิภาดา) เข้างาน 08:12 น. เบี้ยขยัน 0 บาท',
      status: 'SENT_200_OK',
    },
  },
  {
    id: 6,
    title: '6. การยื่นและอนุมัติใบลา',
    subtitle: 'Leave Management Workflow',
    badge: 'Step 6',
    badgeColor: 'bg-cyan-500 text-white',
    icon: FileText,
    color: 'text-cyan-600 dark:text-cyan-400',
    bgColor: 'bg-cyan-50 dark:bg-cyan-950/40',
    borderColor: 'border-cyan-200 dark:border-cyan-800',
    actor: 'Admin',
    dbTables: ['leave_requests'],
    description: 'พนักงานสามารถยื่นคำขอลา (ลาป่วย, ลากิจ, ลาพักร้อน) ผ่าน PWA ข้อมูลจะส่งตรงเข้าสู่คิวรออนุมัติของผู้บริหาร พร้อมระบบกด อนุมัติ / ปฏิเสธ ได้ในคลิกเดียว',
    details: [
      'พนักงานเลือกประเภทการลา (SICK, BUSINESS, VACATION) ระบุวันที่และเหตุผล',
      'คำขอถูกบันทึกลงตาราง `leave_requests` สถานะ PENDING',
      'แสดงรายการในคิวอนุมัติบน Executive Dashboard',
      'ผู้บริหารกด อนุมัติ (APPROVED) หรือ ปฏิเสธ (REJECTED) ในคลิกเดียว',
      'สถานะอัปเดตเรียลไทม์บนหน้าจอปฏิทินของพนักงานทันที',
    ],
    payloadSample: {
      action: 'APPROVE_LEAVE',
      leave_id: 'leave_req_9921',
      employee_id: 'EMP003',
      type: 'VACATION',
      days: 1,
      status: 'APPROVED',
      reviewed_by: 'ADMIN01',
    },
  },
  {
    id: 7,
    title: '7. การสรุปผลบนแดชบอร์ดผู้บริหาร',
    subtitle: 'Executive Analytics & Dashboard Aggregation',
    badge: 'Step 7',
    badgeColor: 'bg-blue-600 text-white',
    icon: BarChart3,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/40',
    borderColor: 'border-blue-200 dark:border-blue-800',
    actor: 'Admin',
    dbTables: ['daily_attendance_summaries', 'attendance_logs', 'employees'],
    description: 'รวบรวมข้อมูลทั้งหมดแบบ Real-time นำมาคำนวณ KPIs สำคัญ: งบประมาณเบี้ยขยัน, อัตราเข้างานตรงเวลา, กำลังพลปัจจุบัน แสดงผลผ่านกราฟ 3D Three.js และ Donut Chart',
    details: [
      'ดึงข้อมูล Aggregated Daily / Weekly / Monthly จากตารางฐานข้อมูล',
      'คำนวณ KPI: Total Headcount, On-Time Punctuality %, Total Allowance Burn (THB)',
      'เรนเดอร์กราฟแท่งแบบ 3D WebGL (Three.js) สามารถหมุนดูมิติรอบทิศทาง',
      'แสดงกราฟวงกลม Donut 2D และตารางรายชื่อสถานะพนักงานเข้างานสด',
      'ส่งออกไฟล์รายงานเวลาทำงานและเบี้ยขยัน (Export CSV) สำหรับทำจ่ายเงินเดือน',
    ],
    payloadSample: {
      metrics: {
        total_headcount: 4,
        on_time_rate: '92%',
        allowance_budget_used: '150 THB',
        pending_leaves: 0,
        security_violations: 0,
      },
      chart_engine: 'Three.js WebGL 3D + 2D Canvas',
    },
  },
];

export default function ExecutiveDataFlow() {
  const [selectedStep, setSelectedStep] = useState<number>(1);
  const [simulating, setSimulating] = useState(false);
  const [simStep, setSimStep] = useState<number>(0);
  const [simLog, setSimLog] = useState<string[]>([]);

  const activeStep = FLOW_STEPS.find((s) => s.id === selectedStep) || FLOW_STEPS[0];

  const runSimulation = async () => {
    if (simulating) return;
    setSimulating(true);
    setSimLog([]);
    setSimStep(1);

    const logs = [
      '🚀 [Init] เริ่มต้นจำลองการไหลของข้อมูลระบบเข้างาน...',
      '👤 [Step 1] ผู้บริหารสร้างบัญชี EMP001 (สมชาย) -> Hash PIN สำเร็จ',
      '📱 [Step 2] สมชายเปิด PWA -> สร้าง Canvas HWID: 8fa291b0 -> ผูกเครื่องสำเร็จ',
      '📍 [Step 3] เวลา 07:45 น. กดตอกบัตร -> GPS 2.5m (<=50m ผ่าน) -> มาก่อน 08:00 -> ได้รับเบี้ยขยัน 50฿',
      '🛡️ [Step 4] ตรวจสอบความปลอดภัย: HWID ตรงกัน, ไม่พบการทุจริต -> Security Pass',
      '🔔 [Step 5] ประเมินเงื่อนไขแจ้งเตือน: เข้างานตรงเวลา -> ไม่จำเป็นต้องยิง LINE Alert',
      '📋 [Step 6] ตรวจสอบคำขอลา: ไม่มีรายการค้าง -> Queue Clear',
      '📊 [Step 7] อัปเดตข้อมูลขึ้น Executive Dashboard -> กราฟ 3D แสดงผลยอดคนและเบี้ยเลี้ยงเรียลไทม์ ✨',
    ];

    for (let i = 0; i < logs.length; i++) {
      await new Promise((r) => setTimeout(r, 600));
      setSimLog((prev) => [...prev, logs[i]]);
      if (i >= 1 && i <= 7) {
        setSimStep(i);
        setSelectedStep(i);
      }
    }

    setSimulating(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-indigo-800/40 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Executive System Architecture & Pipeline
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              การไหลของข้อมูลระบบ (Detailed Data Flow)
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              แผนผังและกลไกการทำงานของข้อมูล ตั้งแต่จุดเริ่มต้นการลงทะเบียน, เช็คอินผ่าน PWA, คำนวณเบี้ยขยัน, ตรวจจับการทุจริต จนถึงการสรุปผลบนแดชบอร์ดผู้บริหาร
            </p>
          </div>

          <button
            onClick={runSimulation}
            disabled={simulating}
            className={`px-5 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 transition-all shadow-lg shrink-0 ${
              simulating
                ? 'bg-slate-700 text-slate-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-slate-950 shadow-emerald-500/20 active:scale-95'
            }`}
          >
            {simulating ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-300 border-t-transparent rounded-full animate-spin"></div>
                กำลังจำลอง Pipeline... (Step {simStep}/7)
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                จำลองการไหลของข้อมูล (Live Simulation)
              </>
            )}
          </button>
        </div>
      </div>

      {/* Horizontal Step Pipeline Bar */}
      <div className="bg-white dark:bg-slate-900/90 rounded-3xl p-4 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              เส้นทางการประมวลผล 7 ขั้นตอน (Pipeline Stages)
            </h3>
          </div>
          <span className="text-xs text-slate-400">คลิกที่ขั้นตอนเพื่อดูเจาะลึก</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {FLOW_STEPS.map((step) => {
            const Icon = step.icon;
            const isSelected = selectedStep === step.id;
            return (
              <button
                key={step.id}
                onClick={() => setSelectedStep(step.id)}
                className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                  isSelected
                    ? `${step.bgColor} ${step.borderColor} ring-2 ring-indigo-500/40 shadow-md`
                    : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${step.badgeColor}`}>
                      #{step.id}
                    </span>
                    <Icon className={`w-4 h-4 ${step.color}`} />
                  </div>
                  <div className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">
                    {step.title.split('. ')[1]}
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 mt-2 flex items-center justify-between">
                  <span>{step.actor}</span>
                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Step Detail + Live Payload Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Step Details (7 Cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900/90 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl ${activeStep.bgColor} ${activeStep.borderColor} border flex items-center justify-center ${activeStep.color}`}>
                  <activeStep.icon className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${activeStep.badgeColor}`}>
                      {activeStep.badge}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">Actor: {activeStep.actor}</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                    {activeStep.title}
                  </h3>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{activeStep.subtitle}</div>
                </div>
              </div>
            </div>

            {/* Description Card */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-sm text-slate-700 dark:text-slate-200 leading-relaxed mb-4">
              {activeStep.description}
            </div>

            {/* Step Checkpoints */}
            <div className="space-y-2.5 mb-6">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                กระบวนการทำงานหลัก (Execution Workflow):
              </h4>
              {activeStep.details.map((detail, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{detail}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom DB & Security Tags */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-500" />
              <span className="font-semibold text-slate-500 dark:text-slate-400">ตารางฐานข้อมูลที่เกี่ยวข้อง:</span>
              <div className="flex gap-1.5">
                {activeStep.dbTables.map((tbl) => (
                  <span key={tbl} className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 font-mono text-[11px] font-semibold">
                    {tbl}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedStep((prev) => (prev > 1 ? prev - 1 : 7))}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium"
              >
                ← ก่อนหน้า
              </button>
              <button
                onClick={() => setSelectedStep((prev) => (prev < 7 ? prev + 1 : 1))}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1"
              >
                ถัดไป →
              </button>
            </div>
          </div>
        </div>

        {/* Right: Technical Payload Inspector & Live Console (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* JSON Payload Inspector */}
          <div className="bg-slate-950 text-slate-200 rounded-3xl p-5 border border-slate-800 shadow-lg font-mono text-xs">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-slate-300">Data Payload & DB Schema</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                JSON Response
              </span>
            </div>

            <pre className="overflow-x-auto text-[11px] leading-relaxed text-emerald-400/90 max-h-64 p-2 rounded-xl bg-slate-900/80 border border-slate-800/60">
              {JSON.stringify(activeStep.payloadSample, null, 2)}
            </pre>
          </div>

          {/* Simulation Output Log */}
          {simLog.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900 text-slate-300 rounded-3xl p-5 border border-slate-800 shadow-sm text-xs font-mono"
            >
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-400 animate-pulse" />
                  <span className="font-bold text-white">Live Pipeline Execution Log</span>
                </div>
                <button
                  onClick={() => setSimLog([])}
                  className="text-slate-400 hover:text-white"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {simLog.map((log, idx) => (
                  <div key={idx} className="text-[11px] leading-relaxed">
                    {log}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Executive Security Assurance Card */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-slate-900 dark:to-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 shadow-sm">
            <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-bold text-sm mb-2">
              <Lock className="w-4 h-4" />
              มาตรฐานความปลอดภัยระดับองค์กร (Enterprise Security)
            </div>
            <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5">
              <li>• <strong>HWID 1:1:</strong> ป้องกันการเปิดลิงก์ส่งต่อให้ผู้อื่นกดแทน</li>
              <li>• <strong>Haversine Geofence 50m:</strong> เช็คพิกัดจาก GPS เครื่องจริงเท่านั้น</li>
              <li>• <strong>Hash Security:</strong> รหัส PIN ทุกตัวถูกเข้ารหัสก่อนบันทึกลงฐานข้อมูล</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
