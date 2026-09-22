import { NextResponse } from 'next/server';
import { db } from '@/lib/db-store';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'monthly'; // 'daily' | 'weekly' | 'monthly'

    const [employees, attendanceLogs, leaveRequests, violationLogs, settings] = await Promise.all([
      db.getEmployees(),
      db.getAttendanceLogs(300),
      db.getLeaveRequests(),
      db.getViolationLogs(),
      db.getStoreSettings(),
    ]);

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

    // Split staff vs executives (Executives have special privileges and are not tracked for attendance)
    const staffEmployees = employees.filter((e) => e.role !== 'ADMIN');
    const executiveEmployees = employees.filter((e) => e.role === 'ADMIN');

    // Filter attendance logs by selected period
    const filteredLogs = attendanceLogs.filter((log) => {
      const logDate = new Date(log.check_in_time);
      return logDate >= filterStartDate;
    });

    // Metrics calculations
    const totalCheckIns = filteredLogs.length;
    const presentLogs = filteredLogs.filter((l) => l.status === 'PRESENT');
    const lateLogs = filteredLogs.filter((l) => l.status === 'LATE');
    const blockedLogs = filteredLogs.filter((l) => l.status === 'OUT_OF_GEOFENCE_BLOCKED');

    const totalPresent = presentLogs.length;
    const totalLate = lateLogs.length;
    const totalBlocked = blockedLogs.length;

    const validCheckIns = totalPresent + totalLate;
    const onTimeRate = validCheckIns > 0 ? Math.round((totalPresent / validCheckIns) * 100) : 0;
    const lateRate = validCheckIns > 0 ? Math.round((totalLate / validCheckIns) * 100) : 0;

    // Allowance Aggregation
    const totalAllowancePaid = filteredLogs.reduce((sum, l) => sum + (Number(l.allowance) || 0), 0);

    // Per Employee Allowance Summary (For Staff ONLY)
    const employeeAllowanceMap = new Map<string, { count: number; totalAmount: number; lateCount: number; presentCount: number }>();
    
    // Initialize map with staff only
    staffEmployees.forEach((emp) => {
      employeeAllowanceMap.set(emp.id, { count: 0, totalAmount: 0, lateCount: 0, presentCount: 0 });
    });

    filteredLogs.forEach((log) => {
      const current = employeeAllowanceMap.get(log.employee_id) || { count: 0, totalAmount: 0, lateCount: 0, presentCount: 0 };
      if (log.status === 'PRESENT') {
        current.presentCount += 1;
        current.count += 1;
        current.totalAmount += Number(log.allowance) || 0;
      } else if (log.status === 'LATE') {
        current.lateCount += 1;
      }
      employeeAllowanceMap.set(log.employee_id, current);
    });

    // Allowance reports for staff only
    const allowanceReports = staffEmployees.map((emp) => {
      const stats = employeeAllowanceMap.get(emp.id) || { count: 0, totalAmount: 0, lateCount: 0, presentCount: 0 };
      return {
        employeeId: emp.id,
        employeeCode: emp.employee_code,
        fullName: emp.full_name,
        nickname: emp.nickname,
        role: emp.role,
        allowanceCount: stats.count,
        totalAllowance: stats.totalAmount,
        presentCount: stats.presentCount,
        lateCount: stats.lateCount,
      };
    });

    // Sanitized all accounts list for Employee Directory
    const allEmployeesList = employees.map(({ pin_hash, ...rest }) => rest);

    // Calculate Day-by-Day Stats for the Chart from Real Supabase Attendance Logs
    // Last 7 days in order (from 6 days ago to today)
    const dayNames = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสฯ', 'ศุกร์', 'เสาร์'];
    const past7Days = [];
    let totalWeeklyOntime = 0;
    let totalWeeklyLate = 0;
    let totalWeeklyAllowance = 0;

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      const dayName = dayNames[d.getDay()];

      // Filter logs for this specific day
      const dayLogs = attendanceLogs.filter((log) => {
        if (!log.check_in_time) return false;
        const logDateStr = new Date(log.check_in_time).toISOString().slice(0, 10);
        return logDateStr === dateStr;
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
    const weeklyPunctualityRate = totalWeeklyCheckIns > 0 ? Math.round((totalWeeklyOntime / totalWeeklyCheckIns) * 100) : 0;

    // Security & Violations
    const unresolvedViolations = violationLogs.filter((v) => !v.is_resolved);
    const criticalViolations = violationLogs.filter((v) => v.severity === 'CRITICAL' && !v.is_resolved);
    const hasCriticalHWIDOverlap = criticalViolations.some((v) => v.violation_type === 'HWID_OVERLAP');

    // Pending Leaves
    const pendingLeaves = leaveRequests.filter((l) => l.status === 'PENDING');

    return NextResponse.json({
      success: true,
      data: {
        period,
        overview: {
          totalEmployees: staffEmployees.length, // Only count staff for attendance metrics
          totalStaff: staffEmployees.length,
          totalExecutives: executiveEmployees.length,
          totalAllAccounts: employees.length,
          totalCheckIns,
          totalPresent,
          totalLate,
          totalBlocked,
          onTimeRate,
          lateRate,
          totalAllowancePaid,
          pendingLeavesCount: pendingLeaves.length,
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
        violations: violationLogs,
        criticalViolations,
        recentAttendance: filteredLogs.slice(0, 50),
        pendingLeaves,
        settings,
      },
    });
  } catch (error: any) {
    console.error('Analytics aggregation error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
