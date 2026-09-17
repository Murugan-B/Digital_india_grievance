import { supabaseServer } from '../src/config/supabase.js';

async function checkNotificationsTable() {
  const { data, error } = await supabaseServer
    .from('notifications')
    .select('id')
    .limit(1);

  if (error) {
    console.log('Notifications table status: DOES NOT EXIST or Error:', error.message);
  } else {
    console.log('Notifications table status: EXISTS ALREADY in Supabase!');
  }
}

checkNotificationsTable();
