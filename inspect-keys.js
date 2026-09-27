const https = require('https');

https.get('https://check-empolye.vercel.app/api/admin/analytics?period=daily', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('Keys in data:', Object.keys(json.data));
      console.log('Summary:', json.data.summary);
      console.log('Staff list length:', json.data.employees?.length);
      console.log('Recent logs length:', json.data.recentAttendance?.length);
      console.log('Violation logs length:', json.data.violations?.length);
    } catch (e) {
      console.log('Error parsing:', e);
    }
  });
});
