import { NextResponse } from 'next/server';
import { db } from '@/lib/db-store';
import { sendLineAdvanceRequestAlert, sendLineAdvanceActionAlert } from '@/lib/line';

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

    // Fire LINE OA Notification asynchronously (Non-blocking)
    sendLineAdvanceRequestAlert({
      advanceId: newAdvance.id,
      employeeCode: employee.employee_code,
      fullName: employee.full_name,
      nickname: employee.nickname,
      avatarUrl: employee.avatar_url,
      amount: Number(amount),
      reason: reason.trim(),
      neededBeforeDate: neededBeforeDate || null,
      requestDate: requestDate || new Date().toISOString().slice(0, 10),
    }).catch((err) => console.error('[LINE OA Advance Alert Error]:', err));

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

    // Fire LINE OA Notification for Approval/Rejection
    const emp = (updated as any).employee || await db.getEmployeeById(updated.employee_id);
    if (emp) {
      sendLineAdvanceActionAlert({
        advanceId: updated.id,
        employeeCode: emp.employee_code,
        fullName: emp.full_name,
        nickname: emp.nickname,
        avatarUrl: emp.avatar_url,
        amount: Number(updated.amount),
        status: status as 'APPROVED' | 'REJECTED',
        reviewerName: reviewedBy === '00000000-0000-0000-0000-000000000000' ? 'ท่านประธาน (SI01)' : 'ผู้บริหาร',
        rejectionReason: rejectionReason || null,
      }).catch((err) => console.error('[LINE OA Advance Action Alert Error]:', err));
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
