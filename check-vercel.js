const https = require('https');

https.get('https://check-empolye.vercel.app/api/admin/analytics?period=monthly', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('--- VERCEL LIVE API RESPONSE ---');
      console.log('Success:', json.success);
      console.log('Total Staff in DB:', json.data?.summary?.totalEmployees);
      console.log('Staff list:', json.data?.allowanceReports?.map(r => `${r.employeeCode}: ${r.fullName} (${r.nickname})`));
      console.log('Attendance count:', json.data?.recentLogs?.length);
      console.log('Pending leaves count:', json.data?.pendingLeaves?.length);
      console.log('Violation count:', json.data?.violationLogs?.length);
      console.log('Store name:', json.data?.settings?.store_name);
    } catch (e) {
      console.log('Raw response:', data.substring(0, 300));
    }
  });
}).on('error', (e) => {
  console.error('Error fetching Vercel:', e);
});
