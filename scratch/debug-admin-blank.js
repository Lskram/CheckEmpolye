const puppeteer = require('puppeteer-core');

async function debugAdmin() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.type(), msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err.toString()));

  console.log('--- Loading http://localhost:3000/admin? without auth ---');
  await page.goto('http://localhost:3000/admin?', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: 'scratch/debug_admin_no_auth.png' });

  console.log('--- Setting auth and reloading ---');
  await page.evaluate(() => {
    localStorage.setItem('executive_auth_token', 'true');
    localStorage.setItem('attendance_employee_profile', JSON.stringify({
      employee_code: 'SI01',
      full_name: 'ผู้บริหารสูงสุด (ท่านประธาน)',
      role: 'ADMIN'
    }));
  });

  await page.goto('http://localhost:3000/admin?', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: 'scratch/debug_admin_with_auth.png' });

  await browser.close();
}

debugAdmin().catch(console.error);
