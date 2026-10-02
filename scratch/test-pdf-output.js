const puppeteer = require('puppeteer-core');
const fs = require('fs');

async function testPdfOutput() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new'
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 1200 });

  await page.goto('http://localhost:3000/admin?');
  await page.evaluate(() => {
    localStorage.setItem('executive_auth_token', 'true');
    localStorage.setItem('attendance_employee_profile', JSON.stringify({ employee_code: 'SI01', full_name: 'Admin', role: 'ADMIN' }));
  });
  await page.goto('http://localhost:3000/admin?');
  await new Promise(r => setTimeout(r, 1000));
  
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const wfBtn = buttons.find(b => b.innerText.includes('Workforce') || b.innerText.includes('พนักงาน'));
    if (wfBtn) wfBtn.click();
  });
  await new Promise(r => setTimeout(r, 500));
  
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const repBtn = buttons.find(b => b.title?.includes('Timesheet') || b.title?.includes('รายงาน') || b.innerText.includes('Timesheet') || b.innerText.includes('รายงาน'));
    if (repBtn) repBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // Also generate PDF
  const pdfBase64 = await page.evaluate(async () => {
    const sheet = document.querySelector('.a4-print-sheet');
    const html2canvas = (await import('html2canvas')).default;
    const { jsPDF } = await import('jspdf');

    const canvas = await html2canvas(sheet, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: 1024
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });
    pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
    return {
      pdfUri: pdf.output('datauristring'),
      canvasDataUrl: canvas.toDataURL('image/png')
    };
  });

  const base64Data = pdfBase64.canvasDataUrl.replace(/^data:image\/png;base64,/, '');
  fs.writeFileSync('scratch/full_a4_canvas.png', base64Data, 'base64');
  console.log('Saved scratch/full_a4_canvas.png successfully!');

  const pdfData = pdfBase64.pdfUri.replace(/^data:application\/pdf;filename=generated.pdf;base64,/, '').replace(/^data:application\/pdf;base64,/, '');
  fs.writeFileSync('scratch/generated_test.pdf', pdfData, 'base64');
  console.log('Saved scratch/generated_test.pdf successfully!');

  await browser.close();
}

testPdfOutput().catch(console.error);
