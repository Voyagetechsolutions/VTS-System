// =====================================================
// SUPABASE ADMIN SYSTEM SETUP SCRIPT
// Execute this to set up the complete admin database
// =====================================================

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Supabase configuration
const SUPABASE_URL = 'https://vtfxizyghgvxnllnapyi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0ZnhpenlnaGd2eG5sbG5hcHlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMDgxNDEsImV4cCI6MjA3MTg4NDE0MX0.wFXRm16eLQYYDO_d4SvOdpH3VSE9nCPIQxnNQ9Bd4Gc';

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Function to execute SQL from file
async function executeSQLFile(filename) {
  try {
    console.log(`\n📄 Executing ${filename}...`);
    
    const filePath = path.join(process.cwd(), filename);
    const sqlContent = fs.readFileSync(filePath, 'utf8');
    
    // Split SQL content by statements (basic splitting)
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`   Found ${statements.length} SQL statements`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.length > 10) { // Skip very short statements
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          if (error) {
            console.warn(`   ⚠️  Statement ${i + 1} warning:`, error.message);
          }
        } catch (err) {
          console.warn(`   ⚠️  Statement ${i + 1} error:`, err.message);
        }
      }
    }
    
    console.log(`   ✅ ${filename} completed`);
    return true;
  } catch (error) {
    console.error(`   ❌ Error executing ${filename}:`, error.message);
    return false;
  }
}

// Function to test database connection
async function testConnection() {
  try {
    console.log('🔌 Testing Supabase connection...');
    
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .limit(1);
    
    if (error) {
      console.error('❌ Connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Supabase connection successful!');
    return true;
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    return false;
  }
}

// Function to check if admin tables exist
async function checkAdminTables() {
  try {
    console.log('🔍 Checking for existing admin tables...');
    
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['admin_users', 'admin_sessions', 'companies']);
    
    if (error) {
      console.warn('⚠️  Could not check existing tables:', error.message);
      return [];
    }
    
    const existingTables = data.map(row => row.table_name);
    console.log(`   Found existing tables: ${existingTables.join(', ') || 'none'}`);
    
    return existingTables;
  } catch (error) {
    console.warn('⚠️  Error checking tables:', error.message);
    return [];
  }
}

// Function to create admin user via API
async function createAdminUser() {
  try {
    console.log('👤 Creating default admin users...');
    
    // Try to create super admin
    const { data: superAdmin, error: superError } = await supabase.rpc('create_admin_user', {
      p_email: 'admin@vtssystem.com',
      p_password: 'VTS@Admin2024!',
      p_full_name: 'System Administrator',
      p_role: 'super_admin',
      p_company_id: null,
      p_permissions: { all_permissions: true, manage_companies: true, manage_admins: true }
    });
    
    if (superError) {
      console.warn('⚠️  Super admin creation warning:', superError.message);
    } else {
      console.log('✅ Super admin created successfully');
    }
    
    return true;
  } catch (error) {
    console.warn('⚠️  Admin user creation error:', error.message);
    return false;
  }
}

// Main setup function
async function setupAdminSystem() {
  console.log('🚀 VTS Admin System Setup Starting...');
  console.log('=====================================');
  
  // Test connection
  const connected = await testConnection();
  if (!connected) {
    console.error('❌ Setup failed: Could not connect to Supabase');
    return;
  }
  
  // Check existing tables
  const existingTables = await checkAdminTables();
  
  // Setup process
  console.log('\n📋 Setting up admin database system...');
  
  try {
    // Note: Since we can't execute raw SQL directly through the client,
    // we'll provide instructions for manual setup
    
    console.log('\n📝 MANUAL SETUP REQUIRED:');
    console.log('=====================================');
    console.log('Due to security restrictions, you need to execute the SQL files manually.');
    console.log('Please follow these steps:');
    console.log('');
    console.log('1. Open your Supabase Dashboard SQL Editor');
    console.log('2. Execute the following files in order:');
    console.log('   - 01_admin_tables.sql');
    console.log('   - 02_admin_functions.sql');
    console.log('   - 04_admin_rls_policies.sql');
    console.log('   - 06_setup_admin_system.sql');
    console.log('');
    console.log('3. After setup, use these credentials:');
    console.log('   Super Admin: admin@vtssystem.com / VTS@Admin2024!');
    console.log('   Company Admin: admin@metrobuslines.com / Metro@2024!');
    console.log('');
    console.log('4. Copy adminApi.js to your frontend:');
    console.log('   cp adminApi.js ../../../Frontend/src/supabase/adminApi.js');
    
    // Test basic functionality
    console.log('\n🧪 Testing basic functionality...');
    
    // Try to query companies table
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name')
      .limit(5);
    
    if (companiesError) {
      console.log('⚠️  Companies table not found - setup needed');
    } else {
      console.log(`✅ Found ${companies.length} companies in database`);
    }
    
  } catch (error) {
    console.error('❌ Setup error:', error.message);
  }
  
  console.log('\n🎉 Setup process completed!');
  console.log('Please follow the manual setup instructions above.');
}

// Run setup
setupAdminSystem().catch(console.error);
