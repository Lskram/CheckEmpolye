import { NextResponse } from 'next/server';
import { db } from '@/lib/db-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const logs = await db.getViolationLogs();
    return NextResponse.json({ success: true, data: logs });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, resolveAll } = body;

    if (resolveAll) {
      await db.resolveAllViolations();
      return NextResponse.json({
        success: true,
        message: 'รับทราบและปิดเคสความปลอดภัยทั้งหมดเรียบร้อยแล้ว',
      });
    }

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'กรุณาระบุ ID ของบันทึกความปลอดภัย' },
        { status: 400 }
      );
    }

    const success = await db.resolveViolation(id);
    if (!success) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบบันทึกความปลอดภัยที่ต้องการแก้ไข' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'รับทราบและปิดเคสความปลอดภัยนี้เรียบร้อยแล้ว',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
