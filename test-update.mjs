import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bcliaorfqyxgiisocmmq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjbGlhb3JmcXl4Z2lpc29jbW1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwODE2NTYsImV4cCI6MjEwNTY1NzY1Nn0.icG_cSkuldZwt-w_v7sbLk0sPd6nBi7cKfuCzxzTyks';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testUpdate() {
  console.log('Testing UPDATE with anon key...');
  const { data, error } = await supabase
    .from('store_settings')
    .update({ store_name: 'TEST STORE', updated_at: new Date().toISOString() })
    .eq('id', '00000000-0000-0000-0000-000000000001')
    .select();
  
  console.log('Update result data:', data);
  console.log('Update result error:', error);
}

testUpdate();
