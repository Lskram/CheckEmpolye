const puppeteer = require('puppeteer-core');
const fs = require('fs');

const edgePaths = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
];
const executablePath = edgePaths.find(p => fs.existsSync(p));

async function inspect(url) {
  console.log(`\n=================== INSPECTING: ${url} ===================`);
  const browser = await puppeteer.launch({
    executablePath,
    headless: 'new',
    args: ['--no-sandbox']
  });

  try {
    const page = await browser.newPage();

    page.on('response', res => {
      const status = res.status();
      if (status >= 400) {
        console.log(`[HTTP ${status} ERROR]: ${res.url()}`);
      }
    });

    page.on('console', msg => {
      console.log(`[CONSOLE ${msg.type().toUpperCase()}]:`, msg.text());
    });

    page.on('pageerror', err => {
      console.error(`[PAGE ERROR / CLIENT CRASH]:`, err.message, err.stack);
    });

    await page.goto(url, { waitUntil: 'networkidle0', timeout: 20000 });
    console.log('Finished loading. Title:', await page.title());

    await page.screenshot({ path: `scratch/vercel_screenshot.png` });
  } catch (e) {
    console.error('Error during test:', e);
  } finally {
    await browser.close();
  }
}

async function run() {
  await inspect('https://check-empolye.vercel.app');
  await inspect('https://check-empolye.vercel.app/admin');
  await inspect('https://check-empolye.vercel.app/employee');
}

run();
