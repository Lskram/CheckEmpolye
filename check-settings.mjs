import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bcliaorfqyxgiisocmmq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjbGlhb3JmcXl4Z2lpc29jbW1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwODE2NTYsImV4cCI6MjEwNTY1NzY1Nn0.icG_cSkuldZwt-w_v7sbLk0sPd6nBi7cKfuCzxzTyks';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  console.log('Querying store_settings...');
  const { data, error } = await supabase.from('store_settings').select('*');
  console.log('store_settings data:', JSON.stringify(data, null, 2));
  console.log('store_settings error:', error);
}

check();
