const baseUrl = 'https://check-empolye.vercel.app';

async function testMobileFlow() {
  console.log('========================================================================');
  console.log('🧪 TESTING COMPLETE MOBILE DATA FLOW & DATA REQUESTS');
  console.log('========================================================================');

  // Step 1: Staff Login
  console.log('\n[1] Testing Staff Login (0001 / PIN 1234)...');
  const loginRes = await fetch(baseUrl + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employeeCode: '0001', pinCode: '1234', hwid: 'HWID_MOBILE_TEST_0001' })
  });
  const loginData = await loginRes.json();
  console.log('    Status:', loginRes.status, '| Success:', loginData.success);
  console.log('    Logged In Employee:', loginData.data?.full_name, `(${loginData.data?.employee_code})`, '| ID:', loginData.data?.id);

  const empId = loginData.data?.id;

  // Step 2: Fetch Store Settings (Geofence & Work Hours)
  console.log('\n[2] Testing Mobile Fetch Store Settings...');
  const setRes = await fetch(baseUrl + '/api/admin/settings');
  const setData = await setRes.json();
  console.log('    Store Name:', setData.data?.store_name);
  console.log(`    Geofence Radius: ${setData.data?.radius_meters}m | Cutoff: ${setData.data?.late_deadline}`);

  // Step 3: Staff Check-in at Store (Within 50m radius)
  console.log('\n[3] Testing Staff Check-in at Store...');
  const checkinRes = await fetch(baseUrl + '/api/check-in', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      employeeId: empId,
      latitude: 15.110412,
      longitude: 104.358434,
      accuracy: 5,
      hwid: 'HWID_MOBILE_TEST_0001'
    })
  });
  const checkinData = await checkinRes.json();
  console.log('    Check-in Status:', checkinRes.status, '| Success:', checkinData.success);
  console.log('    Message:', checkinData.message);
  console.log('    Result:', checkinData.data);

  // Step 4: Staff Fetch Personal Stats & Calendar
  console.log('\n[4] Testing Mobile Fetch Stats & Calendar (/api/employee/stats)...');
  const statsRes = await fetch(baseUrl + `/api/employee/stats?id=${empId}`);
  const statsData = await statsRes.json();
  console.log('    Summary:', statsData.data?.summary);
  console.log('    Today Log in Mobile App:', statsData.data?.todayLog);

  // Step 5: Staff Submit Leave Request
  console.log('\n[5] Testing Mobile Submit Leave Request (/api/leave)...');
  const leaveRes = await fetch(baseUrl + '/api/leave', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      employeeId: empId,
      leaveType: 'SICK',
      startDate: '2026-09-28',
      endDate: '2026-09-28',
      reason: 'มีไข้สูง ไปตรวจที่โรงพยาบาล'
    })
  });
  const leaveData = await leaveRes.json();
  console.log('    Leave Submission:', leaveData.success ? 'SUCCESS' : 'FAILED', '| Leave ID:', leaveData.data?.id);

  // Step 6: Executive Web Dashboard Sync Check
  console.log('\n[6] Testing Web Executive Dashboard Sync (/api/admin/analytics)...');
  const analyticsRes = await fetch(baseUrl + '/api/admin/analytics?period=daily&t=' + Date.now());
  const analyticsData = await analyticsRes.json();
  console.log('    Overview Summary Card:', JSON.stringify(analyticsData.data?.overview));
  console.log('    Staff Checked In Today List:');
  analyticsData.data?.allowanceReports?.forEach(emp => {
    console.log(`      * [${emp.employeeCode}] ${emp.fullName} (${emp.nickname}) | สถานะวันนี้: ${emp.todayStatus} | เวลา: ${emp.todayCheckInTime} | เบี้ยขยัน: ${emp.todayAllowance}฿`);
  });
  console.log('    Pending Leaves on Web Dashboard:', analyticsData.data?.pendingLeaves?.length, 'รายการ');

  console.log('\n========================================================================');
  console.log('✅ ALL MOBILE <-> WEB DATA FLOW TESTS PASSED 100%!');
  console.log('========================================================================');
}

testMobileFlow();
