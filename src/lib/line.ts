/**
 * LINE Messaging API & Notification Service
 */

export interface LineCheckInAlertPayload {
  logId: string;
  employeeCode: string;
  fullName: string;
  nickname: string;
  checkInTime: string;
  distance: number;
  status: 'PRESENT' | 'LATE';
  allowance: number;
  latitude: number;
  longitude: number;
}

export interface LineOutOfGeofenceAlertPayload {
  employeeCode: string;
  fullName: string;
  nickname: string;
  attemptTime: string;
  distance: number;
  allowedRadius: number;
  latitude: number;
  longitude: number;
}

export interface LineLateAlertPayload {
  employeeCode: string;
  fullName: string;
  nickname: string;
  checkInTime: string;
  lateMinutes: number;
  latitude: number;
  longitude: number;
}

export interface LineCheckOutAlertPayload {
  logId: string;
  employeeCode: string;
  fullName: string;
  nickname: string;
  checkOutTime: string;
  duration: string;
}

async function dispatchLineMessage(text: string): Promise<{ success: boolean; message: string }> {
  console.log('[LINE NOTIFICATION]:\n' + text);

  const lineChannelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const lineAdminGroupId = process.env.LINE_ADMIN_GROUP_ID;
  const lineNotifyToken = process.env.LINE_NOTIFY_TOKEN;

  try {
    if (lineNotifyToken) {
      const response = await fetch('https://notify-api.line.me/api/notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Bearer ${lineNotifyToken}`,
        },
        body: new URLSearchParams({ message: text }).toString(),
      });
      if (response.ok) return { success: true, message: 'LINE Notify sent' };
    }

    if (lineChannelAccessToken && lineAdminGroupId) {
      const response = await fetch('https://api.line.me/v2/bot/message/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${lineChannelAccessToken}`,
        },
        body: JSON.stringify({
          to: lineAdminGroupId,
          messages: [{ type: 'text', text }],
        }),
      });
      if (response.ok) return { success: true, message: 'LINE Bot message sent' };
    }

    return { success: true, message: 'Notification logged' };
  } catch (error: any) {
    console.error('Error dispatching LINE message:', error);
    return { success: false, message: error.message };
  }
}

/**
 * 1. Alert when an employee successfully checks in (Includes Unique Log ID)
 */
export async function sendLineCheckInAlert(payload: LineCheckInAlertPayload) {
  const shortId = payload.logId.slice(0, 8).toUpperCase();
  const statusEmoji = payload.status === 'PRESENT' ? '✅' : '⏰';
  const statusText = payload.status === 'PRESENT' ? 'ตรงเวลา (รับเบี้ยขยัน +50฿)' : 'มาสาย (ไม่ได้รับเบี้ยขยัน)';

  const text =
    `${statusEmoji} [พนักงานเข้างาน - Log #${shortId}]\n` +
    `--------------------------\n` +
    `👤 พนักงาน: ${payload.fullName} (${payload.nickname || 'พนักงาน'})\n` +
    `🆔 รหัส: ${payload.employeeCode}\n` +
    `⏰ เวลาเข้างาน: ${payload.checkInTime} น.\n` +
    `📊 สถานะ: ${statusText}\n` +
    `📍 ระยะห่างร้าน: ${payload.distance.toFixed(1)} เมตร\n` +
    `🌐 พิกัดจริง: ${payload.latitude.toFixed(6)}, ${payload.longitude.toFixed(6)}\n` +
    `--------------------------\n` +
    `📱 ระบบบันทึกเวลาทำงาน Attendance PWA`;

  return dispatchLineMessage(text);
}

/**
 * 2. Alert when an employee tries to check in outside geofence (Security & Violation)
 */
export async function sendLineOutOfGeofenceAlert(payload: LineOutOfGeofenceAlertPayload) {
  const text =
    `🚫 [พยายามลงเวลานอกพื้นที่ร้าน]\n` +
    `--------------------------\n` +
    `👤 พนักงาน: ${payload.fullName} (${payload.nickname || 'พนักงาน'})\n` +
    `🆔 รหัส: ${payload.employeeCode}\n` +
    `⏰ เวลาที่พยายาม: ${payload.attemptTime} น.\n` +
    `📍 ระยะห่างจริง: ${payload.distance.toFixed(1)} เมตร (เกินรัศมี ${payload.allowedRadius} ม.)\n` +
    `🌐 พิกัดจริง ณ ตอนนั้น: ${payload.latitude.toFixed(6)}, ${payload.longitude.toFixed(6)}\n` +
    `🗺️ แผนที่: https://maps.google.com/?q=${payload.latitude},${payload.longitude}\n` +
    `⚠️ ผลการตรวจสอบ: ระบบปฏิเสธการลงเวลาอัตโนมัติ\n` +
    `--------------------------\n` +
    `🛡️ บันทึกลง Security Violation Log เรียบร้อย`;

  return dispatchLineMessage(text);
}

/**
 * 3. Alert when an employee arrives late (> 08:00)
 */
export async function sendLineLateAlert(payload: LineLateAlertPayload) {
  const text =
    `🚨 [แจ้งเตือนพนักงานมาสาย]\n` +
    `--------------------------\n` +
    `👤 พนักงาน: ${payload.fullName} (${payload.nickname || 'พนักงาน'})\n` +
    `🆔 รหัส: ${payload.employeeCode}\n` +
    `⏰ เวลาเช็คอิน: ${payload.checkInTime} น.\n` +
    `⏳ มาสายกว่ากำหนด: ${payload.lateMinutes} นาที\n` +
    `💰 เบี้ยเลี้ยงวันนี้: 0 บาท\n` +
    `📍 พิกัด: ${payload.latitude.toFixed(5)}, ${payload.longitude.toFixed(5)}\n` +
    `--------------------------\n` +
    `📱 ระบบบันทึกเวลาทำงาน Attendance PWA`;

  return dispatchLineMessage(text);
}

/**
 * 4. Alert when an employee checks out
 */
export async function sendLineCheckOutAlert(payload: LineCheckOutAlertPayload) {
  const shortId = payload.logId.slice(0, 8).toUpperCase();
  const text =
    `🚪 [พนักงานออกงาน - Log #${shortId}]\n` +
    `--------------------------\n` +
    `👤 พนักงาน: ${payload.fullName} (${payload.nickname || 'พนักงาน'})\n` +
    `🆔 รหัส: ${payload.employeeCode}\n` +
    `⏰ เวลาออกงาน: ${payload.checkOutTime}\n` +
    `⏱️ รวมระยะเวลาทำงาน: ${payload.duration}\n` +
    `--------------------------\n` +
    `📱 ระบบบันทึกเวลาทำงาน Attendance PWA`;

  return dispatchLineMessage(text);
}
