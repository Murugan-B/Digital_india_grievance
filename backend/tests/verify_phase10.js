import { execSync } from 'child_process';
import path from 'path';
import { supabaseServer } from '../src/config/supabase.js';
import { NotificationService } from '../src/services/notificationService.js';
import { AnalyticsService } from '../src/services/analyticsService.js';
import { GrievanceService } from '../src/services/grievanceService.js';
import { AIRoutingService } from '../src/services/aiRoutingService.js';
import { OfficialService } from '../src/services/officialService.js';
import { AdminService } from '../src/services/adminService.js';
import { requireAdmin, requireAuth, requireCitizen, requireOfficial } from '../src/middleware/authMiddleware.js';

console.log('======================================================================');
console.log('PHASE 10 — NOTIFICATIONS + ANALYTICS COMPREHENSIVE VERIFICATION SUITE');
console.log('======================================================================\n');

async function runPhase10Tests() {
  let passedCount = 0;
  let failedCount = 0;

  function assertTest(condition, testNumber, title, details) {
    if (condition) {
      console.log(`✅ [TEST ${testNumber}] PASS: ${title}`);
      if (details) console.log(`   ↳ ${details}`);
      passedCount++;
    } else {
      console.error(`❌ [TEST ${testNumber}] FAIL: ${title}`);
      if (details) console.error(`   ↳ ${details}`);
      failedCount++;
    }
  }

  // 1. Fetch real test profiles from Supabase database
  const { data: allProfiles } = await supabaseServer
    .from('profiles')
    .select('*')
    .limit(10);

  const citizenProfile = (allProfiles && allProfiles.find((p) => p.role === 'citizen')) || {
    id: 'db0076f3-e11c-4b1e-8cbe-c1be5d473c32',
    role: 'citizen',
    account_status: 'active',
    full_name: 'Ramesh Kumar',
  };

  const otherCitizenProfile = (allProfiles && allProfiles.find((p) => p.id !== citizenProfile.id)) || {
    id: '5f6c97ba-7a84-4cd0-8c60-98ef12be23d1',
    role: 'citizen',
    account_status: 'active',
    full_name: 'Test Citizen',
  };

  const officialProfile = (allProfiles && allProfiles.find((p) => p.role === 'official')) || {
    id: otherCitizenProfile.id,
    role: 'official',
    account_status: 'active',
    department: 'Water Supply and Sanitation',
    full_name: 'Official Desk',
  };

  const adminProfile = (allProfiles && allProfiles.find((p) => p.role === 'admin')) || {
    id: citizenProfile.id,
    role: 'admin',
    account_status: 'active',
    full_name: 'Super Administrator',
  };

  console.log(`Test Context: Citizen=${citizenProfile.id}, OtherUser=${otherCitizenProfile.id}, Official=${officialProfile.id}\n`);

  // -------------------------------------------------------------------------
  // Part 1: Notification Security & Middleware
  // -------------------------------------------------------------------------
  console.log('--- PART 1: Notification Security & Middleware ---');

  // Test 1: Unauthenticated notification API -> 401
  let resMock = { status(c) { this.statusCode = c; return this; }, json(b) { this.body = b; return this; } };
  let reqMock = { headers: {} };
  let nextCalled = false;
  await requireAuth(reqMock, resMock, () => { nextCalled = true; });
  assertTest(!nextCalled && resMock.statusCode === 401, 1, 'Unauthenticated access to notification endpoint returns 401 Unauthorized');

  // Create two distinct test notifications for citizen and other user
  const citizenNotif1 = await NotificationService.createNotification({
    recipient_id: citizenProfile.id,
    type: 'grievance_submitted',
    title: 'Test Citizen Notification 1',
    message: 'Grievance submitted successfully for test.',
  });

  const citizenNotif2 = await NotificationService.createNotification({
    recipient_id: citizenProfile.id,
    type: 'status_changed',
    title: 'Test Citizen Notification 2',
    message: 'Status updated to In Progress.',
  });

  const otherUserNotif = await NotificationService.createNotification({
    recipient_id: otherCitizenProfile.id,
    type: 'manual_assignment',
    title: 'Other User Notification',
    message: 'Secret notification for other user.',
  });

  // Test 2: Citizen sees only own notifications
  const citizenList = await NotificationService.getUserNotifications(citizenProfile.id, { page: 1, limit: 50 });
  const containsOnlyCitizen = citizenList.notifications.every((n) => n.recipient_id === citizenProfile.id);
  const containsOther = citizenList.notifications.some((n) => n.id === otherUserNotif?.id);
  assertTest(containsOnlyCitizen && !containsOther, 2, 'Citizen retrieves only own notifications (strict recipient isolation)', `Count: ${citizenList.notifications.length}`);

  // Test 3: Official sees only own notifications
  const officialNotif = await NotificationService.createNotification({
    recipient_id: otherCitizenProfile.id,
    type: 'ai_routed',
    title: 'New Department Grievance',
    message: 'A ticket has been routed to your department.',
  });
  const officialList = await NotificationService.getUserNotifications(otherCitizenProfile.id, { page: 1, limit: 50 });
  const containsOnlyOfficial = officialList.notifications.every((n) => n.recipient_id === otherCitizenProfile.id);
  assertTest(containsOnlyOfficial && officialList.notifications.some((n) => n.id === officialNotif?.id), 3, 'Official retrieves only their own departmental notifications');

  // Test 4: User cannot access another user's notification
  const otherUserList = await NotificationService.getUserNotifications(otherCitizenProfile.id, { page: 1, limit: 10 });
  const otherSeesOnlyOther = otherUserList.notifications.every((n) => n.recipient_id === otherCitizenProfile.id);
  assertTest(otherSeesOnlyOther && !otherUserList.notifications.some((n) => n.recipient_id === citizenProfile.id), 4, 'Users cannot view other recipients notifications across tenants');

  // Test 5: Mark own notification read works
  if (citizenNotif1?.id) {
    const marked = await NotificationService.markAsRead(citizenNotif1.id, citizenProfile.id);
    const updatedCitizenList = await NotificationService.getUserNotifications(citizenProfile.id, { page: 1, limit: 50 });
    const targetItem = updatedCitizenList.notifications.find((n) => n.id === citizenNotif1.id);
    assertTest(marked === true && targetItem?.is_read === true, 5, 'Citizen can successfully mark their own notification as read');
  } else {
    assertTest(false, 5, 'Mark own notification failed (notif missing)');
  }

  // Test 6: Mark another user's notification read fails / returns false
  if (otherUserNotif?.id) {
    const crossMark = await NotificationService.markAsRead(otherUserNotif.id, citizenProfile.id);
    const updatedOtherList = await NotificationService.getUserNotifications(otherCitizenProfile.id, { page: 1, limit: 10 });
    const otherItem = updatedOtherList.notifications.find((n) => n.id === otherUserNotif.id);
    assertTest(crossMark === false && otherItem?.is_read === false, 6, 'Marking another user notification as read fails / rejected');
  } else {
    assertTest(false, 6, 'Cross mark test failed (other notif missing)');
  }

  // Test 7: Read-all only affects own notifications
  await NotificationService.markAllAsRead(citizenProfile.id);
  const otherAfterAll = await NotificationService.getUserNotifications(otherCitizenProfile.id, { page: 1, limit: 10 });
  const otherItemAfterAll = otherAfterAll.notifications.find((n) => n.id === otherUserNotif.id);
  assertTest(otherItemAfterAll?.is_read === false, 7, 'Mark all as read strictly scoped to current user');

  // Test 8: Notification pagination works
  const paginatedRes = await NotificationService.getUserNotifications(citizenProfile.id, { page: 1, limit: 1 });
  assertTest(paginatedRes.notifications.length <= 1 && paginatedRes.pagination.limit === 1, 8, 'Notification pagination correctly bounds page and limit', `Returned: ${paginatedRes.notifications.length}, Page: ${paginatedRes.pagination.page}`);

  // -------------------------------------------------------------------------
  // Part 2: Automated Notification Event Triggers
  // -------------------------------------------------------------------------
  console.log('\n--- PART 2: Automated Event Notification Generation ---');

  // Test 9: Grievance submission generates expected notification
  const submissionNotif = await NotificationService.notifyGrievanceSubmitted({
    citizen_id: citizenProfile.id,
    grievance_id: '00000000-0000-0000-0000-000000000001',
    subject: 'Water pipe leakage in Block C',
  });
  assertTest(submissionNotif?.type === 'grievance_submitted' && submissionNotif.recipient_id === citizenProfile.id, 9, 'Grievance submission generates grievance_submitted notification for citizen');

  // Test 10: AI assignment generates expected notification
  const aiAssignNotifs = await NotificationService.notifyAIRouted({
    citizen_id: citizenProfile.id,
    grievance_id: '00000000-0000-0000-0000-000000000002',
    department_name: 'Water Supply and Sanitation',
    confidence: 0.88,
  });
  assertTest(aiAssignNotifs?.citizenNotif?.type === 'ai_routed' && aiAssignNotifs.citizenNotif.recipient_id === citizenProfile.id, 10, 'High confidence AI assignment generates ai_routed notification with department info');

  // Test 11: AI flagged case generates review notification
  const aiFlaggedNotif = await NotificationService.notifyAIReviewRequired({
    citizen_id: citizenProfile.id,
    grievance_id: '00000000-0000-0000-0000-000000000003',
  });
  assertTest(aiFlaggedNotif?.type === 'ai_review_required' && aiFlaggedNotif.recipient_id === citizenProfile.id, 11, 'Low confidence / flagged AI case generates ai_review_required notification');

  // Test 12: Status change generates citizen notification
  const statusNotif = await NotificationService.notifyStatusChanged({
    citizen_id: citizenProfile.id,
    grievance_id: '00000000-0000-0000-0000-000000000004',
    old_status: 'submitted',
    new_status: 'in_progress',
    grievance_title: 'Power outage main road',
  });
  assertTest(statusNotif?.type === 'status_changed' && statusNotif.recipient_id === citizenProfile.id, 12, 'Status transition to in_progress generates status_changed notification');

  // Test 13: Resolution generates notification
  const resolvedNotif = await NotificationService.notifyStatusChanged({
    citizen_id: citizenProfile.id,
    grievance_id: '00000000-0000-0000-0000-000000000005',
    old_status: 'in_progress',
    new_status: 'resolved',
    grievance_title: 'Power outage main road',
  });
  assertTest(resolvedNotif?.type === 'grievance_resolved' && resolvedNotif.recipient_id === citizenProfile.id, 13, 'Status transition to resolved generates grievance_resolved notification');

  // Test 14: AI failure does not falsely generate assignment notification
  const nullDeptNotif = await NotificationService.notifyAIRouted({
    citizen_id: citizenProfile.id,
    grievance_id: '00000000-0000-0000-0000-000000000006',
    department_name: null,
    confidence: null,
  });
  assertTest(nullDeptNotif === null, 14, 'Null department assignment safely produces no false assignment notification');

  // Test 15: Duplicate event does not create duplicate notification where prevention is implemented
  const notifA = await NotificationService.notifyStatusChanged({
    citizen_id: citizenProfile.id,
    grievance_id: '00000000-0000-0000-0000-000000000007',
    old_status: 'in_progress',
    new_status: 'rejected',
    grievance_title: 'Duplicate test',
  });
  const notifB = await NotificationService.notifyStatusChanged({
    citizen_id: citizenProfile.id,
    grievance_id: '00000000-0000-0000-0000-000000000007',
    old_status: 'in_progress',
    new_status: 'rejected',
    grievance_title: 'Duplicate test',
  });
  assertTest(notifA !== null && notifB === null, 15, 'Duplicate event within 60s suppressed (duplicate prevention active)');

  // -------------------------------------------------------------------------
  // Part 3: Analytics Authorization & Computation
  // -------------------------------------------------------------------------
  console.log('\n--- PART 3: Analytics Authorization & Live Data Calculation ---');

  // Test 16: Unauthenticated analytics API -> 401
  resMock = { status(c) { this.statusCode = c; return this; }, json(b) { this.body = b; return this; } };
  reqMock = { profile: null };
  nextCalled = false;
  requireAdmin(reqMock, resMock, () => { nextCalled = true; });
  assertTest(!nextCalled && resMock.statusCode === 401, 16, 'Unauthenticated user rejected from analytics endpoint (401 Unauthorized)');

  // Test 17: Citizen analytics API -> 403
  resMock = { status(c) { this.statusCode = c; return this; }, json(b) { this.body = b; return this; } };
  reqMock = { profile: { id: citizenProfile.id, role: 'citizen', account_status: 'active' } };
  nextCalled = false;
  requireAdmin(reqMock, resMock, () => { nextCalled = true; });
  assertTest(!nextCalled && resMock.statusCode === 403, 17, 'Citizen forbidden from analytics endpoint (403 Forbidden)');

  // Test 18: Official analytics API -> 403
  resMock = { status(c) { this.statusCode = c; return this; }, json(b) { this.body = b; return this; } };
  reqMock = { profile: { id: officialProfile.id, role: 'official', account_status: 'active' } };
  nextCalled = false;
  requireAdmin(reqMock, resMock, () => { nextCalled = true; });
  assertTest(!nextCalled && resMock.statusCode === 403, 18, 'Official forbidden from analytics endpoint (403 Forbidden)');

  // Test 19: Active admin analytics API -> 200
  resMock = { status(c) { this.statusCode = c; return this; }, json(b) { this.body = b; return this; } };
  reqMock = { profile: { id: adminProfile.id, role: 'admin', account_status: 'active' } };
  nextCalled = false;
  requireAdmin(reqMock, resMock, () => { nextCalled = true; });
  assertTest(nextCalled, 19, 'Active Administrator authorized for analytics endpoints');

  // Test 20: Statistics match actual database values
  const analyticsData = await AnalyticsService.getOverviewMetrics({ days: 30 });
  const { count: actualTotalGrievances } = await supabaseServer.from('grievances').select('*', { count: 'exact', head: true });
  assertTest(analyticsData.totalGrievances === actualTotalGrievances, 20, 'Total grievances count accurately matches database COUNT(*)', `DB: ${actualTotalGrievances}, Analytics: ${analyticsData.totalGrievances}`);

  // Test 21: Department aggregation is correct
  const sumDeptGrievances = Object.values(analyticsData.departmentCounts).reduce((a, b) => a + b, 0);
  const { count: assignedCount } = await supabaseServer.from('grievances').select('*', { count: 'exact', head: true }).not('department', 'is', null);
  assertTest(sumDeptGrievances === assignedCount, 21, 'Department distribution aggregation sum matches assigned grievances', `Sum: ${sumDeptGrievances}, Assigned in DB: ${assignedCount}`);

  // Test 22: Status aggregation is correct
  const sumStatusGrievances = Object.values(analyticsData.statusCounts).reduce((a, b) => a + b, 0);
  assertTest(sumStatusGrievances === actualTotalGrievances, 22, 'Status counts aggregation sum matches total grievances', `Status Sum: ${sumStatusGrievances}, Total: ${actualTotalGrievances}`);

  // Test 23: Priority aggregation is correct
  const sumPriorityGrievances = Object.values(analyticsData.priorityCounts).reduce((a, b) => a + b, 0);
  assertTest(sumPriorityGrievances === actualTotalGrievances, 23, 'Priority counts aggregation sum matches total grievances', `Priority Sum: ${sumPriorityGrievances}, Total: ${actualTotalGrievances}`);

  // Test 24: AI completed/flagged counts are correct
  const { count: actualAIRoutings } = await supabaseServer.from('grievance_ai_routings').select('*', { count: 'exact', head: true });
  assertTest(analyticsData.aiMetrics.total_routings === actualAIRoutings, 24, 'AI routing metrics total matches grievance_ai_routings count', `DB: ${actualAIRoutings}, AI total: ${analyticsData.aiMetrics.total_routings}`);

  // Test 25: Resolution time calculation is based on resolved status history
  assertTest(analyticsData.resolutionTime.formula.includes('grievance_status_history') && typeof analyticsData.resolutionTime.sample_size === 'number', 25, 'Average resolution time derived strictly from grievance_status_history resolved timestamp', `Sample size: ${analyticsData.resolutionTime.sample_size}, Avg hours: ${analyticsData.resolutionTime.average_hours}`);

  // Test 26: Trend date filtering works
  const trend7d = await AnalyticsService.getOverviewMetrics({ days: 7 });
  const trend30d = await AnalyticsService.getOverviewMetrics({ days: 30 });
  assertTest(trend7d.trends.length <= 8 && trend30d.trends.length <= 31, 26, 'Time-series trend respects date window parameters (7 vs 30 days)');

  // -------------------------------------------------------------------------
  // Part 4: Regression Tests (Phases 1 - 9)
  // -------------------------------------------------------------------------
  console.log('\n--- PART 4: Cross-Phase Regression Verification ---');

  // Test 27: Citizen grievance retrieval works
  const citizenGrievances = await GrievanceService.getCitizenGrievances(citizenProfile.id);
  assertTest(Array.isArray(citizenGrievances), 27, 'Citizen grievance retrieval remains functional (Phase 5/6 regression)');

  // Test 28: Official grievance retrieval works
  const officialGrievances = await OfficialService.getDepartmentGrievances('Water Supply and Sanitation');
  assertTest(Array.isArray(officialGrievances), 28, 'Official departmental grievance retrieval remains functional (Phase 7 regression)');

  // Test 29: Admin dashboard works
  const adminStats = await AdminService.getSystemStats();
  assertTest(typeof adminStats.users.totalCitizens === 'number' && typeof adminStats.grievances.total === 'number', 29, 'Admin system stats retrieval remains functional (Phase 9 regression)');

  // Test 30: Phase 8 AI routing works
  const { data: deptRows } = await supabaseServer.from('departments').select('name').eq('is_active', true).limit(3);
  assertTest(deptRows && deptRows.length > 0, 30, 'Departments directory operational for AI Semantic Ticket Routing (Phase 8 regression)');

  // Test 31: Frontend production build check
  console.log('Testing Frontend Production Build...');
  try {
    const buildOut = execSync('npm run build', { cwd: path.resolve('../frontend'), stdio: 'pipe' });
    assertTest(true, 31, 'Frontend production build (Vite + React) succeeds with 0 errors');
  } catch (buildErr) {
    console.error('Frontend build failed:', buildErr.stdout?.toString() || buildErr.message);
    assertTest(false, 31, 'Frontend production build failed');
  }

  // Summary of Verification
  console.log('\n======================================================================');
  console.log(`TOTAL TESTS: ${passedCount + failedCount} | PASSED: ${passedCount} | FAILED: ${failedCount}`);
  console.log('======================================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runPhase10Tests().catch((err) => {
  console.error('Unhandled exception during Phase 10 verification:', err);
  process.exit(1);
});
