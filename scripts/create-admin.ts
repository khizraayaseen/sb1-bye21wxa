import { supabase } from '../src/lib/supabase';

async function createAdminUser() {
  // Replace these with your desired admin credentials
  const email = 'admin@winprod.ai';
  const password = 'Admin123!@#';

  try {
    // 1. Create the user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) throw authError;

    if (!authData.user) {
      throw new Error('No user data returned');
    }

    // 2. Create customer record with admin privileges
    const { error: customerError } = await supabase
      .from('customers')
      .insert({
        user_id: authData.user.id,
        email: email,
        subscription_status: 'active',
        subscription_tier: 'admin'
      });

    if (customerError) throw customerError;

    console.log('Admin user created successfully!');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('You can now log in at /admin/login');

  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

createAdminUser();