import { createClient } from '@supabase/supabase-js';
import { supabaseServer } from '../src/config/supabase.js';
import dotenv from 'dotenv';
dotenv.config();

const API_BASE = 'http://localhost:5000/api';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

const anonClient = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/&/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function pascalCase(name) {
  return name
    .replace(/&/g, 'And')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('');
}

async function runCleanupAndAccountProvisioning() {
  console.log('======================================================================');
  console.log('PART 2: FRESH DEMO DATABASE DATA CLEANUP');
  console.log('======================================================================\n');

  console.log('1. Clearing old grievance-related transaction records in dependency order...');

  // 1. Delete notifications
  try {
    const { error: notifErr } = await supabaseServer
      .from('notifications')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    if (notifErr) console.warn('Notification cleanup note:', notifErr.message);
    else console.log('✅ Cleared notifications table.');
  } catch (e) {
    console.warn('Notifications delete note:', e.message);
  }

  // 2. Delete grievance_attachments
  try {
    const { error: attachErr } = await supabaseServer
      .from('grievance_attachments')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    if (attachErr) console.warn('Attachments cleanup note:', attachErr.message);
    else console.log('✅ Cleared grievance_attachments table.');
  } catch (e) {
    console.warn('Attachments delete note:', e.message);
  }

  // 3. Delete grievance_ai_routings
  try {
    const { error: aiErr } = await supabaseServer
      .from('grievance_ai_routings')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    if (aiErr) console.warn('AI routings cleanup note:', aiErr.message);
    else console.log('✅ Cleared grievance_ai_routings table.');
  } catch (e) {
    console.warn('AI routings delete note:', e.message);
  }

  // 4. Delete grievance_status_history
  try {
    const { error: histErr } = await supabaseServer
      .from('grievance_status_history')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    if (histErr) console.warn('Status history cleanup note:', histErr.message);
    else console.log('✅ Cleared grievance_status_history table.');
  } catch (e) {
    console.warn('Status history delete note:', e.message);
  }

  // 5. Delete grievances
  try {
    const { error: grievErr } = await supabaseServer
      .from('grievances')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    if (grievErr) console.warn('Grievances cleanup note:', grievErr.message);
    else console.log('✅ Cleared grievances table.');
  } catch (e) {
    console.warn('Grievances delete note:', e.message);
  }

  // 6. Empty storage bucket files
  try {
    const { data: files } = await supabaseServer.storage.from('grievance-attachments').list();
    if (files && files.length > 0) {
      const paths = files.map(f => f.name);
      await supabaseServer.storage.from('grievance-attachments').remove(paths);
      console.log(`✅ Cleared ${files.length} files from storage bucket.`);
    }
  } catch (e) {
    console.warn('Storage cleanup note:', e.message);
  }

  // Verify Counts
  console.log('\n2. Verifying post-cleanup record counts:');
  const { count: grievCount } = await supabaseServer.from('grievances').select('*', { count: 'exact', head: true });
  const { count: histCount } = await supabaseServer.from('grievance_status_history').select('*', { count: 'exact', head: true });
  const { count: aiCount } = await supabaseServer.from('grievance_ai_routings').select('*', { count: 'exact', head: true });
  const { count: notifCount } = await supabaseServer.from('notifications').select('*', { count: 'exact', head: true });

  console.log(`   - Grievances remaining: ${grievCount || 0}`);
  console.log(`   - Status History remaining: ${histCount || 0}`);
  console.log(`   - AI Routing records remaining: ${aiCount || 0}`);
  console.log(`   - Notifications remaining: ${notifCount || 0}`);

  console.log('\n======================================================================');
  console.log('PART 1: PROVISIONING DEPARTMENT-WISE DEMO ACCOUNTS');
  console.log('======================================================================\n');

  // Query all active departments
  const { data: depts, error: deptErr } = await supabaseServer
    .from('departments')
    .select('id, name, code, is_active')
    .eq('is_active', true)
    .order('name');

  if (deptErr || !depts) {
    console.error('Failed to load active departments:', deptErr);
    process.exit(1);
  }

  console.log(`Found ${depts.length} active departments in public.departments:`);
  depts.forEach((d, i) => console.log(`   ${i + 1}. ${d.name} (${d.code})`));

  // Build complete demo account list
  const demoAccounts = [
    {
      roleType: 'Citizen',
      email: 'demo.citizen@grievance.gov.in',
      password: 'DemoCitizen@2026!',
      fullName: 'Demo Citizen (Ramesh Kumar)',
      role: 'citizen',
      accountStatus: 'active',
      department: null,
      designation: null
    },
    {
      roleType: 'Admin',
      email: 'admin.user@grievance.gov.in',
      password: 'DemoAdmin@2026!',
      fullName: 'Central System Administrator',
      role: 'admin',
      accountStatus: 'active',
      department: null,
      designation: 'System Administrator'
    },
    {
      roleType: 'Official (Default)',
      email: 'demo.official@grievance.gov.in',
      password: 'DemoOfficial@2026!',
      fullName: 'Demo Nodal Officer (Water Supply)',
      role: 'official',
      accountStatus: 'active',
      department: 'Water Supply',
      designation: 'Nodal Officer'
    }
  ];

  // Add department-specific official demo accounts
  for (const dept of depts) {
    const slug = slugify(dept.name);
    const pName = pascalCase(dept.name);
    const email = `demo.${slug}@grievance.gov.in`;
    const password = `Demo${pName}@2026!`;

    // Avoid duplicate entry if water-supply is already mapped
    if (!demoAccounts.some(a => a.email.toLowerCase() === email.toLowerCase())) {
      demoAccounts.push({
        roleType: `Official (${dept.name})`,
        email,
        password,
        fullName: `Nodal Officer (${dept.name})`,
        role: 'official',
        accountStatus: 'active',
        department: dept.name,
        designation: 'Nodal Officer'
      });
    }
  }

  console.log(`\nProvisioning and verifying ${demoAccounts.length} demo accounts in Supabase Auth...`);

  // Fetch all current auth users
  const { data: userList } = await supabaseServer.auth.admin.listUsers();
  const existingUsers = userList?.users || [];

  const verifiedAccounts = [];

  for (const acc of demoAccounts) {
    let authUser = existingUsers.find(u => u.email.toLowerCase() === acc.email.toLowerCase());

    if (!authUser) {
      console.log(`[CREATE] Creating auth user: ${acc.email}`);
      const { data: newU, error: cErr } = await supabaseServer.auth.admin.createUser({
        email: acc.email,
        password: acc.password,
        email_confirm: true,
        user_metadata: {
          full_name: acc.fullName,
          role: acc.role
        }
      });
      if (cErr) {
        console.error(`Error creating ${acc.email}:`, cErr.message);
        continue;
      }
      authUser = newU.user;
    } else {
      console.log(`[UPDATE] Synchronizing password & confirmation for: ${acc.email}`);
      await supabaseServer.auth.admin.updateUserById(authUser.id, {
        password: acc.password,
        email_confirm: true,
        user_metadata: {
          full_name: acc.fullName,
          role: acc.role
        }
      });
    }

    // Upsert Profile
    await supabaseServer.from('profiles').upsert({
      id: authUser.id,
      email: acc.email,
      full_name: acc.fullName,
      role: acc.role,
      account_status: acc.accountStatus,
      department: acc.department,
      designation: acc.designation,
      updated_at: new Date().toISOString()
    });

    // Verify Sign In
    const { data: loginData, error: lErr } = await anonClient.auth.signInWithPassword({
      email: acc.email,
      password: acc.password
    });

    if (lErr || !loginData?.session?.access_token) {
      console.error(`❌ Verification FAILED for ${acc.email}:`, lErr?.message);
    } else {
      console.log(`✅ [VERIFIED] ${acc.roleType.padEnd(30)} -> ${acc.email} (${acc.password})`);
      verifiedAccounts.push({
        ...acc,
        token: loginData.session.access_token
      });
    }
  }

  console.log('\n======================================================================');
  console.log(`SUMMARY: ${verifiedAccounts.length} OF ${demoAccounts.length} DEMO ACCOUNTS READY & VERIFIED`);
  console.log('======================================================================\n');
}

runCleanupAndAccountProvisioning().catch(e => {
  console.error('Fatal execution error:', e);
  process.exit(1);
});
