const https = require('https');

https.get('https://check-empolye.vercel.app/api/admin/analytics?period=monthly', (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    const resObj = JSON.parse(data);
    console.log('=== VERCEL PRODUCTION LIVE DATA ===');
    console.log('Total Accounts:', resObj.data.overview.totalAllAccounts);
    console.log('Staff count:', resObj.data.overview.totalStaff);
    console.log('Allowance Reports (Staff List):');
    resObj.data.allowanceReports.forEach(s => {
      console.log(`  - [${s.role}] ${s.employeeCode}: ${s.fullName} (${s.nickname}) | เบี้ยขยัน: ${s.totalAllowance} บาท`);
    });
    console.log('\nPending Leaves:', resObj.data.pendingLeaves.length);
    resObj.data.pendingLeaves.forEach(l => {
      console.log(`  - ${l.employee?.full_name || l.employee_id}: ${l.leave_type} (${l.reason}) [${l.status}]`);
    });
    console.log('\nStore Settings:', resObj.data.settings.store_name);
  });
});
