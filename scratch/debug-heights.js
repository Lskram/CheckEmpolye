const puppeteer = require('puppeteer-core');

async function debugHeights() {
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

  const breakdown = await page.evaluate(() => {
    const sheet = document.querySelector('.a4-print-sheet');
    if (!sheet) return 'Sheet not found';
    
    // Temporarily remove overflow hidden and maxHeight to see true natural height
    sheet.style.overflow = 'visible';
    sheet.style.maxHeight = 'none';
    sheet.style.height = 'auto';

    const results = {
      sheetNaturalHeight: sheet.offsetHeight,
      children: []
    };

    for (let child of sheet.children) {
      results.children.push({
        tagName: child.tagName,
        offsetHeight: child.offsetHeight,
        subChildren: Array.from(child.children).map(c => ({
          tagName: c.tagName,
          offsetHeight: c.offsetHeight
        }))
      });
    }

    return results;
  });

  console.log(JSON.stringify(breakdown, null, 2));

  await browser.close();
}

debugHeights().catch(console.error);
