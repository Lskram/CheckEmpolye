import { 
  Employee, 
  AttendanceLog, 
  DailyAttendanceSummary, 
  LeaveRequest, 
  ViolationLog, 
  StoreSettings 
} from './types';
import { supabase, isSupabaseConfigured } from './supabase';

// Mock in-memory state for immediate testing & zero-setup preview
let mockEmployees: Employee[] = [
  {
    id: '00000000-0000-0000-0000-000000000000',
    employee_code: 'SI01',
    full_name: 'ผู้บริหารสูงสุด (Executive Director)',
    nickname: 'ท่านประธาน',
    pin_hash: '5101',
    role: 'ADMIN',
    hwid: null,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '11111111-1111-1111-1111-111111111111',
    employee_code: 'ADMIN01',
    full_name: 'ผู้จัดการ ภัทรพล (Admin)',
    nickname: 'แอดมิน',
    pin_hash: '1234',
    role: 'ADMIN',
    hwid: null,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    employee_code: 'EMP001',
    full_name: 'สมชาย สายตรง (Somchai)',
    nickname: 'ชาย',
    pin_hash: '1234',
    role: 'STAFF',
    hwid: 'HWID_SAMPLE_DEVICE_01',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    employee_code: 'EMP002',
    full_name: 'วิภาดา ขยันยิ่ง (Wiphada)',
    nickname: 'ภา',
    pin_hash: '1234',
    role: 'STAFF',
    hwid: 'HWID_SAMPLE_DEVICE_02',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    employee_code: 'EMP003',
    full_name: 'กิตติพงษ์ ตรงเวลา (Kittiphong)',
    nickname: 'กิต',
    pin_hash: '1234',
    role: 'STAFF',
    hwid: null,
    is_active: true,
    created_at: new Date().toISOString(),
  }
];

let mockStoreSettings: StoreSettings = {
  id: '00000000-0000-0000-0000-000000000001',
  store_name: 'สาขาหลัก สยามสแควร์ (Main Store)',
  store_lat: 13.7460000,
  store_lng: 100.5340000,
  radius_meters: 50.00,
  standard_time: '07:40:00',
  late_deadline: '08:00:00',
  allowance_amount: 50.00,
  updated_at: new Date().toISOString(),
};

let mockAttendanceLogs: AttendanceLog[] = [
  {
    id: 'att-1',
    employee_id: '22222222-2222-2222-2222-222222222222',
    check_in_time: new Date(Date.now() - 3600000 * 24 * 2 + 3600000 * 7.5).toISOString(),
    latitude: 13.74601,
    longitude: 100.53402,
    accuracy: 5.0,
    distance_from_store: 2.5,
    hwid: 'HWID_SAMPLE_DEVICE_01',
    status: 'PRESENT',
    allowance: 50.00,
    notes: 'เช็คอินตรงเวลา',
    created_at: new Date().toISOString(),
  },
  {
    id: 'att-2',
    employee_id: '33333333-3333-3333-3333-333333333333',
    check_in_time: new Date(Date.now() - 3600000 * 24 * 1 + 3600000 * 8.2).toISOString(),
    latitude: 13.74605,
    longitude: 100.53408,
    accuracy: 8.0,
    distance_from_store: 12.0,
    hwid: 'HWID_SAMPLE_DEVICE_02',
    status: 'LATE',
    allowance: 0.00,
    notes: 'เช็คอินสายเกิน 08:00 น.',
    created_at: new Date().toISOString(),
  }
];

let mockLeaveRequests: LeaveRequest[] = [
  {
    id: 'leave-1',
    employee_id: '33333333-3333-3333-3333-333333333333',
    leave_type: 'SICK',
    start_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    end_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    days_count: 1,
    reason: 'มีไข้สูง ไปพบแพทย์ตามนัด',
    status: 'PENDING',
    created_at: new Date().toISOString(),
  }
];

let mockViolationLogs: ViolationLog[] = [
  {
    id: 'viol-1',
    employee_id: '44444444-4444-4444-4444-444444444444',
    violation_type: 'HWID_OVERLAP',
    severity: 'CRITICAL',
    description: 'ตรวจพบการใช้อุปกรณ์ HWID_SAMPLE_DEVICE_01 ซ้ำซ้อนกับพนักงาน สมชาย สายตรง (EMP001)',
    hwid: 'HWID_SAMPLE_DEVICE_01',
    other_employee_id: '22222222-2222-2222-2222-222222222222',
    is_resolved: false,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  }
];

// Helper to generate IDs
const generateId = () => 'id_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

export const db = {
  // -------------------------------------------------------------
  // EMPLOYEES
  // -------------------------------------------------------------
  async getEmployees(): Promise<Employee[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: true });
      if (!error && data) return data as Employee[];
    }
    return [...mockEmployees];
  },

  async getEmployeeById(id: string): Promise<Employee | null> {
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.from('employees').select('*').eq('id', id).single();
      if (data) return data as Employee;
    }
    return mockEmployees.find((e) => e.id === id) || null;
  },

  async getEmployeeByCode(code: string): Promise<Employee | null> {
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase
        .from('employees')
        .select('*')
        .ilike('employee_code', code.trim())
        .single();
      if (data) return data as Employee;
    }
    return mockEmployees.find((e) => e.employee_code.toLowerCase() === code.trim().toLowerCase()) || null;
  },

  async findEmployeeByHWID(hwid: string, excludeId?: string): Promise<Employee | null> {
    if (isSupabaseConfigured && supabase) {
      let query = supabase.from('employees').select('*').eq('hwid', hwid);
      if (excludeId) query = query.neq('id', excludeId);
      const { data } = await query.limit(1);
      if (data && data.length > 0) return data[0] as Employee;
    }
    return mockEmployees.find((e) => e.hwid === hwid && e.id !== excludeId) || null;
  },

  async createEmployee(employee: Partial<Employee>): Promise<Employee> {
    const newEmp: Employee = {
      id: employee.id || generateId(),
      employee_code: employee.employee_code || '',
      full_name: employee.full_name || '',
      nickname: employee.nickname || '',
      pin_hash: employee.pin_hash || '1234',
      role: employee.role || 'STAFF',
      hwid: employee.hwid || null,
      is_active: employee.is_active ?? true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('employees').insert(newEmp).select().single();
      if (!error && data) return data as Employee;
    }

    mockEmployees.push(newEmp);
    return newEmp;
  },

  async updateEmployee(id: string, updates: Partial<Employee>): Promise<Employee | null> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('employees')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (!error && data) return data as Employee;
    }

    const index = mockEmployees.findIndex((e) => e.id === id);
    if (index !== -1) {
      mockEmployees[index] = { ...mockEmployees[index], ...updates, updated_at: new Date().toISOString() };
      return mockEmployees[index];
    }
    return null;
  },

  async deleteEmployee(id: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('employees').delete().eq('id', id);
      return !error;
    }
    const beforeLen = mockEmployees.length;
    mockEmployees = mockEmployees.filter((e) => e.id !== id);
    return mockEmployees.length < beforeLen;
  },

  // -------------------------------------------------------------
  // STORE SETTINGS & GEOFENCE
  // -------------------------------------------------------------
  async getStoreSettings(): Promise<StoreSettings> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('store_settings').select('*').limit(1).single();
      if (!error && data) return data as StoreSettings;
    }
    return { ...mockStoreSettings };
  },

  async updateStoreSettings(updates: Partial<StoreSettings>): Promise<StoreSettings> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('store_settings')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', mockStoreSettings.id)
        .select()
        .single();
      if (!error && data) return data as StoreSettings;
    }
    mockStoreSettings = { ...mockStoreSettings, ...updates, updated_at: new Date().toISOString() };
    return mockStoreSettings;
  },

  // -------------------------------------------------------------
  // ATTENDANCE LOGS
  // -------------------------------------------------------------
  async createAttendanceLog(log: Omit<AttendanceLog, 'id'>): Promise<AttendanceLog> {
    const newLog: AttendanceLog = {
      id: generateId(),
      ...log,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('attendance_logs').insert(newLog).select().single();
      if (!error && data) return data as AttendanceLog;
    }

    mockAttendanceLogs.unshift(newLog);
    return newLog;
  },

  async getAttendanceLogs(limit = 100): Promise<AttendanceLog[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('attendance_logs')
        .select('*, employee:employees(*)')
        .order('check_in_time', { ascending: false })
        .limit(limit);
      if (!error && data) return data as AttendanceLog[];
    }

    // Populate employee details for mock
    return mockAttendanceLogs.slice(0, limit).map((log) => ({
      ...log,
      employee: mockEmployees.find((e) => e.id === log.employee_id),
    }));
  },

  // -------------------------------------------------------------
  // LEAVE REQUESTS
  // -------------------------------------------------------------
  async createLeaveRequest(req: Omit<LeaveRequest, 'id' | 'status'>): Promise<LeaveRequest> {
    const newReq: LeaveRequest = {
      id: generateId(),
      ...req,
      status: 'PENDING',
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('leave_requests').insert(newReq).select().single();
      if (!error && data) return data as LeaveRequest;
    }

    mockLeaveRequests.unshift(newReq);
    return newReq;
  },

  async getLeaveRequests(): Promise<LeaveRequest[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('leave_requests')
        .select('*, employee:employees(*)')
        .order('created_at', { ascending: false });
      if (!error && data) return data as LeaveRequest[];
    }

    return mockLeaveRequests.map((req) => ({
      ...req,
      employee: mockEmployees.find((e) => e.id === req.employee_id),
    }));
  },

  async updateLeaveStatus(
    id: string,
    status: 'APPROVED' | 'REJECTED',
    reviewedBy?: string,
    rejectionReason?: string
  ): Promise<LeaveRequest | null> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('leave_requests')
        .update({
          status,
          reviewed_by: reviewedBy,
          reviewed_at: new Date().toISOString(),
          rejection_reason: rejectionReason,
        })
        .eq('id', id)
        .select()
        .single();
      if (!error && data) return data as LeaveRequest;
    }

    const index = mockLeaveRequests.findIndex((r) => r.id === id);
    if (index !== -1) {
      mockLeaveRequests[index] = {
        ...mockLeaveRequests[index],
        status,
        reviewed_by: reviewedBy,
        reviewed_at: new Date().toISOString(),
        rejection_reason: rejectionReason,
      };
      return mockLeaveRequests[index];
    }
    return null;
  },

  // -------------------------------------------------------------
  // VIOLATION & SECURITY LOGS
  // -------------------------------------------------------------
  async createViolationLog(log: Omit<ViolationLog, 'id' | 'is_resolved'>): Promise<ViolationLog> {
    const newLog: ViolationLog = {
      id: generateId(),
      ...log,
      is_resolved: false,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('violation_logs').insert(newLog).select().single();
      if (!error && data) return data as ViolationLog;
    }

    mockViolationLogs.unshift(newLog);
    return newLog;
  },

  async getViolationLogs(): Promise<ViolationLog[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('violation_logs')
        .select('*, employee:employees(*)')
        .order('created_at', { ascending: false });
      if (!error && data) return data as ViolationLog[];
    }

    return mockViolationLogs.map((log) => ({
      ...log,
      employee: mockEmployees.find((e) => e.id === log.employee_id),
      other_employee: log.other_employee_id ? mockEmployees.find((e) => e.id === log.other_employee_id) : undefined,
    }));
  },

  async resolveViolation(id: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('violation_logs').update({ is_resolved: true }).eq('id', id);
      return !error;
    }
    const item = mockViolationLogs.find((v) => v.id === id);
    if (item) {
      item.is_resolved = true;
      return true;
    }
    return false;
  }
};
