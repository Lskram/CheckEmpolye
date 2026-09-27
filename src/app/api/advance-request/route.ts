import { NextResponse } from 'next/server';
import { db } from '@/lib/db-store';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');

    const requests = await db.getSalaryAdvanceRequests(employeeId || undefined);
    return NextResponse.json({ success: true, data: requests });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { employeeId, amount, requestDate, reason, neededBeforeDate } = body;

    if (!employeeId || !amount || Number(amount) <= 0 || !reason) {
      return NextResponse.json(
        { success: false, message: 'กรุณากรอกข้อมูลการขอเบิกเงินให้ครบถ้วน (ยอดเงิน และ เหตุผล)' },
        { status: 400 }
      );
    }

    const employee = await db.getEmployeeById(employeeId);
    if (!employee) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบข้อมูลพนักงาน' },
        { status: 404 }
      );
    }

    const newAdvance = await db.createSalaryAdvanceRequest({
      employee_id: employee.id,
      amount: Number(amount),
      request_date: requestDate || new Date().toISOString().slice(0, 10),
      reason: reason.trim(),
      needed_before_date: neededBeforeDate || null,
    });

    return NextResponse.json({
      success: true,
      message: `ยื่นขอเบิกเงินล่วงหน้า ${Number(amount).toLocaleString()} บาท เรียบร้อย รอผู้บริหารอนุมัติ`,
      data: newAdvance,
    });
  } catch (error: any) {
    console.error('Salary advance request error:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการยื่นขอเบิกเงิน: ' + error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, status, reviewedBy, rejectionReason } = body;

    if (!id || !status || !['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json(
        { success: false, message: 'ข้อมูลการพิจารณาอนุมัติไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    const updated = await db.updateSalaryAdvanceStatus(id, status, reviewedBy, rejectionReason);
    if (!updated) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบรายการขอเบิกเงินที่ต้องการอนุมัติ' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: status === 'APPROVED' ? 'อนุมัติการขอเบิกเงินเรียบร้อย' : 'ปฏิเสธคำขอเบิกเงินเรียบร้อย',
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
