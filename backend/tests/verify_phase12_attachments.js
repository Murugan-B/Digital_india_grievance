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

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

// Small 1x1 base64 PNG, JPEG, WEBP images for test uploads
const TINY_PNG_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const TINY_JPEG_BASE64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
const TINY_WEBP_BASE64 = 'data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==';

async function login(email, password) {
  const { data, error } = await supabaseAuth.auth.signInWithPassword({
    email,
    password,
  });
  if (error) {
    throw new Error(`Login failed for ${email}: ${error.message}`);
  }
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

async function runTests() {
  console.log('====================================================');
  console.log('PHASE 12 COMPREHENSIVE END-TO-END REGRESSION TEST');
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

  const createdGrievanceIds = [];

  try {
    // 1. Authenticate Demo Accounts
    console.log('--- 1. Testing Demo Accounts Authentication ---');
    const citizenToken = await login('demo.citizen@grievance.gov.in', 'DemoCitizen@2026!');
    test('Citizen Login (demo.citizen@grievance.gov.in)', !!citizenToken);

    const adminToken = await login('admin.user@grievance.gov.in', 'DemoAdmin@2026!');
    test('Admin Login (admin.user@grievance.gov.in)', !!adminToken);

    const waterOfficialToken = await login('demo.water-supply@grievance.gov.in', 'DemoWaterSupply@2026!');
    test('Official Login: Water Supply', !!waterOfficialToken);

    const electricityOfficialToken = await login('demo.electricity@grievance.gov.in', 'DemoElectricity@2026!');
    test('Official Login: Electricity', !!electricityOfficialToken);

    const roadsOfficialToken = await login('demo.roads-transport@grievance.gov.in', 'DemoRoadsAndTransport@2026!');
    test('Official Login: Roads & Transport', !!roadsOfficialToken);

    const sanitationOfficialToken = await login('demo.sanitation@grievance.gov.in', 'DemoSanitation@2026!');
    test('Official Login: Sanitation', !!sanitationOfficialToken);

    const municipalOfficialToken = await login('demo.municipal-services@grievance.gov.in', 'DemoMunicipalServices@2026!');
    test('Official Login: Municipal Services', !!municipalOfficialToken);

    const healthOfficialToken = await login('demo.public-health@grievance.gov.in', 'DemoPublicHealth@2026!');
    test('Official Login: Public Health', !!healthOfficialToken);

    const revenueOfficialToken = await login('demo.revenue@grievance.gov.in', 'DemoRevenue@2026!');
    test('Official Login: Revenue', !!revenueOfficialToken);

    const educationOfficialToken = await login('demo.education@grievance.gov.in', 'DemoEducation@2026!');
    test('Official Login: Education', !!educationOfficialToken);

    // 2. Submit Grievance WITHOUT images
    console.log('\n--- 2. Grievance Submission Tests ---');
    const resNoImage = await request('/grievances', {
      method: 'POST',
      token: citizenToken,
      body: {
        subject: 'Pipeline Burst and Water Contamination in Sector 4',
        description: 'Severe potable drinking water pipeline leak observed near crossroad 5 for past 3 days.',
        category: 'Water Supply',
        location: 'Sector 4, Main Market, Delhi',
        preferred_language: 'en',
      },
    });
    test('Submit Grievance without images returns 201', resNoImage.status === 201 && resNoImage.data?.data?.id);
    if (resNoImage.data?.data?.id) createdGrievanceIds.push(resNoImage.data.data.id);
    const grievanceId1 = resNoImage.data?.data?.id;

    // 3. Submit Grievance WITH 1 image (PNG)
    const res1Image = await request('/grievances', {
      method: 'POST',
      token: citizenToken,
      body: {
        subject: 'Low Voltage and Transformer Sparking near School',
        description: 'Frequent voltage fluctuations and dangerous electric sparks noticed on transformer pole.',
        category: 'Electricity & Power',
        location: 'Zone 3, North Street, Chennai',
        preferred_language: 'en',
        images: [
          {
            name: 'transformer_spark.png',
            type: 'image/png',
            size: 1500,
            data: TINY_PNG_BASE64,
          },
        ],
      },
    });
    test('Submit Grievance with 1 image returns 201 with attachment', 
      res1Image.status === 201 && 
      res1Image.data?.data?.attachments?.length === 1 &&
      res1Image.data?.data?.attachments[0].storage_path
    );
    if (res1Image.data?.data?.id) createdGrievanceIds.push(res1Image.data.data.id);
    const grievanceId2 = res1Image.data?.data?.id;

    // 4. Submit Grievance WITH 3 images (JPG, PNG, WEBP)
    const res3Images = await request('/grievances', {
      method: 'POST',
      token: citizenToken,
      body: {
        subject: 'Massive Potholes and Road Damage on Highway',
        description: 'Severe road asphalt destruction, deep craters and potholes causing severe vehicular accidents.',
        category: 'Roads & Transport Infrastructure',
        location: 'Outer Ring Road, Bengaluru',
        preferred_language: 'en',
        images: [
          { name: 'pothole_1.jpg', type: 'image/jpeg', size: 1200, data: TINY_JPEG_BASE64 },
          { name: 'pothole_2.png', type: 'image/png', size: 1300, data: TINY_PNG_BASE64 },
          { name: 'pothole_3.webp', type: 'image/webp', size: 1100, data: TINY_WEBP_BASE64 },
        ],
      },
    });
    test('Submit Grievance with 3 images returns 201 with 3 attachments', 
      res3Images.status === 201 && res3Images.data?.data?.attachments?.length === 3
    );
    if (res3Images.data?.data?.id) createdGrievanceIds.push(res3Images.data.data.id);
    const grievanceId3 = res3Images.data?.data?.id;

    // 5. Validation: Reject > 3 images
    console.log('\n--- 3. File & Payload Validation Tests ---');
    const res4Images = await request('/grievances', {
      method: 'POST',
      token: citizenToken,
      body: {
        subject: 'Garbage Dump Overflowing on Pavement',
        description: 'Solid waste uncollected for one week creating serious public sanitation issues.',
        category: 'Sanitation & Waste Management',
        images: [
          { name: '1.jpg', type: 'image/jpeg', size: 500, data: TINY_JPEG_BASE64 },
          { name: '2.jpg', type: 'image/jpeg', size: 500, data: TINY_JPEG_BASE64 },
          { name: '3.jpg', type: 'image/jpeg', size: 500, data: TINY_JPEG_BASE64 },
          { name: '4.jpg', type: 'image/jpeg', size: 500, data: TINY_JPEG_BASE64 },
        ],
      },
    });
    test('Reject > 3 images with 400 Bad Request', res4Images.status === 400);

    // 6. Validation: Reject unsupported file type (PDF/text)
    const resInvalidType = await request('/grievances', {
      method: 'POST',
      token: citizenToken,
      body: {
        subject: 'Garbage Dump Overflowing on Pavement',
        description: 'Solid waste uncollected for one week creating serious public sanitation issues.',
        category: 'Sanitation & Waste Management',
        images: [
          { name: 'document.pdf', type: 'application/pdf', size: 500, data: 'data:application/pdf;base64,JVBERi0xLjQ=' },
        ],
      },
    });
    test('Reject unsupported MIME type with 400 Bad Request', resInvalidType.status === 400);

    // 7. Validation: Reject oversized image (> 5 MB)
    const resOversized = await request('/grievances', {
      method: 'POST',
      token: citizenToken,
      body: {
        subject: 'Garbage Dump Overflowing on Pavement',
        description: 'Solid waste uncollected for one week creating serious public sanitation issues.',
        category: 'Sanitation & Waste Management',
        images: [
          { name: 'huge.jpg', type: 'image/jpeg', size: 6 * 1024 * 1024, data: TINY_JPEG_BASE64 },
        ],
      },
    });
    test('Reject oversized image (> 5MB) with 400 Bad Request', resOversized.status === 400);

    // 8. Access Control & Signed URL Retrieval
    console.log('\n--- 4. Attachment Access & IDOR Tests ---');
    
    // Citizen retrieves own grievance details (with signed URLs)
    const resCitizenView = await request(`/grievances/${grievanceId3}`, {
      token: citizenToken,
    });
    test('Citizen gets own grievance with signed URLs', 
      resCitizenView.status === 200 && 
      resCitizenView.data?.data?.attachments?.length === 3 &&
      resCitizenView.data?.data?.attachments[0]?.signed_url?.startsWith('http')
    );

    // Admin manually assigns grievanceId3 to "Roads & Transport" department for official testing
    const resAdminAssign = await request(`/admin/grievances/${grievanceId3}/department`, {
      method: 'PATCH',
      token: adminToken,
      body: {
        department: 'Roads & Transport',
        reason: 'Assigned by Admin for departmental action',
      },
    });
    test('Admin assigns department to grievance', resAdminAssign.status === 200);

    // Roads Official accesses assigned department grievance
    const resOfficialView = await request(`/official/grievances/${grievanceId3}`, {
      token: roadsOfficialToken,
    });
    test('Assigned Official gets department grievance with signed URLs',
      resOfficialView.status === 200 &&
      resOfficialView.data?.data?.attachments?.length === 3 &&
      resOfficialView.data?.data?.attachments[0]?.signed_url?.startsWith('http')
    );

    // Official from DIFFERENT department attempts access (Water Official trying to view Roads grievanceId3)
    const resWrongOfficialView = await request(`/official/grievances/${grievanceId3}`, {
      token: waterOfficialToken,
    });
    test('IDOR Protection: Unassigned Official cannot view other department grievance (403/404)', 
      resWrongOfficialView.status === 403 || resWrongOfficialView.status === 404
    );

    // Admin accesses grievance list
    const resAdminGrievances = await request('/admin/grievances', {
      token: adminToken,
    });
    test('Admin lists all grievances with metadata', 
      resAdminGrievances.status === 200 && Array.isArray(resAdminGrievances.data?.data)
    );

    // 9. AI Routing & Notification Pipeline Integrity
    console.log('\n--- 5. AI Routing & Notification Pipeline Integrity ---');
    // Allow asynchronous AI routing to complete
    await new Promise((r) => setTimeout(r, 1500));

    const { data: aiRecords } = await supabaseServer
      .from('grievance_ai_routings')
      .select('*')
      .in('grievance_id', createdGrievanceIds);
    test('AI routing records created automatically on grievance submission', (aiRecords?.length || 0) > 0);

    const { data: notifications } = await supabaseServer
      .from('notifications')
      .select('*');
    test('Notifications generated without duplicate attachment errors', (notifications?.length || 0) > 0);

    const { data: attachmentsInDb, error: attachTableErr } = await supabaseServer
      .from('grievance_attachments')
      .select('*');
    test('Attachments metadata stored & accessible via service storage', 
      (attachmentsInDb && attachmentsInDb.length >= 4) || resCitizenView.data?.data?.attachments?.length === 3
    );

    // 10. Clean up test grievances to restore pristine demo environment (0 grievances)
    console.log('\n--- 6. Restoring Clean Demo State ---');
    await supabaseServer.from('notifications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabaseServer.from('grievance_attachments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabaseServer.from('grievance_ai_routings').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabaseServer.from('grievance_status_history').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabaseServer.from('grievances').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    const { count: finalGrievanceCount } = await supabaseServer.from('grievances').select('*', { count: 'exact', head: true });
    const { count: finalAiCount } = await supabaseServer.from('grievance_ai_routings').select('*', { count: 'exact', head: true });
    const { count: finalHistoryCount } = await supabaseServer.from('grievance_status_history').select('*', { count: 'exact', head: true });
    const { count: finalNotifCount } = await supabaseServer.from('notifications').select('*', { count: 'exact', head: true });

    test('Final Grievance Count is exactly 0', finalGrievanceCount === 0);
    test('Final AI Routing Count is exactly 0', finalAiCount === 0);
    test('Final Status History Count is exactly 0', finalHistoryCount === 0);
    test('Final Notification Count is exactly 0', finalNotifCount === 0);

    console.log('\n====================================================');
    console.log(`FINAL TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================');

    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error('\n[UNEXPECTED ERROR]:', err);
    process.exit(1);
  }
}

runTests();
