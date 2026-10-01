# 📋 Task Directives from Tech Lead
**Project**: ระบบบันทึกเวลาทำงานและจัดการสาขา ร้านสีแสงยางยนต์ (YOKOHAMA NAYA COSMIS)
**Date**: 2026-10-01
**Status**: 🚨 HIGH PRIORITY BUG FIX & ERROR RESOLUTION

---

## 💻 Directive for `DevWeb AI` (Web Admin & Dashboard Engineer)

### 🎯 Objective: ตรวจสอบและแก้ไข Runtime Error หน้าเว็บแอดมิน / แดชบอร์ด
ท่านประธานได้เข้าทดสอบหน้าเว็บและแจ้งว่าพบ Error เกิดขึ้นบนหน้าจอ

### 🔍 Checklist จุดที่ DevWeb ต้องตรวจสอบและแก้ไขทันที:
1. **Hydration & SSR Safety**:
   - ตรวจสอบ `localStorage` และ `window` object ใน `src/app/admin/page.tsx` และ `src/app/executive/page.tsx` ต้องอยู่ภายใต้ `useEffect` หรือ `typeof window !== 'undefined'`
2. **Leaflet Map SSR Handling**:
   - ตรวจสอบ `StoreMapPicker.tsx` ว่ามีการโหลด `L` (Leaflet) ฝั่ง Client เท่านั้น และมี dynamic import `ssr: false`
3. **Three.js WebGL Fallback**:
   - ใน `ThreeBarChart3D.tsx` และ `ThreeDonut3D.tsx` ต้องมี `try...catch` ครอบ WebGL context เพื่อรองรับกรณีเบราว์เซอร์ปิด Hardware Acceleration
4. **Login Session & Pin Verification**:
   - ตรวจสอบหน้า Login ผู้บริหาร (SI01 / 5101) ไม่ให้เกิด Error ขณะกดปลดล็อก Session
5. **Vercel / Next.js Fast Refresh Error**:
   - ตรวจสอบการ re-render loop ใน `useEffect` ของ `admin/page.tsx`

---

## 🚀 คำสั่งส่งงานเมื่อแก้ไขเสร็จ:
```bash
# 1. ตรวจสอบ Build 0 Errors
npm run build

# 2. รายงานเข้า Discord
npm run report:discord "แก้ไข Runtime Error หน้าเว็บแอดมินสำเร็จ" "ตรวจสอบ SSR, Leaflet, Three.js และ Login Guard เรียบร้อย" "SSR Safety,WebGL Fallback,Leaflet Fix" "พร้อมให้ท่านประธานทดสอบอีกครั้ง"
```
