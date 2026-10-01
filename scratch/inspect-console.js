const puppeteer = require('puppeteer-core');
const fs = require('fs');

const edgePaths = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
];

const executablePath = edgePaths.find(p => fs.existsSync(p));
console.log('Using executable:', executablePath);

async function inspect(url) {
  console.log(`\n=================== INSPECTING ${url} ===================`);
  const browser = await puppeteer.launch({
    executablePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      console.log(`[BROWSER CONSOLE ${type.toUpperCase()}]:`, text);
    });

    page.on('pageerror', err => {
      console.error('[PAGE ERROR - CLIENT EXCEPTION]:', err.message, err.stack);
    });

    page.on('requestfailed', req => {
      console.error('[REQUEST FAILED]:', req.url(), req.failure()?.errorText);
    });

    await page.goto(url, { waitUntil: 'networkidle0', timeout: 15000 });
    console.log('Page loaded successfully! Title:', await page.title());

    // Take screenshot if needed
    await page.screenshot({ path: `scratch/${url.replace(/[^a-zA-Z0-9]/g, '_')}.png` });
  } catch (e) {
    console.error('Navigation/Execution Error:', e);
  } finally {
    await browser.close();
  }
}

async function main() {
  await inspect('http://localhost:3000/admin');
  await inspect('http://localhost:3000/executive');
  await inspect('http://localhost:3000/employee');
}

main();
