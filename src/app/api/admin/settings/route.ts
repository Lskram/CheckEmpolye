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
    const { store_name, store_lat, store_lng, radius_meters, standard_time, late_deadline, allowance_amount } = body;

    const updated = await db.updateStoreSettings({
      store_name,
      store_lat: Number(store_lat),
      store_lng: Number(store_lng),
      radius_meters: Number(radius_meters),
      standard_time,
      late_deadline,
      allowance_amount: Number(allowance_amount),
    });

    return NextResponse.json({
      success: true,
      message: 'บันทึกการตั้งค่าพิกัดร้านและเวลาเข้างานสำเร็จ',
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
