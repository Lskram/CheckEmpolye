-- =========================================================
-- SUPABASE POSTGRESQL SCHEMA FOR TIME & ATTENDANCE PWA
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
    store_name VARCHAR(255) NOT NULL DEFAULT 'สำนักงานใหญ่ (Headquarters)',
    store_lat DECIMAL(10, 7) NOT NULL DEFAULT 13.7563000,
    store_lng DECIMAL(10, 7) NOT NULL DEFAULT 100.5018000,
    radius_meters DECIMAL(10, 2) NOT NULL DEFAULT 50.00,
    standard_time TIME NOT NULL DEFAULT '07:40:00',
    late_deadline TIME NOT NULL DEFAULT '08:00:00',
    allowance_amount DECIMAL(10, 2) NOT NULL DEFAULT 50.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ATTENDANCE LOGS TABLE (Individual Check-in Events)
CREATE TABLE IF NOT EXISTS attendance_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    check_in_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    accuracy DECIMAL(10, 2),
    distance_from_store DECIMAL(10, 2),
    hwid VARCHAR(255),
    status VARCHAR(50) NOT NULL CHECK (status IN ('PRESENT', 'LATE', 'OUT_OF_GEOFENCE_BLOCKED')),
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
    status VARCHAR(50) NOT NULL CHECK (status IN ('PRESENT', 'LATE', 'ABSENT', 'LEAVE')),
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
    violation_type VARCHAR(100) NOT NULL CHECK (violation_type IN ('HWID_OVERLAP', 'DEVICE_MISMATCH', 'OUT_OF_GEOFENCE_BLOCKED', 'INVALID_PIN_ATTEMPTS')),
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

-- =========================================================
-- INITIAL SEED DATA
-- =========================================================

-- Insert Default Store Settings
INSERT INTO store_settings (id, store_name, store_lat, store_lng, radius_meters, standard_time, late_deadline, allowance_amount)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'ร้านสาขาหลัก สยามสแควร์ (Main Store)',
    13.7460000,
    100.5340000,
    50.00,
    '07:40:00',
    '08:00:00',
    50.00
) ON CONFLICT (id) DO NOTHING;

-- Insert Admin and Demo Employees (PINs default to '1234' with simple demo hash)
INSERT INTO employees (id, employee_code, full_name, nickname, pin_hash, role, hwid)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'ADMIN01', 'ผู้จัดการ ระบบ (Admin)', 'แอดมิน', '1234', 'ADMIN', NULL),
    ('22222222-2222-2222-2222-222222222222', 'EMP001', 'สมชาย สายตรง (Somchai)', 'ชาย', '1234', 'STAFF', NULL),
    ('33333333-3333-3333-3333-333333333333', 'EMP002', 'วิภาดา ขยันยิ่ง (Wiphada)', 'ภา', '1234', 'STAFF', NULL),
    ('44444444-4444-4444-4444-444444444444', 'EMP003', 'กิตติพงษ์ ตรงเวลา (Kittiphong)', 'กิต', '1234', 'STAFF', NULL)
ON CONFLICT (employee_code) DO NOTHING;
