import { NextResponse } from 'next/server';
import { db } from '@/lib/db-store';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');

    const leaves = await db.getLeaveRequests();
    const filtered = employeeId ? leaves.filter((l) => l.employee_id === employeeId) : leaves;

    return NextResponse.json({ success: true, data: filtered });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { employeeId, leaveType, startDate, endDate, daysCount, reason } = body;

    if (!employeeId || !leaveType || !startDate || !endDate || !reason) {
      return NextResponse.json(
        { success: false, message: 'กรุณากรอกข้อมูลการลาให้ครบถ้วน (ประเภท, วันที่, เหตุผล)' },
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

    // Calculate days count if not provided
    const days = daysCount || Math.max(1, Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1);

    const newLeave = await db.createLeaveRequest({
      employee_id: employee.id,
      leave_type: leaveType,
      start_date: startDate,
      end_date: endDate,
      days_count: days,
      reason: reason.trim(),
    });

    return NextResponse.json({
      success: true,
      message: 'ยื่นคำขอลาสำเร็จ รอผู้บริหารตรวจสอบอนุมัติ',
      data: newLeave,
    });
  } catch (error: any) {
    console.error('Leave request error:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการยื่นใบลา: ' + error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { leaveId, status, reviewedBy, rejectionReason } = body;

    if (!leaveId || !status || !['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json(
        { success: false, message: 'ข้อมูลการอนุมัติไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    const updated = await db.updateLeaveStatus(leaveId, status, reviewedBy, rejectionReason);
    if (!updated) {
      return NextResponse.json({ success: false, message: 'ไม่พบใบลาที่ต้องการอนุมัติ' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: status === 'APPROVED' ? 'อนุมัติใบลาเรียบร้อยแล้ว' : 'ปฏิเสธคำขอลาเรียบร้อยแล้ว',
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
