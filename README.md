# 📱 ระบบ Attendance PWA (Next.js + Tailwind CSS + Supabase + Vercel)

ระบบ PWA เช็คอินและจัดการเวลาทำงานอัจฉริยะ พร้อมระบบตรวจสอบ Geofencing พิกัดร้าน, ระบบความปลอดภัย HWID ประจำเครื่อง, คำนวณเบี้ยเลี้ยงตรงเวลา (50 บาท), ระบบส่งไลน์แจ้งเตือนเมื่อมาสาย, ระบบยื่นและอนุมัติใบลา, ปฏิทินสถิติพนักงาน และแดชบอร์ดผู้บริหารพร้อมแถบเตือนสีแดง (Red Alert)

---

## ✨ ฟีเจอร์หลักของระบบ (Core Features)

1. **การจัดการบัญชีผู้ใช้ (Admin Employee Provisioning)**:
   - ฟอร์มสร้างพนักงานใหม่ (รหัสพนักงาน, ชื่อ-นามสกุล, ชื่อเล่น, รหัส PIN 4 หลัก, สิทธิ์การใช้งาน)
   - เข้ารหัส PIN และบันทึกลง Database
2. **การยืนยันตัวตนและความปลอดภัย HWID (Employee Auth & Caching Flow)**:
   - **First-time Login**: กรอก EMP Code + PIN พร้อมผูก HWID ประจำเครื่อง (1 คน 1 เครื่อง)
   - **HWID Overlap Detection**: หากมีการใช้เครื่องซ้ำซ้อน ระบบจะไม่บล็อกหน้างาน แต่จะบันทึก Log และส่งแถบเตือนสีแดง (Red Alert Banner) บนหน้าจอผู้บริหารทันที
   - **Cached Login**: บันทึกตัวตนใน LocalStorage เมื่อเข้าแอปครั้งต่อไป กรอกเพียงรหัส PIN 4 หลักเข้าใช้งานได้ทันที
3. **การเช็คอินและ Geofencing (Check-in & Shift Flow)**:
   - ปุ่มเช็คอินแอนิเมชันพริ้วไหวด้วย **Framer Motion**
   - Geolocation API แบบความแม่นยำสูง (High Accuracy) พร้อมคำนวณระยะทางด้วย **Haversine Formula**
   - ตรวจสอบรัศมีร้าน 50 เมตร (หากอยู่นอกพื้นที่ ระบบจะปฏิเสธและขึ้นข้อความเตือนสีแดง)
   - คำนวณเวลาเข้างาน:
     - มาก่อนหรือถึงกำหนด ($\le$ 08:00 น.): สถานะ `PRESENT` รับเบี้ยเลี้ยง **+50 บาท** ทันที พร้อมพลุเฉลิมฉลอง
     - มาสาย ($>$ 08:00 น.): สถานะ `LATE` เบี้ยเลี้ยง 0 บาท และยิงแจ้งเตือนผ่าน **LINE Messaging API** อัตโนมัติ
4. **การยื่นคำขอลา (Leave Request Flow)**:
   - พนักงานยื่นขอลา (ลาป่วย, ลากิจ, ลาพักร้อน) ระบุวันที่และเหตุผล
   - ผู้บริหารสามารถตรวจสอบและกด "อนุมัติ / ปฏิเสธ" ได้จากแดชบอร์ด
5. **Analytics & Executive Dashboard**:
   - **พนักงาน**: ปฏิทินรายเดือนแยกสีวันมาปกติ, มาสาย, วันลา และยอดเบี้ยเลี้ยงสะสม
   - **ผู้บริหาร**: สรุปยอดเบี้ยเลี้ยงรวมทั้งองค์กร, กราฟสถิติ, รายงานเบี้ยเลี้ยงรายบุคคล, ตัวกรอง รายวัน / รายสัปดาห์ / รายเดือน และตาราง Security Logs

---

## 🚀 วิธีการติดตั้งและรันบนเครื่อง (Getting Started)

### 1. ติดตั้ง Dependencies
```bash
npm install
```

### 2. รันโหมด Development
```bash
npm run dev
```
เปิดเบราว์เซอร์ไปที่: `http://localhost:3000`

### 3. รหัสบัญชีทดสอบในระบบ (Demo Accounts)
- **ผู้บริหาร (Admin)**: รหัส `ADMIN01` / PIN `1234`
- **พนักงาน 1**: รหัส `EMP001` / PIN `1234` (สมชาย สายตรง)
- **พนักงาน 2**: รหัส `EMP002` / PIN `1234` (วิภาดา ขยันยิ่ง)
- **พนักงาน 3**: รหัส `EMP003` / PIN `1234` (กิตติพงษ์ ตรงเวลา)

---

## 🗄️ การเชื่อมต่อ Supabase Database

1. สร้างโปรเจกต์ใหม่บน [Supabase Dashboard](https://supabase.com)
2. ไปที่ **SQL Editor** ใน Supabase และ Copy เนื้อหาจากไฟล์ `supabase/schema.sql` ไปวางแล้วกด **Run**
3. คัดลอกค่า `Project URL` และ `anon key` จาก Supabase Project Settings -> API
4. นำมากรอกลงในไฟล์ `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

*(หมายเหตุ: หากยังไม่ได้กรอก Supabase Key ระบบจะทำงานผ่านระบบ In-Memory Store อัตโนมัติ ทำให้ทดสอบได้ทันที)*

---

## ☁️ การ Deploy ขึ้น Vercel

1. Push โค้ดขึ้น GitHub Repository
2. เข้าสู่ [Vercel Dashboard](https://vercel.com) แล้วเลือก **Add New Project** -> Import repository
3. เพิ่ม Environment Variables ในแท็บ Settings -> Environment Variables
4. กด **Deploy** แอปพลิเคชันจะพร้อมใช้งานเป็น Progressive Web App (PWA) บนมือถือทันที!
