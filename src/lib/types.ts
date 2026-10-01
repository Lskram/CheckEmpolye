export type Role = 'STAFF' | 'ADMIN' | 'SUPERVISOR';

export interface Employee {
  id: string;
  employee_code: string;
  full_name: string;
  nickname: string;
  pin_hash: string;
  role: Role;
  position?: string;
  phone_number?: string;
  daily_wage?: number;
  hwid?: string | null;
  is_active: boolean;
  avatar_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface EmployeePhoto {
  id: string;
  employee_id: string;
  photo_url: string;
  file_name?: string;
  file_size?: number;
  mime_type?: string;
  is_current: boolean;
  created_at?: string;
}

export type AttendanceStatus = 'PRESENT' | 'LATE' | 'MISSING_CHECKOUT' | 'EARLY_LEAVE' | 'OUT_OF_GEOFENCE_BLOCKED';

export interface AttendanceLog {
  id: string;
  employee_id: string;
  check_in_time: string;
  check_out_time?: string | null;
  work_hours?: number;
  ot_hours?: number;
  latitude: number;
  longitude: number;
  accuracy?: number;
  distance_from_store: number;
  hwid: string;
  status: AttendanceStatus;
  allowance: number;
  notes?: string;
  created_at?: string;
  employee?: Employee;
}

export interface DailyAttendanceSummary {
  id: string;
  employee_id: string;
  date: string;
  status: 'PRESENT' | 'LATE' | 'ABSENT' | 'LEAVE' | 'MISSING_CHECKOUT';
  first_check_in?: string;
  allowance_amount: number;
  created_at?: string;
}

export type LeaveType = 'SICK' | 'BUSINESS' | 'ANNUAL' | 'OTHER';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  days_count: number;
  reason: string;
  status: LeaveStatus;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  rejection_reason?: string | null;
  created_at?: string;
  employee?: Employee;
}

export type ViolationType = 'HWID_OVERLAP' | 'DEVICE_MISMATCH' | 'OUT_OF_GEOFENCE_BLOCKED' | 'INVALID_PIN_ATTEMPTS' | 'FAKE_GPS_DETECTED' | 'SUSPICIOUS_TIME_TAMPERING';
export type SeverityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ViolationLog {
  id: string;
  employee_id?: string;
  violation_type: ViolationType;
  severity: SeverityLevel;
  description: string;
  hwid?: string;
  other_employee_id?: string;
  ip_address?: string;
  is_resolved: boolean;
  created_at?: string;
  employee?: Employee;
  other_employee?: Employee;
}

export interface StoreSettings {
  id: string;
  store_name: string;
  store_lat: number;
  store_lng: number;
  radius_meters: number;
  standard_time: string; // e.g. "07:40:00"
  late_deadline: string; // e.g. "08:00:00"
  closing_time?: string; // e.g. "17:30:00"
  allowance_amount: number; // e.g. 50.00
  min_work_hours_for_allowance?: number; // e.g. 4.00
  ot_rate_per_hour?: number; // e.g. 60.00
  updated_at?: string;
}

export interface SalaryAdvanceRequest {
  id: string;
  employee_id: string;
  amount: number;
  request_date: string; // 'YYYY-MM-DD'
  reason: string;
  needed_before_date?: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  rejection_reason?: string | null;
  created_at?: string;
  updated_at?: string;
  employee?: Employee;
  reviewer?: Employee;
}

export interface OTRequest {
  id: string;
  employee_id: string;
  date: string;
  start_time: string;
  end_time: string;
  hours: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_at?: string;
  employee?: Employee;
}

export interface MonthlyPayrollSummary {
  id: string;
  employee_id: string;
  month_year: string; // e.g. '2026-09'
  total_work_days: number;
  total_present_days: number;
  total_late_days: number;
  total_absent_days: number;
  total_allowance: number;
  total_ot_hours: number;
  total_ot_amount: number;
  net_payout: number;
  is_paid: boolean;
  paid_at?: string | null;
  created_at?: string;
  employee?: Employee;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: 'NORMAL' | 'URGENT';
  is_active: boolean;
  created_at?: string;
}

export interface AuditLog {
  id: string;
  actor_id?: string;
  action: string;
  target_type: string;
  target_id?: string;
  details?: any;
  created_at?: string;
}

export interface UserSession {
  id: string;
  employee_code: string;
  full_name: string;
  nickname: string;
  role: Role;
  position?: string;
  hwid?: string | null;
}
