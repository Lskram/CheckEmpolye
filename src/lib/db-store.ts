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
  }
];

let mockStoreSettings: StoreSettings = {
  id: '00000000-0000-0000-0000-000000000001',
  store_name: 'สาขาหลัก YOKOHAMA NAYA COSMIS',
  store_lat: 13.7563000,
  store_lng: 100.5018000,
  radius_meters: 50.00,
  standard_time: '07:40:00',
  late_deadline: '08:00:00',
  allowance_amount: 50.00,
  updated_at: new Date().toISOString(),
};

let mockAttendanceLogs: AttendanceLog[] = [];
let mockLeaveRequests: LeaveRequest[] = [];
let mockViolationLogs: ViolationLog[] = [];

// Helper to generate RFC4122 compliant UUIDs
const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

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
      id: employee.id || generateUUID(),
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
      id: generateUUID(),
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
      id: generateUUID(),
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
      id: generateUUID(),
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
