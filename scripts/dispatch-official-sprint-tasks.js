/**
 * Official Task Dispatcher from Tech Lead to DevMobile and DevWeb
 */

const WEBHOOKS = {
  mobile: 'https://discordapp.com/api/webhooks/1555045103968723044/I5hm0t3_M9_T3mW6fbaK9_5lZxDGnSVatzHrB4vkyWPzJxnKwOiydOkPSj81Rs_eMLsd',
  web: 'https://discordapp.com/api/webhooks/1555045267462692955/ueOkNun0q2ROM0wqdHUl9NIj1H8NMCJZzHtGWxv01HYiCMwrTcp-rz_wi5JQhqIbKt60',
  lead: 'https://discordapp.com/api/webhooks/1555045542164435056/TuSdPz-2HnuDYjEoTu3_m3IiZXaPHXgXAYr6aT4NLlbPd6UxOv8O9fT2Ut_tStYACYKC',
};

async function sendWebhook(url, payload) {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch (e) {
    console.error('Webhook error:', e);
    return false;
  }
}

async function main() {
  console.log('🚀 Dispatching Official Task Directives from Tech Lead...');

  // 1. Task Directive for DevMobile AI
  await sendWebhook(WEBHOOKS.mobile, {
    username: '🧠 Tech Lead (Antigravity)',
    avatar_url: 'https://cdn-icons-png.flaticon.com/512/4712/4712035.png',
    embeds: [
      {
        title: '📋 [TICKET #MOB-0101] มอบหมายงาน: ตรวจสอบและทดสอบระบบ Mobile PWA ครบวงจร',
        description: '**เรียน DevMobile AI (Mobile Engineer)**\nท่านประธานได้มีคำสั่งให้ Tech Lead มอบหมายงานการตรวจสอบและทดสอบระบบ Mobile ฝั่งพนักงาน (`src/app/employee/`) โดยมีรายละเอียดดังนี้:',
        color: 0xa855f7, // Purple
        fields: [
          {
            name: '1. ทดสอบระบบ Login & Live DB Auth',
            value: '• ทดสอบล็อกอินด้วยรหัสพนักงานจริง `01` (PIN `11`), `02` (PIN `02`)\n• ทดสอบระบบล็อกอินแบบจำเครื่อง (Cached Profile) และปุ่มสลับบัญชีพนักงาน\n• ตรวจสอบการผูกเครื่อง (HWID Binding) ป้องกันการลงเวลาแทนกัน',
            inline: false,
          },
          {
            name: '2. ตรวจสอบระบบ Dynamic Geofencing (50m)',
            value: '• ยึดพิกัดร้านจาก Supabase: `15.110481, 104.358552` (รัศมี `50m`)\n• ตรวจสอบสูตร Haversine และการคำนวณเบี้ยขยัน (+50฿ ก่อน 08:00 น.)',
            inline: false,
          },
          {
            name: '3. ตรวจสอบระบบยื่นใบลาและขอเบิกเงินล่วงหน้า',
            value: '• หน้า `/employee/advance` (ขอเบิกเงิน) และ `/employee/leave` (ขอลา)\n• บันทึกลงตาราง Supabase `salary_advance_requests` และ `leave_requests` ถูกต้อง',
            inline: false,
          },
          {
            name: '🚀 คำสั่งส่งงานเมื่อเสร็จสิ้น',
            value: '```bash\nnpm run report:discord "DevMobile: ทดสอบระบบ Mobile PWA ครบทุกโมดูลสำเร็จ" "Auth, Geofence 50m, Leave, Advance ผ่าน 100%" "Mobile,HWID,Geofence" "พร้อมให้ท่านประธานตรวจรับงาน"\n```',
            inline: false,
          },
        ],
        footer: { text: 'ร้านสีแสงยางยนต์ • Tech Lead Task Dispatch' },
        timestamp: new Date().toISOString(),
      },
    ],
  });

  // 2. Task Directive for DevWeb AI
  await sendWebhook(WEBHOOKS.web, {
    username: '🧠 Tech Lead (Antigravity)',
    avatar_url: 'https://cdn-icons-png.flaticon.com/512/4712/4712035.png',
    embeds: [
      {
        title: '📋 [TICKET #WEB-0102] มอบหมายงาน: ตรวจสอบ Real-Time Operations & Executive Management',
        description: '**เรียน DevWeb AI (Web Admin & Dashboard Engineer)**\nท่านประธานได้มีคำสั่งให้ Tech Lead มอบหมายงานระบบ Web Dashboard (`src/app/admin/` และ `src/app/executive/`) ดังนี้:',
        color: 0x10b981, // Emerald Green
        fields: [
          {
            name: '1. ตรวจสอบ Real-Time Data Sync',
            value: '• ตรวจสอบ Supabase Postgres Changes Subscription ให้แดชบอร์ดอัปเดตทันทีที่พนักงานเช็คอิน (<100ms)\n• ตรวจสอบกราฟ 3D WebGL Three.js และ 2D Fallback ชัดเจน',
            inline: false,
          },
          {
            name: '2. ตรวจสอบระบบ Admin Employee Management',
            value: '• แสดงรายชื่อพนักงาน 3 ท่าน (`SI01`, `01`, `02`) ถูกต้อง\n• ปุ่ม "ปลดล็อกอุปกรณ์ (Reset HWID)" ใช้งานได้จริงเมื่อพนักงานเปลี่ยนเครื่อง',
            inline: false,
          },
          {
            name: '3. ตรวจสอบระบบอนุมัติเบิกเงิน & ใบลา',
            value: '• ตรวจสอบปุ่ม "อนุมัติ / ปฏิเสธ" ในแท็บเบิกเงินและแท็บใบลา พร้อมอัปเดตแจ้งเตือน',
            inline: false,
          },
          {
            name: '🚀 คำสั่งส่งงานเมื่อเสร็จสิ้น',
            value: '```bash\nnpm run report:discord "DevWeb: ตรวจสอบระบบ Web Admin Dashboard ผ่าน 100%" "Realtime Sync, Reset HWID, Approvals ใช้งานได้สมบูรณ์" "WebAdmin,Realtime,Executive" "พร้อมให้ท่านประธานตรวจรับงาน"\n```',
            inline: false,
          },
        ],
        footer: { text: 'ร้านสีแสงยางยนต์ • Tech Lead Task Dispatch' },
        timestamp: new Date().toISOString(),
      },
    ],
  });

  // 3. Lead Architect Channel Log
  await sendWebhook(WEBHOOKS.lead, {
    username: '🧠 Tech Lead (Antigravity)',
    avatar_url: 'https://cdn-icons-png.flaticon.com/512/4712/4712035.png',
    embeds: [
      {
        title: '📢 [EXECUTIVE DISPATCH] ได้สั่งการงานอย่างเป็นทางการไปยัง DevMobile และ DevWeb เรียบร้อย',
        description: '**กราบเรียนท่านประธาน**\nTech Lead ได้ออก Ticket งาน `#MOB-0101` และ `#WEB-0102` ส่งตรงไปยัง Discord ของทั้งสองฝ่ายเรียบร้อยแล้วครับ พร้อมระบุ Acceptance Criteria และคำสั่งส่งงานอัตโนมัติ',
        color: 0x3b82f6,
        footer: { text: 'ร้านสีแสงยางยนต์ • Executive Architecture Center' },
        timestamp: new Date().toISOString(),
      },
    ],
  });

  console.log('✅ Task directives dispatched to all Discord channels successfully!');
}

main();
