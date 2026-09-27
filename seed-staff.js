const { createClient } = require('@supabase/supabase-js');

const url = "https://bcliaorfqyxgiisocmmq.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjbGlhb3JmcXl4Z2lpc29jbW1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwODE2NTYsImV4cCI6MjEwNTY1NzY1Nn0.icG_cSkuldZwt-w_v7sbLk0sPd6nBi7cKfuCzxzTyks";
const client = createClient(url, key);

async function seed() {
  console.log('Seeding employees into Supabase...');

  const staffToInsert = [
    {
      employee_code: '0001',
      full_name: 'Chanachai',
      nickname: 'เติ้ล',
      pin_hash: '1234',
      role: 'STAFF',
      is_active: true,
    },
    {
      employee_code: 'EMP001',
      full_name: 'สมชาย สายตรง',
      nickname: 'ชาย',
      pin_hash: '1234',
      role: 'STAFF',
      is_active: true,
    },
    {
      employee_code: 'EMP002',
      full_name: 'เติ้ล',
      nickname: 'เติ้ลมาก',
      pin_hash: '1234',
      role: 'STAFF',
      is_active: true,
    },
  ];

  for (const emp of staffToInsert) {
    const { data: existing } = await client.from('employees').select('id').eq('employee_code', emp.employee_code).maybeSingle();
    if (existing) {
      console.log(`Employee ${emp.employee_code} already exists.`);
    } else {
      const { data, error } = await client.from('employees').insert(emp).select().single();
      if (error) {
        console.error(`Error creating ${emp.employee_code}:`, error.message);
      } else {
        console.log(`Created employee [${data.employee_code}] ${data.full_name} (ID: ${data.id})`);
      }
    }
  }

  // Also verify store settings
  const { data: store } = await client.from('store_settings').select('*').limit(1).single();
  console.log('Store settings:', store?.store_name);
}

seed();
