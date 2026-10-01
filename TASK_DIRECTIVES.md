# 📋 Official Task Directives from Tech Lead
**Project**: ระบบบันทึกเวลาทำงานและจัดการสาขา ร้านสีแสงยางยนต์ (YOKOHAMA NAYA COSMIS)
**Date**: 2026-10-01
**Sprint**: Sprint 1 - Production Verification & Live Database Readiness
**Dispatched by**: Tech Lead & Software Architect (Antigravity) on behalf of ท่านประธาน (Product Owner)

---

## 📱 [TICKET #MOB-0101] Directive for `DevMobile AI` (Mobile PWA & Android Engineer)

### 🎯 Objective: ตรวจสอบและทดสอบระบบ Mobile ฝั่งพนักงาน (`src/app/employee/`) ครบวงจร
Tech Lead ได้เชื่อมต่อ Database เข้ากับตารางจริงของ Supabase และเปิดระบบ Agent War Room เรียบร้อยแล้ว DevMobile ต้องเข้าทดสอบระบบตาม Acceptance Criteria ต่อไปนี้:

### 🔑 บัญชีพนักงานจริงในฐานข้อมูล Supabase สำหรับการทดสอบ:
1. **รหัส: `01`** (ชื่อ: `ฟหกหฟก`, ชื่อเล่น: `ฟหกฟหก`, บทบาท: `STAFF`, PIN: `11`)
2. **รหัส: `02`** (ชื่อ: `ฟหก`, ชื่อเล่น: `ฟหก`, บทบาท: `STAFF`, PIN: `02`)
3. **รหัส: `SI01`** (ชื่อ: `ผู้บริหารสูงสุด`, ชื่อเล่น: `ท่านประธาน`, บทบาท: `ADMIN`, PIN: `5101`)

### 🔍 Checklist & Acceptance Criteria:
- [ ] **1. Authentication & Auto-Lookup**:
  - เมื่อกรอกรหัส `01` หรือ `02` ต้องแสดงชื่อพนักงานจาก Supabase แบบ Realtime
  - ทดสอบการล็อกอินครั้งแรก (First-time PIN) และการปลดล็อกแบบจดจำเครื่อง (Cached Profile)
- [ ] **2. Hardware Geofencing (50m)**:
  - พิกัดร้านใน DB: `Lat: 15.110481, Lng: 104.358552`, รัศมี `50 เมตร`
  - เช็คอินผ่านเมื่ออยู่ในรัศมี และถูกบล็อกพร้อมบันทึกความปลอดภัยเมื่ออยู่นอกพื้นที่
- [ ] **3. Strict HWID Device Binding**:
  - 1 พนักงานต่อ 1 เครื่องเท่านั้น หากนำบัญชีไปล็อกอินเครื่องอื่น ระบบต้องบล็อกและขึ้นคำเตือน `DEVICE_BOUND_MISMATCH`
- [ ] **4. Leave & Salary Advance Flow**:
  - ทดสอบหน้า `/employee/advance` (ขอเบิกเงิน) และ `/employee/leave` (ขอลา) ให้บันทึกลง Supabase สำเร็จ

### 🚀 คำสั่งส่งงานเมื่อเสร็จสิ้น:
```bash
npm run report:discord "DevMobile: ทดสอบระบบ Mobile PWA ครบทุกโมดูลสำเร็จ" "Auth, Geofence 50m, Leave, Advance ผ่าน 100%" "Mobile,HWID,Geofence" "พร้อมให้ท่านประธานตรวจรับงาน"
```

---

## 💻 [TICKET #WEB-0102] Directive for `DevWeb AI` (Web Admin & Dashboard Engineer)

### 🎯 Objective: ตรวจสอบ Real-Time Operations & Executive Management บน Web Dashboard
DevWeb ต้องเข้าตรวจสอบระบบหลังบ้าน (`src/app/admin/` และ `src/app/executive/`) ให้ทำงานสอดคล้องกับฐานข้อมูลจริงของร้าน:

### 🔍 Checklist & Acceptance Criteria:
- [ ] **1. Real-Time Attendance Stream**:
  - ยืนยันการทำงานของ Supabase Postgres Changes Subscription (<100ms instant broadcast)
  - แดชบอร์ดสรุปยอด (`totalPresent`, `totalLate`, `pendingCount`) อัปเดตสดเมื่อมีพนักงานเช็คอิน
- [ ] **2. 3D WebGL & 2D Fallback**:
  - ตรวจสอบ `ThreeBarChart3D.tsx` และ `ThreeDonut3D.tsx` ให้แสดงผลสวยงามและมี 2D Fallback ป้องกัน Crash
- [ ] **3. Employee Management & Reset HWID**:
  - แสดงรายชื่อพนักงาน 3 ท่าน (`SI01`, `01`, `02`)
  - ปุ่ม "ปลดล็อกอุปกรณ์ (Reset HWID)" ใช้งานได้จริงเมื่อแอดมินต้องการรีเซ็ตเครื่องให้พนักงาน
- [ ] **4. Request Approvals & Agent War Room**:
  - ตรวจสอบระบบอนุมัติใบลาและเบิกเงิน พร้อมระบบแจ้งเตือนเสียงและ Toast
  - ตรวจสอบหน้าใหม่ `/admin/war-room` ในการรับสารและโต้ตอบกับท่านประธานและ Tech Lead

### 🚀 คำสั่งส่งงานเมื่อเสร็จสิ้น:
```bash
npm run report:discord "DevWeb: ตรวจสอบระบบ Web Admin Dashboard ผ่าน 100%" "Realtime Sync, Reset HWID, Approvals ใช้งานได้สมบูรณ์" "WebAdmin,Realtime,Executive" "พร้อมให้ท่านประธานตรวจรับงาน"
```
