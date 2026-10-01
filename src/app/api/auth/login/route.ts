import { NextResponse } from 'next/server';
import { db } from '@/lib/db-store';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const employeeCode = (body.employeeCode || body.code || '').trim();
    const pinCode = (body.pin || body.pinCode || '').trim();
    const hwid = body.hwid || '';

    if (!employeeCode || !pinCode) {
      return NextResponse.json(
        { success: false, message: 'กรุณากรอกรหัสพนักงานและรหัส PIN ให้ครบถ้วน' },
        { status: 400 }
      );
    }

    const employee = await db.getEmployeeByCode(employeeCode);
    if (!employee) {
      return NextResponse.json(
        { 
          success: false, 
          code: 'USER_NOT_FOUND', 
          message: `❌ ไม่พบบัญชีพนักงานรหัส "${employeeCode.toUpperCase()}" ในระบบ กรุณาตรวจสอบรหัสพนักงานอีกครั้ง หรือติดต่อผู้ดูแลระบบ` 
        },
        { status: 404 }
      );
    }

    // Verify PIN (Simple check or hash comparison)
    if (employee.pin_hash !== pinCode) {
      // Log invalid PIN attempt
      await db.createViolationLog({
        employee_id: employee.id,
        violation_type: 'INVALID_PIN_ATTEMPTS',
        severity: 'LOW',
        description: `พยายามเข้าสู่ระบบด้วยรหัส PIN ไม่ถูกต้อง สำหรับรหัสพนักงาน ${employee.employee_code}`,
        hwid: hwid || 'UNKNOWN',
      });

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
      } else if (employee.hwid !== hwid && employee.role !== 'ADMIN') {
        // Strict Device Binding Enforcement: Block login from unauthorized devices
        await db.createViolationLog({
          employee_id: employee.id,
          violation_type: 'DEVICE_MISMATCH',
          severity: 'HIGH',
          description: `พนักงาน ${employee.full_name} (${employee.employee_code}) พยายามเข้าสู่ระบบจากเครื่องอื่นที่ไม่ได้รับอนุญาต (เครื่องที่ผูกไว้: ${employee.hwid}, เครื่องที่พยายามเข้า: ${hwid})`,
          hwid,
        });

        return NextResponse.json(
          {
            success: false,
            code: 'DEVICE_BOUND_MISMATCH',
            message: `🚫 บัญชีนี้ถูกผูกไว้กับมือถือเครื่องอื่นแล้ว (${employee.hwid.slice(0, 10)}...) ไม่อนุญาตให้เข้าสู่ระบบจากเครื่องนี้ เพื่อความปลอดภัยและป้องกันการลงเวลาแทนกัน\n\nหากท่านเปลี่ยนโทรศัพท์มือถือใหม่ กรุณาแจ้งผู้บริหารเพื่อกด "ปลดล็อกอุปกรณ์" ในระบบ`,
            data: {
              boundHwid: employee.hwid,
              currentHwid: hwid,
            }
          },
          { status: 403 }
        );
      }
    }

    const employeePayload = {
      id: employee.id,
      employee_code: employee.employee_code,
      full_name: employee.full_name,
      nickname: employee.nickname,
      role: employee.role,
      position: employee.position,
      daily_wage: employee.daily_wage,
      hwid: employee.hwid,
    };

    return NextResponse.json({
      success: true,
      message: 'เข้าสู่ระบบสำเร็จ',
      employee: employeePayload,
      data: employeePayload,
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
