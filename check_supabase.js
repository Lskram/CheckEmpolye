const { createClient } = require('@supabase/supabase-js');

const url = "https://bcliaorfqyxgiisocmmq.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjbGlhb3JmcXl4Z2lpc29jbW1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwODE2NTYsImV4cCI6MjEwNTY1NzY1Nn0.icG_cSkuldZwt-w_v7sbLk0sPd6nBi7cKfuCzxzTyks";
const client = createClient(url, key);

async function checkTables() {
  console.log("=== CHECKING SUPABASE TABLES ===");
  
  const tables = ["employees", "store_settings", "attendance_logs", "leave_requests", "violation_logs"];
  for (const t of tables) {
    try {
      const { data, error } = await client.from(t).select('*').limit(5);
      if (error) {
        console.log(`❌ Table [${t}]: Error - ${error.message} (Code: ${error.code})`);
      } else {
        console.log(`✅ Table [${t}]: Exists! (${data.length} sample rows)`);
        console.log(JSON.stringify(data, null, 2));
      }
    } catch (err) {
      console.log(`❌ Table [${t}]: Exception - ${err.message}`);
    }
  }
}

checkTables();
