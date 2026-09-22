import { NextResponse } from 'next/server';
import { db } from '@/lib/db-store';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { employeeCode, pinCode, hwid } = body;

    if (!employeeCode || !pinCode) {
      return NextResponse.json(
        { success: false, message: 'กรุณากรอกรหัสพนักงานและรหัส PIN ให้ครบถ้วน' },
        { status: 400 }
      );
    }

    const employee = await db.getEmployeeByCode(employeeCode);
    if (!employee) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบรหัสพนักงานในระบบ กรุณาตรวจสอบอีกครั้ง' },
        { status: 404 }
      );
    }

    // Verify PIN (Simple check or hash comparison)
    if (employee.pin_hash !== pinCode.trim()) {
      // Log invalid PIN attempt
      await db.createViolationLog({
        employee_id: employee.id,
        violation_type: 'INVALID_PIN_ATTEMPTS',
        severity: 'LOW',
        description: `พยายามเข้าสู่ระบบด้วยรหัส PIN ไม่ถูกต้อง สำหรับรหัสพนักงาน ${employee.employee_code}`,
        hwid: hwid || 'UNKNOWN',
      });

      return NextResponse.json(
        { success: false, message: 'รหัส PIN ไม่ถูกต้อง' },
        { status: 401 }
      );
    }

    if (!employee.is_active) {
      return NextResponse.json(
        { success: false, message: 'บัญชีพนักงานนี้ถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ' },
        { status: 403 }
      );
    }

    // HWID Binding & Overlap Detection Flow
    let violationTriggered = false;
    let violationMessage = '';

    if (hwid) {
      // Check if this HWID is bound to ANOTHER employee
      const otherEmployeeWithHWID = await db.findEmployeeByHWID(hwid, employee.id);

      if (otherEmployeeWithHWID) {
        violationTriggered = true;
        violationMessage = `[CRITICAL HWID OVERLAP] อุปกรณ์นี้ (${hwid}) เคยผูกกับพนักงาน: ${otherEmployeeWithHWID.full_name} (${otherEmployeeWithHWID.employee_code})`;

        // Record critical violation log into DB
        await db.createViolationLog({
          employee_id: employee.id,
          violation_type: 'HWID_OVERLAP',
          severity: 'CRITICAL',
          description: `ตรวจพบการใช้อุปกรณ์ซ้ำซ้อน (HWID: ${hwid}) ระหว่าง ${employee.full_name} (${employee.employee_code}) และ ${otherEmployeeWithHWID.full_name} (${otherEmployeeWithHWID.employee_code})`,
          hwid,
          other_employee_id: otherEmployeeWithHWID.id,
        });

        console.warn(`[HWID VIOLATION DETECTED]: ${violationMessage}`);
      }

      // If employee HWID is empty, bind it permanently
      if (!employee.hwid) {
        await db.updateEmployee(employee.id, { hwid });
        employee.hwid = hwid;
      } else if (employee.hwid !== hwid) {
        // Device mismatch warning
        await db.createViolationLog({
          employee_id: employee.id,
          violation_type: 'DEVICE_MISMATCH',
          severity: 'MEDIUM',
          description: `พนักงาน ${employee.full_name} เข้าสู่ระบบด้วยเครื่องใหม่ (เดิม: ${employee.hwid}, ปัจจุบัน: ${hwid})`,
          hwid,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'เข้าสู่ระบบสำเร็จ',
      data: {
        id: employee.id,
        employee_code: employee.employee_code,
        full_name: employee.full_name,
        nickname: employee.nickname,
        role: employee.role,
        hwid: employee.hwid,
      },
      warning: violationTriggered ? violationMessage : null,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ: ' + error.message },
      { status: 500 }
    );
  }
}
