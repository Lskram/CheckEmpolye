import { NextResponse } from 'next/server';
import { db } from '@/lib/db-store';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const id = searchParams.get('id');

    if (!code && !id) {
      return NextResponse.json({ success: false, message: 'กรุณาระบุรหัสพนักงานหรือ ID' }, { status: 400 });
    }

    let employee = null;
    if (id) {
      employee = await db.getEmployeeById(id.trim());
    }
    if (!employee && code) {
      employee = await db.getEmployeeByCode(code.trim().toUpperCase());
    }

    if (!employee) {
      return NextResponse.json({
        success: false,
        found: false,
        message: `ไม่พบบัญชีพนักงานในระบบ`,
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
        avatar_url: employee.avatar_url || null,
        position: employee.position,
        daily_wage: employee.daily_wage,
        role: employee.role,
        is_active: employee.is_active,
        has_hwid: !!employee.hwid,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

