import { NextResponse } from 'next/server';
import { db } from '@/lib/db-store';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('id');
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1), 10);
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()), 10);

    if (!employeeId) {
      return NextResponse.json({ success: false, message: 'กรุณาระบุรหัสพนักงาน' }, { status: 400 });
    }

    const [employee, allLogs, allLeaves] = await Promise.all([
      db.getEmployeeById(employeeId),
      db.getAttendanceLogs(500),
      db.getLeaveRequests(),
    ]);

    if (!employee) {
      return NextResponse.json({ success: false, message: 'ไม่พบข้อมูลพนักงาน' }, { status: 404 });
    }

    // Filter logs for this employee and requested month/year
    const empLogs = allLogs.filter((log) => {
      if (log.employee_id !== employeeId) return false;
      const d = new Date(log.check_in_time);
      return d.getMonth() + 1 === month && d.getFullYear() === year;
    });

    // Filter approved leaves for this month
    const empLeaves = allLeaves.filter((leave) => {
      if (leave.employee_id !== employeeId) return false;
      const start = new Date(leave.start_date);
      return start.getMonth() + 1 === month && start.getFullYear() === year;
    });

    const presentLogs = empLogs.filter((l) => l.status === 'PRESENT');
    const lateLogs = empLogs.filter((l) => l.status === 'LATE');
    const totalValidLogs = presentLogs.length + lateLogs.length;

    const onTimeRate = totalValidLogs > 0 ? Math.round((presentLogs.length / totalValidLogs) * 100) : 100;
    const totalAllowance = empLogs.reduce((sum, l) => sum + (Number(l.allowance) || 0), 0);

    // Map into daily calendar format: { "2026-09-01": { status: 'PRESENT', time: '07:35', allowance: 50 } }
    const calendarEvents: Record<string, any> = {};

    empLogs.forEach((log) => {
      const dateKey = log.check_in_time.split('T')[0];
      const timeStr = new Date(log.check_in_time).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
      calendarEvents[dateKey] = {
        type: 'ATTENDANCE',
        status: log.status,
        time: timeStr,
        allowance: log.allowance,
        distance: log.distance_from_store,
      };
    });

    empLeaves.forEach((leave) => {
      const dateKey = leave.start_date;
      calendarEvents[dateKey] = {
        type: 'LEAVE',
        leaveType: leave.leave_type,
        status: leave.status,
        reason: leave.reason,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        employee: {
          id: employee.id,
          employee_code: employee.employee_code,
          full_name: employee.full_name,
          nickname: employee.nickname,
          role: employee.role,
        },
        month,
        year,
        summary: {
          presentDays: presentLogs.length,
          lateDays: lateLogs.length,
          leaveDays: empLeaves.filter((l) => l.status === 'APPROVED').length,
          totalAllowance,
          onTimeRate,
        },
        calendarEvents,
        logs: empLogs,
        leaves: empLeaves,
      },
    });
  } catch (error: any) {
    console.error('Employee stats error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
