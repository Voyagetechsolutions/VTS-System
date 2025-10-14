// =====================================================
// ADMIN CONNECTION TEST
// Test your Supabase connection and admin setup
// =====================================================

import { supabase } from '../supabase/client';

// Test Supabase connection and admin setup
export async function testAdminConnection() {
  console.log('🔌 Testing Admin System Connection...');
  console.log('====================================');

  try {
    // Test 1: Basic connection
    console.log('1. Testing basic Supabase connection...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .limit(20);

    if (tablesError) {
      console.error('❌ Connection failed:', tablesError.message);
      return false;
    }

    console.log(`✅ Connected! Found ${tables.length} tables`);
    
    // Test 2: Check for VTS tables
    console.log('\n2. Checking for VTS tables...');
    const vtsTableNames = ['companies', 'staff', 'buses', 'routes', 'trips', 'bookings'];
    const existingVtsTables = tables.filter(t => vtsTableNames.includes(t.table_name));
    
    if (existingVtsTables.length > 0) {
      console.log(`✅ Found ${existingVtsTables.length} VTS tables:`, 
                  existingVtsTables.map(t => t.table_name).join(', '));
    } else {
      console.log('⚠️  No VTS tables found - database setup needed');
    }

    // Test 3: Check for admin tables
    console.log('\n3. Checking for admin tables...');
    const adminTableNames = ['admin_users', 'admin_sessions', 'admin_activity_log'];
    const existingAdminTables = tables.filter(t => adminTableNames.includes(t.table_name));
    
    if (existingAdminTables.length > 0) {
      console.log(`✅ Found ${existingAdminTables.length} admin tables:`, 
                  existingAdminTables.map(t => t.table_name).join(', '));
    } else {
      console.log('⚠️  No admin tables found - run admin setup SQL files');
    }

    // Test 4: Test admin functions if available
    if (existingAdminTables.length > 0) {
      console.log('\n4. Testing admin functions...');
      
      try {
        // Test if admin functions exist
        const { data: functions, error: funcError } = await supabase
          .from('information_schema.routines')
          .select('routine_name')
          .eq('routine_schema', 'public')
          .like('routine_name', '%admin%')
          .limit(10);

        if (funcError) {
          console.log('⚠️  Could not check admin functions:', funcError.message);
        } else {
          console.log(`✅ Found ${functions.length} admin functions:`, 
                      functions.map(f => f.routine_name).join(', '));
        }
      } catch (error) {
        console.log('⚠️  Admin functions check failed:', error.message);
      }
    }

    // Test 5: Try basic data access
    console.log('\n5. Testing data access...');
    
    if (existingVtsTables.includes('companies')) {
      try {
        const { data: companies, error: companiesError } = await supabase
          .from('companies')
          .select('id, name')
          .limit(5);

        if (companiesError) {
          console.log('⚠️  Companies access restricted (normal for RLS):', companiesError.message);
        } else {
          console.log(`✅ Companies accessible - found ${companies.length} companies`);
        }
      } catch (error) {
        console.log('⚠️  Companies test failed:', error.message);
      }
    }

    // Summary
    console.log('\n📋 Setup Status Summary:');
    console.log('========================');
    console.log(`✅ Supabase Connection: Working`);
    console.log(`${existingVtsTables.length > 0 ? '✅' : '⚠️ '} VTS Tables: ${existingVtsTables.length}/6 found`);
    console.log(`${existingAdminTables.length > 0 ? '✅' : '⚠️ '} Admin Tables: ${existingAdminTables.length}/3 found`);
    
    if (existingAdminTables.length === 0) {
      console.log('\n📝 Next Steps:');
      console.log('1. Execute admin SQL files in Supabase Dashboard');
      console.log('2. Run: 01_admin_tables.sql');
      console.log('3. Run: 02_admin_functions.sql');
      console.log('4. Run: 04_admin_rls_policies.sql');
      console.log('5. Run: 06_setup_admin_system.sql');
    } else {
      console.log('\n🎉 Admin system appears to be set up!');
      console.log('You can now test admin login functionality.');
    }

    return true;

  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    return false;
  }
}

// Test admin login (only if admin tables exist)
export async function testAdminLogin() {
  console.log('\n👤 Testing Admin Login...');
  console.log('=========================');

  try {
    // Try to call admin login function
    const { data, error } = await supabase.rpc('authenticate_admin_user', {
      p_email: 'admin@vtssystem.com',
      p_password: 'VTS@Admin2024!'
    });

    if (error) {
      console.log('⚠️  Admin login function not available:', error.message);
      console.log('   Make sure you\'ve run the admin setup SQL files');
      return false;
    }

    if (data && data.length > 0) {
      const adminData = data[0];
      console.log('✅ Admin login successful!');
      console.log('   Admin ID:', adminData.admin_id);
      console.log('   Name:', adminData.full_name);
      console.log('   Role:', adminData.role);
      console.log('   Company ID:', adminData.company_id || 'Super Admin');
      return true;
    } else {
      console.log('⚠️  Login failed - invalid credentials or user not found');
      return false;
    }

  } catch (error) {
    console.error('❌ Admin login test failed:', error.message);
    return false;
  }
}

// Run all tests
export async function runAllTests() {
  console.log('🚀 VTS Admin System Test Suite');
  console.log('===============================\n');

  const connectionOk = await testAdminConnection();
  
  if (connectionOk) {
    await testAdminLogin();
  }

  console.log('\n🏁 Test suite completed!');
}

// Auto-run if called directly
if (typeof window !== 'undefined') {
  // Browser environment - expose to window for manual testing
  window.testAdminConnection = testAdminConnection;
  window.testAdminLogin = testAdminLogin;
  window.runAllTests = runAllTests;
  
  console.log('🧪 Admin tests loaded! Run in console:');
  console.log('   runAllTests() - Run all tests');
  console.log('   testAdminConnection() - Test connection only');
  console.log('   testAdminLogin() - Test admin login only');
}
