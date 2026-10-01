/**
 * Discord Reporter Utility for AI & Developer Activity Tracking
 * ร้านสีแสงยางยนต์ (YOKOHAMA NAYA COSMIS)
 */

export interface DiscordEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

export interface DiscordDevReportParams {
  title?: string;
  status?: 'COMPLETED' | 'IN_PROGRESS' | 'ALERT' | 'MILESTONE' | 'INFO';
  summary: string;
  completedTasks?: string[];
  inProgressTasks?: string[];
  blockersOrNotes?: string[];
  commitHash?: string;
  authorName?: string;
  customWebhookUrl?: string;
}

const STATUS_COLORS: Record<string, number> = {
  COMPLETED: 0x10B981,  // Emerald Green
  IN_PROGRESS: 0x3B82F6, // Electric Blue
  ALERT: 0xEF4444,       // Crimson Red
  MILESTONE: 0x8B5CF6,   // Purple / Amethyst
  INFO: 0xF59E0B,        // Amber Gold
};

const STATUS_EMOJIS: Record<string, string> = {
  COMPLETED: '✅ [COMPLETED]',
  IN_PROGRESS: '🚧 [IN PROGRESS]',
  ALERT: '🚨 [SECURITY / ERROR ALERT]',
  MILESTONE: '🏆 [MILESTONE REACHED]',
  INFO: 'ℹ️ [DEV UPDATE]',
};

/**
 * Sends a rich formatted embed report to Discord Webhook
 */
export async function sendDiscordDevReport(params: DiscordDevReportParams): Promise<{ success: boolean; message: string }> {
  const webhookUrl = params.customWebhookUrl || process.env.DISCORD_WEBHOOK_URL || (typeof window !== 'undefined' ? localStorage.getItem('discord_webhook_url') : '');

  if (!webhookUrl) {
    console.warn('[Discord Reporter] No DISCORD_WEBHOOK_URL found in env or storage.');
    return {
      success: false,
      message: 'DISCORD_WEBHOOK_URL is not configured.',
    };
  }

  const status = params.status || 'INFO';
  const color = STATUS_COLORS[status] || STATUS_COLORS.INFO;
  const statusBadge = STATUS_EMOJIS[status] || STATUS_EMOJIS.INFO;
  const authorName = params.authorName || '🤖 Antigravity AI Senior Dev';

  const fields: DiscordEmbedField[] = [];

  if (params.completedTasks && params.completedTasks.length > 0) {
    fields.push({
      name: '🎯 สิ่งที่ทำเสร็จแล้ว (Completed)',
      value: params.completedTasks.map((t) => `• ${t}`).join('\n'),
      inline: false,
    });
  }

  if (params.inProgressTasks && params.inProgressTasks.length > 0) {
    fields.push({
      name: '🔨 กำลังดำเนินการ (In Progress)',
      value: params.inProgressTasks.map((t) => `• ${t}`).join('\n'),
      inline: false,
    });
  }

  if (params.blockersOrNotes && params.blockersOrNotes.length > 0) {
    fields.push({
      name: '⚠️ หมายเหตุ / สิ่งที่ต้องตัดสินใจ (Notes)',
      value: params.blockersOrNotes.map((n) => `• ${n}`).join('\n'),
      inline: false,
    });
  }

  if (params.commitHash) {
    fields.push({
      name: '🔗 Git Commit',
      value: `[\`${params.commitHash.slice(0, 7)}\`](https://github.com/Lskram/CheckEmpolye/commit/${params.commitHash})`,
      inline: true,
    });
  }

  fields.push({
    name: '📍 สาขา',
    value: 'สีแสงยางยนต์ (ศรีสะเกษ)',
    inline: true,
  });

  const payload = {
    username: 'สีแสงยางยนต์ Dev Team AI',
    avatar_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
    embeds: [
      {
        title: `${statusBadge} ${params.title || 'รายงานความคืบหน้าการพัฒนาโปรเจกต์'}`,
        description: params.summary,
        color: color,
        fields: fields,
        footer: {
          text: `Smart Attendance & Branch System • รายงานโดย ${authorName}`,
        },
        timestamp: new Date().toISOString(),
      },
    ],
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (response.ok || response.status === 204) {
      return { success: true, message: 'ส่งรายงานเข้า Discord สำเร็จเรียบร้อย' };
    } else {
      const errorText = await response.text();
      return { success: false, message: `Discord API Error: ${response.status} - ${errorText}` };
    }
  } catch (error: any) {
    console.error('[Discord Reporter Error]:', error);
    return { success: false, message: error?.message || 'Failed to send Discord webhook' };
  }
}

/**
 * Quick Test Helper for Discord Webhook
 */
export async function testDiscordWebhook(testUrl?: string): Promise<{ success: boolean; message: string }> {
  return sendDiscordDevReport({
    title: 'ทดสอบการเชื่อมต่อระบบ Discord Reporter',
    status: 'COMPLETED',
    summary: '🎉 การเชื่อมต่อ Discord Webhook สำเร็จแล้ว! บอท AI และระบบจะเริ่มรายงานความคืบหน้าการพัฒนามายังห้องนี้',
    completedTasks: [
      'เชื่อมต่อ Webhook เข้ากับ Next.js 14 สำเร็จ',
      'ระบบรองรับการส่ง Embed สีแยกตามสถานะ (Completed, In Progress, Alert)',
      'พร้อมรับการรายงานจาก Senior AI Developer',
    ],
    inProgressTasks: [
      'ติดตามการพัฒนาฟีเจอร์ในระบบแบบ Real-time',
    ],
    authorName: 'Antigravity Setup Bot',
    customWebhookUrl: testUrl,
  });
}
