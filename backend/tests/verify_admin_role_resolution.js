import { createClient } from '@supabase/supabase-js';
import { supabaseServer } from '../src/config/supabase.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_ANON_KEY;
const API_URL = 'http://localhost:5000/api';

const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

async function login(email, password) {
  const { data, error } = await supabaseAuth.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw new Error(`Login failed for ${email}: ${error.message}`);
  return data.session.access_token;
}

async function request(endpoint, { method = 'GET', token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  const res = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data: json };
}

async function runAudit() {
  console.log('====================================================');
  console.log('ADMIN ROLE RESOLUTION & RBAC SECURITY AUDIT');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function test(name, ok, details = '') {
    if (ok) {
      console.log(`[PASS] ${name}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name} -> ${details}`);
      failed++;
    }
  }

  try {
    // 1. Database profile inspection for admin.user@grievance.gov.in
    console.log('--- 1. Database Profile Verification ---');
    const { data: adminProfiles, error: pErr } = await supabaseServer
      .from('profiles')
      .select('id, email, role, account_status, full_name, designation')
      .eq('email', 'admin.user@grievance.gov.in');

    const adminProfile = adminProfiles?.[0];
    test('Admin Profile exists in DB', !!adminProfile);
    test('Admin Profile role is strictly "admin"', adminProfile?.role === 'admin', `Got: ${adminProfile?.role}`);
    test('Admin Profile account_status is "active"', adminProfile?.account_status === 'active', `Got: ${adminProfile?.account_status}`);
    test('Admin Profile email matches admin.user@grievance.gov.in', adminProfile?.email === 'admin.user@grievance.gov.in');

    // 2. Authenticate Demo Accounts
    console.log('\n--- 2. Authentication & /api/auth/profile Verification ---');
    const adminToken = await login('admin.user@grievance.gov.in', 'DemoAdmin@2026!');
    const citizenToken = await login('demo.citizen@grievance.gov.in', 'DemoCitizen@2026!');
    const officialToken = await login('demo.water-supply@grievance.gov.in', 'DemoWaterSupply@2026!');

    // Admin Profile API
    const resAdminProfile = await request('/auth/profile', { token: adminToken });
    test('/api/auth/profile for Admin returns 200', resAdminProfile.status === 200);
    test('Admin profile endpoint returns role: "admin"', resAdminProfile.data?.data?.role === 'admin');
    test('Admin profile endpoint returns status: "active"', resAdminProfile.data?.data?.account_status === 'active');

    // Citizen Profile API
    const resCitizenProfile = await request('/auth/profile', { token: citizenToken });
    test('/api/auth/profile for Citizen returns 200', resCitizenProfile.status === 200);
    test('Citizen profile endpoint returns role: "citizen"', resCitizenProfile.data?.data?.role === 'citizen');

    // Official Profile API
    const resOfficialProfile = await request('/auth/profile', { token: officialToken });
    test('/api/auth/profile for Official returns 200', resOfficialProfile.status === 200);
    test('Official profile endpoint returns role: "official"', resOfficialProfile.data?.data?.role === 'official');
    test('Official profile endpoint returns department: "Water Supply"', resOfficialProfile.data?.data?.department === 'Water Supply');

    // 3. Admin Authorized Endpoint Access
    console.log('\n--- 3. Admin Protected Endpoint Access ---');
    const resAdminStats = await request('/admin/stats', { token: adminToken });
    test('Admin accesses /api/admin/stats (200)', resAdminStats.status === 200);

    const resAdminDepts = await request('/admin/departments', { token: adminToken });
    test('Admin accesses /api/admin/departments (200)', resAdminDepts.status === 200);

    const resAdminAnalytics = await request('/admin/analytics/overview', { token: adminToken });
    test('Admin accesses /api/admin/analytics/overview (200)', resAdminAnalytics.status === 200);

    // 4. Role Authorization Isolation (RBAC)
    console.log('\n--- 4. Role Authorization Isolation (RBAC / 403 Forbidden) ---');
    const resCitizenAdminStats = await request('/admin/stats', { token: citizenToken });
    test('Citizen accessing /api/admin/stats returns 403 Forbidden', resCitizenAdminStats.status === 403);

    const resOfficialAdminStats = await request('/admin/stats', { token: officialToken });
    test('Official accessing /api/admin/stats returns 403 Forbidden', resOfficialAdminStats.status === 403);

    const resAdminGrievancesPost = await request('/grievances', {
      method: 'POST',
      token: adminToken,
      body: { subject: 'Test Grievance', description: 'Test description text here' }
    });
    test('Admin cannot submit citizen grievance directly (403 Forbidden)', resAdminGrievancesPost.status === 403);

    console.log('\n====================================================');
    console.log(`AUDIT RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================');

    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error('[UNEXPECTED ERROR]:', err);
    process.exit(1);
  }
}

runAudit();
