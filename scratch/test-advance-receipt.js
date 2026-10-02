const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

async function testAdvanceReceipt() {
  const downloadDir = path.resolve(__dirname, 'downloads');
  if (!fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 1200 });

  const client = await page.target().createCDPSession();
  await client.send('Page.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: downloadDir
  });

  page.on('console', msg => console.log('PAGE LOG:', msg.type(), msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err.toString()));

  console.log('--- 1. Authenticating as Admin ---');
  await page.goto('http://localhost:3000/admin?', { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    localStorage.setItem('executive_auth_token', 'true');
    localStorage.setItem('attendance_employee_profile', JSON.stringify({
      employee_code: 'SI01',
      full_name: 'ผู้บริหารสูงสุด (ท่านประธาน)',
      role: 'ADMIN'
    }));
  });

  console.log('--- 2. Loading Admin Dashboard & switching to Advance Tab ---');
  await page.goto('http://localhost:3000/admin?', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1200));

  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const advBtn = buttons.find(b => b.innerText.includes('Advance') || b.innerText.includes('เบิกเงิน') || b.innerText.includes('Salary Advance'));
    if (advBtn) advBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // Find an approved request or button that says "สร้างเอกสารรับเงิน" or "พิมพ์ใบสำคัญจ่าย"
  console.log('--- 3. Opening Advance Receipt Modal ---');
  const opened = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const receiptBtn = buttons.find(b => b.innerText.includes('สร้างเอกสารรับเงิน') || b.innerText.includes('พิมพ์ใบสำคัญจ่าย') || b.innerText.includes('ใบสำคัญรับเงิน'));
    if (receiptBtn) {
      receiptBtn.click();
      return true;
    }
    // If no approved item is visible, switch filter to 'approved' or 'all'
    const approvedFilter = buttons.find(b => b.innerText.includes('อนุมัติแล้ว'));
    if (approvedFilter) approvedFilter.click();
    return false;
  });

  await new Promise(r => setTimeout(r, 1000));

  if (!opened) {
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const receiptBtn = buttons.find(b => b.innerText.includes('สร้างเอกสารรับเงิน') || b.innerText.includes('พิมพ์ใบสำคัญจ่าย') || b.innerText.includes('ใบสำคัญรับเงิน'));
      if (receiptBtn) receiptBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));
  }

  // Take screenshot of open modal
  await page.screenshot({ path: 'scratch/advance_modal_view.png' });
  console.log('Saved scratch/advance_modal_view.png');

  // Measure sheet dimensions
  const sheetInfo = await page.evaluate(() => {
    const sheet = document.querySelector('.a4-voucher-sheet');
    if (!sheet) return 'No .a4-voucher-sheet found';
    const rect = sheet.getBoundingClientRect();
    return {
      width: rect.width,
      height: rect.height,
      scrollHeight: sheet.scrollHeight,
      clientHeight: sheet.clientHeight,
      offsetHeight: sheet.offsetHeight
    };
  });
  console.log('Advance Sheet Info:', sheetInfo);

  // Click PDF Export
  console.log('--- 4. Clicking PDF Export Button ---');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const pdfBtn = buttons.find(b => b.innerText.includes('PDF'));
    if (pdfBtn) pdfBtn.click();
  });

  // Wait for file download
  console.log('Waiting for PDF file download...');
  for (let i = 0; i < 15; i++) {
    await new Promise(r => setTimeout(r, 500));
    const files = fs.readdirSync(downloadDir);
    const pdf = files.find(f => f.startsWith('CashAdvance') && f.endsWith('.pdf'));
    if (pdf) {
      console.log('Downloaded Advance PDF:', pdf);
      break;
    }
  }

  // Click PNG Export
  console.log('--- 5. Clicking PNG Export Button ---');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const pngBtn = buttons.find(b => b.innerText.includes('PNG'));
    if (pngBtn) pngBtn.click();
  });

  for (let i = 0; i < 15; i++) {
    await new Promise(r => setTimeout(r, 500));
    const files = fs.readdirSync(downloadDir);
    const png = files.find(f => f.startsWith('CashAdvance') && f.endsWith('.png'));
    if (png) {
      console.log('Downloaded Advance PNG:', png);
      break;
    }
  }

  await browser.close();
  console.log('Done testAdvanceReceipt');
}

testAdvanceReceipt().catch(console.error);
