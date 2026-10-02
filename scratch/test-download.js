const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

async function testDownload() {
  const downloadDir = path.resolve(__dirname, 'downloads');
  if (!fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new'
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 1200 });

  const client = await page.target().createCDPSession();
  await client.send('Page.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: downloadDir
  });

  await page.goto('http://localhost:3000/admin?');
  await page.evaluate(() => {
    localStorage.setItem('executive_auth_token', 'true');
    localStorage.setItem('attendance_employee_profile', JSON.stringify({ employee_code: 'SI01', full_name: 'Admin', role: 'ADMIN' }));
  });
  await page.goto('http://localhost:3000/admin?');
  await new Promise(r => setTimeout(r, 1200));

  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const wfBtn = buttons.find(b => b.innerText.includes('Workforce') || b.innerText.includes('พนักงาน'));
    if (wfBtn) wfBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const repBtn = buttons.find(b => b.title?.includes('Timesheet') || b.title?.includes('รายงาน') || b.innerText.includes('Timesheet') || b.innerText.includes('รายงาน'));
    if (repBtn) repBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // Click Export PDF button
  console.log('Clicking PDF export button...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const pdfBtn = buttons.find(b => b.innerText.includes('PDF'));
    if (pdfBtn) pdfBtn.click();
  });

  // Wait for file download
  console.log('Waiting for PDF file download...');
  let downloadedFile = null;
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 500));
    const files = fs.readdirSync(downloadDir);
    const pdf = files.find(f => f.endsWith('.pdf'));
    if (pdf) {
      downloadedFile = path.join(downloadDir, pdf);
      break;
    }
  }

  console.log('Downloaded File:', downloadedFile);

  // Also Click PNG export button
  console.log('Clicking PNG export button...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const pngBtn = buttons.find(b => b.innerText.includes('PNG'));
    if (pngBtn) pngBtn.click();
  });

  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 500));
    const files = fs.readdirSync(downloadDir);
    const png = files.find(f => f.endsWith('.png'));
    if (png) {
      console.log('Downloaded PNG:', png);
      break;
    }
  }

  await browser.close();
}

testDownload().catch(console.error);
