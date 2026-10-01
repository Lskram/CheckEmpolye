const puppeteer = require('puppeteer-core');
const fs = require('fs');

const edgePaths = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
];
const executablePath = edgePaths.find(p => fs.existsSync(p));

async function testWithAuth(url) {
  console.log(`\nTesting with Simulated LocalStorage & Login on: ${url}`);
  const browser = await puppeteer.launch({
    executablePath,
    headless: 'new',
    args: ['--no-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // Set localStorage before navigation
    await page.evaluateOnNewDocument(() => {
      localStorage.setItem('admin_auth_token', 'mock_token_123');
      localStorage.setItem('executive_code', 'SI01');
      localStorage.setItem('employee_code', 'SI01');
    });

    const errors = [];
    page.on('pageerror', err => {
      errors.push(err.message + '\n' + err.stack);
      console.error('[PAGE ERROR]:', err);
    });

    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('[CONSOLE ERROR]:', msg.text());
      }
    });

    await page.goto(url, { waitUntil: 'networkidle0', timeout: 10000 });
    console.log(`Page: ${url} -> Errors count: ${errors.length}`);
    if (errors.length > 0) {
      console.error('Captured Errors:', errors);
    }
  } catch (e) {
    console.error('Error during test:', e);
  } finally {
    await browser.close();
  }
}

async function run() {
  await testWithAuth('http://localhost:3000/admin');
  await testWithAuth('http://localhost:3000/executive');
  await testWithAuth('http://localhost:3000/employee');
}

run();
