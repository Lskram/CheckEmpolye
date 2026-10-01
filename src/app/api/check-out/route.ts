import { NextResponse } from 'next/server';
import { db } from '@/lib/db-store';
import { isWithinGeofence } from '@/lib/geofence';
import { sendLineCheckOutAlert, sendLineOutOfGeofenceAlert } from '@/lib/line';

export const dynamic = 'force-dynamic';

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

    // Bangkok Date Formatter
    const getBangkokDateStr = (date: Date | string) =>
      new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date(date));

    // 0. Strict Server Clock (Disable simulated time manipulation in production)
    const checkOutDate = (process.env.NODE_ENV === 'development' && simulatedTime) 
      ? new Date(simulatedTime) 
      : new Date();
    const targetDateStr = getBangkokDateStr(checkOutDate);

    // 0.1 Strict Device Binding Validation
    if (employee.role !== 'ADMIN' && employee.hwid && hwid && employee.hwid !== hwid) {
      await db.createViolationLog({
        employee_id: employee.id,
        violation_type: 'DEVICE_MISMATCH',
        severity: 'HIGH',
        description: `พยายามลงเวลาออกงานจากอุปกรณ์อื่นที่ไม่ได้รับอนุญาต (เครื่องผูก: ${employee.hwid}, เครื่องยิงออกงาน: ${hwid})`,
        hwid,
      });

      return NextResponse.json(
        {
          success: false,
          code: 'DEVICE_MISMATCH',
          message: '🚫 คุณกำลังลงเวลาออกงานจากอุปกรณ์เครื่องอื่นที่ไม่ตรงกับเครื่องประจำตัวของคุณ ไม่อนุญาตให้ลงเวลาแทนกัน',
        },
        { status: 403 }
      );
    }

    // Format check-out time in Bangkok timezone
    const timeFormatter = new Intl.DateTimeFormat('th-TH', {
      timeZone: 'Asia/Bangkok',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    const checkOutTimeStr = timeFormatter.format(checkOutDate) + ' น.';

    // Find today's attendance log
    const logs = await db.getAttendanceLogs(200);
    const todayLog = logs.find(
      (l) => l.employee_id === employee.id &&
             l.check_in_time &&
             getBangkokDateStr(l.check_in_time) === targetDateStr &&
             (l.status === 'PRESENT' || l.status === 'LATE')
    );

    if (!todayLog) {
      return NextResponse.json(
        { success: false, message: 'ยังไม่พบประวัติการลงเวลาเข้างานของวันนี้ กรุณากดเข้างานก่อน' },
        { status: 400 }
      );
    }

    const shortLogId = `#LOG-${todayLog.id.slice(0, 8).toUpperCase()}`;

    // Check if already checked out
    if (todayLog.check_out_time) {
      const existingOutTimeStr = new Date(todayLog.check_out_time).toLocaleTimeString('th-TH', {
        timeZone: 'Asia/Bangkok',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }) + ' น.';

      return NextResponse.json({
        success: true,
        alreadyCheckedOut: true,
        message: `คุณได้ลงเวลาออกงานของวันนี้ไปแล้วเมื่อเวลา ${existingOutTimeStr} [${shortLogId}]`,
        data: {
          id: todayLog.id,
          logReference: shortLogId,
          checkInTime: new Date(todayLog.check_in_time).toLocaleTimeString('th-TH', {
            timeZone: 'Asia/Bangkok',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
          }) + ' น.',
          checkOutTime: existingOutTimeStr,
          status: todayLog.status,
          allowance: Number(todayLog.allowance) || 0,
        }
      });
    }

    // Geofence Validation
    const settings = await db.getStoreSettings();
    const storeCoord = { latitude: Number(settings.store_lat), longitude: Number(settings.store_lng) };
    const userCoord = { latitude: Number(latitude), longitude: Number(longitude) };
    const radiusMeters = Number(settings.radius_meters) || 50;
    const { isInside, distance } = isWithinGeofence(userCoord, storeCoord, radiusMeters);

    if (!isInside) {
      // Record violation for out of geofence check-out attempt
      await db.createViolationLog({
        employee_id: employee.id,
        violation_type: 'OUT_OF_GEOFENCE_BLOCKED',
        severity: 'LOW',
        description: `พนักงาน ${employee.full_name} (${employee.employee_code}) พยายามลงเวลาออกงานนอกรัศมีร้าน (${distance.toFixed(1)} เมตร ณ พิกัด ${latitude.toFixed(6)}, ${longitude.toFixed(6)})`,
        hwid: hwid || '',
      });

      // Dispatch LINE Out-of-Geofence Alert (Non-blocking background dispatch)
      sendLineOutOfGeofenceAlert({
        employeeCode: employee.employee_code,
        fullName: employee.full_name,
        nickname: employee.nickname,
        attemptTime: checkOutTimeStr,
        distance,
        allowedRadius: radiusMeters,
        latitude,
        longitude,
      }).catch((err) => console.warn('[LINE] Check-out out-of-geofence alert error:', err));

      return NextResponse.json(
        {
          success: false,
          code: 'OUT_OF_GEOFENCE_BLOCKED',
          message: `คุณอยู่นอกพื้นที่ร้าน (${distance.toFixed(1)} ม., กำหนด ${radiusMeters} ม.) ไม่อนุญาตให้ลงเวลาออกงาน`,
          distance,
        },
        { status: 400 }
      );
    }

    // Calculate working duration
    const inTime = new Date(todayLog.check_in_time);
    const diffMs = checkOutDate.getTime() - inTime.getTime();
    const diffTotalHours = diffMs / (1000 * 60 * 60);
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const durationStr = `${diffHours} ชม. ${diffMinutes} นาที`;

    // Allowance Integrity: If worked less than 4 hours (e.g. hit & run), adjust allowance to 0
    let finalAllowance = Number(todayLog.allowance) || 0;
    let finalStatus = todayLog.status;
    let extraNote = '';

    if (diffTotalHours < 4.0 && finalAllowance > 0) {
      finalAllowance = 0.00;
      finalStatus = 'EARLY_LEAVE';
      extraNote = ` [ออกงานก่อนเวลา ทำงาน ${durationStr} ไม่ถึง 4 ชม. ไม่อนุมัติเบี้ยขยัน]`;
    }

    // Save check-out timestamp & updated allowance
    const updatedLog = await db.checkOutAttendance(
      todayLog.id,
      checkOutDate.toISOString(),
      `${todayLog.notes || ''} | ออกงานเวลา ${checkOutTimeStr} (ระยะเวลาทำงาน ${durationStr})${extraNote}`,
      {
        allowance: finalAllowance,
        status: finalStatus,
      }
    );

    // Dispatch LINE Check-Out notification with Log ID (Non-blocking background dispatch)
    sendLineCheckOutAlert({
      logId: todayLog.id,
      employeeCode: employee.employee_code,
      fullName: employee.full_name,
      nickname: employee.nickname,
      checkOutTime: checkOutTimeStr,
      duration: durationStr,
    }).catch((err) => console.warn('[LINE] Check-out alert error:', err));

    return NextResponse.json({
      success: true,
      message: `ลงเวลาออกงานสำเร็จ [${shortLogId}] (${checkOutTimeStr}) รวมเวลาทำงาน ${durationStr}`,
      data: {
        id: todayLog.id,
        logReference: shortLogId,
        rawCheckInTime: todayLog.check_in_time,
        rawCheckOutTime: checkOutDate.toISOString(),
        checkInTime: new Date(todayLog.check_in_time).toLocaleTimeString('th-TH', {
          timeZone: 'Asia/Bangkok',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }) + ' น.',
        checkOutTime: checkOutTimeStr,
        workingDuration: durationStr,
        status: finalStatus,
        allowance: finalAllowance,
        distance,
      }
    });
  } catch (error: any) {
    console.error('Check-out error:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการลงเวลาออกงาน: ' + error.message },
      { status: 500 }
    );
  }
}
