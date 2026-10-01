/**
 * CLI Tool for sending messages to the Multi-Agent Group Chat & Discord
 * Usage:
 *   node scripts/agent-chat-cli.js --sender PRESIDENT --msg "ข้อความจากท่านประธาน"
 *   node scripts/agent-chat-cli.js --sender TECH_LEAD --msg "คำสั่งงานจาก Lead"
 *   node scripts/agent-chat-cli.js --sender DEV_MOBILE --msg "รายงานความคืบหน้า Mobile"
 *   node scripts/agent-chat-cli.js --sender DEV_WEB --msg "รายงานความคืบหน้า Web"
 */

const WEBHOOKS = {
  mobile: 'https://discordapp.com/api/webhooks/1555045103968723044/I5hm0t3_M9_T3mW6fbaK9_5lZxDGnSVatzHrB4vkyWPzJxnKwOiydOkPSj81Rs_eMLsd',
  web: 'https://discordapp.com/api/webhooks/1555045267462692955/ueOkNun0q2ROM0wqdHUl9NIj1H8NMCJZzHtGWxv01HYiCMwrTcp-rz_wi5JQhqIbKt60',
  lead: 'https://discordapp.com/api/webhooks/1555045542164435056/TuSdPz-2HnuDYjEoTu3_m3IiZXaPHXgXAYr6aT4NLlbPd6UxOv8O9fT2Ut_tStYACYKC',
};

const PROFILES = {
  PRESIDENT: {
    name: '👑 ท่านประธาน (Product Owner)',
    avatar: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
    color: 0xf59e0b,
    title: 'ประธานกรรมการ / เจ้าของธุรกิจ',
  },
  TECH_LEAD: {
    name: '🧠 Tech Lead & Architect (Antigravity)',
    avatar: 'https://cdn-icons-png.flaticon.com/512/4712/4712035.png',
    color: 0x3b82f6,
    title: 'หัวหน้าฝ่ายสถาปัตยกรรมและเทคโนโลยี',
  },
  DEV_MOBILE: {
    name: '📱 DevMobile AI (Mobile & PWA)',
    avatar: 'https://cdn-icons-png.flaticon.com/512/2586/2586488.png',
    color: 0xa855f7,
    title: 'นักพัฒนาแอปมือถือ / Android & PWA',
  },
  DEV_WEB: {
    name: '💻 DevWeb AI (Web Admin & Dashboard)',
    avatar: 'https://cdn-icons-png.flaticon.com/512/2040/2040946.png',
    color: 0x10b981,
    title: 'นักพัฒนาระบบเว็บแอดมิน / Vercel Full-Stack',
  },
};

function parseArgs() {
  const args = process.argv.slice(2);
  let sender = 'PRESIDENT';
  let message = '';
  let target = 'ALL';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--sender' && args[i + 1]) {
      sender = args[i + 1].toUpperCase();
      i++;
    } else if (args[i] === '--msg' && args[i + 1]) {
      message = args[i + 1];
      i++;
    } else if (args[i] === '--target' && args[i + 1]) {
      target = args[i + 1].toUpperCase();
      i++;
    } else if (!message) {
      message = args[i];
    }
  }

  return { sender, message, target };
}

async function main() {
  const { sender, message, target } = parseArgs();

  if (!message) {
    console.log('❌ กรุณาระบุข้อความ เช่น:');
    console.log('  npm run chat "สวัสดีทุกคน"');
    console.log('  npm run chat:lead "เริ่มงาน Sprint 1"');
    return;
  }

  const profile = PROFILES[sender] || PROFILES.PRESIDENT;

  const payload = {
    username: profile.name,
    avatar_url: profile.avatar,
    embeds: [
      {
        title: `💬 [${profile.title}]`,
        description: message,
        color: profile.color,
        footer: { text: 'สีแสงยานยนต์ • Multi-Agent Group Chat' },
        timestamp: new Date().toISOString(),
      },
    ],
  };

  const urls = target === 'ALL'
    ? Object.values(WEBHOOKS)
    : target === 'MOBILE'
      ? [WEBHOOKS.mobile]
      : target === 'WEB'
        ? [WEBHOOKS.web]
        : [WEBHOOKS.lead];

  console.log(`📡 Sending as [${profile.name}] to ${urls.length} Discord channel(s)...`);

  await Promise.all(
    urls.map(async (url) => {
      try {
        await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch (e) {
        console.error('Failed to send:', e.message);
      }
    })
  );

  console.log(`✅ ข้อความถูกส่งเข้า Discord เรียบร้อยแล้ว!`);
}

main();
