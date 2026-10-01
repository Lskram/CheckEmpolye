import { NextResponse } from 'next/server';
import { db } from '@/lib/db-store';
import { supabaseAdmin, supabase, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let employeeId = '';
    let imageBase64 = '';
    let mimeType = 'image/jpeg';
    let fileName = `avatar_${Date.now()}.jpg`;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      employeeId = (formData.get('employeeId') as string) || '';
      const file = formData.get('file') as File;
      if (file) {
        mimeType = file.type || 'image/jpeg';
        fileName = file.name || fileName;
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        imageBase64 = `data:${mimeType};base64,${buffer.toString('base64')}`;
      }
    } else {
      const body = await request.json();
      employeeId = body.employeeId;
      imageBase64 = body.base64Image;
      mimeType = body.mimeType || mimeType;
      if (body.fileName) fileName = body.fileName;
    }

    if (!employeeId) {
      return NextResponse.json(
        { success: false, message: 'กรุณาระบุรหัส ID พนักงาน (employeeId)' },
        { status: 400 }
      );
    }

    if (!imageBase64) {
      return NextResponse.json(
        { success: false, message: 'กรุณาแนบไฟล์รูปภาพ' },
        { status: 400 }
      );
    }

    let publicAvatarUrl = imageBase64;
    const client = supabaseAdmin || supabase;

    // If Supabase is connected, attempt to upload to Supabase Storage Bucket 'avatars'
    if (isSupabaseConfigured && client) {
      try {
        // Clean base64 header
        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
        const fileBuffer = Buffer.from(base64Data, 'base64');
        const ext = mimeType.split('/')[1] || 'jpg';
        const storageFilePath = `employee_${employeeId}_${Date.now()}.${ext}`;

        // Upload to 'avatars' bucket
        const { data: uploadData, error: uploadError } = await client.storage
          .from('avatars')
          .upload(storageFilePath, fileBuffer, {
            contentType: mimeType,
            upsert: true,
          });

        if (!uploadError && uploadData) {
          const { data: urlData } = client.storage
            .from('avatars')
            .getPublicUrl(storageFilePath);
          if (urlData?.publicUrl) {
            publicAvatarUrl = urlData.publicUrl;
          }
        } else {
          console.warn('[Supabase Storage Upload Notice]:', uploadError?.message);
        }
      } catch (storageErr) {
        console.warn('[Supabase Storage fallback to Data URL]:', storageErr);
      }
    }

    // 1. Update Employee Record with new avatar_url
    const updatedEmp = await db.updateEmployee(employeeId, {
      avatar_url: publicAvatarUrl,
    });

    // 2. Insert into employee_photos table if table exists
    if (isSupabaseConfigured && client) {
      try {
        await client.from('employee_photos').insert({
          employee_id: employeeId,
          photo_url: publicAvatarUrl,
          file_name: fileName,
          mime_type: mimeType,
          is_current: true,
          created_at: new Date().toISOString(),
        });
      } catch (photoTableErr) {
        // Table might not exist yet before running migration SQL
      }
    }

    return NextResponse.json({
      success: true,
      message: 'อัปโหลดรูปภาพโปรไฟล์พนักงานสำเร็จ',
      data: {
        avatarUrl: publicAvatarUrl,
        employee: updatedEmp,
      },
    });
  } catch (error: any) {
    console.error('Avatar upload error:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ: ' + error.message },
      { status: 500 }
    );
  }
}
