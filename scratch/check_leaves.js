const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const content = fs.readFileSync('.env.local', 'utf8');
const env = {};
content.split(/\r?\n/).forEach(line => {
  const match = line.match(/^\s*([\w_]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let val = (match[2] || '').trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    env[match[1]] = val;
  }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function main() {
  const { data: leaves, error: lErr } = await supabase.from('leave_requests').select('*');
  console.log('Leaves raw count:', leaves ? leaves.length : 0);
  console.log('Leaves error:', lErr);
  if (leaves && leaves.length > 0) {
    console.log('Recent 3 leaves:', JSON.stringify(leaves.slice(0, 3), null, 2));
  }

  // Also check employees
  const { data: emps } = await supabase.from('employees').select('id, employee_code, full_name, role').limit(5);
  console.log('Employees:', emps);
}

main().catch(console.error);
