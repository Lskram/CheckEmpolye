import { NextResponse } from 'next/server';
import { db } from '@/lib/db-store';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('id') || searchParams.get('employeeId');
    const now = new Date();
    const currentBangkokYear = parseInt(new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric' }).format(now), 10);
    const currentBangkokMonth = parseInt(new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', month: 'numeric' }).format(now), 10);
    const todayBangkokDateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(now);

    const month = parseInt(searchParams.get('month') || String(currentBangkokMonth), 10);
    const year = parseInt(searchParams.get('year') || String(currentBangkokYear), 10);

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

    // Helper for Bangkok date string (YYYY-MM-DD)
    const getBangkokDateStr = (dateStr: string | Date) => {
      try {
        return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date(dateStr));
      } catch (e) {
        return String(dateStr).slice(0, 10);
      }
    };

    // Filter logs for this employee and requested month/year
    const empLogs = allLogs.filter((log) => {
      if (log.employee_id !== employeeId) return false;
      if (!log.check_in_time) return false;
      const bDate = getBangkokDateStr(log.check_in_time); // "YYYY-MM-DD"
      const [yStr, mStr] = bDate.split('-');
      return parseInt(mStr, 10) === month && parseInt(yStr, 10) === year;
    });

    // Find today's check-in log (if any)
    const todayLog = allLogs.find((log) => {
      if (log.employee_id !== employeeId) return false;
      if (!log.check_in_time) return false;
      return getBangkokDateStr(log.check_in_time) === todayBangkokDateStr;
    });

    // Filter approved leaves for this month
    const empLeaves = allLeaves.filter((leave) => {
      if (leave.employee_id !== employeeId) return false;
      if (!leave.start_date) return false;
      const bDate = getBangkokDateStr(leave.start_date);
      const [yStr, mStr] = bDate.split('-');
      return parseInt(mStr, 10) === month && parseInt(yStr, 10) === year;
    });

    const presentLogs = empLogs.filter((l) => l.status === 'PRESENT');
    const lateLogs = empLogs.filter((l) => l.status === 'LATE');
    const totalValidLogs = presentLogs.length + lateLogs.length;

    const onTimeRate = totalValidLogs > 0 ? Math.round((presentLogs.length / totalValidLogs) * 100) : 100;
    const totalAllowance = empLogs.reduce((sum, l) => sum + (Number(l.allowance) || 0), 0);

    // Map into daily calendar format: { "2026-09-01": { status: 'PRESENT', time: '07:35 น.', allowance: 50 } }
    const calendarEvents: Record<string, any> = {};

    empLogs.forEach((log) => {
      const dateKey = getBangkokDateStr(log.check_in_time);
      const timeStr = new Date(log.check_in_time).toLocaleTimeString('th-TH', {
        timeZone: 'Asia/Bangkok',
        hour: '2-digit',
        minute: '2-digit',
      }) + ' น.';

      const checkOutStr = log.check_out_time
        ? new Date(log.check_out_time).toLocaleTimeString('th-TH', {
            timeZone: 'Asia/Bangkok',
            hour: '2-digit',
            minute: '2-digit',
          }) + ' น.'
        : null;

      calendarEvents[dateKey] = {
        type: 'ATTENDANCE',
        status: log.status,
        time: timeStr,
        checkInTime: timeStr,
        checkOutTime: checkOutStr,
        allowance: Number(log.allowance) || 0,
        distance: log.distance_from_store,
      };
    });

    empLeaves.forEach((leave) => {
      const dateKey = getBangkokDateStr(leave.start_date);
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
        todayLog: todayLog ? {
          id: todayLog.id,
          status: todayLog.status,
          rawCheckInTime: todayLog.check_in_time,
          rawCheckOutTime: todayLog.check_out_time || null,
          checkInTime: new Date(todayLog.check_in_time).toLocaleTimeString('th-TH', {
            timeZone: 'Asia/Bangkok',
            hour: '2-digit',
            minute: '2-digit',
          }) + ' น.',
          checkOutTime: todayLog.check_out_time
            ? new Date(todayLog.check_out_time).toLocaleTimeString('th-TH', {
                timeZone: 'Asia/Bangkok',
                hour: '2-digit',
                minute: '2-digit',
              }) + ' น.'
            : null,
          allowance: Number(todayLog.allowance) || 0,
          distance: todayLog.distance_from_store,
          isLate: todayLog.status === 'LATE',
        } : null,
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
