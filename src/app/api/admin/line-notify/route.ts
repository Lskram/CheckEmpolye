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

    const DEFAULT_LINE_TOKEN = 'Pe4vS2QQHU9yIPfxRFbMO5wYicsPlob8HMZKtLKsJ/3uy3zSfwpp9772on7oszJQCHw6C94BnXgFDH7CaVUap9BX/hFj+qEIfMAeTygPUWB+8gh9+YSXJgj2+f46epgGZv3owz+WVifHWXOJwb5xEAdB04t89/1O/w1cDnyilFU=';
    const activeToken = (settings as any)?.line_access_token || envToken || DEFAULT_LINE_TOKEN;
    const activeTarget = (settings as any)?.line_target_id || envTarget || 'broadcast';

    const hasToken = !!activeToken;
    const hasNotify = !!((settings as any)?.line_notify_token || envNotify);

    return NextResponse.json({
      success: true,
      data: {
        isConfigured: hasToken || hasNotify,
        hasLineOAToken: hasToken,
        hasLineNotifyToken: hasNotify,
        targetId: activeTarget,
        tokenMasked: hasToken ? '••••••••' + activeToken.slice(-6) : null,
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
