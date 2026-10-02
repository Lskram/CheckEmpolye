const puppeteer = require('puppeteer-core');
const fs = require('fs');

async function testExport() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 1200 });

  await page.goto('http://localhost:3000/admin?', { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    localStorage.setItem('executive_auth_token', 'true');
    localStorage.setItem('attendance_employee_profile', JSON.stringify({
      employee_code: 'SI01',
      full_name: 'ผู้บริหารสูงสุด (ท่านประธาน)',
      role: 'ADMIN'
    }));
  });

  await page.goto('http://localhost:3000/admin?', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1200));

  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const wfBtn = buttons.find(b => b.innerText.includes('Workforce') || b.innerText.includes('พนักงาน'));
    if (wfBtn) wfBtn.click();
  });
  await new Promise(r => setTimeout(r, 800));

  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const repBtn = buttons.find(b => b.title?.includes('Timesheet') || b.title?.includes('รายงาน') || b.innerText.includes('Timesheet') || b.innerText.includes('รายงาน') || b.innerText.includes('สรุปเวลา'));
    if (repBtn) repBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  // Run html2canvas inside the browser context just like the app does!
  const canvasDataUrl = await page.evaluate(async () => {
    const html2canvas = window.html2canvas || (await import('html2canvas')).default;
    const sheet = document.querySelector('.a4-print-sheet');
    const canvas = await html2canvas(sheet, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });
    return canvas.toDataURL('image/png');
  });

  const base64Data = canvasDataUrl.replace(/^data:image\/png;base64,/, '');
  fs.writeFileSync('scratch/full_a4_canvas_rendered.png', base64Data, 'base64');
  console.log('Saved scratch/full_a4_canvas_rendered.png (Full A4 HTML2CANVAS export)');

  await browser.close();
}

testExport().catch(console.error);
