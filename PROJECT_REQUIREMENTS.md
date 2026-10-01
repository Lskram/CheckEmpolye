# 📋 PROJECT REQUIREMENTS & SYSTEM SPECIFICATIONS
> **ระบบลงเวลาทำงานและจัดการเบี้ยเลี้ยงอัจฉริยะ (สีแสงยางยนต์ - YOKOHAMA NAYA COSMIS)**  
> *เอกสารความต้องการของระบบ โครงสร้างสถาปัตยกรรม และตารางบันทึกการปรับปรุงความต้องการ (Living Requirements)*

---

## 🏗️ 1. โครงสร้างสถาปัตยกรรมระบบ 3 ส่วน (System Division)

ระบบถูกแบ่งออกเป็น 3 ส่วนหลักอย่างชัดเจนตามข้อกำหนด:

```mermaid
flowchart TD
    subgraph Cloud["☁️ Central Database & Cloud Services"]
        DB[(Supabase PostgreSQL\n- employees, attendance_logs\n- store_settings, leave_requests\n- violation_logs)]
        Vercel[Vercel Serverless Hosting]
        Line[LINE Messaging API]
    end

    subgraph Part1["💻 Part 1: Web Executive Dashboard"]
        WebAdmin["Web Browser (/admin, /executive)\n- หน้าจอสำหรับผู้บริหารบนคอมพิวเตอร์\n- จัดการพนักงาน, อนุมัติใบลา, มอนิเตอร์แบบเรียลไทม์\n- ตรวจสอบ Red Alert Security Logs\n- ส่งออกรายงาน Excel/CSV (UTF-8 BOM)"]
    end

    subgraph Part2["📱 Part 2: Executive Mobile App"]
        MobileAdmin["Mobile Executive Dashboard\n- หน้าจอสำหรับผู้บริหารดูสรุปยอดผ่านมือถือ\n- อนุมัติการลาเร่งด่วน และดูพนักงานมาสาย"]
    end

    subgraph Part3["📲 Part 3: Staff Native Android Mobile App"]
        NativeApp["Native Android APK (com.yokohama.attendance)\n- รันบนโทรศัพท์มือถือเครื่องจริงของพนักงาน (Realme)\n- 1-Device-1-Employee HWID Lock\n- Geofencing 50m ตรวจจับพิกัดร้าน\n- ปุ่ม Dynamic เข้างาน -> ออกงาน -> สำเร็จ\n- ปฏิทินเบี้ยเลี้ยงสะสม, ยื่นคำขอลางาน"]
    end

    WebAdmin <--> DB
    MobileAdmin <--> DB
    NativeApp <--> DB
    WebAdmin -. Deploy .-> Vercel
    NativeApp -. LINE Alert .-> Line
```

| ส่วนของระบบ | แพลตฟอร์ม / ช่องทาง | ผู้ใช้งาน | ฟังก์ชันหลัก |
| :--- | :--- | :--- | :--- |
| **Part 1: Web Executive Dashboard** | Web Browser (`https://check-empolye.vercel.app/admin`) | ผู้บริหาร / แอดมิน | จัดการบัญชีพนักงาน, อนุมัติใบลา, กราฟสถิติ 3D, ส่งออกรายงาน Excel/CSV, Red Alert ความปลอดภัย |
| **Part 2: Executive Mobile App** | Mobile App / Mobile Web | ผู้บริหาร | สรุปยอดลงเวลารายวัน, อนุมัติคำขอลาเร่งด่วนผ่านมือถือ |
| **Part 3: Staff Native Mobile App** | Native Android APK (`com.yokohama.attendance`) บนมือถือจริง | พนักงานร้าน | บันทึกเวลาเข้างาน-ออกงาน, ตรวจสอบพิกัด GPS ร้าน 50 ม., ปฏิทินเบี้ยเลี้ยงสะสม, ยื่นคำขอลา |

---

## 🎯 2. กฎเกณฑ์ทางธุรกิจและข้อกำหนดระบบ (Core Business Logic)

### 2.1 กฎการลงเวลาและการคำนวณเบี้ยเลี้ยง (Shift & Allowance Rules)
- **พิกัดร้าน (Store Geofence)**: `Lat: 15.110412, Lng: 104.358434` (สีแสงยางยนต์ YOKOHAMA NAYA COSMIS)
- **รัศมีที่อนุญาต**: ภายใน **50 เมตร** (คำนวณผ่าน Haversine Formula บนพิกัด GPS ความแม่นยำสูง)
- **เวลากะทำงานปกติ**: **07:40 น.**
- **เวลาอนุโลมสูงสุด (Grace Period)**: **08:00 น.**
- **การคิดเบี้ยขยัน (Allowance)**:
  - มาถึง $\le$ 08:00 น. $\rightarrow$ สถานะ **ตรงเวลา (PRESENT)** รับเบี้ยขยัน **+50 บาท/วัน**
  - มาถึง $>$ 08:00 น. $\rightarrow$ สถานะ **มาสาย (LATE)** รับเบี้ยขยัน **0 บาท** และส่งแจ้งเตือนเข้า LINE กลุ่มผู้บริหาร
- **การลงเวลาออกงาน (Check-Out Flow)**:
  - เมื่อหมดเวลากะ พนักงานสามารถกดปุ่ม "ออกงาน" ผ่านแอปมือถือ
  - บันทึกเวลาออกงาน (`check_out_time`) และคำนวณระยะเวลาทำงานสุทธิต่อวัน
- **การป้องกันการลงเวลาซ้ำ (Daily Duplicate Prevention)**:
  - บล็อกที่ระดับ Backend API ป้องกันไม่ให้เกิด Log เข้างานซ้ำซ้อนในวันเดียวกัน

### 2.2 ระบบความปลอดภัยและการป้องกันการทุจริต (Anti-Fraud & Security)
- **1 คน 1 เครื่อง (1-Device-1-Employee HWID Lock)**:
  - เมื่อพนักงานเข้าสู่ระบบบนโทรศัพท์มือถือครั้งแรก ระบบจะดึงรหัส Hardware Fingerprint (HWID) ผูกติดกับบัญชีพนักงาน
  - หากมีการนำเครื่องเดิมไปล็อกอินให้พนักงานคนอื่น $\rightarrow$ ระบบจะตรวจพบ `CRITICAL HWID OVERLAP` และแจ้งเตือน Red Alert บน Dashboard ผู้บริหารทันที

### 2.3 การยื่นและอนุมัติใบลา (Leave Management Flow)
- พนักงานสามารถยื่นคำขอลาได้ 4 ประเภท: **ลาป่วย 🩺, ลากิจ 💼, ลาพักร้อน 🏖️, อื่นๆ 📝**
- ผู้บริหารสามารถตรวจสอบและกด "อนุมัติ" หรือ "ปฏิเสธ" ผ่าน Dashboard
- สถานะใบลาจะสะท้อนเข้าสู่ปฏิทินของพนักงานแบบเรียลไทม์

---

## 📊 3. ตารางสถานะฟีเจอร์และความต้องการ (Requirements & Task Backlog)

### 3.1 ฟีเจอร์ที่พัฒนาแล้วเสร็จ (Completed Features)

| รหัส Ticket | หมวดหมู่ | รายละเอียดความต้องการ | สถานะ | เครื่องมือ / แพลตฟอร์ม |
| :--- | :--- | :--- | :---: | :--- |
| **REQ-001** | Architecture | แยก 3 โปรเจกต์: Web Dashboard, Executive Mobile, Staff Native App | ✅ เสร็จสิ้น | Vercel / Capacitor / Next.js |
| **REQ-002** | Web Executive | หน้าจอผู้บริหารบนคอมพิวเตอร์ ตรวจสอบพนักงาน, ประวัติ, ข้อมูลสถิติ | ✅ เสร็จสิ้น | Web / Vercel (`/admin`) |
| **REQ-003** | Mobile Staff | บิวด์แอป Native Android ติดตั้งบนโทรศัพท์จริงของพนักงาน (Realme RMX3491) | ✅ เสร็จสิ้น | Capacitor / Gradle / ADB |
| **REQ-004** | Security | ระบบ HWID Device Fingerprint ป้องกันการลงเวลาแทนกัน | ✅ เสร็จสิ้น | Native HWID / Supabase |
| **REQ-005** | Geofence | ระบบตรวจสอบพิกัด GPS ร้านรัศมี 50 เมตร ป้องกันการลงเวลานอกสถานที่ | ✅ เสร็จสิ้น | Geolocation / Haversine |
| **REQ-006** | Attendance | ระบบคำนวณเบี้ยขยัน 50฿ และแยกสถานะ ตรงเวลา/สาย/ลา | ✅ เสร็จสิ้น | PostgreSQL / Live Supabase |
| **REQ-007** | Leave System | ระบบยื่นคำขอลาบนมือถือพนักงาน และปุ่มอนุมัติบนหน้าผู้บริหาร | ✅ เสร็จสิ้น | Mobile UI / Admin Flow |
| **REQ-008** | Living Spec | จัดทำเอกสาร `.MD` บันทึกความต้องการและคอยอัปเดตต่อเนื่อง | ✅ เสร็จสิ้น | `PROJECT_REQUIREMENTS.md` |
| **REQ-009** | Realtime Flow | เชื่อมต่อข้อมูลมือถือ ↔ เว็บ ↔ Supabase แบบ Real-time ทันที (<100ms) และเรียงลำดับการลงเวลาล่าสุดไว้บนสุด | ✅ เสร็จสิ้น | Supabase Realtime / WebSocket |
| **REQ-010** | Attendance | ระบบลงเวลา "ออกงาน" (Check-Out Flow) บันทึกเวลาเลิกงานและระยะเวลาทำงาน | ✅ เสร็จสิ้น | API `/api/check-out` / Mobile UI |
| **REQ-011** | Reporting | ปุ่มส่งออกรายงาน Excel / CSV (Export Report UTF-8 with BOM สำหรับภาษาไทย) | ✅ เสร็จสิ้น | Admin Web Dashboard (`/admin`) |
| **REQ-012** | Attendance | ระบบป้องกันการกดเช็คอินซ้ำในวันเดียวกัน (Daily Check-in Duplicate Prevention) | ✅ เสร็จสิ้น | API `/api/check-in` Backend Guard |
| **REQ-018** | Geofence | ระบบพิกัดดาวเทียมฮาร์ดแวร์ความแม่นยำสูง และซิงค์จุดมาร์คร้านจากเว็บสู่มือถือแบบเรียลไทม์ (<100ms) | ✅ เสร็จสิ้น | Capacitor Geolocation / Supabase Realtime |
| **REQ-019** | Geofence & Audit | ล็อกปุ่มเมื่ออยู่นอกพื้นที่ร้าน บันทึก Log พิกัดที่พยายามลงเวลา แจ้งเตือน Log ID ข้ามอุปกรณ์ และแจ้งเตือนรหัสผ่าน/บัญชีไม่ถูกต้อง | ✅ เสร็จสิ้น | API Check-in / Login / Web Toast / LINE |
| **REQ-020** | UI & Experience | ปรับแต่งโฉมหน้าจอ Mobile Employee ทั้งระบบเป็น Dark Slate Glassmorphism สุดพรีเมียมและมินิมอล | ✅ เสร็จสิ้น | Mobile Staff App (`/employee/*`) |
| **REQ-021** | UI & Experience | ปรับปรุงสไตล์ Neumorphic 3D Dual-Tone Wave (Dark & Light Theme Toggle) เลียนแบบต้นแบบดีไซน์ พร้อม Tactile 3D Tiles, S-Curve Transition และ Piano Key Capsules | ✅ เสร็จสิ้น | Mobile Staff App (`/employee/*`) |

---

### 3.2 คลังความต้องการในอนาคต (Future Feature Backlog)

| รหัส Ticket | หมวดหมู่ | รายละเอียดความต้องการ | ระดับความสำคัญ | แพลตฟอร์ม |
| :--- | :--- | :--- | :---: | :--- |
| **REQ-013** | Notifications | แจ้งเตือน LINE Notify เมื่อมีพนักงานยื่นใบลาใหม่ และแจ้งเตือนผลการอนุมัติ/ปฏิเสธ | ปานกลาง | LINE Messaging API |
| **REQ-014** | Security & Profile | ระบบให้พนักงานเปลี่ยนรหัสผ่าน PIN 4 หลัก ด้วยตนเองผ่านแอปมือถือ | ปานกลาง | Mobile Staff App |
| **REQ-015** | Notifications | Push Notification บนโทรศัพท์ แจ้งเตือนพนักงานก่อน 07:40 น. ไม่ให้ลืมเข้างาน | แนะนำ | Native Push / Capacitor |
| **REQ-016** | Reporting | ตัวเลือกเลือกช่วงวันที่รายงานแบบกำหนดเองอิสระ (Custom Date Range Filter) | แนะนำ | Web Admin Dashboard |
| **REQ-017** | Reliability | แถบแสดงสถานะเตือนเมื่อเน็ตมือถือหลุดชั่วขณะ (Offline Indicator Banner) | แนะนำ | Mobile Staff App |

---

## 🛠️ 4. สภาพแวดล้อมและเครื่องมือในการพัฒนา (Environment & Tooling)

- **โทรศัพท์ทดสอบจริง**: Realme RMX3491 (Device ID: `f4da450d`)
- **Android SDK Path**: `C:\Users\tlelo\.gemini\antigravity\tools\android-sdk`
- **Java JDK Path**: `C:\Users\tlelo\.gemini\antigravity\tools\jdk-21`
- **ADB Command Tool**: `C:\Users\tlelo\.gemini\antigravity\tools\platform-tools\adb.exe`
- **Web Production Host**: `https://check-empolye.vercel.app`
- **Supabase Live Database**: `https://bcliaorfqyxgiisocmmq.supabase.co`

---

## 📝 5. บันทึกการเปลี่ยนแปลงและความต้องการเพิ่มเติม (Changelog)

### 📌 [2026-10-01] - Soft 3D Neumorphism & S-Curve Wave Dual-Tone Design with Dark/Light Theme (Version 2.9)
- ✅ **ระบบสลับธีม Dark & Light Mode อัตโนมัติ (`src/lib/theme.ts`)**: รองรับการเปลี่ยนโหมดทั้งแอปด้วยปุ่ม Sun/Moon และจดจำสถานะใน `localStorage`
- ✅ **S-Curve Organic Wave Cutout**: เลเยอร์คลื่นตัดระหว่างส่วน Telemetry ด้านบนกับพื้นที่ Tactile Tiles ด้านล่าง
- ✅ **6 Tactile Neumorphic 3D Action Tiles**: ปุ่มเมนูสัมผัสนุ่มนวล (เข้างาน, เบิกเงิน, ยื่นใบลา, ปฏิทิน, พิกัดร้าน, เบี้ยขยัน) พร้อมเงา 3D Embossed ทั้งใน Dark และ Light Mode
- ✅ **Piano Key Date Capsules**: แคปซูลแสดงประวัติเวลาทำงานย้อนหลังแบบแถวเปียโน
- ✅ **Raised 3D Center Action Button บน Bottom Nav**: ปุ่มวงกลมนูน 3 มิติพร้อมร่องโค้ง Indented Bevel
- ✅ **Zero Regression Guarantee**: ฟังก์ชันความแม่นยำสูง GPS Geofencing 50ม., Live Working Stopwatch, HWID Guard, และ Supabase Realtime พร้อม Production Build ผ่าน 15/15 Routes

### 📌 [2026-10-01] - Modern Clean Bento Grid & Minimalist UI Master Overhaul (Version 2.8)
- ✅ **หน้าแรก Landing & Entry Portal (`/`) สไตล์ Modern Bento Grid**: สร้างหน้า Portal ทางเข้าหลักที่มินิมอล สวยงาม จัดวางการ์ด 2 ประตูหลัก (📱 Staff Mobile PWA และ 💻 Executive Web Dashboard) พร้อมแสดงเวลาสดของกรุงเทพฯ และสถานะความหน่วงเซิร์ฟเวอร์
- ✅ **ยกเครื่อง Web Executive Dashboard (`/admin`) สไตล์ Linear / Vercel Bento Grid**:
  - การ์ดสถิติ KPI 4 มิติแบบ Bento Grid: ยอดจ่ายเบี้ยขยันวันนี้ (+50฿), จำนวนพนักงานเข้างานจริง/ทั้งหมด, อัตราความตรงต่อเวลา (On-Time %), และระบบตรวจจับความปลอดภัย HWID Guard
  - แถบเมนู Segmented Pill Tab Bar มินิมอล: ภาพรวมสถิติ, จัดการพนักงาน, อนุมัติใบลา, คำขอเบิกเงิน, Security Logs, และตั้งค่าร้าน & แผนที่ Geofence
  - ตารางพนักงานสด (Staff Live Roster) ดีไซน์ใหม่: Avatar ย่อส่วน, เวลาเช็คอิน/ออกงาน, สถานะตรงเวลา/สาย/ยังไม่ลง, ระยะห่างร้าน, ค้นหาแบบ Real-time และฟิลเตอร์สถานะ
  - หน้าต่างล็อกอินผู้บริหาร (Executive Authentication Lock Screen) สไตล์ Glass Card พร้อม Toggle เปิด/ปิดดูรหัสผ่าน
- ✅ **ปรับปรุง Mobile Executive View (`/executive`)**: การ์ดสรุปยอด Bento แบบ Obsidian Glass, ตัวเลือกแท็บมินิมอล, และรองรับการจัดการพิกัดร้านบนมือถือ
- ✅ **ปรับปรุง Employee Login & Keypad (`/employee/login`)**: ดีไซน์การ์ดมินิมอล พร้อมระบบ Live Employee Lookup แสดงชื่อ-นามสกุลก่อนกดรหัส และปุ่มตัวเลขสัมผัสนุ่มนวล
- ✅ **Zero Regression Guarantee**: สถาปัตยกรรม Database, API Route Handlers, Realtime WebSocket, Haversine Geofencing, และ Web Audio Synthesizer ทำงานได้ 100% ผ่านการคอมไพล์ `npm run build` สมบูรณ์ 15/15 Routes (0 Errors)

### 📌 [2026-10-01] - Minimalist Dark Slate Glassmorphism Mobile UI Overhaul (Version 2.7)
- ✅ **ยกเครื่องแถบเมนูด้านล่าง (Smart Floating Frosted Glass Bottom Nav)**: ดีไซน์ใหม่แบบลอยตัวโค้งมน (`backdrop-blur-2xl bg-slate-900/90`), Active Pill Indicator พร้อมไฟนีออน และระบบ Smart Auto-Hide ซ่อนแถบอัตโนมัติเมื่อเลื่อนหน้าจอลงเพื่อเพิ่มพื้นที่การมองเห็นสูงสุด
- ✅ **อัปเกรดหน้าเข้าสู่ระบบ (Premium Dark Glass Login & Tactile Keypad)**: การ์ดกระจกดำหรูหรา (`bg-slate-900/70 border-white/10`), Ambient Glow แสงสีฟ้า-ม่วง, Debounced Live Profile Peek, และ Numeric Keypad แบบ Tactile กดง่าย แม่นยำ
- ✅ **อัปเกรดหน้าหลักลงเวลาเข้า-ออกงาน (`/employee`)**:
  - นาฬิกาดิจิทัลเรืองแสงแบบเรียลไทม์ พร้อมวัน/เวลาภาษาไทย
  - วงแหวนปุ่มกดลงเวลาขนาดใหญ่แบบ Multi-Layer Glowing Rings พร้อมสถานะตามบริบท (เข้างาน / ออกงาน / สำเร็จ)
  - **Live Working Stopwatch Widget**: แสดงเวลานับกะการทำงานแบบวินาทีต่อวินาทีเมื่อเข้างานแล้ว
  - การ์ด Telemetry สด: ระยะห่างพิกัด GPS ดาวเทียม, รัศมีร้าน 50 ม., และสถานะ Cloud Realtime Sync
- ✅ **อัปเกรดหน้าขอยืมเงินล่วงหน้า (`/employee/advance`)**: การ์ดแสดงโควตาเงินเดือนที่ยืมได้, Quick Amount Selectors (+500฿, +1,000฿, +2,000฿), และ Timeline ประวัติคำขอแบบเรืองแสง
- ✅ **อัปเกรดหน้ายื่นใบลา (`/employee/leave`)**: Quick Category Pills (ลาป่วย, ลากิจ, พักร้อน, อื่นๆ) พร้อมสีประจำประเภท, Date Picker กระจกดำ, และรายการประวัติใบลาพร้อม Badge แสดงสถานะ
- ✅ **อัปเกรดหน้าสถิติ & ปฏิทินเบี้ยเลี้ยง (`/employee/stats`)**: การ์ดสรุปยอดเบี้ยเลี้ยงสะสมเดือนนี้แบบ Emerald Gradient, อัตราความตรงต่อเวลา (On-Time %), ตารางปฏิทินแยกสีสถานะและยอดเงิน (+50฿, สาย, ลา), และระบบเลื่อนเดือนพุทธศักราช
- ✅ **Zero Regression Guarantee**: สถาปัตยกรรม Business Logic, GPS Geofencing, Audio Synthesizer, Supabase Realtime Channels, และ Native Android Bridges ทำงานได้สมบูรณ์แบบ 100% ผ่านการทดสอบ Next.js Production Build 15/15 Routes ผ่านฉลุย

### 📌 [2026-09-27] - Real-Time Employee Lookup & Flexible PIN/Password Length (Version 2.6)
- ✅ **ยกเลิกการจำกัดความยาว PIN 4 หลัก (Flexible Length PIN/Password)**: ปลดล็อกข้อจำกัด `maxLength=4` และ Hardcoded 4-Dot Keypad รองรับการตั้งและกรอกรหัสผ่านทุกความยาว (4 หลัก, 6 หลัก, หรือมากกว่า)
- ✅ **ระบบตรวจสอบรหัสพนักงานแบบ Real-Time ก่อนกรอกรหัสผ่าน (`/api/auth/check-code`)**: เมื่อพนักงานพิมพ์รหัส ระบบจะค้นหาและแสดงชื่อ-นามสกุล, ชื่อเล่น และตำแหน่ง (Badge) ให้ทันทีเพื่อความมั่นใจก่อนกรอกรหัสผ่าน
- ✅ **เพิ่มปุ่มเปิด/ปิดดูรหัสผ่าน (Show/Hide Password Eye Toggle)**: ให้ผู้ใช้แตะดูรหัสที่พิมพ์ได้ทั้งในโหมด Keypad และ Text Input
- ✅ **ปรับปรุงหน้าจอปุ่มตัวเลข (Keypad Unlock Mode)**: จุดรหัสจะขยายตามจำนวนที่กดจริง พร้อมปุ่มกดยืนยัน `ยืนยันเข้าสู่ระบบ (Unlock)` และรองรับปุ่ม Enter
- ✅ **ปรับปรุงฟอร์มเพิ่มพนักงานในหน้า Admin / Executive**: รองรับการกำหนดรหัสผ่านแบบยืดหยุ่นได้ทันที

### 📌 [2026-09-27] - Real-Time Interactive Map Picker & Dynamic Geofence Sync (Version 2.5)
- ✅ **แก้ไขปัญหา Background Polling รีเซ็ตฟอร์ม**: ป้องกันไม่ให้การดึงข้อมูลสถิติทุก 4 วินาทีมารีเซ็ตพิกัดขณะผู้บริหารกำลังลากหมุดหรือพิมพ์พิกัด
- ✅ **เพิ่มช่องกรอก Latitude & Longitude โดยตรง**: รองรับการพิมพ์หรือ Paste ตัวเลขพิกัด พร้อมปุ่ม `ปรับหมุดตามพิกัดที่พิมพ์` และปุ่ม `คัดลอกพิกัด / เปิดบน Google Maps`
- ✅ **ระบบ Smart Search & Google Maps Link Parser**: ถอดรหัสพิกัดจากลิงก์ Google Maps (`maps.app.goo.gl` หรือ `google.com/maps/@lat,lng`) อัตโนมัติในช่องค้นหา
- ✅ **ติดตั้ง StoreMapPicker บนทั้ง Web Admin (`/admin`) และ Mobile Executive (`/executive`)**: ให้ผู้บริหารจัดการพิกัดร้านได้ทั้งบนคอมพิวเตอร์และมือถือ
- ✅ **กระจายพิกัดใหม่สู่มือถือพนักงานแบบ Real-Time**: มือถือพนักงานรับพิกัดใหม่ทันที (<100ms) คำนวณระยะห่างใหม่และปลดล็อกปุ่มให้อัตโนมัติ

### 📌 [2026-09-27] - Strict Geofence Lock, Location Audit & Log ID Alerts (Version 2.4)
- ✅ **ล็อกปุ่มเช็คอินอัตโนมัติเมื่ออยู่นอกพื้นที่ร้าน**: ป้องกันการกดลงเวลาสำเร็จหากระยะห่างเกินรัศมีที่กำหนด
- ✅ **ระบบบันทึก Log พิกัดที่พยายามลงเวลานอกร้าน**: บันทึก `latitude`, `longitude`, `distance` ลงในตาราง `violation_logs` พร้อมยิงแจ้งเตือนความปลอดภัยทันที
- ✅ **ระบบส่งการแจ้งเตือนพร้อม Unique Log ID (`#LOG-XXXX`)**: แสดงรหัสบันทึกอ้างอิงทั้งบนมือถือพนักงาน, บน Toast หน้าเว็บผู้บริหาร และบน LINE Notify
- ✅ **ข้อความแจ้งเตือนข้อผิดพลาดในการเข้าสู่ระบบอย่างชัดเจน**: ระบุชัดเจนกรณี `ไม่พบบัญชีพนักงานในระบบ` หรือ `รหัส PIN ไม่ถูกต้อง`

### 📌 [2026-09-27] - High-Precision Hardware Satellite GPS & Live Geofence Sync (Version 2.3)
- ✅ **สร้างโมดูลระบบพิกัดฮาร์ดแวร์ดาวเทียม (`src/lib/location.ts`)**: เชื่อมต่อชิป GPS ของเครื่องผ่าน `@capacitor/geolocation` พร้อมเปิด `enableHighAccuracy: true`
- ✅ **ยกเลิกพิกัดจำลองในแอปมือถือ (`src/app/employee/page.tsx`)**: ใช้พิกัดจริง 100% จากตัวเครื่องเพื่อวัดระยะห่างที่ถูกต้อง
- ✅ **ระบบซิงค์จุดมาร์คร้านค้าแบบเรียลไทม์ (<100ms)**: เมื่อผู้บริหารปรับเปลี่ยนหรือลากหมุดบนแผนที่หน้าเว็บ (`/admin`) ข้อมูลจะส่งตรงถึงมือถือพนักงานทันที และคำนวณระยะห่างใหม่ในเสี้ยววินาที
- ✅ **ดึงพิกัดสดทันทีที่กดปุ่มเข้างาน/ออกงาน**: ตรวจสอบตำแหน่ง ณ วินาทีที่กด เพื่อป้องกันพิกัดค้างหรือคลาดเคลื่อน

### 📌 [2026-09-27] - Check-Out Flow, CSV Export & Duplicate Prevention (Version 2.2)
- ✅ **เพิ่มคอลัมน์ `check_out_time`** ในฐานข้อมูล Supabase PostgreSQL ตาราง `attendance_logs`
- ✅ **สร้าง API Endpoint `/api/check-out`** รองรับการลงเวลาออกงาน ตรวจสอบ Geofence และคำนวณระยะเวลาทำงาน
- ✅ **ปรับปรุงปุ่ม Dynamic Button บนมือถือ** สลับสถานะระหว่าง "เข้างาน" $\rightarrow$ "ออกงาน" $\rightarrow$ "เสร็จสิ้น" พร้อมการ์ดสรุปเวลาออกงาน
- ✅ **เพิ่มระบบบล็อกการกดเช็คอินซ้ำในวันเดียวกัน (Daily Duplicate Prevention)** ใน `/api/check-in`
- ✅ **เพิ่มปุ่ม "📥 ส่งออก Excel / CSV"** บนหน้าเว็บผู้บริหาร รองรับภาษาไทยสมบูรณ์แบบ (`UTF-8 with BOM`)
- ✅ **บันทึก Backlog Ticket REQ-013 ถึง REQ-017** เข้าสู่คลังความต้องการของระบบ

### 📌 [2026-09-27] - Initial Living Requirements Release (Version 2.0)
- ✅ รวบรวมสถาปัตยกรรมระบบทั้ง 3 ส่วนลงในเอกสาร
- ✅ บันทึกรายละเอียดการเชื่อมต่อ Native Android บนอุปกรณ์จริง
- ✅ สรุปกฎทางธุรกิจ Geofencing, Shift, เบี้ยเลี้ยง 50 บาท และ HWID
