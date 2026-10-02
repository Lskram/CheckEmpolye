const puppeteer = require('puppeteer-core');
const fs = require('fs');

async function testReportPDF() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 1000 });

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

  console.log('--- 2. Loading Admin Dashboard ---');
  await page.goto('http://localhost:3000/admin?', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1200));

  console.log('--- 3. Switching to Workforce tab & opening report modal ---');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const wfBtn = buttons.find(b => b.innerText.includes('Workforce') || b.innerText.includes('พนักงาน'));
    if (wfBtn) wfBtn.click();
  });
  await new Promise(r => setTimeout(r, 800));

  console.log('--- 4. Clicking Timesheet Report button ---');
  const clicked = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    // Look for timesheet or report button
    const repBtn = buttons.find(b => b.title?.includes('Timesheet') || b.title?.includes('รายงาน') || b.innerText.includes('Timesheet') || b.innerText.includes('รายงาน') || b.innerText.includes('สรุปเวลา'));
    if (repBtn) {
      repBtn.click();
      return true;
    }
    // Check if there are icon buttons with FileSpreadsheet
    const actionBtns = Array.from(document.querySelectorAll('button'));
    for (const b of actionBtns) {
      if (b.querySelector('svg') && (b.className.includes('blue') || b.title?.includes('รายงาน'))) {
        b.click();
        return true;
      }
    }
    return false;
  });
  console.log('Timesheet button clicked:', clicked);

  await new Promise(r => setTimeout(r, 1500));

  // Take screenshot of modal
  await page.screenshot({ path: 'scratch/report_modal_view.png' });
  console.log('Saved scratch/report_modal_view.png');

  // Measure sheet
  const sheetInfo = await page.evaluate(() => {
    const sheet = document.querySelector('.a4-print-sheet');
    if (!sheet) return null;
    const rect = sheet.getBoundingClientRect();
    return {
      width: rect.width,
      height: rect.height,
      scrollHeight: sheet.scrollHeight,
      clientHeight: sheet.clientHeight,
      offsetHeight: sheet.offsetHeight
    };
  });
  console.log('Sheet Info:', sheetInfo);

  const sheetElement = await page.$('.a4-print-sheet');
  if (sheetElement) {
    await sheetElement.screenshot({ path: 'scratch/a4_sheet_rendered.png' });
    console.log('Saved scratch/a4_sheet_rendered.png');
  }

  // Click PDF button
  console.log('--- 5. Clicking PDF Export Button ---');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const pdfBtn = buttons.find(b => b.innerText.includes('PDF'));
    if (pdfBtn) pdfBtn.click();
  });
  await new Promise(r => setTimeout(r, 2000));

  await browser.close();
  console.log('Done testReportPDF');
}

testReportPDF().catch(console.error);
