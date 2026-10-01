/**
 * CLI Task Retriever for DevMobile and DevWeb AI
 * Usage:
 *   node scripts/get-my-task.js --role=DEV_MOBILE
 *   node scripts/get-my-task.js --role=DEV_WEB
 */

const fs = require('fs');
const path = require('path');

const roleArg = process.argv.find((a) => a.startsWith('--role='))?.split('=')[1] || 'DEV_MOBILE';

const TASKS = {
  DEV_MOBILE: {
    roleName: '📱 DevMobile AI (Mobile App PWA & Android)',
    currentMilestone: 'Milestone 1: Mobile Production DB & Offline Sync',
    primaryFolders: [
      'src/app/employee/page.tsx (หน้าจอหลักลงเวลา + Live Clock)',
      'src/app/employee/advance/page.tsx (หน้าระบบเบิกเงินล่วงหน้า)',
      'src/app/employee/leave/page.tsx (หน้าระบบขอลางาน)',
      'src/components/EmployeeBottomNav.tsx (4-Tab Auto-Hide Bar)',
      'src/lib/location.ts (GPS Geolocation Watcher)',
    ],
    directives: [
      '1. เชื่อมต่อระบบ Check-in/out เข้ากับ Supabase Database จริง',
      '2. รักษาระบบ Dynamic Geofencing (ดึง radius_meters จาก Store Settings ห้ามล็อก 50m)',
      '3. ตรวจสอบ HWID Device Binding ทุกครั้งเพื่อป้องกันการตอกบัตรแทนกัน',
      '4. คงกลไก Auto-Hide on Scroll ใน EmployeeBottomNav.tsx ไว้เสมอ',
      '5. จัดการระบบ Offline Resilience (IndexedDB Fallback) เมื่อเครือข่ายออฟไลน์'
    ],
    qualityGate: 'รัน `npm run build` ต้องผ่าน 0 Errors ก่อนส่งงาน',
    discordReportCommand: 'npm run report:discord "Milestone 1: Mobile DB Integration" "สรุปงานที่ทำ..." "งานที่เสร็จ1,งานที่เสร็จ2" "งานถัดไป"',
  },
  DEV_WEB: {
    roleName: '💻 DevWeb AI (Web Admin & Executive Dashboard บน Vercel)',
    currentMilestone: 'Milestone 1: Web Realtime Dashboard & Instant Approval',
    primaryFolders: [
      'src/app/admin/page.tsx (ศูนย์ควบคุมแอดมิน)',
      'src/app/executive/page.tsx (แดชบอร์ดสถิติ 3D WebGL)',
      'src/components/NotificationCenter.tsx (ศูนย์แจ้งเตือนสด)',
      'src/components/SalaryAdvanceManager.tsx (ระบบอนุมัติเงินเบิก)',
      'src/components/StoreMapPicker.tsx (แผนที่ Leaflet กำหนดรัศมี)',
    ],
    directives: [
      '1. เชื่อมต่อ Supabase Realtime Subscription รับ Event สดจาก attendance_logs & requests',
      '2. ระบบ NotificationCenter ต้องเล่นเสียง Web Audio Synth ทันทีโดยไม่ต้องกดรีเฟรช',
      '3. ปุ่ม 1-Click Approve/Reject ต้องอัปเดต DB และ Auto-Clear Badge แจ้งเตือนออกแบบสดๆ',
      '4. รองรับการ Deploy บน Vercel 100% ไม่มีปัญหา Client/Server Mismatch',
      '5. แผนที่ Leaflet ต้องให้ Admin ปรับเปลี่ยนพิกัดและขนาดรัศมี Geofence (เมตร) ได้อิสระ'
    ],
    qualityGate: 'รัน `npm run build` ต้องผ่าน 0 Errors ก่อนส่งงาน',
    discordReportCommand: 'npm run report:discord "Milestone 1: Web Realtime Sync" "สรุปงานที่ทำ..." "งานที่เสร็จ1,งานที่เสร็จ2" "งานถัดไป"',
  }
};

const task = TASKS[roleArg] || TASKS.DEV_MOBILE;

console.log('\n' + '='.repeat(70));
console.log(`🤖 [TECH LEAD DIRECTIVE] สำหรับ ${task.roleName}`);
console.log('='.repeat(70));
console.log(`🎯 Milestone ปัจจุบัน: ${task.currentMilestone}\n`);

console.log('📁 โฟลเดอร์และไฟล์หลักของคุณ:');
task.primaryFolders.forEach((f) => console.log(`   • ${f}`));

console.log('\n📋 ข้อกำหนดและสโคปงานที่ต้องทำ:');
task.directives.forEach((d) => console.log(`   ${d}`));

console.log(`\n🔍 มาตรฐานคุณภาพ (Quality Gate): ${task.qualityGate}`);
console.log(`📡 คำสั่งส่งรายงานเข้า Discord: \n   ${task.discordReportCommand}\n`);
console.log('='.repeat(70) + '\n');
