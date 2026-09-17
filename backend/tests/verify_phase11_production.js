import { createClient } from '@supabase/supabase-js';
import { supabaseServer } from '../src/config/supabase.js';
import dotenv from 'dotenv';
import { performance } from 'perf_hooks';

dotenv.config();

const API_BASE = 'http://localhost:5000/api';
const AI_BASE = 'http://127.0.0.1:8000';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;
const AI_SERVICE_SECRET = process.env.AI_SERVICE_SECRET || 'dev_ai_routing_secret_2026';

const anonClient = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function runPhase11ComprehensiveAudit() {
  console.log('======================================================================');
  console.log('PHASE 11 — FINAL PRODUCTION SECURITY, TESTING & PERFORMANCE AUDIT');
  console.log('======================================================================\n');

  let passed = 0;
  let failed = 0;
  const metrics = {};

  function assert(condition, testId, title, details) {
    if (condition) {
      console.log(`✅ [TEST ${testId}] PASS: ${title}`);
      if (details) console.log(`   ↳ ${details}`);
      passed++;
    } else {
      console.error(`❌ [TEST ${testId}] FAIL: ${title}`);
      if (details) console.error(`   ↳ ${details}`);
      failed++;
    }
  }

  // Fetch real test profiles
  const { data: profiles, error: profErr } = await supabaseServer
    .from('profiles')
    .select('id, email, full_name, role, account_status, department');

  if (profErr || !profiles) {
    console.error('Fatal: Failed to load profiles from database:', profErr);
    process.exit(1);
  }

  console.log(`Loaded ${profiles.length} database profiles for security testing.`);

  const citizen = profiles.find((p) => p.role === 'citizen') || profiles[0];
  const secondCitizen = profiles.find((p) => p.role === 'citizen' && p.id !== citizen.id) || profiles[1];
  const admin = profiles.find((p) => p.role === 'admin' && p.account_status === 'active');
  const testPassword = 'Password123!';

  // Sign in accounts
  let citizenToken = null;
  let adminToken = null;

  try {
    const { data: cAuth } = await anonClient.auth.signInWithPassword({
      email: citizen.email,
      password: testPassword,
    });
    citizenToken = cAuth?.session?.access_token;
  } catch (e) {}

  try {
    const { data: aAuth } = await anonClient.auth.signInWithPassword({
      email: admin?.email || 'admin.user@grievance.gov.in',
      password: testPassword,
    });
    adminToken = aAuth?.session?.access_token;
  } catch (e) {}

  console.log(`Citizen Token: ${citizenToken ? 'Obtained' : 'Failed'}`);
  console.log(`Admin Token: ${adminToken ? 'Obtained' : 'Failed'}`);

  // =========================================================================
  // SECTION 1: AUTHENTICATION SECURITY AUDIT (CASES 1 - 9)
  // =========================================================================
  console.log('\n--- PART 1: Authentication Security Audit (Cases 1 - 9) ---');

  // Case 1: No Token
  const resCase1 = await fetch(`${API_BASE}/auth/profile`);
  assert(resCase1.status === 401, 'AUTH-1', 'Missing Token rejected with 401 Unauthorized', `Status: ${resCase1.status}`);

  // Case 2: Malformed Token
  const resCase2 = await fetch(`${API_BASE}/auth/profile`, {
    headers: { Authorization: 'NotABearerTokenString' },
  });
  assert(resCase2.status === 401, 'AUTH-2', 'Malformed Authorization header rejected with 401', `Status: ${resCase2.status}`);

  // Case 3: Invalid Token
  const resCase3 = await fetch(`${API_BASE}/auth/profile`, {
    headers: { Authorization: 'Bearer invalid.token.payload' },
  });
  assert(resCase3.status === 401, 'AUTH-3', 'Invalid JWT rejected with 401', `Status: ${resCase3.status}`);

  // Case 4: Expired Token Simulation (Garbage payload)
  const resCase4 = await fetch(`${API_BASE}/admin/stats`, {
    headers: { Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.fake' },
  });
  assert(resCase4.status === 401, 'AUTH-4', 'Expired/Unverifiable JWT rejected with 401', `Status: ${resCase4.status}`);

  // Case 5: Valid Citizen Auth
  if (citizenToken) {
    const resCase5 = await fetch(`${API_BASE}/auth/profile`, {
      headers: { Authorization: `Bearer ${citizenToken}` },
    });
    const dataCase5 = await resCase5.json();
    assert(resCase5.status === 200 && dataCase5.data?.role === 'citizen', 'AUTH-5', 'Valid citizen authenticated correctly', `Role: ${dataCase5.data?.role}`);
  }

  // Case 6 & 7: Valid Admin Auth
  if (adminToken) {
    const resCase7 = await fetch(`${API_BASE}/auth/profile`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const dataCase7 = await resCase7.json();
    assert(resCase7.status === 200 && dataCase7.data?.role === 'admin' && dataCase7.data?.account_status === 'active', 'AUTH-7', 'Valid active admin authenticated correctly', `Role: ${dataCase7.data?.role}, Status: ${dataCase7.data?.account_status}`);
  }

  // Case 8: Pending Admin Auth & API Rejection
  if (admin && adminToken) {
    await supabaseServer.from('profiles').update({ account_status: 'pending' }).eq('id', admin.id);
    const resPending = await fetch(`${API_BASE}/admin/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const dataPending = await resPending.json();
    assert(resPending.status === 403 && dataPending.message?.includes('pending approval'), 'AUTH-8', 'Pending admin denied access with 403 Forbidden', `Message: "${dataPending.message}"`);
    // Restore active status
    await supabaseServer.from('profiles').update({ account_status: 'active' }).eq('id', admin.id);
  }

  // Case 9: Suspended User Access
  if (admin && adminToken) {
    await supabaseServer.from('profiles').update({ account_status: 'suspended' }).eq('id', admin.id);
    const resSuspended = await fetch(`${API_BASE}/auth/profile`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const dataSuspended = await resSuspended.json();
    assert(resSuspended.status === 403 && dataSuspended.message?.includes('suspended'), 'AUTH-9', 'Suspended account blocked with 403 Forbidden', `Message: "${dataSuspended.message}"`);
    // Restore active status
    await supabaseServer.from('profiles').update({ account_status: 'active' }).eq('id', admin.id);
  }

  // =========================================================================
  // SECTION 2: ROLE / PRIVILEGE ESCALATION AUDIT (RBAC)
  // =========================================================================
  console.log('\n--- PART 2: Role / Privilege Escalation Audit (RBAC) ---');

  if (citizenToken) {
    // Citizen -> Admin stats
    const resCtoA1 = await fetch(`${API_BASE}/admin/stats`, {
      headers: { Authorization: `Bearer ${citizenToken}` },
    });
    assert(resCtoA1.status === 403, 'RBAC-1', 'Citizen accessing /api/admin/stats blocked with 403 Forbidden');

    // Citizen -> Admin departments
    const resCtoA2 = await fetch(`${API_BASE}/admin/departments`, {
      headers: { Authorization: `Bearer ${citizenToken}` },
    });
    assert(resCtoA2.status === 403, 'RBAC-2', 'Citizen accessing /api/admin/departments blocked with 403 Forbidden');

    // Citizen -> Admin analytics
    const resCtoA3 = await fetch(`${API_BASE}/admin/analytics/overview`, {
      headers: { Authorization: `Bearer ${citizenToken}` },
    });
    assert(resCtoA3.status === 403, 'RBAC-3', 'Citizen accessing /api/admin/analytics blocked with 403 Forbidden');

    // Citizen -> Official grievances
    const resCtoO = await fetch(`${API_BASE}/official/grievances`, {
      headers: { Authorization: `Bearer ${citizenToken}` },
    });
    assert(resCtoO.status === 403, 'RBAC-4', 'Citizen accessing /api/official/grievances blocked with 403 Forbidden');
  }

  if (adminToken) {
    // Admin -> Official grievances (requires department assigned if not admin, admin gets through or handled safely)
    const resAtoStats = await fetch(`${API_BASE}/admin/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(resAtoStats.status === 200, 'RBAC-5', 'Active Admin authorized to access /api/admin/stats');
  }

  // =========================================================================
  // SECTION 3: IDOR / OBJECT-LEVEL AUTHORIZATION TESTING
  // =========================================================================
  console.log('\n--- PART 3: IDOR / Object-Level Authorization Testing ---');

  // Fetch grievances belonging to different citizens
  const { data: allGrievances } = await supabaseServer
    .from('grievances')
    .select('id, citizen_id, subject, department');

  if (allGrievances && allGrievances.length > 0) {
    const ownGrievance = allGrievances.find((g) => g.citizen_id === citizen.id);
    const otherGrievance = allGrievances.find((g) => g.citizen_id !== citizen.id);

    if (citizenToken && otherGrievance) {
      // Citizen A trying to view Citizen B's grievance
      const resIDOR = await fetch(`${API_BASE}/grievances/${otherGrievance.id}`, {
        headers: { Authorization: `Bearer ${citizenToken}` },
      });
      assert(resIDOR.status === 404, 'IDOR-1', "Citizen cannot access another citizen's grievance by ID (IDOR blocked with 404)", `Status: ${resIDOR.status}`);
    }

    if (citizenToken && ownGrievance) {
      // Citizen A viewing own grievance
      const resOwn = await fetch(`${API_BASE}/grievances/${ownGrievance.id}`, {
        headers: { Authorization: `Bearer ${citizenToken}` },
      });
      assert(resOwn.status === 200, 'IDOR-2', "Citizen can access their own grievance by ID", `Status: ${resOwn.status}`);
    }
  }

  // IDOR Notification test
  const { data: notifications } = await supabaseServer
    .from('notifications')
    .select('id, recipient_id')
    .limit(10);

  if (notifications && notifications.length > 0 && citizenToken) {
    const otherNotif = notifications.find((n) => n.recipient_id !== citizen.id);
    if (otherNotif) {
      const resNotifIDOR = await fetch(`${API_BASE}/notifications/${otherNotif.id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${citizenToken}` },
      });
      assert(resNotifIDOR.status === 404, 'IDOR-3', "Citizen cannot mark another user's notification as read (404 Not Found)", `Status: ${resNotifIDOR.status}`);
    }
  }

  // =========================================================================
  // SECTION 4: GRIEVANCE INPUT VALIDATION & SECURITY
  // =========================================================================
  console.log('\n--- PART 4: Grievance Input Validation & Security ---');

  if (citizenToken) {
    // 1. Empty subject
    const resVal1 = await fetch(`${API_BASE}/grievances`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${citizenToken}` },
      body: JSON.stringify({ subject: '', description: 'Valid description for testing grievance validation.' }),
    });
    assert(resVal1.status === 400, 'VAL-1', 'Empty subject rejected with 400 Bad Request');

    // 2. Short subject (< 5 chars)
    const resVal2 = await fetch(`${API_BASE}/grievances`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${citizenToken}` },
      body: JSON.stringify({ subject: 'Hi', description: 'Valid description for testing grievance validation.' }),
    });
    assert(resVal2.status === 400, 'VAL-2', 'Subject under 5 chars rejected with 400 Bad Request');

    // 3. Short description (< 15 chars)
    const resVal3 = await fetch(`${API_BASE}/grievances`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${citizenToken}` },
      body: JSON.stringify({ subject: 'Valid Subject', description: 'Too short' }),
    });
    assert(resVal3.status === 400, 'VAL-3', 'Description under 15 chars rejected with 400 Bad Request');

    // 4. Invalid language code
    const resVal4 = await fetch(`${API_BASE}/grievances`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${citizenToken}` },
      body: JSON.stringify({ subject: 'Valid Subject', description: 'Valid description for testing grievance validation.', preferred_language: 'invalid_lang_code' }),
    });
    assert(resVal4.status === 400, 'VAL-4', 'Unsupported language code rejected with 400 Bad Request');

    // 5. Invalid UUID format for detail query
    const resVal5 = await fetch(`${API_BASE}/grievances/not-a-valid-uuid`, {
      headers: { Authorization: `Bearer ${citizenToken}` },
    });
    assert(resVal5.status === 400, 'VAL-5', 'Non-UUID ticket ID lookup rejected with 400 Bad Request');

    // 6. Privilege escalation / citizen_id spoofing attempt in payload
    const spoofCitizenId = '00000000-0000-0000-0000-000000000000';
    const resSpoof = await fetch(`${API_BASE}/grievances`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${citizenToken}` },
      body: JSON.stringify({
        subject: 'Spoofing Test Grievance',
        description: 'Testing that citizen_id in body is ignored and authenticated user id is enforced.',
        citizen_id: spoofCitizenId,
        status: 'resolved', // Attempt to set terminal status
        department: 'Revenue & Land Administration', // Attempt arbitrary department
      }),
    });
    const dataSpoof = await resSpoof.json();
    assert(
      resSpoof.status === 201 &&
      dataSpoof.data?.citizen_id === citizen.id &&
      dataSpoof.data?.citizen_id !== spoofCitizenId,
      'VAL-6',
      'Citizen ID spoofing prevented: backend strictly enforces authenticated req.user.id',
      `Assigned citizen_id: ${dataSpoof.data?.citizen_id}`
    );
  }

  // =========================================================================
  // SECTION 5: STATUS TRANSITION SECURITY
  // =========================================================================
  console.log('\n--- PART 5: Status Transition Security ---');

  // Verify terminal state transitions are rejected
  // We can test OfficialService directly or via API with simulated states
  const { OfficialService } = await import('../src/services/officialService.js');
  
  // Test invalid transition from resolved -> in_progress
  try {
    // Create a temporary mock or test record
    const { data: testGrievance } = await supabaseServer
      .from('grievances')
      .insert([{
        citizen_id: citizen.id,
        subject: 'Terminal State Test',
        description: 'Testing that terminal states cannot be illegally transitioned.',
        status: 'resolved',
        department: 'Water Supply and Sanitation',
      }])
      .select()
      .single();

    if (testGrievance) {
      let threw = false;
      try {
        await OfficialService.updateGrievanceStatus(
          citizen.id,
          'Water Supply and Sanitation',
          testGrievance.id,
          'in_progress'
        );
      } catch (err) {
        threw = true;
        assert(err.statusCode === 400 && err.message.includes('Invalid status transition'), 'TRANS-1', 'Transition from resolved -> in_progress blocked with 400 Bad Request');
      }
      if (!threw) {
        assert(false, 'TRANS-1', 'Transition from resolved -> in_progress should have thrown 400');
      }

      // Cleanup test grievance
      await supabaseServer.from('grievances').delete().eq('id', testGrievance.id);
    }
  } catch (err) {
    console.warn('Status transition test warning:', err.message);
  }

  // =========================================================================
  // SECTION 6: AI SERVICE SECURITY & RELIABILITY
  // =========================================================================
  console.log('\n--- PART 6: AI Service Security & Reliability ---');

  // 1. AI Direct without secret
  const resAI1 = await fetch(`${AI_BASE}/api/v1/route`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subject: 'Water leakage issue', description: 'Pipeline broken in main road.' }),
  });
  assert(resAI1.status === 401, 'AI-1', 'AI service rejects requests without Authorization Bearer secret (401)');

  // 2. AI Direct with invalid secret
  const resAI2 = await fetch(`${AI_BASE}/api/v1/route`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer invalid_secret' },
    body: JSON.stringify({ subject: 'Water leakage issue', description: 'Pipeline broken in main road.' }),
  });
  assert(resAI2.status === 401, 'AI-2', 'AI service rejects invalid Bearer secret (401)');

  // 3. AI Direct with valid secret
  const tAIStart = performance.now();
  const resAI3 = await fetch(`${AI_BASE}/api/v1/route`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${AI_SERVICE_SECRET}` },
    body: JSON.stringify({ subject: 'Drinking water pipeline burst', description: 'The main underground water pipeline has burst causing contamination.' }),
  });
  const tAIDuration = performance.now() - tAIStart;
  metrics.aiWarmLatencyMs = Math.round(tAIDuration);
  const dataAI3 = await resAI3.json();

  assert(
    resAI3.status === 200 &&
    dataAI3.predicted_department &&
    dataAI3.predicted_department.toLowerCase().includes('water') &&
    dataAI3.confidence_score >= 0.65,
    'AI-3',
    'AI service successfully predicts department with high confidence score',
    `Predicted: "${dataAI3.predicted_department}", Confidence: ${dataAI3.confidence_score}, Latency: ${metrics.aiWarmLatencyMs}ms`
  );

  // 4. AI Low confidence / flagged case
  const resAI4 = await fetch(`${AI_BASE}/api/v1/route`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${AI_SERVICE_SECRET}` },
    body: JSON.stringify({ subject: 'Something abstract and ambiguous', description: 'General random comment without specific municipal grievance context.' }),
  });
  const dataAI4 = await resAI4.json();
  assert(
    resAI4.status === 200 &&
    dataAI4.routing_status === 'flagged_for_review',
    'AI-4',
    'AI service flags ambiguous grievances as flagged_for_review without false department assignment',
    `Status: "${dataAI4.routing_status}", Confidence: ${dataAI4.confidence_score}`
  );

  // =========================================================================
  // SECTION 7: API PERFORMANCE BENCHMARKS (MEASURED ACTUAL LATENCY)
  // =========================================================================
  console.log('\n--- PART 7: API Performance Benchmarks (Actual Latency) ---');

  async function measureApi(name, url, options = {}) {
    const start = performance.now();
    const res = await fetch(url, options);
    const duration = performance.now() - start;
    const rounded = Math.round(duration);
    metrics[name] = rounded;
    console.log(`⏱️  ${name}: ${rounded}ms (HTTP ${res.status})`);
    return { status: res.status, duration: rounded };
  }

  await measureApi('GET /api/health', `${API_BASE}/health`);
  if (adminToken) {
    await measureApi('GET /api/auth/profile', `${API_BASE}/auth/profile`, { headers: { Authorization: `Bearer ${adminToken}` } });
    await measureApi('GET /api/admin/stats', `${API_BASE}/admin/stats`, { headers: { Authorization: `Bearer ${adminToken}` } });
    await measureApi('GET /api/admin/departments', `${API_BASE}/admin/departments`, { headers: { Authorization: `Bearer ${adminToken}` } });
    await measureApi('GET /api/admin/analytics/overview', `${API_BASE}/admin/analytics/overview`, { headers: { Authorization: `Bearer ${adminToken}` } });
  }
  if (citizenToken) {
    await measureApi('GET /api/grievances', `${API_BASE}/grievances`, { headers: { Authorization: `Bearer ${citizenToken}` } });
    await measureApi('GET /api/notifications', `${API_BASE}/notifications`, { headers: { Authorization: `Bearer ${citizenToken}` } });
  }

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log('\n======================================================================');
  console.log(`AUDIT & VERIFICATION RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('======================================================================\n');
  console.log('Performance Metrics Summary:', JSON.stringify(metrics, null, 2));

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runPhase11ComprehensiveAudit().catch((err) => {
  console.error('Fatal audit execution error:', err);
  process.exit(1);
});
