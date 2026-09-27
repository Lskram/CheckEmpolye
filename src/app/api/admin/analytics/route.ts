import { NextResponse } from 'next/server';
import { db } from '@/lib/db-store';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'monthly'; // 'daily' | 'weekly' | 'monthly'

    const [employees, attendanceLogs, leaveRequests, violationLogs, settings, salaryAdvances] = await Promise.all([
      db.getEmployees(),
      db.getAttendanceLogs(300),
      db.getLeaveRequests(),
      db.getViolationLogs(),
      db.getStoreSettings(),
      db.getSalaryAdvanceRequests(),
    ]);

    // Thailand Timezone (Asia/Bangkok) Date Formatter
    const getBangkokDateStr = (date: Date | string) =>
      new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date(date));

    const todayBangkokStr = getBangkokDateStr(new Date());

    // Split staff vs executives (Executives have special privileges and are not tracked for attendance)
    const staffEmployees = employees.filter((e) => e.role !== 'ADMIN');
    const executiveEmployees = employees.filter((e) => e.role === 'ADMIN');

    // 1. TODAY's Attendance Calculation (Unique Staff Headcount)
    const todayLogs = attendanceLogs.filter((log) => {
      if (!log.check_in_time) return false;
      return getBangkokDateStr(log.check_in_time) === todayBangkokStr;
    });

    const todayStaffMap = new Map<string, {
      status: 'PRESENT' | 'LATE';
      checkInTimeStr: string;
      checkOutTimeStr?: string | null;
      rawCheckInTime?: string | null;
      rawCheckOutTime?: string | null;
      distanceStr: string;
      allowance: number;
    }>();

    todayLogs.forEach((log) => {
      const isStaff = staffEmployees.some((e) => e.id === log.employee_id);
      if (!isStaff) return;

      const existing = todayStaffMap.get(log.employee_id);
      const isPresent = log.status === 'PRESENT';

      if (!existing || (isPresent && existing.status !== 'PRESENT')) {
        const timeObj = new Date(log.check_in_time);
        const timeStr = timeObj.toLocaleTimeString('th-TH', {
          timeZone: 'Asia/Bangkok',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }) + ' น.';

        const checkOutTimeStr = log.check_out_time
          ? new Date(log.check_out_time).toLocaleTimeString('th-TH', {
              timeZone: 'Asia/Bangkok',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false,
            }) + ' น.'
          : null;

        const distM = (log as any).distance_meters ?? (log as any).distance_from_store;
        const distanceStr = distM != null ? `พิกัดในร้าน (${Math.round(distM)} ม.)` : 'พิกัดในร้าน (5 ม.)';

        todayStaffMap.set(log.employee_id, {
          status: isPresent ? 'PRESENT' : 'LATE',
          checkInTimeStr: timeStr,
          checkOutTimeStr,
          rawCheckInTime: log.check_in_time,
          rawCheckOutTime: log.check_out_time || null,
          distanceStr,
          allowance: Number(log.allowance) || 0,
        });
      }
    });

    let todayPresent = 0;
    let todayLate = 0;
    let todayAllowancePaid = 0;

    staffEmployees.forEach((emp) => {
      const record = todayStaffMap.get(emp.id);
      if (record) {
        if (record.status === 'PRESENT') todayPresent += 1;
        else if (record.status === 'LATE') todayLate += 1;
        todayAllowancePaid += record.allowance;
      }
    });

    const todayCheckedIn = todayPresent + todayLate;
    const todayPending = Math.max(0, staffEmployees.length - todayCheckedIn);
    const todayOnTimeRate = todayCheckedIn > 0 ? Math.round((todayPresent / todayCheckedIn) * 100) : 100;

    // 2. Period Filtered Logs
    const now = new Date();
    let filterStartDate = new Date();

    if (period === 'daily') {
      filterStartDate.setHours(0, 0, 0, 0);
    } else if (period === 'weekly') {
      filterStartDate.setDate(now.getDate() - 7);
    } else {
      // monthly (30 days)
      filterStartDate.setDate(now.getDate() - 30);
    }

    const filteredLogs = attendanceLogs.filter((log) => {
      if (!log.check_in_time) return false;
      return new Date(log.check_in_time) >= filterStartDate;
    });

    const periodPresentLogs = filteredLogs.filter((l) => l.status === 'PRESENT');
    const periodLateLogs = filteredLogs.filter((l) => l.status === 'LATE');
    const periodBlockedLogs = filteredLogs.filter((l) => l.status === 'OUT_OF_GEOFENCE_BLOCKED');
    const periodAllowancePaid = filteredLogs.reduce((sum, l) => sum + (Number(l.allowance) || 0), 0);

    // 3. Per Employee Allowance Summary (For Staff ONLY)
    const employeeAllowanceMap = new Map<string, { count: number; totalAmount: number; lateCount: number; presentCount: number }>();
    staffEmployees.forEach((emp) => {
      employeeAllowanceMap.set(emp.id, { count: 0, totalAmount: 0, lateCount: 0, presentCount: 0 });
    });

    filteredLogs.forEach((log) => {
      const current = employeeAllowanceMap.get(log.employee_id);
      if (!current) return;
      if (log.status === 'PRESENT') {
        current.presentCount += 1;
        current.count += 1;
        current.totalAmount += Number(log.allowance) || 0;
      } else if (log.status === 'LATE') {
        current.lateCount += 1;
      }
      employeeAllowanceMap.set(log.employee_id, current);
    });

    // Allowance reports for staff only (SORTED: Latest Check-in time descending)
    const allowanceReports = staffEmployees.map((emp) => {
      const stats = employeeAllowanceMap.get(emp.id) || { count: 0, totalAmount: 0, lateCount: 0, presentCount: 0 };
      const todayInfo = todayStaffMap.get(emp.id);

      return {
        employeeId: emp.id,
        employeeCode: emp.employee_code,
        fullName: emp.full_name,
        nickname: emp.nickname,
        role: emp.role,
        hwid: emp.hwid,
        allowanceCount: stats.count,
        totalAllowance: stats.totalAmount,
        presentCount: stats.presentCount,
        lateCount: stats.lateCount,
        todayStatus: todayInfo ? todayInfo.status : 'PENDING',
        todayCheckInTime: todayInfo ? todayInfo.checkInTimeStr : '-',
        todayRawCheckInTime: todayInfo ? todayInfo.rawCheckInTime : null,
        todayCheckOutTime: todayInfo ? todayInfo.checkOutTimeStr : '-',
        todayRawCheckOutTime: todayInfo ? todayInfo.rawCheckOutTime : null,
        todayDistance: todayInfo ? todayInfo.distanceStr : '-',
        todayAllowance: todayInfo ? todayInfo.allowance : 0,
      };
    }).sort((a, b) => {
      if (a.todayRawCheckInTime && b.todayRawCheckInTime) {
        return new Date(b.todayRawCheckInTime).getTime() - new Date(a.todayRawCheckInTime).getTime();
      }
      if (a.todayRawCheckInTime) return -1;
      if (b.todayRawCheckInTime) return 1;
      return a.employeeCode.localeCompare(b.employeeCode);
    });

    // Sanitized all accounts list for Employee Directory
    const allEmployeesList = employees.map(({ pin_hash, ...rest }) => rest);

    // 4. Calculate Day-by-Day Stats for the Chart from Supabase Attendance Logs (Bangkok Time)
    const dayNames = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสฯ', 'ศุกร์', 'เสาร์'];
    const past7Days = [];
    let totalWeeklyOntime = 0;
    let totalWeeklyLate = 0;
    let totalWeeklyAllowance = 0;

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = getBangkokDateStr(d);
      const dayName = dayNames[d.getDay()];

      // Filter logs for this specific Bangkok date
      const dayLogs = attendanceLogs.filter((log) => {
        if (!log.check_in_time) return false;
        return getBangkokDateStr(log.check_in_time) === dateStr;
      });

      const dayOntime = dayLogs.filter((l) => l.status === 'PRESENT').length;
      const dayLate = dayLogs.filter((l) => l.status === 'LATE').length;
      const dayTotal = dayOntime + dayLate;
      const dayAllowance = dayLogs.reduce((sum, l) => sum + (Number(l.allowance) || 0), 0);
      const dayPercent = dayTotal > 0 ? Math.round((dayOntime / dayTotal) * 100) : 0;

      totalWeeklyOntime += dayOntime;
      totalWeeklyLate += dayLate;
      totalWeeklyAllowance += dayAllowance;

      past7Days.push({
        date: dateStr,
        day: dayName,
        ontime: dayOntime,
        late: dayLate,
        total: dayTotal,
        allowance: dayAllowance,
        percent: dayPercent,
      });
    }

    const totalWeeklyCheckIns = totalWeeklyOntime + totalWeeklyLate;
    const weeklyPunctualityRate = totalWeeklyCheckIns > 0 ? Math.round((totalWeeklyOntime / totalWeeklyCheckIns) * 100) : 100;

    // Security & Violations
    const unresolvedViolations = violationLogs.filter((v) => !v.is_resolved);
    const criticalViolations = violationLogs.filter((v) => v.severity === 'CRITICAL' && !v.is_resolved);
    const hasCriticalHWIDOverlap = criticalViolations.some((v) => v.violation_type === 'HWID_OVERLAP');

    // Pending Leaves & Advances
    const pendingLeaves = leaveRequests.filter((l) => l.status === 'PENDING');
    const pendingAdvances = salaryAdvances.filter((a) => a.status === 'PENDING');

    return NextResponse.json({
      success: true,
      data: {
        period,
        overview: {
          totalEmployees: staffEmployees.length, // Only count staff for operational headcount
          totalStaff: staffEmployees.length,
          totalExecutives: executiveEmployees.length,
          totalAllAccounts: employees.length,

          // Today's Operational Attendance (1 / 3 คน)
          totalPresent: todayPresent,
          totalLate: todayLate,
          totalPending: todayPending,
          totalCheckedIn: todayCheckedIn,
          onTimeRate: todayOnTimeRate,
          totalAllowancePaid: todayAllowancePaid,

          // Period Totals
          periodTotalCheckIns: filteredLogs.length,
          periodPresentLogs: periodPresentLogs.length,
          periodLateLogs: periodLateLogs.length,
          periodBlockedLogs: periodBlockedLogs.length,
          periodAllowancePaid,

          pendingLeavesCount: pendingLeaves.length,
          pendingAdvancesCount: pendingAdvances.length,
          unresolvedViolationsCount: unresolvedViolations.length,
          criticalAlertActive: hasCriticalHWIDOverlap,
        },
        weeklyStats: {
          data: past7Days,
          totalOntime: totalWeeklyOntime,
          totalLate: totalWeeklyLate,
          totalAllowance: totalWeeklyAllowance,
          totalCheckIns: totalWeeklyCheckIns,
          punctualityRate: weeklyPunctualityRate,
        },
        allowanceReports,
        allEmployees: allEmployeesList,
        employees: allEmployeesList,
        violations: violationLogs,
        violationLogs: violationLogs,
        criticalViolations,
        recentAttendance: filteredLogs.slice(0, 50),
        attendanceLogs: attendanceLogs,
        pendingLeaves,
        leaveRequests: leaveRequests,
        salaryAdvances,
        salaryAdvanceRequests: salaryAdvances,
        pendingAdvances,
        settings,
      },
    });
  } catch (error: any) {
    console.error('Analytics aggregation error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
