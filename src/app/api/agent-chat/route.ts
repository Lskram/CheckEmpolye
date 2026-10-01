import { NextResponse } from 'next/server';
import { sendDiscordAgentMessage, AGENT_PROFILES } from '@/lib/discord-chat';

export const dynamic = 'force-dynamic';

// In-memory chat log with persistent session support
let chatHistory: Array<{
  id: string;
  sender: 'PRESIDENT' | 'TECH_LEAD' | 'DEV_MOBILE' | 'DEV_WEB' | 'SYSTEM';
  senderName: string;
  avatarUrl: string;
  color: number;
  content: string;
  target?: string;
  tags?: string[];
  timestamp: string;
}> = [
  {
    id: 'msg-001',
    sender: 'SYSTEM',
    senderName: '⚡ System Notification',
    avatarUrl: 'https://cdn-icons-png.flaticon.com/512/1006/1006771.png',
    color: 0x64748b,
    content: '🎉 ยินดีต้อนรับสู่ **Agent War Room & Group Chat** สำหรับทีมพัฒนา "สีแสงยางยนต์"\nช่องทางการสื่อสารแบบ Real-Time ระหว่าง ท่านประธาน, Tech Lead, DevMobile และ DevWeb',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'msg-002',
    sender: 'TECH_LEAD',
    senderName: '🧠 Tech Lead & Architect (Antigravity)',
    avatarUrl: 'https://cdn-icons-png.flaticon.com/512/4712/4712035.png',
    color: 0x3b82f6,
    content: 'กราบเรียนท่านประธานครับ ระบบฐานข้อมูล Live Supabase ซิงค์ข้อมูลพนักงาน 3 ท่าน (`SI01`, `01`, `02`) และพิกัดร้านเรียบร้อยแล้วครับ ทีมพร้อมรับคำสั่งการจากท่านประธานในห้องนี้ตลอดเวลาครับ',
    tags: ['Supabase', 'LiveSync', 'Ready'],
    timestamp: new Date(Date.now() - 1800000).toISOString(),
  },
];

export async function GET() {
  return NextResponse.json({
    success: true,
    data: chatHistory,
    profiles: AGENT_PROFILES,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sender, message, target = 'ALL', tags = [] } = body;

    if (!sender || !message || !message.trim()) {
      return NextResponse.json(
        { success: false, message: 'กรุณาระบุผู้ส่ง (Sender) และข้อความ (Message)' },
        { status: 400 }
      );
    }

    const profile = AGENT_PROFILES[sender as keyof typeof AGENT_PROFILES] || AGENT_PROFILES.SYSTEM;

    const newMsg = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      sender: sender as any,
      senderName: profile.name,
      avatarUrl: profile.avatar,
      color: profile.color,
      content: message.trim(),
      target,
      tags,
      timestamp: new Date().toISOString(),
    };

    chatHistory.push(newMsg);
    if (chatHistory.length > 200) {
      chatHistory = chatHistory.slice(-200);
    }

    // Forward message to Discord Channels
    const discordResult = await sendDiscordAgentMessage({
      sender: sender as any,
      message: message.trim(),
      target: target as any,
      tags,
    });

    return NextResponse.json({
      success: true,
      message: 'ส่งข้อความเข้า Group Chat และ Discord สำเร็จ',
      data: newMsg,
      discord: discordResult,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการส่งข้อความ: ' + error.message },
      { status: 500 }
    );
  }
}
