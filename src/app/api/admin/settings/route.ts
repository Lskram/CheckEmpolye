import { NextResponse } from 'next/server';
import { db } from '@/lib/db-store';

export async function GET() {
  try {
    const settings = await db.getStoreSettings();
    return NextResponse.json({ success: true, data: settings });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { 
      store_name, 
      store_lat, 
      store_lng, 
      radius_meters, 
      standard_time, 
      late_deadline, 
      allowance_amount,
      line_access_token,
      line_target_id,
      line_notify_token,
      line_notifications_enabled
    } = body;

    const payload: any = {
      store_name,
      store_lat: Number(store_lat),
      store_lng: Number(store_lng),
      radius_meters: Number(radius_meters),
      standard_time,
      late_deadline,
      allowance_amount: Number(allowance_amount),
    };

    if (line_access_token !== undefined) payload.line_access_token = line_access_token;
    if (line_target_id !== undefined) payload.line_target_id = line_target_id;
    if (line_notify_token !== undefined) payload.line_notify_token = line_notify_token;
    if (line_notifications_enabled !== undefined) payload.line_notifications_enabled = line_notifications_enabled;

    const updated = await db.updateStoreSettings(payload);

    return NextResponse.json({
      success: true,
      message: 'บันทึกการตั้งค่าพิกัดร้าน นโยบายเวลา และระบบแจ้งเตือน LINE OA สำเร็จ!',
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return PUT(request);
}
