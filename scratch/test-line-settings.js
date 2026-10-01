const puppeteer = require('puppeteer-core');

async function testSettingsTab() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1800 });

  await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle0' });

  // Unlock session
  await page.evaluate(() => {
    localStorage.setItem('executive_auth_token', 'true');
    localStorage.setItem('attendance_employee_profile', JSON.stringify({
      employee_code: 'SI01',
      full_name: 'ผู้บริหารสูงสุด (ท่านประธาน)',
      role: 'ADMIN'
    }));
  });

  await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));

  // Find all buttons in header tabs and click "Store & Geofence // พิกัด"
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const settingsBtn = buttons.find(b => b.textContent.includes('Store & Geofence') || b.textContent.includes('พิกัด'));
    if (settingsBtn) settingsBtn.click();
  });

  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: 'scratch/settings_line_oa_active.png', fullPage: true });
  console.log('Saved settings screenshot to scratch/settings_line_oa_active.png');

  await browser.close();
}

testSettingsTab().catch(console.error);
