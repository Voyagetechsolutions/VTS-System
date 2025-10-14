// =====================================================
// SUPABASE CONNECTION TEST
// Run this to verify your Supabase connection works
// =====================================================

const { createClient } = require('@supabase/supabase-js');

// Your Supabase configuration
const SUPABASE_URL = 'https://vtfxizyghgvxnllnapyi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0ZnhpenlnaGd2eG5sbG5hcHlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMDgxNDEsImV4cCI6MjA3MTg4NDE0MX0.wFXRm16eLQYYDO_d4SvOdpH3VSE9nCPIQxnNQ9Bd4Gc';

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testConnection() {
  console.log('🔌 Testing Supabase Connection...');
  console.log('==================================');
  console.log(`URL: ${SUPABASE_URL}`);
  console.log(`Key: ${SUPABASE_ANON_KEY.substring(0, 20)}...`);
  console.log('');

  try {
    // Test 1: Basic connection
    console.log('1. Testing basic connection...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .limit(10);

    if (tablesError) {
      console.error('❌ Connection failed:', tablesError.message);
      return false;
    }

    console.log(`✅ Connected! Found ${tables.length} tables`);
    console.log('   Tables:', tables.map(t => t.table_name).join(', '));

    // Test 2: Check for existing VTS tables
    console.log('\n2. Checking for existing VTS tables...');
    const vtsTableNames = ['companies', 'staff', 'buses', 'routes', 'trips', 'bookings'];
    const existingVtsTables = tables.filter(t => vtsTableNames.includes(t.table_name));
    
    if (existingVtsTables.length > 0) {
      console.log(`✅ Found ${existingVtsTables.length} existing VTS tables:`, 
                  existingVtsTables.map(t => t.table_name).join(', '));
    } else {
      console.log('⚠️  No existing VTS tables found - fresh setup needed');
    }

    // Test 3: Check for admin tables
    console.log('\n3. Checking for admin tables...');
    const adminTableNames = ['admin_users', 'admin_sessions', 'admin_activity_log'];
    const existingAdminTables = tables.filter(t => adminTableNames.includes(t.table_name));
    
    if (existingAdminTables.length > 0) {
      console.log(`✅ Found ${existingAdminTables.length} admin tables:`, 
                  existingAdminTables.map(t => t.table_name).join(', '));
    } else {
      console.log('⚠️  No admin tables found - admin setup needed');
    }

    // Test 4: Try to query companies if it exists
    if (existingVtsTables.some(t => t.table_name === 'companies')) {
      console.log('\n4. Testing companies table access...');
      const { data: companies, error: companiesError } = await supabase
        .from('companies')
        .select('id, name')
        .limit(5);

      if (companiesError) {
        console.log('⚠️  Companies table access restricted:', companiesError.message);
      } else {
        console.log(`✅ Companies table accessible - found ${companies.length} companies`);
        if (companies.length > 0) {
          companies.forEach(company => {
            console.log(`   - ${company.name} (${company.id})`);
          });
        }
      }
    }

    console.log('\n🎉 Connection test completed successfully!');
    console.log('\n📋 Next Steps:');
    console.log('1. Execute the admin SQL files in your Supabase Dashboard');
    console.log('2. Run the setup script to create admin users');
    console.log('3. Test admin login functionality');

    return true;

  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    return false;
  }
}

// Run the test
testConnection().catch(console.error);
