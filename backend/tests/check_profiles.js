import { supabaseServer } from '../src/config/supabase.js';

async function listUsers() {
  const { data: profiles, error } = await supabaseServer
    .from('profiles')
    .select('id, full_name, email, role, department, account_status');
  
  if (error) {
    console.error('Error fetching profiles:', error);
    return;
  }

  console.log('--- REGISTERED PROFILES IN SUPABASE ---');
  console.table(profiles);
}

listUsers();
