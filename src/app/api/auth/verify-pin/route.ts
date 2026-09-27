import { NextResponse } from 'next/server';
import { db } from '@/lib/db-store';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { employeeId, pinCode, hwid } = body;

    if (!employeeId || !pinCode) {
      return NextResponse.json(
        { success: false, message: 'กรุณากรอกรหัส PIN หรือรหัสผ่าน' },
        { status: 400 }
      );
    }

    const employee = await db.getEmployeeById(employeeId);
    if (!employee) {
      return NextResponse.json(
        { 
          success: false, 
          code: 'USER_NOT_FOUND', 
          message: '❌ ไม่พบบัญชีผู้ใช้นี้ในระบบ กรุณาสลับบัญชีหรือเข้าสู่ระบบใหม่' 
        },
        { status: 404 }
      );
    }

    if (employee.pin_hash !== pinCode.trim()) {
      return NextResponse.json(
        { 
          success: false, 
          code: 'INVALID_PIN', 
          message: '❌ รหัส PIN / รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง' 
        },
        { status: 401 }
      );
    }

    if (!employee.is_active) {
      return NextResponse.json(
        { 
          success: false, 
          code: 'ACCOUNT_SUSPENDED', 
          message: '⚠️ บัญชีพนักงานนี้ถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ' 
        },
        { status: 403 }
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
