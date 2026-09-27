const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bcliaorfqyxgiisocmmq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjbGlhb3JmcXl4Z2lpc29jbW1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwODE2NTYsImV4cCI6MjEwNTY1NzY1Nn0.icG_cSkuldZwt-w_v7sbLk0sPd6nBi7cKfuCzxzTyks';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testQueries() {
  console.log('--- TEST getAttendanceLogs with JOIN ---');
  const res1 = await supabase
    .from('attendance_logs')
    .select('*, employee:employees(*)')
    .order('check_in_time', { ascending: false });
  console.log('res1 error:', res1.error);
  console.log('res1 data count:', res1.data?.length);

  console.log('\n--- TEST getLeaveRequests with JOIN ---');
  const res2 = await supabase
    .from('leave_requests')
    .select('*, employee:employees(*)')
    .order('created_at', { ascending: false });
  console.log('res2 error:', res2.error);
  console.log('res2 data count:', res2.data?.length);

  console.log('\n--- TEST getViolationLogs with JOIN ---');
  const res3 = await supabase
    .from('violation_logs')
    .select('*, employee:employees(*)')
    .order('created_at', { ascending: false });
  console.log('res3 error:', res3.error);
  console.log('res3 data count:', res3.data?.length);
}

testQueries();
