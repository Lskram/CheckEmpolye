const puppeteer = require('puppeteer-core');

async function testLogo() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // 1. Check Homepage Header Logo
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: 'scratch/logo_homepage.png', clip: { x: 0, y: 0, width: 600, height: 120 } });
  console.log('Saved scratch/logo_homepage.png');

  // 2. Check Admin Header Logo
  await page.evaluate(() => {
    localStorage.setItem('executive_auth_token', 'true');
    localStorage.setItem('attendance_employee_profile', JSON.stringify({
      employee_code: 'SI01',
      full_name: 'ผู้บริหารสูงสุด (ท่านประธาน)',
      role: 'ADMIN'
    }));
  });

  await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: 'scratch/logo_admin_header.png', clip: { x: 0, y: 0, width: 600, height: 100 } });
  console.log('Saved scratch/logo_admin_header.png');

  await browser.close();
}

testLogo().catch(console.error);
