/**
 * Multi-Role Discord Reporter for Automotive Attendance System
 * ร้านสีแสงยางยนต์ (YOKOHAMA NAYA COSMIS)
 * 
 * Team Roles:
 * 1. DevMobile: AI Engineer for Mobile PWA / Android
 * 2. DevWeb: AI Engineer for Web Dashboard on Vercel
 * 3. LeadArchitect (Antigravity): Tech Lead, Architecture, QC & Executive Advisor
 * 4. ProductOwner: Database Admin & Store Owner
 */

export type TeamRole = 'DEV_MOBILE' | 'DEV_WEB' | 'LEAD_ARCHITECT' | 'PRODUCT_OWNER';

export interface DiscordEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

export interface DiscordDevReportParams {
  title?: string;
  targetRole?: TeamRole;
  status?: 'COMPLETED' | 'IN_PROGRESS' | 'ALERT' | 'MILESTONE' | 'INFO' | 'KICKOFF';
  summary: string;
  completedTasks?: string[];
  inProgressTasks?: string[];
  blockersOrNotes?: string[];
  commitHash?: string;
  authorName?: string;
  customWebhookUrl?: string;
}

const WEBHOOK_URLS: Record<TeamRole, string> = {
  DEV_MOBILE: 'https://discordapp.com/api/webhooks/1555045103968723044/I5hm0t3_M9_T3mW6fbaK9_5lZxDGnSVatzHrB4vkyWPzJxnKwOiydOkPSj81Rs_eMLsd',
  DEV_WEB: 'https://discordapp.com/api/webhooks/1555045267462692955/ueOkNun0q2ROM0wqdHUl9NIj1H8NMCJZzHtGWxv01HYiCMwrTcp-rz_wi5JQhqIbKt60',
  LEAD_ARCHITECT: 'https://discordapp.com/api/webhooks/1555045542164435056/TuSdPz-2HnuDYjEoTu3_m3IiZXaPHXgXAYr6aT4NLlbPd6UxOv8O9fT2Ut_tStYACYKC',
  PRODUCT_OWNER: 'https://discordapp.com/api/webhooks/1555045542164435056/TuSdPz-2HnuDYjEoTu3_m3IiZXaPHXgXAYr6aT4NLlbPd6UxOv8O9fT2Ut_tStYACYKC',
};

const STATUS_COLORS: Record<string, number> = {
  COMPLETED: 0x10B981,   // Emerald Green
  IN_PROGRESS: 0x3B82F6,  // Electric Blue
  ALERT: 0xEF4444,        // Crimson Red
  MILESTONE: 0x8B5CF6,    // Purple / Amethyst
  INFO: 0xF59E0B,         // Amber Gold
  KICKOFF: 0x06B6D4,      // Neon Cyan
};

const STATUS_EMOJIS: Record<string, string> = {
  COMPLETED: '✅ [COMPLETED]',
  IN_PROGRESS: '🚧 [IN PROGRESS]',
  ALERT: '🚨 [SECURITY / ALERT]',
  MILESTONE: '🏆 [MILESTONE REACHED]',
  INFO: 'ℹ️ [DEV UPDATE]',
  KICKOFF: '🚀 [MISSION BRIEFING & DIRECTIVE]',
};

export function getWebhookUrlForRole(role: TeamRole): string {
  if (typeof process !== 'undefined' && process.env) {
    if (role === 'DEV_MOBILE' && process.env.DISCORD_WEBHOOK_DEV_MOBILE) return process.env.DISCORD_WEBHOOK_DEV_MOBILE;
    if (role === 'DEV_WEB' && process.env.DISCORD_WEBHOOK_DEV_WEB) return process.env.DISCORD_WEBHOOK_DEV_WEB;
    if (role === 'LEAD_ARCHITECT' && process.env.DISCORD_WEBHOOK_LEAD_ARCHITECT) return process.env.DISCORD_WEBHOOK_LEAD_ARCHITECT;
  }
  return WEBHOOK_URLS[role] || WEBHOOK_URLS.LEAD_ARCHITECT;
}

/**
 * Sends a rich formatted embed report to a specific Discord Team Channel
 */
export async function sendDiscordDevReport(params: DiscordDevReportParams): Promise<{ success: boolean; message: string }> {
  const targetRole = params.targetRole || 'LEAD_ARCHITECT';
  const webhookUrl = params.customWebhookUrl || getWebhookUrlForRole(targetRole);

  if (!webhookUrl) {
    console.warn('[Discord Reporter] No Discord Webhook URL found.');
    return { success: false, message: 'No Webhook URL configured.' };
  }

  const status = params.status || 'INFO';
  const color = STATUS_COLORS[status] || STATUS_COLORS.INFO;
  const statusBadge = STATUS_EMOJIS[status] || STATUS_EMOJIS.INFO;
  const authorName = params.authorName || '🤖 Antigravity Tech Lead & Architect';

  const fields: DiscordEmbedField[] = [];

  if (params.completedTasks && params.completedTasks.length > 0) {
    fields.push({
      name: '🎯 สิ่งที่ทำเสร็จแล้ว / ข้อกำหนด (Completed / Directives)',
      value: params.completedTasks.map((t) => `• ${t}`).join('\n'),
      inline: false,
    });
  }

  if (params.inProgressTasks && params.inProgressTasks.length > 0) {
    fields.push({
      name: '🔨 กำลังดำเนินการ / สิ่งที่ต้องทำต่อ (In Progress / Action Items)',
      value: params.inProgressTasks.map((t) => `• ${t}`).join('\n'),
      inline: false,
    });
  }

  if (params.blockersOrNotes && params.blockersOrNotes.length > 0) {
    fields.push({
      name: '⚠️ ข้อพึงระวัง & ขอบเขตงาน (Rules & Guidelines)',
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
    name: '🏢 องค์กร & สาขา',
    value: 'สีแสงยางยนต์ YOKOHAMA NAYA COSMIS (ศรีสะเกษ)',
    inline: true,
  });

  const payload = {
    username: targetRole === 'DEV_MOBILE' ? '📱 Mobile Dev Channel' : targetRole === 'DEV_WEB' ? '💻 Web Dev Channel' : '👑 Lead Architect & Secretary',
    avatar_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
    embeds: [
      {
        title: `${statusBadge} ${params.title || 'รายงานความคืบหน้าทีมพัฒนา'}`,
        description: params.summary,
        color: color,
        fields: fields,
        footer: {
          text: `Smart Attendance & Branch Management • ส่งจาก ${authorName}`,
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
      return { success: true, message: `ส่งรายงานเข้า Discord (${targetRole}) สำเร็จเรียบร้อย` };
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
 * Tests if a given webhook is functional
 */
export async function testDiscordWebhook(webhookUrl?: string): Promise<{ success: boolean; message: string }> {
  const url = webhookUrl || getWebhookUrlForRole('LEAD_ARCHITECT');
  if (!url) {
    return { success: false, message: 'No webhook URL provided' };
  }
  return sendDiscordDevReport({
    title: 'ทดสอบการเชื่อมต่อระบบแจ้งเตือน Discord',
    status: 'INFO',
    summary: 'ทดสอบการยิง Webhook สำเร็จเรียบร้อย ระบบรายงานพร้อมทำงาน 100%',
    customWebhookUrl: url,
    authorName: '⚙️ Antigravity Webhook Tester',
  });
}

/**
 * Broadcasts a message to all 3 team channels (DevMobile, DevWeb, LeadArchitect)
 */
export async function sendTeamBroadcast(params: Omit<DiscordDevReportParams, 'targetRole'>): Promise<{ success: boolean; results: any[] }> {
  const roles: TeamRole[] = ['DEV_MOBILE', 'DEV_WEB', 'LEAD_ARCHITECT'];
  const results = await Promise.all(
    roles.map((role) => sendDiscordDevReport({ ...params, targetRole: role }))
  );
  return {
    success: results.every((r) => r.success),
    results,
  };
}


