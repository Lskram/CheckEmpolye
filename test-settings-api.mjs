import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bcliaorfqyxgiisocmmq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjbGlhb3JmcXl4Z2lpc29jbW1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwODE2NTYsImV4cCI6MjEwNTY1NzY1Nn0.icG_cSkuldZwt-w_v7sbLk0sPd6nBi7cKfuCzxzTyks';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSettingsApi() {
  console.log('1. Reading current settings from Supabase...');
  const { data: initial, error: err1 } = await supabase.from('store_settings').select('*').limit(1).single();
  console.log('Current store_settings in DB:', initial);

  console.log('2. Simulating API update to a new location...');
  const newLat = 15.120000;
  const newLng = 104.360000;
  
  const { data: updated, error: err2 } = await supabase
    .from('store_settings')
    .update({
      store_name: 'สีแสงยางยนต์ YOKOHAMA NAYA COSMIS',
      store_lat: newLat,
      store_lng: newLng,
      radius_meters: 50,
      updated_at: new Date().toISOString(),
    })
    .eq('id', initial.id)
    .select()
    .single();

  console.log('Updated in Supabase:', updated);
  console.log('Update Error:', err2);
}

testSettingsApi();
