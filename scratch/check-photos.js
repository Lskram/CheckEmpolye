const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: emps, error: empErr } = await supabase.from('employees').select('*');
  console.log('Employees count:', emps?.length, 'Error:', empErr);
  if (emps) {
    console.log('Employees summary:', emps.map(e => ({ id: e.id, code: e.employee_code, name: e.full_name, avatar_url: e.avatar_url })));
  }

  const { data: photos, error: photoErr } = await supabase.from('employee_photos').select('*');
  console.log('Employee Photos count:', photos?.length, 'Error:', photoErr);
  if (photos && photos.length > 0) {
    console.log('Photos:', photos);
  }
}

check();
