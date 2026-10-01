/**
 * Standalone CLI Script to send Dev Progress Reports to Discord
 * Usage: node scripts/send-discord-report.js "<Title>" "<Summary>" "<CompletedTasks_CommaSeparated>" "<InProgressTasks_CommaSeparated>"
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Read .env.local to find DISCORD_WEBHOOK_URL if not in process.env
function getWebhookUrl() {
  if (process.env.DISCORD_WEBHOOK_URL) {
    return process.env.DISCORD_WEBHOOK_URL;
  }
  const envPath = path.resolve(__dirname, '../.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/DISCORD_WEBHOOK_URL\s*=\s*(.+)/);
    if (match && match[1]) {
      return match[1].trim().replace(/^["']|["']$/g, '');
    }
  }
  return null;
}

const webhookUrl = getWebhookUrl();

const title = process.argv[2] || 'รายงานความคืบหน้าระบบ (Dev Progress Update)';
const summary = process.argv[3] || 'อัปเดตสถานะการพัฒนาโปรเจกต์ระบบลงเวลาและจัดการสาขา ร้านสีแสงยางยนต์';
const completedArg = process.argv[4] || '';
const inProgressArg = process.argv[5] || '';
const statusArg = process.argv[6] || 'COMPLETED';

const completedTasks = completedArg ? completedArg.split(',').map((s) => s.trim()).filter(Boolean) : [];
const inProgressTasks = inProgressArg ? inProgressArg.split(',').map((s) => s.trim()).filter(Boolean) : [];

const STATUS_COLORS = {
  COMPLETED: 0x10B981,
  IN_PROGRESS: 0x3B82F6,
  ALERT: 0xEF4444,
  MILESTONE: 0x8B5CF6,
  INFO: 0xF59E0B,
};

const STATUS_EMOJIS = {
  COMPLETED: '✅ [COMPLETED]',
  IN_PROGRESS: '🚧 [IN PROGRESS]',
  ALERT: '🚨 [ALERT]',
  MILESTONE: '🏆 [MILESTONE]',
  INFO: 'ℹ️ [DEV UPDATE]',
};

if (!webhookUrl) {
  console.log('\n❌ Error: DISCORD_WEBHOOK_URL is not set.');
  console.log('👉 Please add DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/... to .env.local');
  process.exit(1);
}

const fields = [];
if (completedTasks.length > 0) {
  fields.push({
    name: '🎯 สิ่งที่ทำเสร็จแล้ว (Completed)',
    value: completedTasks.map((t) => `• ${t}`).join('\n'),
    inline: false,
  });
}
if (inProgressTasks.length > 0) {
  fields.push({
    name: '🔨 กำลังดำเนินการ (In Progress)',
    value: inProgressTasks.map((t) => `• ${t}`).join('\n'),
    inline: false,
  });
}

fields.push({
  name: '📍 สาขา',
  value: 'สีแสงยางยนต์ (ศรีสะเกษ)',
  inline: true,
});

const payload = JSON.stringify({
  username: 'สีแสงยางยนต์ Dev Team AI',
  avatar_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
  embeds: [
    {
      title: `${STATUS_EMOJIS[statusArg] || 'ℹ️'} ${title}`,
      description: summary,
      color: STATUS_COLORS[statusArg] || STATUS_COLORS.INFO,
      fields: fields,
      footer: {
        text: 'Smart Attendance System • รายงานโดย Antigravity Senior AI Dev',
      },
      timestamp: new Date().toISOString(),
    },
  ],
});

const urlObj = new URL(webhookUrl);
const client = urlObj.protocol === 'https:' ? https : http;

const req = client.request(
  webhookUrl,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
    },
  },
  (res) => {
    if (res.statusCode === 204 || res.statusCode === 200) {
      console.log('✅ [Discord Reporter] ส่งรายงานเข้า Discord สำเร็จเรียบร้อย!');
    } else {
      console.log(`⚠️ [Discord Reporter] Discord API ตอบกลับด้วยสถานะ: ${res.statusCode}`);
    }
  }
);

req.on('error', (e) => {
  console.error('❌ [Discord Reporter Error]:', e.message);
});

req.write(payload);
req.end();
