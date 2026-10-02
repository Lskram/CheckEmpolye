const puppeteer = require('puppeteer-core');

async function debugFresh() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.createBrowserContext();
  const page = await context.newPage();

  page.on('console', msg => console.log('LOG:', msg.type(), msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err.stack || err.message));

  await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle0' });

  // Type login credentials into the inputs
  console.log('Typing login code & PIN...');
  await page.type('input[placeholder="รหัสผู้บริหาร (Executive Code)"]', 'SI01');
  await page.type('input[placeholder="••••"]', '1234');

  await page.click('button[type="submit"]');

  await new Promise(r => setTimeout(r, 3000));

  await page.screenshot({ path: 'scratch/debug_fresh_login.png', fullPage: true });
  console.log('Saved scratch/debug_fresh_login.png');

  await browser.close();
}

debugFresh().catch(console.error);
