# 📊 คู่มือนำเสนอภาพรวมระบบ (Executive Infographic & System Manual)
### ระบบบันทึกเวลาทำงานและบริหารจัดการสาขาอัจฉริยะ (Smart Attendance & Branch Management System)
**ร้าน สีแสงยางยนต์ (YOKOHAMA NAYA COSMIS)**

---

## 📱 1. ฝั่งแอปพนักงานมือถือ (Mobile Employee App)

### 🌟 5 ระบบหลักในแอปพลิเคชันพนักงาน:

1. **📍 Hardware GPS Geofencing Lock (รัศมี 50 เมตร):**
   - คำนวณพิกัดดาวเทียมแบบ Real-time ด้วยสูตร Haversine
   - ล็อกความถูกต้อง หากอยู่นอกระยะ 50 เมตรจากร้าน ปุ่มลงเวลาจะถูกล็อกอัตโนมัติ ป้องกันการโกงลงเวลาจากที่บ้าน
2. **⏱️ One-Tap Smart Check-In / Check-Out (ลงเวลาง่ายใน 1 วินาที):**
   - หน้าจอ Live Digital Clock & Stopwatch บ่งบอกชั่วโมงการทำงานแบบวินาทีต่อวินาที
   - อัปเดตสถานะแบบ Real-time (ทำงานอยู่ / ออกงานแล้ว / เบิกเงินสะสม)
3. **🧭 4-Tab Smart Auto-Hide Bottom Navigation Bar:**
   - เมนู 4 แถบมาตรฐาน: **แดชบอร์ด (Home) | ประวัติ (History) | เบิกเงิน/ลา (Advance) | ข้อมูลส่วนตัว (Profile)**
   - ระบบ **Auto-Hide on Scroll**: ซ่อนแถบเมนูอย่างนุ่มนวลเมื่อเลื่อนดูรายการยาวๆ เพื่อเพิ่มพื้นที่การอ่าน และแสดงกลับทันทีเมื่อเลื่อนขึ้น
4. **🔔 In-App Notification Banner & Audio Chimes (การแจ้งเตือนพร้อมเสียงสังเคราะห์):**
   - แถบแจ้งเตือนลอยด้านบนสีเขียว/ฟ้าแจ้งผลการลงเวลาสำเร็จทันที
   - คำนวณเบี้ยเลี้ยงพิเศษ (+50 บาท) อัตโนมัติเมื่อเข้างานก่อน 08:30 น.
   - แจ้งผลการอนุมัติใบลา/เงินเบิกล่วงหน้าทันทีที่ผู้บริหารกดยืนยัน
5. **🛡️ HWID Device Binding (Anti-Buddy Punching):**
   - ผูกเครื่องโทรศัพท์กับรหัสพนักงาน ป้องกันการฝากเพื่อนตอกบัตรหรือสลับเครื่องโดยไม่ได้รับอนุญาต

---

## 💻 2. ฝั่งเว็บผู้บริหาร & แอดมิน (Web Admin & Executive Dashboard)

### 🌟 5 ระบบหลักในแดชบอร์ดผู้บริหาร:

1. **🌐 3D WebGL Holographic Energy Core & 2D Live Attendance Analytics:**
   - แอนิเมชันลูกโลก 3D Three.js แสดงพลังงานและสถานะสาขาแบบ Sci-Fi
   - กราฟสถิติ 2D วิเคราะห์อัตราการเข้างานตรงเวลา (On-time), มาสาย (Late), ทำงานล่วงเวลา (Overtime) รายวัน/รายเดือน
2. **🔔 Real-Time Live Notification Center (Web Audio Synthesizer):**
   - ศูนย์รวมการแจ้งเตือน Real-time เมื่อมีพนักงาน Check-in/out หรือยื่นขอเบิกเงิน/ลา
   - เสียงสังเคราะห์ Chime แจ้งเตือนคมชัดระดับ 0ms Latency โดยไม่ต้องโหลดไฟล์เสียงภายนอก
3. **⚡ Instant One-Click Approval & Rejection Engine:**
   - ระบบอนุมัติคำขอเบิกเงินล่วงหน้าและใบลาเพียงคลิกเดียว (ปุ่มเขียว Approve / ปุ่มแดง Reject)
   - หักล้างและเคลียร์ Badge แจ้งเตือนอัตโนมัติแบบทันที ไม่ต้องรีเฟรชหน้าจอ
4. **🗺️ Interactive Leaflet GPS Store Geofence Picker:**
   - แผนที่ดาวเทียมพร้อมหมุดพิกัดร้านและวงรัศมี Geofence 50 เมตร
   - ผู้บริหารสามารถคลิกเปลี่ยนพิกัดร้านหรือขยายรัศมีตรวจจับได้ทันทีจากหน้าจอ
5. **🔒 Security & Fraud Prevention Center (ระบบตรวจจับการโกง):**
   - ตรวจจับความผิดปกติของ Hardware ID (HWID Overlap Detection)
   - บันทึก IP Address และแจ้งเตือนเมื่อพบพฤติกรรมน่าสงสัยหรือการพยายามจำลอง GPS (Mock Location)

---

## 🔄 แผนภาพการเชื่อมโยงระบบ (System Flowchart)

```mermaid
flowchart TD
    subgraph Mobile_App["📱 Mobile Employee App"]
        GPS[📍 GPS Sensor < 50m] --> Auth[🛡️ HWID + Pin Auth]
        Auth --> Action[⏱️ Check-In / Out / Leave Request]
        Action --> Sound[🔊 In-App Sound + Banner]
    end

    subgraph Cloud_API["☁️ Next.js Fullstack API Engine"]
        Action -->|JSON Payload| API_Route["/api/attendance & /api/leave"]
        API_Route --> DB[(🗄️ Database: Users, Logs, Requests, StoreConfig)]
        DB --> WS[⚡ Server Push & Broadcast]
    end

    subgraph Web_Admin["💻 Web Admin Dashboard"]
        WS --> Notif[🔔 Live Notification Center]
        Notif --> Chime[🎵 Web Audio Chime]
        WS --> Charts[📊 3D WebGL + 2D Analytics]
        Web_Admin --> Approve[⚡ 1-Click Approve / Reject]
        Approve --> DB
        Web_Admin --> Geofence[🗺️ Leaflet Map Store Setup]
        Geofence --> DB
    end
```
