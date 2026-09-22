import { NextResponse } from 'next/server';
import { db } from '@/lib/db-store';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { employeeId, pinCode, hwid } = body;

    if (!employeeId || !pinCode) {
      return NextResponse.json(
        { success: false, message: 'กรุณากรอกรหัส PIN' },
        { status: 400 }
      );
    }

    const employee = await db.getEmployeeById(employeeId);
    if (!employee) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบบัญชีผู้ใช้ กรุณาเข้าสู่ระบบใหม่' },
        { status: 404 }
      );
    }

    if (employee.pin_hash !== pinCode.trim()) {
      return NextResponse.json(
        { success: false, message: 'รหัส PIN ไม่ถูกต้อง' },
        { status: 401 }
      );
    }

    // Check HWID overlap on cached unlock as well
    if (hwid) {
      const otherEmp = await db.findEmployeeByHWID(hwid, employee.id);
      if (otherEmp) {
        await db.createViolationLog({
          employee_id: employee.id,
          violation_type: 'HWID_OVERLAP',
          severity: 'CRITICAL',
          description: `[Cached Unlock] ตรวจพบการใช้อุปกรณ์ซ้ำซ้อน (HWID: ${hwid}) ระหว่าง ${employee.full_name} และ ${otherEmp.full_name}`,
          hwid,
          other_employee_id: otherEmp.id,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'ยืนยันรหัส PIN สำเร็จ',
      data: {
        id: employee.id,
        employee_code: employee.employee_code,
        full_name: employee.full_name,
        nickname: employee.nickname,
        role: employee.role,
        hwid: employee.hwid,
      },
    });
  } catch (error: any) {
    console.error('Verify PIN error:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการตรวจสอบ PIN' },
      { status: 500 }
    );
  }
}
