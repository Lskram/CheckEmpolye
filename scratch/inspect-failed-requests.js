const puppeteer = require('puppeteer-core');
const fs = require('fs');

const edgePaths = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
];
const executablePath = edgePaths.find(p => fs.existsSync(p));

async function inspectFailedRequests(url) {
  console.log(`\n=================== INSPECTING FAILED REQUESTS ON: ${url} ===================`);
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

    page.on('requestfailed', req => {
      console.log(`[REQUEST FAILED]: ${req.url()} (${req.failure()?.errorText})`);
    });

    page.on('pageerror', err => {
      console.error(`[PAGE ERROR]:`, err.message);
    });

    await page.goto(url, { waitUntil: 'networkidle0', timeout: 10000 });
  } catch (e) {
    console.error('Error during test:', e);
  } finally {
    await browser.close();
  }
}

async function run() {
  await inspectFailedRequests('http://localhost:3000/admin');
  await inspectFailedRequests('http://localhost:3000/executive');
  await inspectFailedRequests('http://localhost:3000/employee');
}

run();
