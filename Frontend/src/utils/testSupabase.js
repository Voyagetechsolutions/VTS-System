import { supabase } from '../supabase/client';

export async function testSupabaseConnection() {
  console.log('Testing Supabase connection...');
  
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(5);
    
    if (error) {
      console.error('Supabase connection error:', error);
      return { success: false, error: error.message };
    }
    
    console.log('Users in database:', data);
    return { success: true, users: data };
  } catch (err) {
    console.error('Unexpected error:', err);
    return { success: false, error: err.message };
  }
}

export async function testUserLogin(email, password) {
  console.log('Testing user login...');
  
  try {
    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .select('user_id, name, email, role, is_active, company_id, password_hash')
      .eq('email', email)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();
    
    if (userError) {
      console.error('User lookup error:', userError);
      return { success: false, error: userError.message };
    }
    
    if (!userRecord) {
      console.log('No user found with email:', email);
      return { success: false, error: 'No active user found with this email.' };
    }
    
    console.log('User found:', userRecord);
    
    // Check password
    if (userRecord.password_hash !== password) {
      console.log('Password mismatch');
      return { success: false, error: 'Invalid password.' };
    }
    
    return { success: true, user: userRecord };
  } catch (err) {
    console.error('Login test error:', err);
    return { success: false, error: err.message };
  }
}

export async function testCreateDeveloper(name, email, password) {
  console.log('Testing developer creation...');
  
  try {
    // Prefer server-side Edge Function to create confirmed auth user
    try {
      const resp = await fetch(`${process.env.REACT_APP_SUPABASE_URL}/functions/v1/admin_create_user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ email, password, name, role: 'developer' }),
      });
      if (resp.ok) {
        const json = await resp.json();
        if (json?.user_id) {
          // Profile upsert is handled by the function; return success
          return { success: true, data: { user_id: json.user_id } };
        }
      } else {
        // Fall through to client sign-up
        const errJson = await resp.json().catch(() => ({}));
        console.warn('admin_create_user failed, fallback to client sign-up:', errJson);
      }
    } catch (e) {
      console.warn('admin_create_user unreachable, fallback to client sign-up:', e);
    }

    // 1) Create Supabase Auth user (client-side signUp) with email confirmation redirect
    const normEmail = (email || '').trim().toLowerCase();
    let authUser = null;
    const { data: signUp, error: signUpErr } = await supabase.auth.signUp({
      email: normEmail,
      password: password || '',
      options: {
        emailRedirectTo: (typeof window !== 'undefined' && window.location?.origin) ? window.location.origin : undefined,
        data: { role: 'developer' },
      },
    });
    if (signUpErr) {
      // If already registered, attempt sign-in with provided password
      const alreadyRegistered = (signUpErr.message || '').toLowerCase().includes('already registered');
      if (alreadyRegistered) {
        const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
          email: normEmail,
          password: password || '',
        });
        if (signInErr) {
          console.error('Auth signIn error after already-registered:', signInErr);
          return { success: false, error: signUpErr.message };
        }
        authUser = signInData?.user || null;
      } else {
        console.error('Auth signUp error:', signUpErr);
        return { success: false, error: signUpErr.message };
      }
    } else {
      authUser = signUp?.user || null;
    }
    if (!authUser?.id) {
      return { success: false, error: 'Sign up did not return a user id (verify email confirmations setting and redirect URL).' };
    }

    // 2) Link/create profile in public.users without violating unique email
    const { data: existing, error: selErr } = await supabase
      .from('users')
      .select('user_id, email, role')
      .eq('email', normEmail)
      .limit(1)
      .maybeSingle();
    if (selErr) {
      console.error('Profile select error:', selErr);
      return { success: false, error: selErr.message };
    }
    if (existing) {
      // Update existing row: promote to developer, keep existing user_id to avoid PK change
      const { error: updErr } = await supabase
        .from('users')
        .update({ role: 'developer', is_active: true, name })
        .eq('email', normEmail);
      if (updErr) {
        console.error('Profile update error:', updErr);
        return { success: false, error: updErr.message };
      }
    } else {
      // Create new profile, align user_id to auth uid
      const { error: insErr } = await supabase
        .from('users')
        .insert([{ user_id: authUser.id, name, email: normEmail, role: 'developer', is_active: true }]);
      if (insErr) {
        console.error('Profile insert error:', insErr);
        return { success: false, error: insErr.message };
      }
    }

    console.log('Developer auth + profile linked:', authUser.id);
    return { success: true, data: { user_id: authUser.id } };
  } catch (err) {
    console.error('Developer creation unexpected error:', err);
    return { success: false, error: err.message };
  }
}
