import { NextResponse } from 'next/server';
import { db } from '@/lib/db-store';
import { isWithinGeofence } from '@/lib/geofence';
import { sendLineLateAlert } from '@/lib/line';

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

    // Fetch store settings for coordinates & time rules
    const settings = await db.getStoreSettings();
    const storeCoord = { latitude: Number(settings.store_lat), longitude: Number(settings.store_lng) };
    const userCoord = { latitude: Number(latitude), longitude: Number(longitude) };
    const radiusMeters = Number(settings.radius_meters) || 50;

    // -------------------------------------------------------------
    // CHECKPOINT 1: GEOFENCING VALIDATION (Haversine Formula)
    // -------------------------------------------------------------
    const { isInside, distance } = isWithinGeofence(userCoord, storeCoord, radiusMeters);

    if (!isInside) {
      // Record failed check-in attempt into attendance & violation logs
      await db.createAttendanceLog({
        employee_id: employee.id,
        check_in_time: new Date().toISOString(),
        latitude,
        longitude,
        accuracy,
        distance_from_store: distance,
        hwid: hwid || 'UNKNOWN',
        status: 'OUT_OF_GEOFENCE_BLOCKED',
        allowance: 0,
        notes: `อยู่นอกพื้นที่ร้าน (${distance} ม. เกินกำหนด ${radiusMeters} ม.)`,
      });

      await db.createViolationLog({
        employee_id: employee.id,
        violation_type: 'OUT_OF_GEOFENCE_BLOCKED',
        severity: 'MEDIUM',
        description: `พนักงาน ${employee.full_name} พยายามเช็คอินนอกรัศมีร้าน (${distance.toFixed(1)} เมตร ห่างจากร้าน)`,
        hwid: hwid || '',
      });

      return NextResponse.json(
        {
          success: false,
          code: 'OUT_OF_GEOFENCE_BLOCKED',
          message: `คุณอยู่นอกพื้นที่ร้าน กรุณาขยับเข้ามาใกล้ร้านแล้วลองใหม่ (ระยะห่างปัจจุบัน: ${distance.toFixed(1)} ม., กำหนดไว้ไม่เกิน ${radiusMeters} ม.)`,
          distance,
          allowedRadius: radiusMeters,
        },
        { status: 400 }
      );
    }

    // -------------------------------------------------------------
    // CHECKPOINT 2: TIME CHECK & ALLOWANCE CALCULATION
    // -------------------------------------------------------------
    // Allow custom simulated timestamp for testing or use current server time
    const checkInDate = simulatedTime ? new Date(simulatedTime) : new Date();
    
    // Format to Asia/Bangkok time
    const timeFormatter = new Intl.DateTimeFormat('th-TH', {
      timeZone: 'Asia/Bangkok',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    
    const timeString = timeFormatter.format(checkInDate); // e.g. "07:45:00"
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

    // If late, trigger LINE alert automatically
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
        ? `เช็คอินสำเร็จ แต่สายกว่ากำหนด (${timeString} น.) ไม่ได้รับเบี้ยเลี้ยง` 
        : `เช็คอินตรงเวลาสำเร็จ! (${timeString} น.) ได้รับเบี้ยเลี้ยง +${allowance} บาท`,
      data: {
        id: attendanceRecord.id,
        status,
        checkInTime: timeString,
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
