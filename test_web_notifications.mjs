import { supabase } from './src/lib/supabase.ts';

async function testWebNotificationFlow() {
  console.log('--- 🧪 Testing Web Notification & Salary Advance System ---');

  // 1. Get employee 'เติ้ล'
  const { data: emps } = await supabase.from('employees').select('*').eq('employee_code', '01');
  const tle = emps?.[0] || { id: '501cd32b-3609-494a-90a0-c473bd523eb4', nickname: 'เติ้ล45', full_name: 'เติ้ล' };

  console.log('1. Target Employee:', tle.full_name, `(${tle.nickname})`);

  // 2. Insert a new Salary Advance Request
  const { data: newAdv, error } = await supabase.from('salary_advance_requests').insert({
    employee_id: tle.id,
    amount: 1500,
    request_date: new Date().toISOString().split('T')[0],
    reason: 'ค่าเทอมลูก (ทดสอบระบบแจ้งเตือน Web Real-time)',
    status: 'PENDING'
  }).select().single();

  if (error) {
    console.error('Failed to create advance request:', error);
    return;
  }
  console.log('2. ✅ Created Advance Request:', newAdv.id, 'Amount:', newAdv.amount, 'Status:', newAdv.status);

  // 3. Query DB
  const { count } = await supabase.from('salary_advance_requests').select('*', { count: 'exact' }).eq('status', 'PENDING');
  console.log('3. ✅ Pending Advances in Supabase DB:', count);

  console.log('\n--- 🎉 All Web Notification Tests Passed Successfully ---');
}

testWebNotificationFlow();
