import { NextResponse } from 'next/server';
import { db } from '@/lib/db-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const employees = await db.getEmployees();
    // Omit sensitive pin_hash in general list
    const sanitized = employees.map(({ pin_hash, ...rest }) => rest);
    return NextResponse.json({ success: true, data: sanitized });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { employeeCode, fullName, nickname, pin, role } = body;

    if (!employeeCode || !fullName || !pin) {
      return NextResponse.json(
        { success: false, message: 'กรุณากรอกรหัสพนักงาน ชื่อ-นามสกุล และรหัส PIN 4 หลัก' },
        { status: 400 }
      );
    }

    // Check if code already exists
    const existing = await db.getEmployeeByCode(employeeCode);
    if (existing) {
      return NextResponse.json(
        { success: false, message: `รหัสพนักงาน ${employeeCode} มีอยู่ในระบบแล้ว` },
        { status: 400 }
      );
    }

    const newEmp = await db.createEmployee({
      employee_code: employeeCode.trim().toUpperCase(),
      full_name: fullName.trim(),
      nickname: nickname?.trim() || '',
      pin_hash: pin.trim(), // Stored/Hashed PIN
      role: role || 'STAFF',
      hwid: null,
      is_active: true,
    });

    const { pin_hash, ...sanitized } = newEmp;

    return NextResponse.json({
      success: true,
      message: `สร้างบัญชีพนักงาน ${newEmp.employee_code} (${newEmp.full_name}) สำเร็จ พร้อมใช้งาน`,
      data: sanitized,
    });
  } catch (error: any) {
    console.error('Create employee error:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการสร้างบัญชีพนักงาน: ' + error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, fullName, nickname, pin, role, isActive, clearHWID } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: 'กรุณาระบุ ID พนักงาน' }, { status: 400 });
    }

    const updates: any = {};
    if (fullName) updates.full_name = fullName.trim();
    if (nickname !== undefined) updates.nickname = nickname.trim();
    if (pin) updates.pin_hash = pin.trim();
    if (role) updates.role = role;
    if (isActive !== undefined) updates.is_active = isActive;
    if (clearHWID) updates.hwid = null; // Admin can reset bound device

    const updatedEmp = await db.updateEmployee(id, updates);
    if (!updatedEmp) {
      return NextResponse.json({ success: false, message: 'ไม่พบพนักงานที่ต้องการแก้ไข' }, { status: 404 });
    }

    const { pin_hash, ...sanitized } = updatedEmp;
    return NextResponse.json({
      success: true,
      message: 'อัปเดตข้อมูลพนักงานสำเร็จ',
      data: sanitized,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'กรุณาระบุ ID พนักงาน' }, { status: 400 });
    }

    const success = await db.deleteEmployee(id);
    return NextResponse.json({
      success,
      message: success ? 'ลบบัญชีพนักงานเรียบร้อยแล้ว' : 'ไม่สามารถลบข้อมูลได้',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
