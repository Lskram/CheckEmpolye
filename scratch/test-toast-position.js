const puppeteer = require('puppeteer-core');

async function testToast() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle0' });

  // Set auth
  await page.evaluate(() => {
    localStorage.setItem('executive_auth_token', 'true');
    localStorage.setItem('attendance_employee_profile', JSON.stringify({
      employee_code: 'SI01',
      full_name: 'ผู้บริหารสูงสุด (ท่านประธาน)',
      role: 'ADMIN'
    }));
  });

  await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));

  // Trigger a test notification via API POST
  await page.evaluate(async () => {
    await fetch('/api/leave', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employeeId: 'cad180f3-28da-402f-b1fe-ab46f870c0ea',
        leaveType: 'SICK',
        startDate: '2026-10-02',
        endDate: '2026-10-02',
        reason: 'ทดสอบตำแหน่ง Toast Alert'
      })
    });
  });

  // Wait for poll / toast popup
  await new Promise(r => setTimeout(r, 3500));

  await page.screenshot({ path: 'scratch/toast_fixed_position.png', fullPage: false });
  console.log('Saved toast screenshot to scratch/toast_fixed_position.png');

  // Also test clicking bell icon
  await page.evaluate(() => {
    const bellBtn = document.querySelector('button[title="การแจ้งเตือน Real-time"]');
    if (bellBtn) bellBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  await page.screenshot({ path: 'scratch/drawer_fixed_position.png', fullPage: false });
  console.log('Saved drawer screenshot to scratch/drawer_fixed_position.png');

  await browser.close();
}

testToast().catch(console.error);
