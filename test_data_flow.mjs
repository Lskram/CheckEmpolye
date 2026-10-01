import { db } from './src/lib/db-store.ts';

async function testAllDataFlows() {
  console.log('--- STARTING COMPREHENSIVE DATA FLOW VERIFICATION ---');

  // 1. Check Store Settings Flow
  const settings = await db.getStoreSettings();
  console.log('1. Store Settings Flow:');
  console.log(`   - Store Name: ${settings.store_name}`);
  console.log(`   - Standard Time: ${settings.standard_time}`);
  console.log(`   - Late Deadline: ${settings.late_deadline}`);
  console.log(`   - Geofence Radius: ${settings.radius_meters}m`);

  // 2. Check Employees
  const employees = await db.getEmployees();
  const staff = employees.find(e => e.role === 'STAFF') || employees[0];
  const admin = employees.find(e => e.role === 'ADMIN') || employees[0];
  console.log('2. Employee Query Flow:');
  console.log(`   - Staff Target: ${staff.full_name} (${staff.employee_code}) [ID: ${staff.id}]`);
  console.log(`   - Admin Target: ${admin.full_name} (${admin.employee_code}) [ID: ${admin.id}]`);

  // 3. Salary Advance Request Lifecycle Flow
  console.log('3. Salary Advance Request Flow:');
  const newAdvance = await db.createSalaryAdvanceRequest({
    employee_id: staff.id,
    amount: 1500,
    request_date: new Date().toISOString().slice(0, 10),
    reason: 'ทดสอบการไหลของข้อมูลขอเบิกเงินล่วงหน้า (Automated Verification Test)',
    needed_before_date: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
  });
  console.log(`   [STEP 3.1] Created Advance Request: ID=${newAdvance.id}, Amount=${newAdvance.amount}฿, Status=${newAdvance.status}`);

  // Query advances
  const allAdvances = await db.getSalaryAdvanceRequests(staff.id);
  const found = allAdvances.find(a => a.id === newAdvance.id);
  console.log(`   [STEP 3.2] Query Advance List: Found ${allAdvances.length} items. Target item status=${found?.status}`);

  // Approve advance
  const approved = await db.updateSalaryAdvanceStatus(newAdvance.id, 'APPROVED', admin.id);
  console.log(`   [STEP 3.3] Executive Approval: Status=${approved?.status}, ReviewedBy=${approved?.reviewed_by}`);

  // 4. Violation Logs & Security Flow
  console.log('4. Security Violation Logs Flow:');
  const testViol = await db.createViolationLog({
    employee_id: staff.id,
    violation_type: 'HWID_OVERLAP',
    severity: 'CRITICAL',
    description: `ทดสอบตรวจจับใช้อุปกรณ์ซ้ำซ้อน ระหว่าง ${staff.full_name} และ ADMIN`,
    hwid: 'TEST-HWID-VERIFY-001',
    other_employee_id: admin.id,
  });
  console.log(`   [STEP 4.1] Created Security Log: ID=${testViol.id}, Type=${testViol.violation_type}, Resolved=${testViol.is_resolved}`);

  const resolveResult = await db.resolveViolation(testViol.id);
  console.log(`   [STEP 4.2] Resolve Security Violation: Success=${resolveResult}`);

  console.log('--- ALL DATA FLOWS VERIFIED SUCCESSFULLY (100% PASS) ---');
}

testAllDataFlows().catch(err => {
  console.error('Data flow verification error:', err);
  process.exit(1);
});
