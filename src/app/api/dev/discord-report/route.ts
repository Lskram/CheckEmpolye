import { NextRequest, NextResponse } from 'next/server';
import { sendDiscordDevReport, testDiscordWebhook } from '@/lib/discord-reporter';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.action === 'test') {
      const result = await testDiscordWebhook(body.webhookUrl);
      return NextResponse.json(result);
    }

    const result = await sendDiscordDevReport({
      title: body.title,
      status: body.status,
      summary: body.summary,
      completedTasks: body.completedTasks,
      inProgressTasks: body.inProgressTasks,
      blockersOrNotes: body.blockersOrNotes,
      commitHash: body.commitHash,
      authorName: body.authorName,
      customWebhookUrl: body.webhookUrl,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
