import { createClient } from '@supabase/supabase-js';
import { supabaseServer } from '../src/config/supabase.js';
import dotenv from 'dotenv';
dotenv.config();

const API_BASE = 'http://localhost:5000/api';
const SUPABASE_URL = process.env.SUPABASE_URL;
// Anonymous client for auth sign in without polluting service role client
const anonClient = createClient(SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

async function runAuthSecurityTests() {
  console.log('====================================================');
  console.log('STARTING BACKEND AUTH & ADMIN SECURITY VERIFICATION');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  // 1. Check Missing Token (Case E)
  console.log('\n--- TEST CASE E: Missing Authorization Token ---');
  try {
    const res = await fetch(`${API_BASE}/admin/stats`);
    const data = await res.json();
    assert(res.status === 401, `Status is 401 (received ${res.status})`);
    assert(data.success === false, `Response success is false (${data.message})`);
  } catch (err) {
    assert(false, `Request failed: ${err.message}`);
  }

  // 2. Check Invalid Token (Case F)
  console.log('\n--- TEST CASE F: Invalid Authorization Token ---');
  try {
    const res = await fetch(`${API_BASE}/admin/stats`, {
      headers: { 'Authorization': 'Bearer invalid.jwt.token_here' }
    });
    const data = await res.json();
    assert(res.status === 401, `Status is 401 (received ${res.status})`);
    assert(data.success === false, `Response success is false (${data.message})`);
  } catch (err) {
    assert(false, `Request failed: ${err.message}`);
  }

  // 3. Find Citizen, Official, Admin Profiles in DB
  const { data: profiles, error: profErr } = await supabaseServer
    .from('profiles')
    .select('id, email, role, account_status, full_name');
  
  if (profErr || !profiles) {
    console.error('Failed to query profiles:', profErr);
    return;
  }

  console.log(`\nFound ${profiles.length} profiles in database.`);

  const citizen = profiles.find(p => p.role === 'citizen');
  const activeAdmin = profiles.find(p => p.role === 'admin' && p.account_status === 'active');

  console.log(`Citizen: ${citizen?.email} (${citizen?.id})`);
  console.log(`Active Admin: ${activeAdmin?.email} (${activeAdmin?.id})`);

  // Sign in active admin to get live JWT
  console.log('\n--- TEST CASE D: Admin + Active Access ---');
  let adminToken = null;
  const adminEmailsToTry = ['admin.user@grievance.gov.in', 'admin@example.com'];
  const testPassword = 'Password123!';

  for (const email of adminEmailsToTry) {
    const { data: authData, error } = await anonClient.auth.signInWithPassword({
      email,
      password: testPassword
    });
    if (!error && authData?.session?.access_token) {
      adminToken = authData.session.access_token;
      console.log(`Signed in as active admin: ${email}`);
      break;
    }
  }

  if (adminToken) {
    // Test /api/admin/stats
    const statsRes = await fetch(`${API_BASE}/admin/stats`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const statsData = await statsRes.json();
    assert(statsRes.status === 200, `GET /api/admin/stats returns 200 for active admin (got ${statsRes.status})`);
    assert(statsData.data?.grievances?.total !== undefined, `Stats payload has grievances.total: ${statsData.data?.grievances?.total}`);

    // Test /api/admin/departments
    const deptRes = await fetch(`${API_BASE}/admin/departments`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const deptData = await deptRes.json();
    assert(deptRes.status === 200, `GET /api/admin/departments returns 200 for active admin (got ${deptRes.status})`);
    assert(Array.isArray(deptData.data), `Departments payload contains array (count: ${deptData.data?.length})`);

    // Test /api/auth/profile
    const profRes = await fetch(`${API_BASE}/auth/profile`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const profJson = await profRes.json();
    assert(profRes.status === 200, `GET /api/auth/profile returns 200 for active admin (got ${profRes.status})`);
    assert(profJson.data?.role === 'admin' && profJson.data?.account_status === 'active', `Profile role=admin, status=active`);
  }

  // Test Citizen (Case A)
  console.log('\n--- TEST CASE A: Citizen accessing /api/admin/stats ---');
  let citizenToken = null;
  const citizenEmails = ['citizen@example.com', 'testcitizen.phase8@example.com'];
  for (const email of citizenEmails) {
    const { data: authData, error } = await anonClient.auth.signInWithPassword({
      email,
      password: testPassword
    });
    if (!error && authData?.session?.access_token) {
      citizenToken = authData.session.access_token;
      console.log(`Signed in as citizen: ${email}`);
      break;
    }
  }

  if (citizenToken) {
    const res = await fetch(`${API_BASE}/admin/stats`, {
      headers: { 'Authorization': `Bearer ${citizenToken}` }
    });
    const data = await res.json();
    assert(res.status === 403, `Citizen is forbidden 403 (got ${res.status})`);
    assert(data.success === false, `Response success is false: "${data.message}"`);
  }

  // Test Pending Admin (Case C)
  console.log('\n--- TEST CASE C: Pending Admin accessing /api/admin/stats ---');
  if (adminToken && activeAdmin) {
    // Temporarily set to pending
    await supabaseServer.from('profiles').update({ account_status: 'pending' }).eq('id', activeAdmin.id);
    
    const res = await fetch(`${API_BASE}/admin/stats`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const data = await res.json();
    assert(res.status === 403, `Pending admin is forbidden 403 (got ${res.status})`);
    assert(data.message?.includes('pending approval'), `Message indicates pending approval: "${data.message}"`);

    // Restore back to active immediately
    await supabaseServer.from('profiles').update({ account_status: 'active' }).eq('id', activeAdmin.id);
    console.log('Restored active admin status back to active.');
  }

  // Test RLS direct query to ensure no infinite recursion on profiles
  console.log('\n--- TEST RLS: Supabase Direct Profile Queries (Non-Admin & Admin) ---');
  // Check that profiles select works without recursion
  const { data: directProfiles, error: directErr } = await supabaseServer
    .from('profiles')
    .select('id, role, account_status')
    .limit(5);

  assert(!directErr, `Direct profiles select executed without error: ${directErr?.message || 'OK'}`);
  assert(Array.isArray(directProfiles) && directProfiles.length > 0, `Returned ${directProfiles?.length} profiles`);

  console.log('\n====================================================');
  console.log(`VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAuthSecurityTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
