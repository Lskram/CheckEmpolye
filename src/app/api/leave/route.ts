import { NextResponse } from 'next/server';
import { db } from '@/lib/db-store';
import { sendLineLeaveRequestAlert, sendLineLeaveActionAlert } from '@/lib/line';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

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

    if (!employeeId || !leaveType || !startDate || !endDate) {
      return NextResponse.json(
        { success: false, message: 'กรุณากรอกข้อมูลการลาให้ครบถ้วน (ประเภท และ วันที่)' },
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

    const cleanReason = (reason || '').trim() || 'ไม่ได้ระบุเหตุผล';

    // Calculate days count if not provided
    const days = daysCount || Math.max(1, Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1);

    const newLeave = await db.createLeaveRequest({
      employee_id: employee.id,
      leave_type: leaveType,
      start_date: startDate,
      end_date: endDate,
      days_count: days,
      reason: cleanReason,
    });

    // Fire LINE OA Notification asynchronously
    sendLineLeaveRequestAlert({
      leaveId: newLeave.id,
      employeeCode: employee.employee_code,
      fullName: employee.full_name,
      nickname: employee.nickname,
      avatarUrl: employee.avatar_url,
      leaveType: leaveType,
      startDate: startDate,
      endDate: endDate,
      daysCount: days,
      reason: cleanReason,
    }).catch((err) => console.error('[LINE OA Leave Alert Error]:', err));

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

    // Fire LINE OA Notification for Leave Approval/Rejection
    const emp = (updated as any).employee || await db.getEmployeeById(updated.employee_id);
    if (emp) {
      sendLineLeaveActionAlert({
        leaveId: updated.id,
        employeeCode: emp.employee_code,
        fullName: emp.full_name,
        nickname: emp.nickname,
        avatarUrl: emp.avatar_url,
        leaveType: updated.leave_type,
        status: status as 'APPROVED' | 'REJECTED',
        reviewerName: reviewedBy === '00000000-0000-0000-0000-000000000000' ? 'ท่านประธาน (SI01)' : 'ผู้บริหาร',
        rejectionReason: rejectionReason || null,
      }).catch((err) => console.error('[LINE OA Leave Action Alert Error]:', err));
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
