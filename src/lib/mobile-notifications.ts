import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export const MobileNotificationService = {
  // Request Notification Permissions
  async requestPermission(): Promise<boolean> {
    try {
      if (Capacitor.isNativePlatform()) {
        const status = await LocalNotifications.requestPermissions();
        return status.display === 'granted';
      } else if (typeof window !== 'undefined' && 'Notification' in window) {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
      }
      return false;
    } catch (e) {
      console.warn('Notification permission request error:', e);
      return false;
    }
  },

  // 1. Schedule Pre-Shift Countdown Notification (5 Minutes Before Standard Shift Time)
  async scheduleShiftCountdown(standardTimeStr: string = '07:40:00') {
    try {
      const parts = standardTimeStr.split(':');
      const targetHours = parseInt(parts[0], 10);
      const targetMinutes = parseInt(parts[1], 10);

      // Target time minus 5 minutes
      let notifyHours = targetHours;
      let notifyMinutes = targetMinutes - 5;
      if (notifyMinutes < 0) {
        notifyMinutes += 60;
        notifyHours = (notifyHours - 1 + 24) % 24;
      }

      const now = new Date();
      const scheduledDate = new Date();
      scheduledDate.setHours(notifyHours, notifyMinutes, 0, 0);

      // If already passed for today, schedule for tomorrow
      if (scheduledDate.getTime() <= now.getTime()) {
        scheduledDate.setDate(scheduledDate.getDate() + 1);
      }

      const timeFormatted = `${targetHours.toString().padStart(2, '0')}:${targetMinutes.toString().padStart(2, '0')} น.`;

      if (Capacitor.isNativePlatform()) {
        await LocalNotifications.cancel({ notifications: [{ id: 1001 }] });
        await LocalNotifications.schedule({
          notifications: [
            {
              id: 1001,
              title: '⏰ อีก 5 นาทีจะถึงเวลาเข้างาน!',
              body: `เข้างานเวลา ${timeFormatted} กรุณาเตรียมตัวเช็คอินในรัศมีร้านเพื่อรับเบี้ยขยัน 50฿`,
              schedule: { at: scheduledDate, repeats: true, every: 'day' },
              sound: 'beep.wav',
              smallIcon: 'ic_stat_name',
            },
          ],
        });
      }
    } catch (e) {
      console.warn('Failed to schedule pre-shift notification:', e);
    }
  },

  // 2. Instant Check-in Success Notification
  async showCheckInSuccess(timeStr: string, isLate: boolean, allowance: number) {
    const title = isLate ? '⚠️ เช็คอินเข้างานแล้ว (มาสาย)' : '✓ เช็คอินเข้างานสำเร็จ (ตรงเวลา)';
    const body = isLate 
      ? `บันทึกลงระบบสำเร็จ เวลา ${timeStr} น.`
      : `บันทึกลงระบบสำเร็จ เวลา ${timeStr} น. (+${allowance}฿ เบี้ยขยัน)`;

    try {
      if (Capacitor.isNativePlatform()) {
        await LocalNotifications.schedule({
          notifications: [
            {
              id: Math.floor(Math.random() * 100000),
              title,
              body,
              schedule: { at: new Date(Date.now() + 500) },
              sound: 'beep.wav',
            },
          ],
        });
      } else if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/favicon.ico' });
      }
    } catch (e) {
      console.warn('Check-in notification error:', e);
    }
  },

  // 3. Instant Check-out Success Notification
  async showCheckOutSuccess(timeStr: string, workHours?: number) {
    const title = '🏁 ลงชื่อออกงานเรียบร้อยแล้ว';
    const body = workHours 
      ? `บันทึกเวลาออกงานสำเร็จ เวลา ${timeStr} น. (รวมทำงาน ${workHours.toFixed(1)} ชม.)`
      : `บันทึกเวลาออกงานสำเร็จ เวลา ${timeStr} น. ขอบคุณสำหรับการทำงานวันนี้ครับ`;

    try {
      if (Capacitor.isNativePlatform()) {
        await LocalNotifications.schedule({
          notifications: [
            {
              id: Math.floor(Math.random() * 100000),
              title,
              body,
              schedule: { at: new Date(Date.now() + 500) },
              sound: 'beep.wav',
            },
          ],
        });
      } else if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/favicon.ico' });
      }
    } catch (e) {
      console.warn('Check-out notification error:', e);
    }
  },

  // 4. Instant Offline / Internet Disconnection Warning Notification
  async showOfflineWarning() {
    const title = '⚠️ ขาดการเชื่อมต่ออินเทอร์เน็ต';
    const body = 'กรุณาเชื่อมต่ออินเทอร์เน็ตเพื่อบันทึกเวลาและตรวจสอบความปลอดภัย';

    try {
      if (Capacitor.isNativePlatform()) {
        await LocalNotifications.schedule({
          notifications: [
            {
              id: Math.floor(Math.random() * 100000),
              title,
              body,
              schedule: { at: new Date(Date.now() + 300) },
              sound: 'beep.wav',
            },
          ],
        });
      } else if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/favicon.ico' });
      }
    } catch (e) {
      console.warn('Offline notification error:', e);
    }
  },

  // 5. Instant Geofence Out-of-Range Warning Notification
  async showGeofenceWarning(distance: number, allowedRadius: number) {
    const title = '🚫 อยู่นอกพื้นที่ร้าน!';
    const body = `คุณอยู่ห่างจากร้าน ${distance.toFixed(0)} ม. (กำหนดไม่เกิน ${allowedRadius} ม.) ไม่สามารถลงเวลาได้`;

    try {
      if (Capacitor.isNativePlatform()) {
        await LocalNotifications.schedule({
          notifications: [
            {
              id: Math.floor(Math.random() * 100000),
              title,
              body,
              schedule: { at: new Date(Date.now() + 300) },
              sound: 'beep.wav',
            },
          ],
        });
      } else if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/favicon.ico' });
      }
    } catch (e) {
      console.warn('Geofence notification error:', e);
    }
  },

  // 6. Instant Leave Request Status Notification (Approved / Rejected)
  async showLeaveStatusNotification(status: 'APPROVED' | 'REJECTED', leaveType: string, daysCount: number = 1, reason?: string) {
    const isApproved = status === 'APPROVED';
    const title = isApproved ? '✅ คำขอลางานได้รับการอนุมัติ' : '❌ คำขอลางานถูกปฏิเสธ';
    const body = isApproved
      ? `คำขอ${leaveType} (${daysCount} วัน) ได้รับการอนุมัติเรียบร้อย`
      : `คำขอ${leaveType}ของคุณถูกปฏิเสธ${reason ? `: ${reason}` : ' โดยผู้บริหาร'}`;

    try {
      if (Capacitor.isNativePlatform()) {
        await LocalNotifications.schedule({
          notifications: [
            {
              id: Math.floor(Math.random() * 100000),
              title,
              body,
              schedule: { at: new Date(Date.now() + 300) },
              sound: 'beep.wav',
            },
          ],
        });
      } else if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/favicon.ico' });
      }
    } catch (e) {
      console.warn('Leave status notification error:', e);
    }
  },

  // 7. Instant Salary Advance Request Status Notification (Approved / Rejected)
  async showAdvanceStatusNotification(status: 'APPROVED' | 'REJECTED', amount: number, reason?: string) {
    const isApproved = status === 'APPROVED';
    const title = isApproved ? '✅ คำขอเบิกเงินได้รับการอนุมัติ' : '❌ คำขอเบิกเงินถูกปฏิเสธ';
    const body = isApproved
      ? `คำขอเบิกเงินล่วงหน้า ${Number(amount).toLocaleString()} บาท ได้รับการอนุมัติแล้ว`
      : `คำขอเบิกเงิน ${Number(amount).toLocaleString()} บาท ถูกปฏิเสธ${reason ? `: ${reason}` : ' โดยผู้บริหาร'}`;

    try {
      if (Capacitor.isNativePlatform()) {
        await LocalNotifications.schedule({
          notifications: [
            {
              id: Math.floor(Math.random() * 100000),
              title,
              body,
              schedule: { at: new Date(Date.now() + 300) },
              sound: 'beep.wav',
            },
          ],
        });
      } else if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/favicon.ico' });
      }
    } catch (e) {
      console.warn('Advance status notification error:', e);
    }
  },
};


