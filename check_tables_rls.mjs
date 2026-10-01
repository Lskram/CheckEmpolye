import { supabase } from './src/lib/supabase.ts';

async function test() {
  const { data: att, error: errAtt } = await supabase.from('attendance_logs').select('id').limit(1);
  console.log('attendance_logs select:', errAtt ? errAtt.message : 'OK');
  
  const { data: lv, error: errLv } = await supabase.from('leave_requests').select('id').limit(1);
  console.log('leave_requests select:', errLv ? errLv.message : 'OK');
  
  const { data: sa, error: errSa } = await supabase.from('salary_advance_requests').select('id').limit(1);
  console.log('salary_advance_requests select:', errSa ? errSa.message : 'OK');

  // Test insert into leave_requests
  const { data: insLv, error: errInsLv } = await supabase.from('leave_requests').insert({
    employee_id: '501cd32b-3609-494a-90a0-c473bd523eb4',
    leave_type: 'SICK',
    start_date: '2026-09-28',
    end_date: '2026-09-28',
    days_count: 1,
    reason: 'RLS check test',
    status: 'PENDING'
  }).select().single();
  console.log('leave_requests insert:', errInsLv ? errInsLv.message : 'OK: ' + insLv?.id);

  if (insLv?.id) {
    await supabase.from('leave_requests').delete().eq('id', insLv.id);
  }
}

test();
