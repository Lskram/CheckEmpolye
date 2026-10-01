import { 
  Employee, 
  AttendanceLog, 
  DailyAttendanceSummary, 
  LeaveRequest, 
  ViolationLog, 
  StoreSettings,
  SalaryAdvanceRequest
} from './types';
import { supabase, supabaseAdmin, isSupabaseConfigured } from './supabase';

const getClient = () => supabaseAdmin || supabase;

let mockSalaryAdvanceRequests: SalaryAdvanceRequest[] = [];

// Fallback in-memory state matching live Supabase records
let mockEmployees: Employee[] = [
  {
    id: '00000000-0000-0000-0000-000000000000',
    employee_code: 'SI01',
    full_name: 'ผู้บริหารสูงสุด (Executive Director)',
    nickname: 'ท่านประธาน',
    pin_hash: '5101',
    role: 'ADMIN',
    hwid: 'HWID_7970d174_pkqx4tgi',
    is_active: true,
    position: 'ช่างบริการทั่วไป',
    daily_wage: 400,
    created_at: '2026-09-22T14:32:23.098087+00:00',
    updated_at: '2026-09-23T16:40:48.569+00:00',
  },
  {
    id: 'cad180f3-28da-402f-b1fe-ab46f870c0ea',
    employee_code: '01',
    full_name: 'ฟหกหฟก',
    nickname: 'ฟหกฟหก',
    pin_hash: '11',
    role: 'STAFF',
    hwid: 'HWID_7970d174_pkqx4tgi',
    is_active: true,
    position: 'ช่างบริการทั่วไป',
    daily_wage: 400,
    created_at: '2026-09-27T15:27:45.308+00:00',
    updated_at: '2026-09-27T15:27:56.098+00:00',
  },
  {
    id: '14711ebc-cfaa-4674-ba8e-7ab0ea0aecaf',
    employee_code: '02',
    full_name: 'ฟหก',
    nickname: 'ฟหก',
    pin_hash: '02',
    role: 'STAFF',
    hwid: 'HWID_7970d174_pkqx4tgi',
    is_active: true,
    position: 'ช่างบริการทั่วไป',
    daily_wage: 400,
    created_at: '2026-09-27T15:32:17.678+00:00',
    updated_at: '2026-09-27T15:32:33.043+00:00',
  }
];

let mockStoreSettings: StoreSettings = {
  id: '00000000-0000-0000-0000-000000000001',
  store_name: 'สีแสงยานยนต์',
  store_lat: 15.110481,
  store_lng: 104.358552,
  radius_meters: 50.00,
  standard_time: '07:40:00',
  late_deadline: '08:00:00',
  closing_time: '17:30:00',
  allowance_amount: 50.00,
  min_work_hours_for_allowance: 4.00,
  ot_rate_per_hour: 60.00,
  updated_at: '2026-09-27T15:31:44.789+00:00',
};

let mockAttendanceLogs: AttendanceLog[] = [];
let mockLeaveRequests: LeaveRequest[] = [];
let mockViolationLogs: ViolationLog[] = [
  {
    id: 'v-001',
    employee_id: '14711ebc-cfaa-4674-ba8e-7ab0ea0aecaf', // 02 (ฟหก)
    other_employee_id: 'cad180f3-28da-402f-b1fe-ab46f870c0ea', // 01 (ฟหกหฟก)
    violation_type: 'HWID_OVERLAP',
    severity: 'CRITICAL',
    description: 'ตรวจพบการใช้อุปกรณ์ซ้ำซ้อน: พนักงานรหัส 02 (คุณฟหก) พยายามล็อกอินบนโทรศัพท์ที่ผูกไว้กับพนักงานรหัส 01 (คุณฟหกหฟก)',
    hwid: 'HWID_7970d174_pkqx4tgi',
    is_resolved: false,
    created_at: '2026-10-01T07:48:32.000Z',
  },
  {
    id: 'v-002',
    employee_id: '14711ebc-cfaa-4674-ba8e-7ab0ea0aecaf', // 02 (ฟหก)
    other_employee_id: 'cad180f3-28da-402f-b1fe-ab46f870c0ea', // 01 (ฟหกหฟก)
    violation_type: 'HWID_OVERLAP',
    severity: 'CRITICAL',
    description: 'ตรวจพบการใช้อุปกรณ์ซ้ำซ้อน: พนักงานรหัส 02 พยายามลงชื่อเข้าใช้บนเครื่องของรหัส 01',
    hwid: 'HWID_7970d174_pkqx4tgi',
    is_resolved: false,
    created_at: '2026-09-30T07:51:15.000Z',
  },
  {
    id: 'v-003',
    employee_id: '14711ebc-cfaa-4674-ba8e-7ab0ea0aecaf', // 02 (ฟหก)
    other_employee_id: 'cad180f3-28da-402f-b1fe-ab46f870c0ea', // 01 (ฟหกหฟก)
    violation_type: 'HWID_OVERLAP',
    severity: 'CRITICAL',
    description: 'ตรวจพบการใช้อุปกรณ์ซ้ำซ้อน: พนักงานรหัส 02 พยายามลงชื่อเข้าใช้บนเครื่องของรหัส 01',
    hwid: 'HWID_7970d174_pkqx4tgi',
    is_resolved: true,
    created_at: '2026-09-29T07:44:20.000Z',
  },
  {
    id: 'v-004',
    employee_id: 'cad180f3-28da-402f-b1fe-ab46f870c0ea', // 01 (ฟหกหฟก)
    violation_type: 'OUT_OF_GEOFENCE_BLOCKED',
    severity: 'HIGH',
    description: 'พยายามลงเวลานอกพื้นที่ร้าน: ระยะห่าง 184.2 เมตร (พิกัด GPS: Lat 15.111820, Lng 104.359910 - เกินรัศมีร้านที่กำหนด 50 เมตร)',
    hwid: 'HWID_7970d174_pkqx4tgi',
    is_resolved: false,
    created_at: '2026-10-01T07:42:10.000Z',
  },
  {
    id: 'v-005',
    employee_id: 'cad180f3-28da-402f-b1fe-ab46f870c0ea', // 01
    violation_type: 'DEVICE_MISMATCH',
    severity: 'MEDIUM',
    description: 'พยายามเข้าสู่ระบบจากเครื่องใหม่ที่ไม่ตรงกับเครื่องประจำตัวที่ลงทะเบียนไว้',
    hwid: 'HWID_samsung_galaxy_a54_unknown',
    is_resolved: true,
    created_at: '2026-09-28T08:15:00.000Z',
  },
  {
    id: 'v-006',
    employee_id: '14711ebc-cfaa-4674-ba8e-7ab0ea0aecaf', // 02
    violation_type: 'INVALID_PIN_ATTEMPTS',
    severity: 'LOW',
    description: 'กรอกรหัส PIN ไม่ถูกต้องต่อเนื่อง 3 ครั้ง',
    is_resolved: true,
    created_at: '2026-09-27T08:02:45.000Z',
  },
];

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
    const client = getClient();
    if (isSupabaseConfigured && client) {
      const { data, error } = await client
        .from('employees')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) {
        console.error('[Supabase getEmployees Error]:', error);
      }
      if (!error && data) {
        return data as Employee[];
      }
    }
    return [...mockEmployees];
  },

  async getEmployeeById(id: string): Promise<Employee | null> {
    const client = getClient();
    if (isSupabaseConfigured && client) {
      const { data } = await client.from('employees').select('*').eq('id', id).single();
      if (data) return data as Employee;
    }
    return mockEmployees.find((e) => e.id === id) || null;
  },

  async getEmployeeByCode(code: string): Promise<Employee | null> {
    const client = getClient();
    if (isSupabaseConfigured && client) {
      const { data } = await client
        .from('employees')
        .select('*')
        .ilike('employee_code', code.trim())
        .single();
      if (data) return data as Employee;
    }
    return mockEmployees.find((e) => e.employee_code.toLowerCase() === code.trim().toLowerCase()) || null;
  },

  async findEmployeeByHWID(hwid: string, excludeId?: string): Promise<Employee | null> {
    const client = getClient();
    if (isSupabaseConfigured && client) {
      let query = client.from('employees').select('*').eq('hwid', hwid);
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

    const client = getClient();
    if (isSupabaseConfigured && client) {
      const { data, error } = await client.from('employees').insert(newEmp).select().single();
      if (!error && data) return data as Employee;
    }

    mockEmployees.push(newEmp);
    return newEmp;
  },

  async updateEmployee(id: string, updates: Partial<Employee>): Promise<Employee | null> {
    const client = getClient();
    if (isSupabaseConfigured && client) {
      const { data, error } = await client
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
    const client = getClient();
    if (isSupabaseConfigured && client) {
      const { error } = await client.from('employees').delete().eq('id', id);
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
    const client = getClient();
    if (isSupabaseConfigured && client) {
      const { data, error } = await client.from('store_settings').select('*').limit(1).single();
      if (!error && data) return data as StoreSettings;
    }
    return { ...mockStoreSettings };
  },

  async updateStoreSettings(updates: Partial<StoreSettings>): Promise<StoreSettings> {
    const client = getClient();
    if (isSupabaseConfigured && client) {
      try {
        const current = await this.getStoreSettings();
        const targetId = current?.id || '00000000-0000-0000-0000-000000000001';
        const { data, error } = await client
          .from('store_settings')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', targetId)
          .select()
          .single();
        if (!error && data) {
          mockStoreSettings = { ...mockStoreSettings, ...(data as StoreSettings) };
          return data as StoreSettings;
        }
        if (error) {
          console.warn('[Supabase updateStoreSettings update error]:', error.message);
          const { data: upsertData, error: upsertError } = await client
            .from('store_settings')
            .upsert({ id: targetId, ...updates, updated_at: new Date().toISOString() })
            .select()
            .single();
          if (!upsertError && upsertData) {
            mockStoreSettings = { ...mockStoreSettings, ...(upsertData as StoreSettings) };
            return upsertData as StoreSettings;
          }
        }
      } catch (err: any) {
        console.warn('[Supabase updateStoreSettings catch]:', err.message);
      }
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

    const client = getClient();
    if (isSupabaseConfigured && client) {
      const { data, error } = await client.from('attendance_logs').insert(newLog).select().single();
      if (!error && data) return data as AttendanceLog;
    }

    mockAttendanceLogs.unshift(newLog);
    return newLog;
  },

  async getAttendanceLogs(limit = 100): Promise<AttendanceLog[]> {
    const client = getClient();
    if (isSupabaseConfigured && client) {
      // 1. Try explicit Foreign Key join
      const { data, error } = await client
        .from('attendance_logs')
        .select('*, employee:employees!attendance_logs_employee_id_fkey(*)')
        .order('check_in_time', { ascending: false })
        .limit(limit);
      if (!error && data) return data as AttendanceLog[];

      // 2. Resilient fallback: standard select + manual hydration
      const { data: rawLogs, error: rawError } = await client
        .from('attendance_logs')
        .select('*')
        .order('check_in_time', { ascending: false })
        .limit(limit);
      if (!rawError && rawLogs) {
        const employees = await this.getEmployees();
        return rawLogs.map((log: any) => ({
          ...log,
          employee: employees.find((e) => e.id === log.employee_id),
        })) as AttendanceLog[];
      }
    }

    // Populate employee details for mock
    return mockAttendanceLogs.slice(0, limit).map((log) => ({
      ...log,
      employee: mockEmployees.find((e) => e.id === log.employee_id),
    }));
  },

  async updateAttendanceLog(id: string, updates: Partial<AttendanceLog>): Promise<AttendanceLog | null> {
    const client = getClient();
    if (isSupabaseConfigured && client) {
      try {
        const { data, error } = await client
          .from('attendance_logs')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        if (!error && data) return data as AttendanceLog;
        if (error) {
          console.warn('[Supabase updateAttendanceLog]:', error.message);
        }
      } catch (err: any) {
        console.warn('[Supabase updateAttendanceLog catch]:', err.message);
      }
    }

    const index = mockAttendanceLogs.findIndex((l) => l.id === id);
    if (index !== -1) {
      mockAttendanceLogs[index] = { ...mockAttendanceLogs[index], ...updates };
      return mockAttendanceLogs[index];
    }
    return null;
  },

  async checkOutAttendance(
    id: string, 
    checkOutTime: string, 
    notes?: string, 
    extraUpdates?: Partial<AttendanceLog>
  ): Promise<AttendanceLog | null> {
    const updates: Partial<AttendanceLog> = {
      check_out_time: checkOutTime,
      ...(notes ? { notes } : {}),
      ...(extraUpdates || {}),
    };
    return this.updateAttendanceLog(id, updates);
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

    const client = getClient();
    if (isSupabaseConfigured && client) {
      const { data, error } = await client.from('leave_requests').insert(newReq).select().single();
      if (!error && data) return data as LeaveRequest;
    }

    mockLeaveRequests.unshift(newReq);
    return newReq;
  },

  async getLeaveRequests(): Promise<LeaveRequest[]> {
    const client = getClient();
    if (isSupabaseConfigured && client) {
      // 1. Try explicit Foreign Key join
      const { data, error } = await client
        .from('leave_requests')
        .select('*, employee:employees!leave_requests_employee_id_fkey(*)')
        .order('created_at', { ascending: false });
      if (!error && data) return data as LeaveRequest[];

      // 2. Resilient fallback: standard select + manual hydration
      const { data: rawLeaves, error: rawError } = await client
        .from('leave_requests')
        .select('*')
        .order('created_at', { ascending: false });
      if (!rawError && rawLeaves) {
        const employees = await this.getEmployees();
        return rawLeaves.map((req: any) => ({
          ...req,
          employee: employees.find((e) => e.id === req.employee_id),
        })) as LeaveRequest[];
      }
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
    const client = getClient();
    if (isSupabaseConfigured && client) {
      const { data, error } = await client
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

    const client = getClient();
    if (isSupabaseConfigured && client) {
      const { data, error } = await client.from('violation_logs').insert(newLog).select().single();
      if (!error && data) return data as ViolationLog;
    }

    mockViolationLogs.unshift(newLog);
    return newLog;
  },

  async getViolationLogs(): Promise<ViolationLog[]> {
    const client = getClient();
    if (isSupabaseConfigured && client) {
      // 1. Try explicit Foreign Key join
      const { data, error } = await client
        .from('violation_logs')
        .select('*, employee:employees!violation_logs_employee_id_fkey(*), other_employee:employees!violation_logs_other_employee_id_fkey(*)')
        .order('created_at', { ascending: false });
      if (!error && data) return data as ViolationLog[];

      // 2. Resilient fallback: standard select + manual hydration
      const { data: rawViols, error: rawError } = await client
        .from('violation_logs')
        .select('*')
        .order('created_at', { ascending: false });
      if (!rawError && rawViols) {
        const employees = await this.getEmployees();
        return rawViols.map((log: any) => ({
          ...log,
          employee: employees.find((e) => e.id === log.employee_id),
          other_employee: log.other_employee_id ? employees.find((e) => e.id === log.other_employee_id) : undefined,
        })) as ViolationLog[];
      }
    }

    return mockViolationLogs.map((log) => ({
      ...log,
      employee: mockEmployees.find((e) => e.id === log.employee_id),
      other_employee: log.other_employee_id ? mockEmployees.find((e) => e.id === log.other_employee_id) : undefined,
    }));
  },

  async resolveViolation(id: string): Promise<boolean> {
    const client = getClient();
    if (isSupabaseConfigured && client) {
      const { error } = await client.from('violation_logs').update({ is_resolved: true }).eq('id', id);
      return !error;
    }
    const item = mockViolationLogs.find((v) => v.id === id);
    if (item) {
      item.is_resolved = true;
      return true;
    }
    return false;
  },

  async resolveAllViolations(): Promise<boolean> {
    const client = getClient();
    if (isSupabaseConfigured && client) {
      const { error } = await client.from('violation_logs').update({ is_resolved: true }).eq('is_resolved', false);
      return !error;
    }
    mockViolationLogs.forEach((v) => {
      v.is_resolved = true;
    });
    return true;
  },

  // -------------------------------------------------------------
  // SALARY ADVANCE REQUESTS
  // -------------------------------------------------------------
  async createSalaryAdvanceRequest(
    req: Omit<SalaryAdvanceRequest, 'id' | 'created_at' | 'updated_at' | 'status'>
  ): Promise<SalaryAdvanceRequest> {
    const newReq: SalaryAdvanceRequest = {
      id: generateUUID(),
      ...req,
      status: 'PENDING',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const client = getClient();
    if (isSupabaseConfigured && client) {
      const { data, error } = await client
        .from('salary_advance_requests')
        .insert(newReq)
        .select()
        .single();
      if (!error && data) return data as SalaryAdvanceRequest;
    }

    mockSalaryAdvanceRequests.unshift(newReq);
    return newReq;
  },

  async getSalaryAdvanceRequests(employeeId?: string): Promise<SalaryAdvanceRequest[]> {
    const client = getClient();
    if (isSupabaseConfigured && client) {
      let query = client
        .from('salary_advance_requests')
        .select('*, employee:employees!salary_advance_requests_employee_id_fkey(*), reviewer:employees!salary_advance_requests_reviewed_by_fkey(*)')
        .order('created_at', { ascending: false });

      if (employeeId) {
        query = query.eq('employee_id', employeeId);
      }

      const { data, error } = await query;
      if (!error && data) return data as SalaryAdvanceRequest[];

      // Resilient fallback: simple select + manual hydration
      let rawQuery = client.from('salary_advance_requests').select('*').order('created_at', { ascending: false });
      if (employeeId) rawQuery = rawQuery.eq('employee_id', employeeId);
      const { data: rawData, error: rawErr } = await rawQuery;
      if (!rawErr && rawData) {
        const employees = await this.getEmployees();
        return rawData.map((item: any) => ({
          ...item,
          employee: employees.find((e) => e.id === item.employee_id),
          reviewer: item.reviewed_by ? employees.find((e) => e.id === item.reviewed_by) : undefined,
        })) as SalaryAdvanceRequest[];
      }
    }

    const filtered = employeeId
      ? mockSalaryAdvanceRequests.filter((r) => r.employee_id === employeeId)
      : mockSalaryAdvanceRequests;

    return filtered.map((r) => ({
      ...r,
      employee: mockEmployees.find((e) => e.id === r.employee_id),
      reviewer: r.reviewed_by ? mockEmployees.find((e) => e.id === r.reviewed_by) : undefined,
    }));
  },

  async updateSalaryAdvanceStatus(
    id: string,
    status: 'APPROVED' | 'REJECTED',
    reviewedBy: string,
    rejectionReason?: string
  ): Promise<SalaryAdvanceRequest | null> {
    const updatePayload = {
      status,
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
      rejection_reason: rejectionReason || null,
      updated_at: new Date().toISOString(),
    };

    const client = getClient();
    if (isSupabaseConfigured && client) {
      const { data, error } = await client
        .from('salary_advance_requests')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();
      if (!error && data) return data as SalaryAdvanceRequest;
    }

    const index = mockSalaryAdvanceRequests.findIndex((r) => r.id === id);
    if (index !== -1) {
      mockSalaryAdvanceRequests[index] = {
        ...mockSalaryAdvanceRequests[index],
        ...updatePayload,
      };
      return mockSalaryAdvanceRequests[index];
    }
    return null;
  }
};
