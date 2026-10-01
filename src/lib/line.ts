/**
 * Comprehensive LINE Official Account (LINE OA) & LINE Messaging API Notification Service
 * ศูนย์บริการสีแสงยางยนต์ (YOKOHAMA NAYA COSMIS)
 */

import { db } from './db-store';

export interface LineCheckInAlertPayload {
  logId: string;
  employeeCode: string;
  fullName: string;
  nickname?: string;
  checkInTime: string;
  distance: number;
  status: 'PRESENT' | 'LATE';
  allowance: number;
  latitude: number;
  longitude: number;
}

export interface LineCheckOutAlertPayload {
  logId: string;
  employeeCode: string;
  fullName: string;
  nickname?: string;
  checkOutTime: string;
  duration: string;
}

export interface LineOutOfGeofenceAlertPayload {
  employeeCode: string;
  fullName: string;
  nickname?: string;
  attemptTime: string;
  distance: number;
  allowedRadius: number;
  latitude: number;
  longitude: number;
}

export interface LineLateAlertPayload {
  employeeCode: string;
  fullName: string;
  nickname?: string;
  checkInTime: string;
  lateMinutes: number;
  latitude: number;
  longitude: number;
}

export interface LineAdvanceRequestAlertPayload {
  advanceId: string;
  employeeCode: string;
  fullName: string;
  nickname?: string;
  amount: number;
  reason: string;
  neededBeforeDate?: string | null;
  requestDate: string;
}

export interface LineAdvanceActionAlertPayload {
  advanceId: string;
  employeeCode: string;
  fullName: string;
  nickname?: string;
  amount: number;
  status: 'APPROVED' | 'REJECTED';
  reviewerName?: string;
  rejectionReason?: string | null;
}

export interface LineLeaveRequestAlertPayload {
  leaveId: string;
  employeeCode: string;
  fullName: string;
  nickname?: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  daysCount: number;
  reason: string;
}

export interface LineLeaveActionAlertPayload {
  leaveId: string;
  employeeCode: string;
  fullName: string;
  nickname?: string;
  leaveType: string;
  status: 'APPROVED' | 'REJECTED';
  reviewerName?: string;
  rejectionReason?: string | null;
}

export interface LineViolationAlertPayload {
  violationType: string;
  severity: string;
  description: string;
  employeeCode?: string;
  fullName?: string;
  nickname?: string;
  hwid?: string;
  time?: string;
}

/**
 * Dispatch LINE Notification via LINE Messaging API (LINE OA) or LINE Notify Fallback
 */
export async function dispatchLineMessage(
  text: string,
  options?: {
    customToken?: string;
    customTarget?: string;
    flexMessage?: any;
  }
): Promise<{ success: boolean; message: string; channel?: string; details?: any }> {
  console.log('[LINE OA NOTIFICATION DISPATCH]:\n' + text);

  let token = options?.customToken;
  let target = options?.customTarget;
  let notifyToken: string | undefined = process.env.LINE_NOTIFY_TOKEN;

  // If tokens not provided in options, retrieve from Database Settings or Environment Variables
  if (!token) {
    try {
      const settings = await db.getStoreSettings();
      if (settings) {
        if ((settings as any).line_access_token) token = (settings as any).line_access_token;
        if ((settings as any).line_target_id) target = (settings as any).line_target_id;
        if ((settings as any).line_notify_token) notifyToken = (settings as any).line_notify_token;
      }
    } catch (e) {
      console.warn('[LINE] Could not fetch settings from DB:', e);
    }
  }

  const DEFAULT_LINE_TOKEN = 'Pe4vS2QQHU9yIPfxRFbMO5wYicsPlob8HMZKtLKsJ/3uy3zSfwpp9772on7oszJQCHw6C94BnXgFDH7CaVUap9BX/hFj+qEIfMAeTygPUWB+8gh9+YSXJgj2+f46epgGZv3owz+WVifHWXOJwb5xEAdB04t89/1O/w1cDnyilFU=';

  if (!token) {
    token = process.env.LINE_CHANNEL_ACCESS_TOKEN || process.env.LINE_ACCESS_TOKEN || process.env.LINE_OA_TOKEN || DEFAULT_LINE_TOKEN;
  }
  if (!target) {
    target = process.env.LINE_TARGET_USER_ID || process.env.LINE_ADMIN_GROUP_ID || process.env.LINE_GROUP_ID || 'broadcast';
  }

  const results: string[] = [];

  // 1. PRIMARY: LINE Messaging API (LINE Official Account)
  if (token) {
    try {
      // Determine whether to use Push (specific user/group) or Broadcast (all followers)
      const isPush = target && target.trim() !== '' && target.toLowerCase() !== 'broadcast';
      const endpoint = isPush 
        ? 'https://api.line.me/v2/bot/message/push'
        : 'https://api.line.me/v2/bot/message/broadcast';

      const messageObject = options?.flexMessage || {
        type: 'text',
        text: text,
      };

      const payloadBody = (isPush && target) 
        ? { to: target.trim(), messages: [messageObject] }
        : { messages: [messageObject] };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token.trim()}`,
        },
        body: JSON.stringify(payloadBody),
      });

      const responseText = await res.text();
      let responseJson: any = null;
      try {
        responseJson = JSON.parse(responseText);
      } catch (e) {}

      if (res.ok) {
        console.log(`[LINE OA] Message successfully delivered via ${isPush ? `Push (${target})` : 'Broadcast'}`);
        return {
          success: true,
          channel: isPush ? 'LINE OA (Push)' : 'LINE OA (Broadcast)',
          message: 'ส่งข้อความเข้า LINE Official Account สำเร็จ',
          details: responseJson,
        };
      } else {
        const errorMsg = responseJson?.message || responseText || `HTTP ${res.status}`;
        console.error('[LINE OA Error]:', errorMsg);
        results.push(`LINE OA Error: ${errorMsg}`);
      }
    } catch (oaErr: any) {
      console.error('[LINE OA Exception]:', oaErr);
      results.push(`LINE OA Exception: ${oaErr.message}`);
    }
  }

  // 2. SECONDARY / FALLBACK: LINE Notify API
  if (notifyToken) {
    try {
      const notifyRes = await fetch('https://notify-api.line.me/api/notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Bearer ${notifyToken.trim()}`,
        },
        body: new URLSearchParams({ message: '\n' + text }).toString(),
      });

      if (notifyRes.ok) {
        return {
          success: true,
          channel: 'LINE Notify',
          message: 'ส่งข้อความเข้า LINE Notify สำเร็จ',
        };
      } else {
        results.push(`LINE Notify Status: ${notifyRes.status}`);
      }
    } catch (notifyErr: any) {
      results.push(`LINE Notify Exception: ${notifyErr.message}`);
    }
  }

  if (results.length > 0) {
    return {
      success: false,
      message: results.join(' | '),
    };
  }

  return {
    success: true,
    channel: 'Console (Simulation Mode)',
    message: 'จำลองการส่งแจ้งเตือน (ยังไม่ได้ระบุ LINE Access Token ในระบบ)',
  };
}

// -------------------------------------------------------------------
// 1. CHECK-IN ALERT (ลงเวลาเข้างาน)
// -------------------------------------------------------------------
export async function sendLineCheckInAlert(payload: LineCheckInAlertPayload) {
  const shortId = payload.logId.slice(0, 8).toUpperCase();
  const isPresent = payload.status === 'PRESENT';
  const statusEmoji = isPresent ? '🟢' : '⚠️';
  const statusTitle = isPresent ? 'ตรงเวลา (รับเบี้ยขยัน +50฿)' : 'มาสาย (ไม่ได้รับเบี้ยขยัน)';

  const text =
    `${statusEmoji} [ลงเวลาเข้างาน - Log #${shortId}]\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `🏢 ร้าน: สีแสงยางยนต์ YOKOHAMA\n` +
    `👤 พนักงาน: ${payload.fullName} ${payload.nickname ? `(${payload.nickname})` : ''}\n` +
    `🆔 รหัสพนักงาน: [ ${payload.employeeCode} ]\n` +
    `⏰ เวลาเข้างาน: ${payload.checkInTime} น.\n` +
    `📊 สถานะ: ${statusTitle}\n` +
    `📍 ระยะห่างร้าน: ${Number(payload.distance).toFixed(1)} เมตร\n` +
    `🌐 พิกัด GPS: ${payload.latitude.toFixed(6)}, ${payload.longitude.toFixed(6)}\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `📱 ระบบบันทึกเวลา Attendance PWA`;

  return dispatchLineMessage(text);
}

// -------------------------------------------------------------------
// 2. CHECK-OUT ALERT (ลงเวลาออกงาน)
// -------------------------------------------------------------------
export async function sendLineCheckOutAlert(payload: LineCheckOutAlertPayload) {
  const shortId = payload.logId.slice(0, 8).toUpperCase();

  const text =
    `🏁 [ลงเวลาออกงาน - Log #${shortId}]\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `🏢 ร้าน: สีแสงยางยนต์ YOKOHAMA\n` +
    `👤 พนักงาน: ${payload.fullName} ${payload.nickname ? `(${payload.nickname})` : ''}\n` +
    `🆔 รหัสพนักงาน: [ ${payload.employeeCode} ]\n` +
    `⏰ เวลาออกงาน: ${payload.checkOutTime} น.\n` +
    `⏱️ ชั่วโมงทำงานวันนี้: ${payload.duration}\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `📱 ระบบบันทึกเวลา Attendance PWA`;

  return dispatchLineMessage(text);
}

// -------------------------------------------------------------------
// 3. OUT OF GEOFENCE ALERT (พยายามลงเวลานอกพื้นที่ร้าน)
// -------------------------------------------------------------------
export async function sendLineOutOfGeofenceAlert(payload: LineOutOfGeofenceAlertPayload) {
  const text =
    `🚫 [ตรวจพบการลงเวลานอกพื้นที่ร้าน]\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `👤 พนักงาน: ${payload.fullName} ${payload.nickname ? `(${payload.nickname})` : ''}\n` +
    `🆔 รหัสพนักงาน: [ ${payload.employeeCode} ]\n` +
    `⏰ เวลาที่พยายาม: ${payload.attemptTime} น.\n` +
    `📍 ระยะห่างจริง: ${Number(payload.distance).toFixed(1)} เมตร (เกินรัศมีร้าน ${payload.allowedRadius} ม.)\n` +
    `🌐 พิกัดจริง: ${payload.latitude.toFixed(6)}, ${payload.longitude.toFixed(6)}\n` +
    `🗺️ แผนที่: https://maps.google.com/?q=${payload.latitude},${payload.longitude}\n` +
    `⚠️ ผลการตรวจสอบ: ระบบปฏิเสธการลงเวลาอัตโนมัติ\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `🛡️ บันทึกลง Security Violation Logs เรียบร้อย`;

  return dispatchLineMessage(text);
}

// -------------------------------------------------------------------
// 4. LATE ARRIVAL ALERT (แจ้งเตือนมาสาย)
// -------------------------------------------------------------------
export async function sendLineLateAlert(payload: LineLateAlertPayload) {
  const text =
    `⏰ [แจ้งเตือนพนักงานมาสาย]\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `👤 พนักงาน: ${payload.fullName} ${payload.nickname ? `(${payload.nickname})` : ''}\n` +
    `🆔 รหัสพนักงาน: [ ${payload.employeeCode} ]\n` +
    `⏰ เวลาเข้างาน: ${payload.checkInTime} น.\n` +
    `⏳ มาสายกว่ากำหนด: ${payload.lateMinutes} นาที\n` +
    `💰 เบี้ยขยันวันนี้: 0 บาท\n` +
    `📍 พิกัด: ${payload.latitude.toFixed(6)}, ${payload.longitude.toFixed(6)}\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `📱 ระบบบันทึกเวลา Attendance PWA`;

  return dispatchLineMessage(text);
}

// -------------------------------------------------------------------
// 5. SALARY ADVANCE REQUEST (คำขอเบิกเงินล่วงหน้าใหม่)
// -------------------------------------------------------------------
export async function sendLineAdvanceRequestAlert(payload: LineAdvanceRequestAlertPayload) {
  const shortId = payload.advanceId.slice(0, 8).toUpperCase();

  const text =
    `💵 [มีคำขอเบิกเงินล่วงหน้าใหม่ - #${shortId}]\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `👤 พนักงาน: ${payload.fullName} ${payload.nickname ? `(${payload.nickname})` : ''}\n` +
    `🆔 รหัสพนักงาน: [ ${payload.employeeCode} ]\n` +
    `💰 ยอดที่ขอเบิก: ฿${Number(payload.amount).toLocaleString()} บาท\n` +
    `📋 เหตุผลความจำเป็น: "${payload.reason}"\n` +
    (payload.neededBeforeDate ? `📅 วันที่จำเป็นต้องใช้: ${payload.neededBeforeDate}\n` : '') +
    `📅 วันที่ยื่นคำขอ: ${payload.requestDate}\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `⚡ ผู้บริหารสามารถกดอนุมัติได้ที่แดชบอร์ด Web / Mobile Console`;

  return dispatchLineMessage(text);
}

// -------------------------------------------------------------------
// 6. SALARY ADVANCE ACTION (แจ้งผลการอนุมัติ/ปฏิเสธเบิกเงิน)
// -------------------------------------------------------------------
export async function sendLineAdvanceActionAlert(payload: LineAdvanceActionAlertPayload) {
  const isApproved = payload.status === 'APPROVED';
  const statusEmoji = isApproved ? '✅' : '❌';
  const statusText = isApproved ? 'อนุมัติเรียบร้อย ✓' : 'ไม่อนุมัติ / ปฏิเสธ';
  const shortId = payload.advanceId.slice(0, 8).toUpperCase();

  const text =
    `${statusEmoji} [ผลการพิจารณาเบิกเงินล่วงหน้า - #${shortId}]\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `👤 พนักงาน: ${payload.fullName} ${payload.nickname ? `(${payload.nickname})` : ''}\n` +
    `🆔 รหัสพนักงาน: [ ${payload.employeeCode} ]\n` +
    `💰 ยอดเงิน: ฿${Number(payload.amount).toLocaleString()} บาท\n` +
    `📊 ผลการพิจารณา: ${statusText}\n` +
    (payload.reviewerName ? `👑 ผู้พิจารณา: ${payload.reviewerName}\n` : '') +
    (payload.rejectionReason ? `📝 เหตุผลที่ปฏิเสธ: "${payload.rejectionReason}"\n` : '') +
    `━━━━━━━━━━━━━━━━━━\n` +
    `📱 ระบบบันทึกเวลาและสวัสดิการ Attendance PWA`;

  return dispatchLineMessage(text);
}

// -------------------------------------------------------------------
// 7. LEAVE REQUEST (คำขอลางานใหม่)
// -------------------------------------------------------------------
export async function sendLineLeaveRequestAlert(payload: LineLeaveRequestAlertPayload) {
  const shortId = payload.leaveId.slice(0, 8).toUpperCase();
  const typeMap: Record<string, string> = {
    SICK: 'ลาป่วย 🩺',
    BUSINESS: 'ลากิจ 💼',
    ANNUAL: 'ลาพักร้อน 🏖️',
    OTHER: 'ลาอื่นๆ 📝',
  };
  const leaveName = typeMap[payload.leaveType] || payload.leaveType;

  const text =
    `📄 [มีคำขอลางานใหม่ - #${shortId}]\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `👤 พนักงาน: ${payload.fullName} ${payload.nickname ? `(${payload.nickname})` : ''}\n` +
    `🆔 รหัสพนักงาน: [ ${payload.employeeCode} ]\n` +
    `🏖️ ประเภทการลา: ${leaveName}\n` +
    `📅 วันที่ลา: ${payload.startDate} ถึง ${payload.endDate} (${payload.daysCount} วัน)\n` +
    `📋 เหตุผล: "${payload.reason}"\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `⚡ ผู้บริหารสามารถกดอนุมัติได้ที่แดชบอร์ด Web / Mobile Console`;

  return dispatchLineMessage(text);
}

// -------------------------------------------------------------------
// 8. LEAVE ACTION (แจ้งผลการอนุมัติ/ปฏิเสธใบลา)
// -------------------------------------------------------------------
export async function sendLineLeaveActionAlert(payload: LineLeaveActionAlertPayload) {
  const isApproved = payload.status === 'APPROVED';
  const statusEmoji = isApproved ? '✅' : '❌';
  const statusText = isApproved ? 'อนุมัติใบลาเรียบร้อย ✓' : 'ไม่อนุมัติ / ปฏิเสธคำขอลา';
  const shortId = payload.leaveId.slice(0, 8).toUpperCase();

  const text =
    `${statusEmoji} [ผลการพิจารณาใบลา - #${shortId}]\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `👤 พนักงาน: ${payload.fullName} ${payload.nickname ? `(${payload.nickname})` : ''}\n` +
    `🆔 รหัสพนักงาน: [ ${payload.employeeCode} ]\n` +
    `🏖️ ประเภท: ${payload.leaveType}\n` +
    `📊 ผลการพิจารณา: ${statusText}\n` +
    (payload.reviewerName ? `👑 ผู้พิจารณา: ${payload.reviewerName}\n` : '') +
    (payload.rejectionReason ? `📝 เหตุผล: "${payload.rejectionReason}"\n` : '') +
    `━━━━━━━━━━━━━━━━━━\n` +
    `📱 ระบบบันทึกเวลา Attendance PWA`;

  return dispatchLineMessage(text);
}

// -------------------------------------------------------------------
// 9. SECURITY & VIOLATION ALERT (แจ้งเตือนความปลอดภัย)
// -------------------------------------------------------------------
export async function sendLineViolationAlert(payload: LineViolationAlertPayload) {
  const text =
    `🚨 [แจ้งเตือนระบบความปลอดภัย (Security Alert)]\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `⚠️ ระดับความรุนแรง: ${payload.severity}\n` +
    `🔒 ประเภท: ${payload.violationType}\n` +
    (payload.fullName ? `👤 พนักงานที่เกี่ยวข้อง: ${payload.fullName} (${payload.employeeCode || '-'})\n` : '') +
    (payload.hwid ? `📱 รหัสอุปกรณ์ (HWID): ${payload.hwid}\n` : '') +
    `📝 รายละเอียด: ${payload.description}\n` +
    `⏰ เวลาที่ตรวจพบ: ${payload.time || new Date().toLocaleTimeString('th-TH') + ' น.'}\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `🛡️ ตรวจสอบรายการเต็มได้ที่เมนู Security Logs ใน Web Admin`;

  return dispatchLineMessage(text);
}

// -------------------------------------------------------------------
// 10. TEST SEND LINE MESSAGE (ทดสอบการเชื่อมต่อ)
// -------------------------------------------------------------------
export async function sendLineTestMessage(options?: {
  token?: string;
  target?: string;
}) {
  const nowStr = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' น.';
  const text =
    `🟢 [ทดสอบระบบเชื่อมต่อ LINE Official Account สำเร็จ!]\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `🏢 ศูนย์บริการ: สีแสงยางยนต์ (YOKOHAMA NAYA COSMIS)\n` +
    `⏰ เวลาทดสอบ: ${nowStr}\n` +
    `✅ สถานะ: ระบบแจ้งเตือนอัตโนมัติพร้อมทำงาน 100%\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `📌 การแจ้งเตือนที่จะได้รับ:\n` +
    `• พนักงานลงเวลาเข้างาน / ออกงาน\n` +
    `• การยื่นขอเบิกเงินล่วงหน้า & ผลการอนุมัติ\n` +
    `• การยื่นคำขอลางาน & ผลการอนุมัติ\n` +
    `• การแจ้งเตือนความผิดปกติ (Security Violation)`;

  return dispatchLineMessage(text, {
    customToken: options?.token,
    customTarget: options?.target,
  });
}
