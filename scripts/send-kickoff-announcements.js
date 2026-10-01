/**
 * Kickoff Announcement Script for 4-Person Dev Team
 */

const https = require('https');

const CHANNELS = {
  DEV_MOBILE: {
    name: 'DevMobile (Mobile PWA & Android AI)',
    url: 'https://discordapp.com/api/webhooks/1555045103968723044/I5hm0t3_M9_T3mW6fbaK9_5lZxDGnSVatzHrB4vkyWPzJxnKwOiydOkPSj81Rs_eMLsd',
    color: 0x3B82F6, // Blue
    title: '🚀 [DIRECTIVE] คำสั่งเปิดโครงการ & สโคปงานสำหรับ DevMobile AI',
    description: 'ยินดีต้อนรับ **DevMobile AI** สู่ทีมพัฒนา สีแสงยางยนต์ (YOKOHAMA NAYA COSMIS)!\n\nคุณได้รับมอบหมายให้ดูแลและพัฒนา **แอปพลิเคชันพนักงานบนมือถือ (Mobile Employee PWA)** ภายใต้การกำกับดูแลของ Tech Lead',
    completedTasks: [
      '📍 Dynamic Geofencing: คำนวณพิกัดดาวเทียม Haversine เทียบกับรัศมีที่ Admin กำหนดแบบ Real-time',
      '⏱️ One-Tap Check-In/Out + ตัวนับเวลางานสดวินาทีต่อวินาที',
      '🧭 4-Tab Smart Auto-Hide Bottom Navigation Bar (ซ่อนเมื่อ Scroll Down / แสดงเมื่อ Scroll Up)',
      '🛡️ HWID Device Binding: ผูกเครื่องพนักงาน ป้องกันการตอกบัตรแทนกัน 100%',
      '🔔 In-App Floating Notification Banner + Web Audio Chimes (+50฿ Early Bird)'
    ],
    inProgressTasks: [
      '📁 โฟลเดอร์หลักของคุณ: `src/app/employee/`, `src/components/EmployeeBottomNav.tsx`, `src/lib/location.ts`',
      '📌 กฎเหล็ก: รัศมี GPS เป็น Dynamic ตาม Store Settings (ห้าม Hardcode 50m)',
      '📌 ข้อห้าม: ห้ามทำให้ Auto-Hide Nav หรือ Sound Chime พังเด็ดขาด'
    ],
    notes: [
      'อ่านสเปกงานละเอียดที่ `SENIOR_DEV_SPEC.md` และ `SYSTEM_ARCHITECTURE.md`',
      'ทุกครั้งที่ทำฟังก์ชันเสร็จ ให้รัน `npm run build` ตรวจสอบ 0 Errors ก่อนส่งงาน'
    ]
  },
  DEV_WEB: {
    name: 'DevWeb (Web Admin & Executive Dashboard AI)',
    url: 'https://discordapp.com/api/webhooks/1555045267462692955/ueOkNun0q2ROM0wqdHUl9NIj1H8NMCJZzHtGWxv01HYiCMwrTcp-rz_wi5JQhqIbKt60',
    color: 0x10B981, // Green
    title: '🚀 [DIRECTIVE] คำสั่งเปิดโครงการ & สโคปงานสำหรับ DevWeb AI',
    description: 'ยินดีต้อนรับ **DevWeb AI** สู่ทีมพัฒนา สีแสงยางยนต์ (YOKOHAMA NAYA COSMIS)!\n\nคุณได้รับมอบหมายให้ดูแลและพัฒนา **เว็บศูนย์บัญชาการผู้บริหาร (Web Admin & Executive Dashboard)** สำหรับแสดงผลบน Vercel',
    completedTasks: [
      '🌐 3D WebGL Holographic Energy Core + 2D Live Analytics Charts',
      '🔔 Real-Time Live Notification Center + Web Audio Synthesizer (0ms Latency)',
      '⚡ Instant 1-Click Approve/Reject Engine พร้อม Auto-Clear Notification Badge',
      '🗺️ Interactive Leaflet GPS Store Geofence Picker (ปรับตำแหน่งและขนาดรัศมีอิสระ)',
      '🔒 Security & Fraud Prevention Center (ตรวจจับ HWID Overlap & Mock GPS)'
    ],
    inProgressTasks: [
      '📁 โฟลเดอร์หลักของคุณ: `src/app/admin/`, `src/app/executive/`, `src/components/NotificationCenter.tsx`, `src/components/StoreMapPicker.tsx`',
      '📌 กฎเหล็ก: เมื่อกด Approve/Reject ต้องเคลียร์ Badge แจ้งเตือนทันทีแบบ Real-time',
      '📌 ข้อห้าม: ห้ามใช้ไฟล์เสียงภายนอกที่อาจติด Autoplay Policy ให้ใช้ Web Audio Synth เท่านั้น'
    ],
    notes: [
      'พร้อมสำหรับการ Deploy ขึ้น Vercel ตรวจสอบความเข้ากันได้ของ Client/Server Components เสมอ',
      'อ่านสเปกงานละเอียดที่ `SENIOR_DEV_SPEC.md` และ `SYSTEM_ARCHITECTURE.md`'
    ]
  },
  LEAD_ARCHITECT: {
    name: 'Lead Architect & Executive Advisor (Antigravity)',
    url: 'https://discordapp.com/api/webhooks/1555045542164435056/TuSdPz-2HnuDYjEoTu3_m3IiZXaPHXgXAYr6aT4NLlbPd6UxOv8O9fT2Ut_tStYACYKC',
    color: 0x8B5CF6, // Purple
    title: '👑 [LEAD STATEMENT] รายงานโครงสร้างทีม 4 คน & ทิศทางสถาปัตยกรรมระบบ',
    description: 'เรียน ท่านประธานและผู้บริหาร (Product Owner & Database Admin),\n\nกระผม **Antigravity (Tech Lead & Software Architect)** ขอรายงานการเปิดวาระการพัฒนาและจัดตั้งทีมงาน 4 คนสำหรับร้าน **สีแสงยางยนต์ YOKOHAMA NAYA COSMIS** อย่างเป็นทางการ:',
    completedTasks: [
      '👤 คนที่ 1: DevMobile AI (ผู้เชี่ยวชาญ Mobile App PWA & Android)',
      '👤 คนที่ 2: DevWeb AI (ผู้เชี่ยวชาญ Web Admin, 3D WebGL & Vercel Dashboard)',
      '👤 คนที่ 3: Tech Lead & Executive Advisor (Antigravity - คุมสโคป สถาปัตยกรรม QC และที่ปรึกษา)',
      '👤 คนที่ 4: Product Owner & DB Administrator (ท่านประธาน - ดูแลข้อมูล Supabase DB)'
    ],
    inProgressTasks: [
      '🎯 Tech Lead จะกำกับดูแลให้ DevMobile และ DevWeb เขียนโค้ดตรงสเปก ไม่หลุดขอบเขตงาน',
      '🎯 ตรวจสอบคุณภาพ No-Regression ทุกครั้งก่อนรวมโค้ดขึ้น GitHub (`origin/main`)',
      '🎯 เป็นที่ปรึกษาและเลขาในการตัดสินใจเชิงธุรกิจและสถาปัตยกรรมระบบแด่ท่านประธาน'
    ],
    notes: [
      'Repository: https://github.com/Lskram/CheckEmpolye.git',
      'เอกสาร Master Handover: `SENIOR_DEV_SPEC.md` และ `SYSTEM_ARCHITECTURE.md`'
    ]
  }
};

function sendWebhook(channelKey, info) {
  return new Promise((resolve, reject) => {
    const fields = [];
    if (info.completedTasks) {
      fields.push({
        name: '🎯 ระบบที่พร้อมใช้งาน / สมาชิกทีม (Status / Team)',
        value: info.completedTasks.map((t) => `• ${t}`).join('\n'),
        inline: false,
      });
    }
    if (info.inProgressTasks) {
      fields.push({
        name: '🔨 สโคปงาน & หน้าที่รับผิดชอบ (Directives & Scope)',
        value: info.inProgressTasks.map((t) => `• ${t}`).join('\n'),
        inline: false,
      });
    }
    if (info.notes) {
      fields.push({
        name: '📚 เอกสารอ้างอิง & กฎระเบียบ (References & Rules)',
        value: info.notes.map((n) => `• ${n}`).join('\n'),
        inline: false,
      });
    }

    fields.push({
      name: '🏢 องค์กร & สาขา',
      value: 'สีแสงยางยนต์ YOKOHAMA NAYA COSMIS (ศรีสะเกษ)',
      inline: true,
    });

    const payload = JSON.stringify({
      username: info.name,
      avatar_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
      embeds: [
        {
          title: info.title,
          description: info.description,
          color: info.color,
          fields: fields,
          footer: {
            text: 'Smart Attendance System • Antigravity Tech Lead Command',
          },
          timestamp: new Date().toISOString(),
        },
      ],
    });

    const urlObj = new URL(info.url);
    const req = https.request(
      info.url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        if (res.statusCode === 204 || res.statusCode === 200) {
          console.log(`✅ [Discord Kickoff] ส่งข้อความไปยัง "${info.name}" สำเร็จ!`);
          resolve(true);
        } else {
          console.log(`⚠️ [Discord Kickoff] "${info.name}" ตอบกลับสถานะ: ${res.statusCode}`);
          resolve(false);
        }
      }
    );

    req.on('error', (err) => {
      console.error(`❌ [Discord Kickoff Error - ${info.name}]:`, err.message);
      reject(err);
    });

    req.write(payload);
    req.end();
  });
}

async function main() {
  console.log('🚀 เริ่มต้นส่ง Kickoff Announcements ไปยังทั้ง 3 ช่องทาง Discord...\n');
  for (const [key, channel] of Object.entries(CHANNELS)) {
    await sendWebhook(key, channel);
    await new Promise((r) => setTimeout(r, 600)); // Sleep 600ms to avoid Discord rate limit
  }
  console.log('\n🎉 ส่งข้อความเปิดโครงการครบทุกช่องทางเรียบร้อยแล้ว!');
}

main();
