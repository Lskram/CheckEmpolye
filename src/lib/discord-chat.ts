/**
 * Multi-Agent Discord Chat Dispatcher & Webhook Engine
 * Allows President, Tech Lead, DevMobile, and DevWeb to communicate in a unified Discord Hub
 */

export interface AgentMessage {
  id: string;
  sender: 'PRESIDENT' | 'TECH_LEAD' | 'DEV_MOBILE' | 'DEV_WEB' | 'SYSTEM';
  senderName: string;
  avatarUrl: string;
  color: number;
  content: string;
  tags?: string[];
  timestamp: string;
  replyTo?: string;
}

export const AGENT_PROFILES = {
  PRESIDENT: {
    name: '👑 ท่านประธาน (Product Owner)',
    avatar: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
    color: 0xf59e0b, // Gold
    roleTitle: 'ประธานกรรมการ / เจ้าของธุรกิจ',
  },
  TECH_LEAD: {
    name: '🧠 Tech Lead & Architect (Antigravity)',
    avatar: 'https://cdn-icons-png.flaticon.com/512/4712/4712035.png',
    color: 0x3b82f6, // Royal Blue
    roleTitle: 'หัวหน้าฝ่ายสถาปัตยกรรมและเทคโนโลยี',
  },
  DEV_MOBILE: {
    name: '📱 DevMobile AI (Mobile & PWA)',
    avatar: 'https://cdn-icons-png.flaticon.com/512/2586/2586488.png',
    color: 0xa855f7, // Purple
    roleTitle: 'นักพัฒนาแอปมือถือ / Android & PWA',
  },
  DEV_WEB: {
    name: '💻 DevWeb AI (Web Admin & Dashboard)',
    avatar: 'https://cdn-icons-png.flaticon.com/512/2040/2040946.png',
    color: 0x10b981, // Emerald Green
    roleTitle: 'นักพัฒนาระบบเว็บแอดมิน / Vercel Full-Stack',
  },
  SYSTEM: {
    name: '⚡ System Notification',
    avatar: 'https://cdn-icons-png.flaticon.com/512/1006/1006771.png',
    color: 0x64748b, // Slate Gray
    roleTitle: 'ระบบอัตโนมัติ',
  },
};

export const DISCORD_WEBHOOKS = {
  // Main Unified Group Chat / War Room Webhook (if provided, falls back to specific channels)
  warRoom: process.env.DISCORD_WAR_ROOM_WEBHOOK || '',
  mobile: process.env.DISCORD_MOBILE_WEBHOOK || 'https://discordapp.com/api/webhooks/1555045103968723044/I5hm0t3_M9_T3mW6fbaK9_5lZxDGnSVatzHrB4vkyWPzJxnKwOiydOkPSj81Rs_eMLsd',
  web: process.env.DISCORD_WEB_WEBHOOK || 'https://discordapp.com/api/webhooks/1555045267462692955/ueOkNun0q2ROM0wqdHUl9NIj1H8NMCJZzHtGWxv01HYiCMwrTcp-rz_wi5JQhqIbKt60',
  lead: process.env.DISCORD_LEAD_WEBHOOK || 'https://discordapp.com/api/webhooks/1555045542164435056/TuSdPz-2HnuDYjEoTu3_m3IiZXaPHXgXAYr6aT4NLlbPd6UxOv8O9fT2Ut_tStYACYKC',
};

/**
 * Send an Agent message into Discord with appropriate avatar and badge
 */
export async function sendDiscordAgentMessage(params: {
  sender: 'PRESIDENT' | 'TECH_LEAD' | 'DEV_MOBILE' | 'DEV_WEB' | 'SYSTEM';
  message: string;
  target?: 'ALL' | 'MOBILE' | 'WEB' | 'LEAD';
  tags?: string[];
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
}): Promise<{ success: boolean; dispatchedTo: string[] }> {
  const profile = AGENT_PROFILES[params.sender] || AGENT_PROFILES.SYSTEM;
  const dispatchedTo: string[] = [];

  const discordPayload = {
    username: profile.name,
    avatar_url: profile.avatar,
    embeds: [
      {
        title: `💬 [${profile.roleTitle}]`,
        description: params.message,
        color: profile.color,
        fields: params.fields || (params.tags ? [{ name: '🏷️ Tags', value: params.tags.map(t => `\`#${t}\``).join(' '), inline: true }] : undefined),
        footer: { text: 'สีแสงยานยนต์ • Multi-Agent Command Hub' },
        timestamp: new Date().toISOString(),
      },
    ],
  };

  // Determine target webhook URLs
  const targets: string[] = [];
  if (DISCORD_WEBHOOKS.warRoom) {
    targets.push(DISCORD_WEBHOOKS.warRoom);
  }

  if (params.target === 'MOBILE' || params.target === 'ALL') {
    if (DISCORD_WEBHOOKS.mobile && !targets.includes(DISCORD_WEBHOOKS.mobile)) targets.push(DISCORD_WEBHOOKS.mobile);
  }
  if (params.target === 'WEB' || params.target === 'ALL') {
    if (DISCORD_WEBHOOKS.web && !targets.includes(DISCORD_WEBHOOKS.web)) targets.push(DISCORD_WEBHOOKS.web);
  }
  if (params.target === 'LEAD' || params.target === 'ALL') {
    if (DISCORD_WEBHOOKS.lead && !targets.includes(DISCORD_WEBHOOKS.lead)) targets.push(DISCORD_WEBHOOKS.lead);
  }

  if (targets.length === 0 && DISCORD_WEBHOOKS.lead) {
    targets.push(DISCORD_WEBHOOKS.lead);
  }

  // Dispatch concurrently
  await Promise.all(
    targets.map(async (url) => {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(discordPayload),
        });
        if (res.ok) {
          dispatchedTo.push(url);
        }
      } catch (err) {
        console.error('[Discord Dispatch Error]:', err);
      }
    })
  );

  return {
    success: dispatchedTo.length > 0,
    dispatchedTo,
  };
}
