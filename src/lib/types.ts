export type Role = 'STAFF' | 'ADMIN' | 'SUPERVISOR';

export interface Employee {
  id: string;
  employee_code: string;
  full_name: string;
  nickname: string;
  pin_hash: string;
  role: Role;
  hwid?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export type AttendanceStatus = 'PRESENT' | 'LATE' | 'OUT_OF_GEOFENCE_BLOCKED';

export interface AttendanceLog {
  id: string;
  employee_id: string;
  check_in_time: string;
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
  status: 'PRESENT' | 'LATE' | 'ABSENT' | 'LEAVE';
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

export type ViolationType = 'HWID_OVERLAP' | 'DEVICE_MISMATCH' | 'OUT_OF_GEOFENCE_BLOCKED' | 'INVALID_PIN_ATTEMPTS';
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
  allowance_amount: number; // e.g. 50.00
  updated_at?: string;
}

export interface UserSession {
  id: string;
  employee_code: string;
  full_name: string;
  nickname: string;
  role: Role;
  hwid?: string | null;
}
