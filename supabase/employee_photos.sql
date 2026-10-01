-- =========================================================
-- 📸 SUPABASE MIGRATION: Employee Photo & Avatar Storage
-- ระบบอัปโหลดและจัดเก็บรูปภาพโปรไฟล์พนักงาน สีแสงยางยนต์
-- =========================================================

-- 1. เพิ่มคอลัมน์ avatar_url ในตาราง employees (หากยังไม่มี)
ALTER TABLE IF EXISTS employees 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. สร้างตาราง employee_photos สำหรับเก็บประวัติการอัปโหลดรูปภาพทั้งหมด
CREATE TABLE IF NOT EXISTS employee_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    file_name VARCHAR(255),
    file_size BIGINT,
    mime_type VARCHAR(100) DEFAULT 'image/jpeg',
    is_current BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- สร้างดัชนี (Indexes) เพื่อความเร็วในการค้นหา
CREATE INDEX IF NOT EXISTS idx_employee_photos_emp_id ON employee_photos(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_photos_is_current ON employee_photos(is_current);

-- 3. สร้าง Storage Bucket 'avatars' สำหรับเก็บไฟล์รูปภาพพนักงาน
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 4. ตั้งค่านโยบายความปลอดภัย (RLS Policies) สำหรับ Storage Bucket 'avatars'
-- อนุญาตให้ทุกคนอ่าน/ดูรูปภาพได้แบบสาธารณะ (Public Read)
CREATE POLICY "Public Read Avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- อนุญาตให้อัปโหลดไฟล์รูปภาพได้
CREATE POLICY "Allow Upload Avatars"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars');

-- อนุญาตให้อัปเดตไฟล์รูปภาพเดิมได้
CREATE POLICY "Allow Update Avatars"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars');

-- อนุญาตให้ลบไฟล์รูปภาพได้
CREATE POLICY "Allow Delete Avatars"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars');
