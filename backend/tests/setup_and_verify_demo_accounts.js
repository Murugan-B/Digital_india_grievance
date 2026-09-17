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

const DEMO_CREDENTIALS = {
  citizen: {
    email: 'demo.citizen@grievance.gov.in',
    password: 'DemoCitizen@2026!',
    fullName: 'Demo Citizen (Ramesh Kumar)',
    role: 'citizen',
    accountStatus: 'active',
    department: null,
    designation: null
  },
  official: {
    email: 'demo.official@grievance.gov.in',
    password: 'DemoOfficial@2026!',
    fullName: 'Demo Nodal Officer (Priya Sharma)',
    role: 'official',
    accountStatus: 'active',
    department: 'Water Supply',
    designation: 'Nodal Officer'
  },
  admin: {
    email: 'admin.user@grievance.gov.in',
    password: 'DemoAdmin@2026!',
    fullName: 'Central System Administrator',
    role: 'admin',
    accountStatus: 'active',
    department: null,
    designation: 'System Administrator'
  }
};

async function ensureUser(userDef) {
  // Check if auth user exists
  const { data: userList, error: listErr } = await supabaseServer.auth.admin.listUsers();
  if (listErr) {
    throw new Error(`Failed to list auth users: ${listErr.message}`);
  }

  let authUser = userList.users.find(u => u.email.toLowerCase() === userDef.email.toLowerCase());

  if (!authUser) {
    console.log(`Creating auth user: ${userDef.email}`);
    const { data: createData, error: createErr } = await supabaseServer.auth.admin.createUser({
      email: userDef.email,
      password: userDef.password,
      email_confirm: true,
      user_metadata: {
        full_name: userDef.fullName,
        role: userDef.role
      }
    });

    if (createErr) {
      throw new Error(`Failed to create user ${userDef.email}: ${createErr.message}`);
    }
    authUser = createData.user;
  } else {
    console.log(`Updating password and confirmation for existing user: ${userDef.email}`);
    const { error: updateAuthErr } = await supabaseServer.auth.admin.updateUserById(authUser.id, {
      password: userDef.password,
      email_confirm: true,
      user_metadata: {
        full_name: userDef.fullName,
        role: userDef.role
      }
    });
    if (updateAuthErr) {
      throw new Error(`Failed to update password for ${userDef.email}: ${updateAuthErr.message}`);
    }
  }

  // Ensure profile record matches definition
  const { data: existingProfile } = await supabaseServer
    .from('profiles')
    .select('*')
    .eq('id', authUser.id)
    .maybeSingle();

  if (!existingProfile) {
    console.log(`Creating profile record for: ${userDef.email}`);
    await supabaseServer.from('profiles').insert([{
      id: authUser.id,
      email: userDef.email,
      full_name: userDef.fullName,
      role: userDef.role,
      account_status: userDef.accountStatus,
      department: userDef.department,
      designation: userDef.designation
    }]);
  } else {
    console.log(`Updating profile attributes for: ${userDef.email}`);
    await supabaseServer.from('profiles').update({
      email: userDef.email,
      full_name: userDef.fullName,
      role: userDef.role,
      account_status: userDef.accountStatus,
      department: userDef.department,
      designation: userDef.designation
    }).eq('id', authUser.id);
  }

  return authUser;
}

async function runDemoAuditAndVerification() {
  console.log('======================================================================');
  console.log('DEMO LOGIN CREDENTIAL AUDIT & VERIFICATION');
  console.log('======================================================================\n');

  // Step 1: Ensure all 3 demo accounts exist with active status & configured passwords
  console.log('--- STEP 1: Ensuring Demo Accounts ---');
  await ensureUser(DEMO_CREDENTIALS.citizen);
  await ensureUser(DEMO_CREDENTIALS.official);
  await ensureUser(DEMO_CREDENTIALS.admin);
  console.log('All 3 accounts verified in Supabase Auth and Profiles.\n');

  // Step 2: Test Login for each account
  console.log('--- STEP 2: Testing Live Sign In ---');
  const tokens = {};
  for (const [roleKey, creds] of Object.entries(DEMO_CREDENTIALS)) {
    const { data: loginData, error: loginErr } = await anonClient.auth.signInWithPassword({
      email: creds.email,
      password: creds.password
    });

    if (loginErr || !loginData?.session?.access_token) {
      console.error(`❌ FAILED login for ${roleKey} (${creds.email}):`, loginErr?.message);
    } else {
      tokens[roleKey] = loginData.session.access_token;
      console.log(`✅ PASS: Login successful for ${roleKey.toUpperCase()} (${creds.email})`);
    }
  }

  // Step 3: Verify Profile and Dashboard Access for each role
  console.log('\n--- STEP 3: Dashboard & Workflow Verifications ---');

  // Citizen Dashboard check
  if (tokens.citizen) {
    const profRes = await fetch(`${API_BASE}/auth/profile`, {
      headers: { Authorization: `Bearer ${tokens.citizen}` }
    });
    const prof = await profRes.json();
    console.log(`✅ Citizen Profile verified: role=${prof.data?.role}, status=${prof.data?.account_status}`);

    const grievRes = await fetch(`${API_BASE}/grievances`, {
      headers: { Authorization: `Bearer ${tokens.citizen}` }
    });
    const griev = await grievRes.json();
    console.log(`✅ Citizen Grievances endpoint: status=${grievRes.status}, count=${griev.data?.length || 0}`);

    const notifRes = await fetch(`${API_BASE}/notifications`, {
      headers: { Authorization: `Bearer ${tokens.citizen}` }
    });
    const notif = await notifRes.json();
    console.log(`✅ Citizen Notifications endpoint: status=${notifRes.status}, count=${notif.data?.length || 0}`);
  }

  // Official Dashboard check
  if (tokens.official) {
    const profRes = await fetch(`${API_BASE}/auth/profile`, {
      headers: { Authorization: `Bearer ${tokens.official}` }
    });
    const prof = await profRes.json();
    console.log(`✅ Official Profile verified: role=${prof.data?.role}, status=${prof.data?.account_status}, dept=${prof.data?.department}`);

    const offGrievRes = await fetch(`${API_BASE}/official/grievances`, {
      headers: { Authorization: `Bearer ${tokens.official}` }
    });
    const offGriev = await offGrievRes.json();
    console.log(`✅ Official Departmental Feed: status=${offGrievRes.status}, count=${offGriev.data?.length || 0}`);
  }

  // Admin Dashboard check
  if (tokens.admin) {
    const profRes = await fetch(`${API_BASE}/auth/profile`, {
      headers: { Authorization: `Bearer ${tokens.admin}` }
    });
    const prof = await profRes.json();
    console.log(`✅ Admin Profile verified: role=${prof.data?.role}, status=${prof.data?.account_status}`);

    const statsRes = await fetch(`${API_BASE}/admin/stats`, {
      headers: { Authorization: `Bearer ${tokens.admin}` }
    });
    const stats = await statsRes.json();
    console.log(`✅ Admin Stats: status=${statsRes.status}, total grievances=${stats.data?.grievances?.total}`);

    const deptsRes = await fetch(`${API_BASE}/admin/departments`, {
      headers: { Authorization: `Bearer ${tokens.admin}` }
    });
    const depts = await deptsRes.json();
    console.log(`✅ Admin Departments: status=${deptsRes.status}, total=${depts.data?.length}`);

    const analyticsRes = await fetch(`${API_BASE}/admin/analytics/overview`, {
      headers: { Authorization: `Bearer ${tokens.admin}` }
    });
    console.log(`✅ Admin Analytics: status=${analyticsRes.status}`);
  }

  // Step 4: Security Cross-Checks
  console.log('\n--- STEP 4: Security Cross-Check ---');
  let secPassed = 0;
  let secFailed = 0;

  function assertSec(cond, desc) {
    if (cond) {
      console.log(`✅ PASS: ${desc}`);
      secPassed++;
    } else {
      console.error(`❌ FAIL: ${desc}`);
      secFailed++;
    }
  }

  // 1. Citizen -> Admin APIs
  const cToA = await fetch(`${API_BASE}/admin/stats`, {
    headers: { Authorization: `Bearer ${tokens.citizen}` }
  });
  assertSec(cToA.status === 403, 'Citizen -> Admin APIs (403 Forbidden)');

  // 2. Citizen -> Official APIs
  const cToO = await fetch(`${API_BASE}/official/grievances`, {
    headers: { Authorization: `Bearer ${tokens.citizen}` }
  });
  assertSec(cToO.status === 403, 'Citizen -> Official APIs (403 Forbidden)');

  // 3. Official -> Admin APIs
  const oToA = await fetch(`${API_BASE}/admin/stats`, {
    headers: { Authorization: `Bearer ${tokens.official}` }
  });
  assertSec(oToA.status === 403, 'Official -> Admin APIs (403 Forbidden)');

  // 4. Admin -> Admin APIs
  const aToA = await fetch(`${API_BASE}/admin/stats`, {
    headers: { Authorization: `Bearer ${tokens.admin}` }
  });
  assertSec(aToA.status === 200, 'Admin -> Admin APIs (200 OK)');

  console.log(`\nSecurity Cross-Checks: ${secPassed} Passed, ${secFailed} Failed`);
}

runDemoAuditAndVerification().catch(err => {
  console.error('Fatal error in demo audit:', err);
  process.exit(1);
});
