const puppeteer = require('puppeteer-core');
const fs = require('fs');

const edgePaths = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
];

const executablePath = edgePaths.find(p => fs.existsSync(p));

async function inspectModals() {
  console.log('\nTesting UI and Modals rendering on /admin...');
  const browser = await puppeteer.launch({
    executablePath,
    headless: 'new',
    args: ['--no-sandbox']
  });

  try {
    const page = await browser.newPage();
    let pageErrors = [];
    page.on('pageerror', err => pageErrors.push(err.message));

    await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle0' });

    console.log('Page loaded without crash. Any page errors?', pageErrors.length === 0 ? 'None (Clean)' : pageErrors);
    
    // Check if body rendered
    const hasAdminContainer = await page.evaluate(() => !!document.querySelector('body'));
    console.log('Body rendered:', hasAdminContainer);

    await page.screenshot({ path: 'scratch/admin_rendered_clean.png' });
    console.log('Saved screenshot to scratch/admin_rendered_clean.png');
  } catch (e) {
    console.error('Test error:', e);
  } finally {
    await browser.close();
  }
}

inspectModals();
