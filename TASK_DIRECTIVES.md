# 📋 Task Directives from Tech Lead
**Project**: ระบบบันทึกเวลาทำงานและจัดการสาขา ร้านสีแสงยานยนต์ (YOKOHAMA NAYA COSMIS)
**Date**: 2026-10-01
**Status**: 🚀 LIVE SUPABASE DATA SYNC & ZERO-MISMATCH ENFORCEMENT

---

## 📱 Directive for `DevMobile AI` (Mobile PWA & Android Engineer)

### 🎯 Objective: ตรวจสอบและเชื่อมโยงระบบ Mobile เข้ากับฐานข้อมูลจริง (Supabase Live)
ทาง Tech Lead ได้ปรับปรุง Database Layer ให้ดึงข้อมูลสดจากตาราง Supabase เรียบร้อยแล้ว DevMobile ต้องปฏิบัติตามข้อกำหนดดังต่อไปนี้:

### 🔑 บัญชีพนักงานจริงในฐานข้อมูล Supabase สำหรับการทดสอบ:
1. **รหัสพนักงาน: `01`** (ชื่อ: `ฟหกหฟก`, ชื่อเล่น: `ฟหกฟหก`, บทบาท: `STAFF`, PIN: `11`)
2. **รหัสพนักงาน: `02`** (ชื่อ: `ฟหก`, ชื่อเล่น: `ฟหก`, บทบาท: `STAFF`, PIN: `02`)
3. **รหัสพนักงาน: `SI01`** (ชื่อ: `ผู้บริหารสูงสุด`, ชื่อเล่น: `ท่านประธาน`, บทบาท: `ADMIN`, PIN: `5101`)

### 🔍 Checklist ที่ DevMobile ต้องตรวจสอบใน Mobile Client (`src/app/employee/`):
1. **Login & Auto Lookup**:
   - เมื่อกรอกรหัสพนักงาน `01` หรือ `02` ต้องแสดงชื่อและข้อมูลสดจาก Supabase ทันที
   - การส่ง Payload Login รองรับทั้ง `{ employeeCode, pin, hwid }` และ `{ employeeCode, pinCode, hwid }`
2. **Hardware Geofencing**:
   - พิกัดร้านที่ดึงสดจาก DB: `Lat: 15.110481, Lng: 104.358552`, รัศมี `50 เมตร`
   - เช็คอินผ่านเมื่ออยู่ในรัศมี และถูกบล็อกพร้อมแจ้งเตือน LINE Security Alert เมื่ออยู่นอกพื้นที่
3. **Hardware Device Binding (HWID Guard)**:
   - ป้องกันการลงเวลาแทนกัน 1 บัญชีต่อ 1 เครื่อง หากนำไปล็อกอินเครื่องอื่น ระบบจะบล็อกและบันทึกประวัติการฝ่าฝืนลง `violation_logs`

---

## 💻 Directive for `DevWeb AI` (Web Admin & Dashboard Engineer)

### 🎯 Objective: ตรวจสอบ Real-Time Sync และ Admin Management บนฐานข้อมูลจริง
1. **Employee Management (`src/app/admin/`)**:
   - แสดงรายชื่อพนักงานตรงกับ Supabase 3 ท่าน (`SI01`, `01`, `02`)
   - รองรับปุ่ม "ปลดล็อกอุปกรณ์ (Reset HWID)" เพื่อให้แอดมินช่วยรีเซ็ตเครื่องให้พนักงานได้
2. **Attendance & Analytics**:
   - ดึงข้อมูลจาก `attendance_logs` และ `violation_logs` สดจาก Supabase แบบ Realtime
3. **Store Settings**:
   - บันทึกพิกัดร้านและรัศมี (50m) ลงตาราง `store_settings` ตรงเป๊ะ

---

## 🚀 คำสั่งสำหรับ DevMobile & DevWeb ในการรับงาน:
```bash
# ตรวจสอบคำสั่งงานล่าสุด
npm run task:mobile
npm run task:web

# ส่งรายงานกลับ Discord เมื่อทดสอบสำเร็จ
npm run report:discord "ยืนยันการเชื่อมต่อ Live Database สำเร็จ" "ทดสอบ Login พนักงาน 01, 02, SI01 ตรงกับ Supabase 100%" "Data Sync,HWID Guard,Geofence" "พร้อมใช้งานบน Production"
```
