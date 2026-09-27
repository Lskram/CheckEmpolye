const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bcliaorfqyxgiisocmmq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjbGlhb3JmcXl4Z2lpc29jbW1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwODE2NTYsImV4cCI6MjEwNTY1NzY1Nn0.icG_cSkuldZwt-w_v7sbLk0sPd6nBi7cKfuCzxzTyks';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('Testing Supabase Cloud Connection...');
  
  // 1. Employees
  const { data: employees, error: empErr } = await supabase.from('employees').select('*');
  console.log('\n--- 1. EMPLOYEES ---');
  if (empErr) console.error('Error fetching employees:', empErr);
  else console.log('Found', employees?.length, 'employees:', employees);

  // 2. Store Settings
  const { data: settings, error: setErr } = await supabase.from('store_settings').select('*');
  console.log('\n--- 2. STORE SETTINGS ---');
  if (setErr) console.error('Error fetching store_settings:', setErr);
  else console.log('Found', settings?.length, 'settings:', settings);

  // 3. Attendance Logs
  const { data: logs, error: logErr } = await supabase.from('attendance_logs').select('*');
  console.log('\n--- 3. ATTENDANCE LOGS ---');
  if (logErr) console.error('Error fetching attendance_logs:', logErr);
  else console.log('Found', logs?.length, 'attendance logs:', logs);

  // 4. Leave Requests
  const { data: leaves, error: leaveErr } = await supabase.from('leave_requests').select('*');
  console.log('\n--- 4. LEAVE REQUESTS ---');
  if (leaveErr) console.error('Error fetching leave_requests:', leaveErr);
  else console.log('Found', leaves?.length, 'leave requests:', leaves);

  // 5. Violation Logs
  const { data: violations, error: violErr } = await supabase.from('violation_logs').select('*');
  console.log('\n--- 5. VIOLATION LOGS ---');
  if (violErr) console.error('Error fetching violation_logs:', violErr);
  else console.log('Found', violations?.length, 'violation logs:', violations);
}

testConnection();
