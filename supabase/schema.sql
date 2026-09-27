-- =========================================================
-- SUPABASE POSTGRESQL SCHEMA FOR TIME & ATTENDANCE PWA
-- SHOP: สีแสงยางยนต์ YOKOHAMA NAYA COSMIS
-- =========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. EMPLOYEES TABLE
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_code VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    nickname VARCHAR(100),
    pin_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'STAFF' CHECK (role IN ('STAFF', 'ADMIN', 'SUPERVISOR')),
    position VARCHAR(100) DEFAULT 'ช่างบริการทั่วไป',
    phone_number VARCHAR(50),
    daily_wage DECIMAL(10, 2) DEFAULT 400.00,
    hwid VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index on employee_code for fast auth lookups
CREATE INDEX IF NOT EXISTS idx_employees_code ON employees(employee_code);
CREATE INDEX IF NOT EXISTS idx_employees_hwid ON employees(hwid);

-- 2. STORE SETTINGS & GEOFENCE TABLE
CREATE TABLE IF NOT EXISTS store_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_name VARCHAR(255) NOT NULL DEFAULT 'สีแสงยางยนต์ YOKOHAMA NAYA COSMIS',
    store_lat DECIMAL(10, 7) NOT NULL DEFAULT 15.1104120,
    store_lng DECIMAL(10, 7) NOT NULL DEFAULT 104.3584340,
    radius_meters DECIMAL(10, 2) NOT NULL DEFAULT 50.00,
    standard_time TIME NOT NULL DEFAULT '07:40:00',
    late_deadline TIME NOT NULL DEFAULT '08:00:00',
    closing_time TIME NOT NULL DEFAULT '17:30:00',
    allowance_amount DECIMAL(10, 2) NOT NULL DEFAULT 50.00,
    min_work_hours_for_allowance DECIMAL(4, 2) DEFAULT 4.00,
    ot_rate_per_hour DECIMAL(10, 2) DEFAULT 60.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ATTENDANCE LOGS TABLE (Individual Check-in / Check-out Events)
CREATE TABLE IF NOT EXISTS attendance_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    check_in_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    check_out_time TIMESTAMPTZ,
    work_hours DECIMAL(4, 2) DEFAULT 0.00,
    ot_hours DECIMAL(4, 2) DEFAULT 0.00,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    accuracy DECIMAL(10, 2),
    distance_from_store DECIMAL(10, 2),
    hwid VARCHAR(255),
    status VARCHAR(50) NOT NULL CHECK (status IN ('PRESENT', 'LATE', 'EARLY_LEAVE', 'MISSING_CHECKOUT', 'OUT_OF_GEOFENCE_BLOCKED')),
    allowance DECIMAL(10, 2) DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attendance_employee ON attendance_logs(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_time ON attendance_logs(check_in_time);

-- 4. DAILY ATTENDANCE SUMMARIES TABLE
CREATE TABLE IF NOT EXISTS daily_attendance_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('PRESENT', 'LATE', 'ABSENT', 'LEAVE', 'MISSING_CHECKOUT')),
    first_check_in TIMESTAMPTZ,
    allowance_amount DECIMAL(10, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(employee_id, date)
);

CREATE INDEX IF NOT EXISTS idx_daily_summary_date ON daily_attendance_summaries(date);

-- 5. LEAVE REQUESTS TABLE
CREATE TABLE IF NOT EXISTS leave_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    leave_type VARCHAR(50) NOT NULL CHECK (leave_type IN ('SICK', 'BUSINESS', 'ANNUAL', 'OTHER')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_count DECIMAL(4, 1) NOT NULL DEFAULT 1.0,
    reason TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    reviewed_by UUID REFERENCES employees(id),
    reviewed_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leave_employee ON leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_status ON leave_requests(status);

-- 6. VIOLATION & SECURITY LOGS TABLE (HWID Overlap & Multi-Account Detection)
CREATE TABLE IF NOT EXISTS violation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    violation_type VARCHAR(100) NOT NULL CHECK (violation_type IN ('HWID_OVERLAP', 'DEVICE_MISMATCH', 'OUT_OF_GEOFENCE_BLOCKED', 'INVALID_PIN_ATTEMPTS', 'FAKE_GPS_DETECTED', 'SUSPICIOUS_TIME_TAMPERING')),
    severity VARCHAR(50) NOT NULL DEFAULT 'CRITICAL' CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    description TEXT NOT NULL,
    hwid VARCHAR(255),
    other_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    ip_address VARCHAR(100),
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_violations_employee ON violation_logs(employee_id);
CREATE INDEX IF NOT EXISTS idx_violations_created ON violation_logs(created_at);

-- 7. OT REQUESTS TABLE (Overtime Requests)
CREATE TABLE IF NOT EXISTS ot_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    hours DECIMAL(4, 2) NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    reviewed_by UUID REFERENCES employees(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ot_employee ON ot_requests(employee_id);

-- 8. MONTHLY PAYROLL SUMMARIES TABLE
CREATE TABLE IF NOT EXISTS monthly_payroll_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    month_year VARCHAR(7) NOT NULL, -- Format: 'YYYY-MM' (e.g. '2026-09')
    total_work_days INT DEFAULT 0,
    total_present_days INT DEFAULT 0,
    total_late_days INT DEFAULT 0,
    total_absent_days INT DEFAULT 0,
    total_allowance DECIMAL(10, 2) DEFAULT 0.00,
    total_ot_hours DECIMAL(6, 2) DEFAULT 0.00,
    total_ot_amount DECIMAL(10, 2) DEFAULT 0.00,
    net_payout DECIMAL(10, 2) DEFAULT 0.00,
    is_paid BOOLEAN DEFAULT FALSE,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(employee_id, month_year)
);

CREATE INDEX IF NOT EXISTS idx_payroll_month ON monthly_payroll_summaries(month_year);

-- 9. ANNOUNCEMENTS TABLE (Store News & Broadcasts)
CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    priority VARCHAR(50) DEFAULT 'NORMAL' CHECK (priority IN ('NORMAL', 'URGENT')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. AUDIT LOGS TABLE (Executive Actions Audit Trail)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES employees(id),
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(100) NOT NULL,
    target_id VARCHAR(100),
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. SALARY ADVANCE REQUESTS TABLE (Employee Advance Requests)
CREATE TABLE IF NOT EXISTS salary_advance_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    request_date DATE NOT NULL,
    reason TEXT NOT NULL,
    needed_before_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    reviewed_by UUID REFERENCES employees(id),
    reviewed_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_salary_advance_employee ON salary_advance_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_salary_advance_status ON salary_advance_requests(status);

-- =========================================================
-- PERMISSIONS & REALTIME CONFIGURATION (DISABLE RLS)
-- =========================================================
ALTER TABLE IF EXISTS employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS store_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS attendance_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS daily_attendance_summaries DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS leave_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS violation_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ot_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS monthly_payroll_summaries DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS announcements DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS salary_advance_requests DISABLE ROW LEVEL SECURITY;

-- Enable Realtime Broadcast for Web & Mobile Synchronization
ALTER PUBLICATION supabase_realtime ADD TABLE salary_advance_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE attendance_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE leave_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE violation_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE employees;
ALTER PUBLICATION supabase_realtime ADD TABLE store_settings;

-- =========================================================
-- INITIAL SEED DATA
-- =========================================================

-- Insert Default Store Settings
INSERT INTO store_settings (id, store_name, store_lat, store_lng, radius_meters, standard_time, late_deadline, closing_time, allowance_amount)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'สีแสงยางยนต์ YOKOHAMA NAYA COSMIS',
    15.1104120,
    104.3584340,
    50.00,
    '07:40:00',
    '08:00:00',
    '17:30:00',
    50.00
) ON CONFLICT (id) DO NOTHING;

-- Insert Admin and Demo Employees
INSERT INTO employees (id, employee_code, full_name, nickname, pin_hash, role, position, daily_wage, hwid)
VALUES 
    ('00000000-0000-0000-0000-000000000000', 'SI01', 'ผู้บริหารสูงสุด (Executive Director)', 'ท่านประธาน', '5101', 'ADMIN', 'กรรมการผู้จัดการ', 1000.00, NULL),
    ('11111111-1111-1111-1111-111111111111', 'ADMIN01', 'ผู้จัดการ ระบบ (Admin)', 'แอดมิน', '1234', 'ADMIN', 'ผู้จัดการศูนย์บริการ', 700.00, NULL),
    ('22222222-2222-2222-2222-222222222222', 'EMP001', 'สมชาย สายตรง (Somchai)', 'ชาย', '1234', 'STAFF', 'หัวหน้าช่างช่วงล่าง', 500.00, NULL),
    ('33333333-3333-3333-3333-333333333333', 'EMP002', 'วิภาดา ขยันยิ่ง (Wiphada)', 'ภา', '1234', 'STAFF', 'เจ้าหน้าที่ต้อนรับ/แคชเชียร์', 450.00, NULL),
    ('44444444-4444-4444-4444-444444444444', 'EMP003', 'กิตติพงษ์ ตรงเวลา (Kittiphong)', 'กิต', '1234', 'STAFF', 'ช่างเปลี่ยนยาง/ถ่วงล้อ', 400.00, NULL)
ON CONFLICT (employee_code) DO NOTHING;
