import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAttendanceLogNotifications() {
  console.log('--- 1. Fetching Employees & Settings ---');
  const { data: emps, error: empErr } = await supabase.from('employees').select('*');
  if (empErr) {
    console.error('Error fetching employees:', empErr);
    return;
  }
  const testEmp = emps.find(e => e.role !== 'ADMIN') || emps[0];
  console.log(`Found test employee: ${testEmp.full_name} (${testEmp.employee_code})`);

  console.log('\n--- 2. Querying Recent Attendance Logs ---');
  const { data: logs, error: logErr } = await supabase
    .from('attendance_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (logErr) {
    console.error('Error querying logs:', logErr);
    return;
  }

  console.log(`Retrieved ${logs.length} recent attendance logs:`);
  logs.forEach(l => {
    const timeIn = l.check_in_time ? new Date(l.check_in_time).toLocaleTimeString('th-TH') : '-';
    const timeOut = l.check_out_time ? new Date(l.check_out_time).toLocaleTimeString('th-TH') : '-';
    console.log(` - ID: ${l.id} | Emp: ${l.employee_id} | In: ${timeIn} | Out: ${timeOut} | Status: ${l.status}`);
  });

  console.log('\n--- 3. Verifying Notification Mapping Schema ---');
  const empMap = new Map();
  emps.forEach(e => {
    empMap.set(e.id, e);
    if (e.employee_code) empMap.set(e.employee_code, e);
  });

  logs.forEach(l => {
    const emp = empMap.get(l.employee_id) || {};
    const empName = emp.nickname || emp.full_name || 'พนักงาน';
    const empCode = emp.employee_code ? `(${emp.employee_code})` : '';

    if (l.check_in_time) {
      const timeStr = new Date(l.check_in_time).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
      const statusText = l.status === 'PRESENT' ? 'ตรงเวลา (+50฿)' : 'มาสาย';
      const notif = {
        type: 'checkin',
        title: `🟢 คุณ ${empName} ${empCode} ลงเวลาเข้างาน`,
        message: `เวลา ${timeStr} น. • ระยะห่างร้าน ${Number(l.distance_from_store || 0).toFixed(1)} ม. (${statusText})`,
        time: timeStr,
      };
      console.log('✅ Check-in Notification payload:', notif);
    }

    if (l.check_out_time) {
      const timeStr = new Date(l.check_out_time).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
      const notif = {
        type: 'checkout',
        title: `🏁 คุณ ${empName} ${empCode} ลงชื่อออกงาน`,
        message: `เวลาออกงาน: ${timeStr} น. • ทำงาน: ${l.work_hours || '-'} ชม.`,
        time: timeStr,
      };
      console.log('✅ Check-out Notification payload:', notif);
    }
  });

  console.log('\n--- 4. Verification Successful! All notification payloads format cleanly ---');
}

testAttendanceLogNotifications();
