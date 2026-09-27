const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bcliaorfqyxgiisocmmq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjbGlhb3JmcXl4Z2lpc29jbW1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwODE2NTYsImV4cCI6MjEwNTY1NzY1Nn0.icG_cSkuldZwt-w_v7sbLk0sPd6nBi7cKfuCzxzTyks';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testHydration() {
  console.log('--- TEST 1: leave_requests with explicit fkey ---');
  const res1 = await supabase
    .from('leave_requests')
    .select('*, employee:employees!leave_requests_employee_id_fkey(*)')
    .order('created_at', { ascending: false });
  console.log('res1 error:', res1.error);
  console.log('res1 count:', res1.data?.length);
  if (res1.data) console.log('Sample leave:', res1.data[0]);

  console.log('\n--- TEST 2: violation_logs with explicit fkey ---');
  const res2 = await supabase
    .from('violation_logs')
    .select('*, employee:employees!violation_logs_employee_id_fkey(*), other_employee:employees!violation_logs_other_employee_id_fkey(*)')
    .order('created_at', { ascending: false });
  console.log('res2 error:', res2.error);
  console.log('res2 count:', res2.data?.length);
  if (res2.data) console.log('Sample violation:', res2.data[0]);
}

testHydration();
