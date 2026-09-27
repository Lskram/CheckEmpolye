import { NextResponse } from 'next/server';
import { db } from '@/lib/db-store';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code || code.trim().length === 0) {
      return NextResponse.json({ success: false, message: 'กรุณาระบุรหัสพนักงาน' }, { status: 400 });
    }

    const employee = await db.getEmployeeByCode(code.trim().toUpperCase());
    if (!employee) {
      return NextResponse.json({
        success: false,
        found: false,
        message: `ไม่พบบัญชีพนักงานรหัส "${code.trim().toUpperCase()}" ในระบบ`,
      });
    }

    return NextResponse.json({
      success: true,
      found: true,
      employee: {
        id: employee.id,
        employee_code: employee.employee_code,
        full_name: employee.full_name,
        nickname: employee.nickname,
        role: employee.role,
        is_active: employee.is_active,
        has_hwid: !!employee.hwid,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
