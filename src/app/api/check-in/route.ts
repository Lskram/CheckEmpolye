import { NextResponse } from 'next/server';
import { db } from '@/lib/db-store';
import { isWithinGeofence } from '@/lib/geofence';
import { sendLineLateAlert, sendLineCheckInAlert, sendLineOutOfGeofenceAlert } from '@/lib/line';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { employeeId, latitude, longitude, accuracy, hwid, simulatedTime } = body;

    if (!employeeId || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { success: false, message: 'ข้อมูลพิกัดหรือรหัสพนักงานไม่สมบูรณ์' },
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

    // Thailand Timezone (Asia/Bangkok) Date Formatter
    const getBangkokDateStr = (date: Date | string) =>
      new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date(date));

    const checkInDate = simulatedTime ? new Date(simulatedTime) : new Date();
    const targetDateStr = getBangkokDateStr(checkInDate);

    // Format to Asia/Bangkok time
    const timeFormatter = new Intl.DateTimeFormat('th-TH', {
      timeZone: 'Asia/Bangkok',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    const timeString = timeFormatter.format(checkInDate);

    // -------------------------------------------------------------
    // CHECKPOINT 0: DUPLICATE CHECK-IN PREVENTION
    // -------------------------------------------------------------
    const existingLogs = await db.getAttendanceLogs(200);
    const todayExistingLog = existingLogs.find(
      (l) => l.employee_id === employee.id &&
             l.check_in_time &&
             getBangkokDateStr(l.check_in_time) === targetDateStr &&
             (l.status === 'PRESENT' || l.status === 'LATE')
    );

    if (todayExistingLog) {
      const timeStr = new Date(todayExistingLog.check_in_time).toLocaleTimeString('th-TH', {
        timeZone: 'Asia/Bangkok',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }) + ' น.';

      const checkOutTimeStr = todayExistingLog.check_out_time
        ? new Date(todayExistingLog.check_out_time).toLocaleTimeString('th-TH', {
            timeZone: 'Asia/Bangkok',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
          }) + ' น.'
        : null;

      const shortLogId = `#LOG-${todayExistingLog.id.slice(0, 8).toUpperCase()}`;

      return NextResponse.json({
        success: true,
        alreadyCheckedIn: true,
        code: 'ALREADY_CHECKED_IN',
        message: `คุณได้ลงเวลาเข้างานของวันนี้ไปแล้ว (${timeStr}) [${shortLogId}]`,
        data: {
          id: todayExistingLog.id,
          logReference: shortLogId,
          status: todayExistingLog.status,
          rawCheckInTime: todayExistingLog.check_in_time,
          rawCheckOutTime: todayExistingLog.check_out_time || null,
          checkInTime: timeStr,
          checkOutTime: checkOutTimeStr,
          allowance: Number(todayExistingLog.allowance) || 0,
          distance: todayExistingLog.distance_from_store,
          isLate: todayExistingLog.status === 'LATE',
          employeeName: employee.full_name,
        },
      });
    }

    // -------------------------------------------------------------
    // CHECKPOINT 1: GEOFENCING VALIDATION (Haversine Formula)
    // -------------------------------------------------------------
    // Fetch store settings for coordinates & time rules
    const settings = await db.getStoreSettings();
    const storeCoord = { latitude: Number(settings.store_lat), longitude: Number(settings.store_lng) };
    const userCoord = { latitude: Number(latitude), longitude: Number(longitude) };
    const radiusMeters = Number(settings.radius_meters) || 50;

    const { isInside, distance } = isWithinGeofence(userCoord, storeCoord, radiusMeters);

    if (!isInside) {
      // 1. Record Security Violation Log with exact GPS coordinates
      await db.createViolationLog({
        employee_id: employee.id,
        violation_type: 'OUT_OF_GEOFENCE_BLOCKED',
        severity: 'MEDIUM',
        description: `พนักงาน ${employee.full_name} (${employee.employee_code}) พยายามลงเวลาเข้างานนอกรัศมีร้าน (${distance.toFixed(1)} เมตร ณ พิกัด ${latitude.toFixed(6)}, ${longitude.toFixed(6)})`,
        hwid: hwid || '',
      });

      // 2. Dispatch LINE Out-of-Geofence Security Alert
      await sendLineOutOfGeofenceAlert({
        employeeCode: employee.employee_code,
        fullName: employee.full_name,
        nickname: employee.nickname,
        attemptTime: timeString,
        distance,
        allowedRadius: radiusMeters,
        latitude,
        longitude,
      });

      return NextResponse.json(
        {
          success: false,
          code: 'OUT_OF_GEOFENCE_BLOCKED',
          message: `คุณอยู่นอกพื้นที่ร้าน (${distance.toFixed(1)} ม., กำหนดไว้ไม่เกิน ${radiusMeters} ม.) ไม่อนุญาตให้ลงเวลาเข้างาน`,
          distance,
          allowedRadius: radiusMeters,
          latitude,
          longitude,
        },
        { status: 400 }
      );
    }

    // -------------------------------------------------------------
    // CHECKPOINT 2: TIME CHECK & ALLOWANCE CALCULATION
    // -------------------------------------------------------------
    const [hours, minutes] = timeString.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;

    // Parse deadline: default 08:00 -> 8 * 60 = 480 minutes
    const [deadHours, deadMinutes] = (settings.late_deadline || '08:00:00').split(':').map(Number);
    const deadlineTotalMinutes = deadHours * 60 + deadMinutes;

    const isLate = totalMinutes > deadlineTotalMinutes;
    const status = isLate ? 'LATE' : 'PRESENT';
    const allowance = isLate ? 0.00 : Number(settings.allowance_amount || 50.00);

    // Save successful check-in
    const attendanceRecord = await db.createAttendanceLog({
      employee_id: employee.id,
      check_in_time: checkInDate.toISOString(),
      latitude,
      longitude,
      accuracy,
      distance_from_store: distance,
      hwid: hwid || 'UNKNOWN',
      status,
      allowance,
      notes: isLate 
        ? `เช็คอินสาย (เวลา ${timeString} น. เกินเส้นตาย ${settings.late_deadline} น.)` 
        : `เช็คอินสำเร็จตรงเวลา ได้รับเบี้ยเลี้ยง ${allowance} บาท`,
    });

    const shortLogId = `#LOG-${attendanceRecord.id.slice(0, 8).toUpperCase()}`;

    // 3. Dispatch LINE Check-In Notification with unique Log ID
    await sendLineCheckInAlert({
      logId: attendanceRecord.id,
      employeeCode: employee.employee_code,
      fullName: employee.full_name,
      nickname: employee.nickname,
      checkInTime: timeString,
      distance,
      status,
      allowance,
      latitude,
      longitude,
    });

    // If late, also trigger LINE late breakdown
    if (isLate) {
      const lateMinutes = totalMinutes - deadlineTotalMinutes;
      await sendLineLateAlert({
        employeeCode: employee.employee_code,
        fullName: employee.full_name,
        nickname: employee.nickname,
        checkInTime: timeString,
        lateMinutes,
        latitude,
        longitude,
      });
    }

    return NextResponse.json({
      success: true,
      message: isLate 
        ? `เช็คอินสำเร็จ [${shortLogId}] แต่สายกว่ากำหนด (${timeString} น.) ไม่ได้รับเบี้ยเลี้ยง` 
        : `เช็คอินตรงเวลาสำเร็จ! [${shortLogId}] (${timeString} น.) ได้รับเบี้ยเลี้ยง +${allowance} บาท`,
      data: {
        id: attendanceRecord.id,
        logReference: shortLogId,
        status,
        rawCheckInTime: attendanceRecord.check_in_time,
        rawCheckOutTime: null,
        checkInTime: timeString + ' น.',
        allowance,
        distance,
        isLate,
        employeeName: employee.full_name,
      },
    });
  } catch (error: any) {
    console.error('Check-in processing error:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการประมวลผลเช็คอิน: ' + error.message },
      { status: 500 }
    );
  }
}
