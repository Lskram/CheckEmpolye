import { NextResponse } from 'next/server';
import { db } from '@/lib/db-store';
import { sendLineTestMessage } from '@/lib/line';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = await db.getStoreSettings();
    const envToken = process.env.LINE_CHANNEL_ACCESS_TOKEN || process.env.LINE_ACCESS_TOKEN;
    const envTarget = process.env.LINE_TARGET_USER_ID || process.env.LINE_ADMIN_GROUP_ID;
    const envNotify = process.env.LINE_NOTIFY_TOKEN;

    const hasToken = !!((settings as any)?.line_access_token || envToken);
    const hasNotify = !!((settings as any)?.line_notify_token || envNotify);

    return NextResponse.json({
      success: true,
      data: {
        isConfigured: hasToken || hasNotify,
        hasLineOAToken: hasToken,
        hasLineNotifyToken: hasNotify,
        targetId: (settings as any)?.line_target_id || envTarget || 'broadcast',
        tokenMasked: hasToken ? '••••••••' + ((settings as any)?.line_access_token || envToken)?.slice(-6) : null,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, target } = body;

    const result = await sendLineTestMessage({
      token: token ? token.trim() : undefined,
      target: target ? target.trim() : undefined,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message || 'ส่งข้อความทดสอบเข้า LINE สำเร็จ!',
        channel: result.channel,
      });
    } else {
      return NextResponse.json({
        success: false,
        message: result.message || 'ไม่สามารถส่งข้อความได้ กรุณาตรวจสอบ Channel Access Token',
      }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
