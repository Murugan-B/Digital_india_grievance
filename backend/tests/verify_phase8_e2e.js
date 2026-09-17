import { supabaseServer } from '../src/config/supabase.js';
import { AIRoutingService } from '../src/services/aiRoutingService.js';
import { GrievanceService } from '../src/services/grievanceService.js';

console.log('======================================================================');
console.log('PHASE 8 END-TO-END AUTOMATED VERIFICATION SUITE');
console.log('======================================================================\n');

async function runEndToEndVerification() {
  let passedCount = 0;
  let failedCount = 0;

  function reportPass(stepNumber, title, details) {
    console.log(`✅ [STEP ${stepNumber}] PASS: ${title}`);
    if (details) console.log(`   ↳ ${details}`);
    passedCount++;
  }

  function reportFail(stepNumber, title, error) {
    console.error(`❌ [STEP ${stepNumber}] FAIL: ${title}`);
    if (error) console.error(`   ↳ ${error}`);
    failedCount++;
  }

  // Find a test citizen user
  const { data: citizenProfile, error: profileErr } = await supabaseServer
    .from('profiles')
    .select('id, full_name, email')
    .eq('role', 'citizen')
    .limit(1)
    .single();

  if (profileErr || !citizenProfile) {
    console.error('Failed to locate test citizen profile:', profileErr);
    process.exit(1);
  }

  console.log(`Using Citizen Account: ${citizenProfile.full_name} (${citizenProfile.email} - ID: ${citizenProfile.id})\n`);

  let highConfidenceGrievanceId = null;
  let lowConfidenceGrievanceId = null;
  let offlineFallbackGrievanceId = null;

  // -------------------------------------------------------------------------
  // TEST CASE 1: High-Confidence Grievance Submission & Automatic Assignment
  // -------------------------------------------------------------------------
  console.log('--- TEST 1: High-Confidence Semantic Routing (Water Supply) ---');
  try {
    // 1. Citizen submits grievance -> Node inserts with department = NULL
    const createdGrievance = await GrievanceService.createGrievance(citizenProfile.id, {
      subject: 'Drinking water supply pipeline leakage and contaminated water',
      description: 'The municipal drinking water supply pipeline has severe leakages on 4th cross road. Contaminated tap water with low water pressure is flowing and water tankers have not arrived.',
      category: 'Water Supply',
      location: 'Sector 9, Ward 14',
      preferred_language: 'en'
    });

    highConfidenceGrievanceId = createdGrievance.id;
    
    // Check initial state
    if (createdGrievance.department === null) {
      reportPass(1, 'Grievance created in Supabase with initial department = NULL', `Ticket ID: ${createdGrievance.id}`);
    } else {
      reportFail(1, 'Initial department should be NULL', `Got: ${createdGrievance.department}`);
    }

    // 2. Node calls AI Routing Service
    const aiResult = await AIRoutingService.callAIService(createdGrievance.subject, createdGrievance.description);
    if (aiResult && aiResult.predicted_department && aiResult.confidence_score !== undefined) {
      reportPass(2, 'Python FastAPI AI Service generated semantic prediction', 
        `Predicted: "${aiResult.predicted_department}", Score: ${aiResult.confidence_score}, Status: "${aiResult.routing_status}", Model: ${aiResult.model_name}`);
    } else {
      throw new Error('AI Service response missing required fields');
    }

    // 3. Process full routing pipeline
    const routedGrievance = await AIRoutingService.processGrievanceRouting(createdGrievance);

    // 4. Verify AI Routing record written in public.grievance_ai_routings
    const { data: routingAudit, error: auditErr } = await supabaseServer
      .from('grievance_ai_routings')
      .select('*')
      .eq('grievance_id', highConfidenceGrievanceId)
      .order('routed_at', { ascending: false })
      .limit(1)
      .single();

    if (!auditErr && routingAudit) {
      reportPass(3, 'Immutable audit row created in public.grievance_ai_routings', 
        `Audit ID: ${routingAudit.id}, Predicted: "${routingAudit.predicted_department}", Score: ${routingAudit.confidence_score}, Status: "${routingAudit.routing_status}"`);
    } else {
      reportFail(3, 'Failed to find routing audit record', auditErr?.message);
    }

    // 5. Verify grievance department assignment in Supabase
    const { data: finalGrievance, error: fetchErr } = await supabaseServer
      .from('grievances')
      .select('*')
      .eq('id', highConfidenceGrievanceId)
      .single();

    if (!fetchErr && finalGrievance) {
      if (finalGrievance.department === 'Water Supply') {
        reportPass(4, 'High-confidence grievance automatically assigned to "Water Supply"', `grievances.department = "${finalGrievance.department}"`);
      } else {
        reportFail(4, 'Department was not updated to "Water Supply"', `Current department: ${finalGrievance.department}`);
      }
    }
  } catch (err) {
    reportFail(1, 'High confidence test failed with exception', err.message);
  }

  // -------------------------------------------------------------------------
  // TEST CASE 2: Low-Confidence Grievance Submission (Remains Unassigned)
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 2: Low-Confidence Semantic Routing (Ambiguous / Out-of-Domain) ---');
  try {
    const createdLow = await GrievanceService.createGrievance(citizenProfile.id, {
      subject: 'Inquiry about quantum physics lectures',
      description: 'Could you please explain how subatomic quantum particles behave and whether physics seminars will be held in our town?',
      category: 'General',
      location: 'Ward 2',
      preferred_language: 'en'
    });

    lowConfidenceGrievanceId = createdLow.id;

    // Process routing
    const routedLow = await AIRoutingService.processGrievanceRouting(createdLow);

    // Verify audit record has flagged_for_review
    const { data: lowAudit } = await supabaseServer
      .from('grievance_ai_routings')
      .select('*')
      .eq('grievance_id', lowConfidenceGrievanceId)
      .single();

    if (lowAudit && lowAudit.routing_status === 'flagged_for_review') {
      reportPass(5, 'Low-confidence audit recorded as "flagged_for_review"', 
        `Score: ${lowAudit.confidence_score} (< 0.65 threshold), Status: ${lowAudit.routing_status}`);
    } else {
      reportFail(5, 'Low-confidence audit status incorrect', lowAudit?.routing_status);
    }

    // Verify grievances table department remains NULL
    const { data: checkLowGrievance } = await supabaseServer
      .from('grievances')
      .select('department')
      .eq('id', lowConfidenceGrievanceId)
      .single();

    if (checkLowGrievance && checkLowGrievance.department === null) {
      reportPass(6, 'Low-confidence grievance remains department = NULL (Pending AI Routing / Review)', 'Confirmed department is NULL');
    } else {
      reportFail(6, 'Low-confidence grievance should NOT have a department assigned', `department: ${checkLowGrievance?.department}`);
    }
  } catch (err) {
    reportFail(5, 'Low confidence test failed with exception', err.message);
  }

  // -------------------------------------------------------------------------
  // TEST CASE 3: Graceful Failover when AI Service is Offline
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 3: Resilient Failover on AI Service Outage ---');
  try {
    const originalUrl = process.env.AI_SERVICE_URL;
    process.env.AI_SERVICE_URL = 'http://127.0.0.1:9999'; // Dead port

    const createdOffline = await GrievanceService.createGrievance(citizenProfile.id, {
      subject: 'Dangerous potholes on Ring Road',
      description: 'Big potholes causing two wheeler accidents during rain on the outer ring road.',
      category: 'Roads',
      location: 'Ring Road Junction',
      preferred_language: 'en'
    });

    offlineFallbackGrievanceId = createdOffline.id;

    // Call routing pipeline with dead service
    const offlineResult = await AIRoutingService.processGrievanceRouting(createdOffline);

    // Verify grievance still exists and is untouched
    const { data: persistedOffline } = await supabaseServer
      .from('grievances')
      .select('*')
      .eq('id', offlineFallbackGrievanceId)
      .single();

    if (persistedOffline && persistedOffline.id === offlineFallbackGrievanceId && persistedOffline.department === null) {
      reportPass(7, 'Graceful Failover: Grievance preserved with department = NULL during AI outage', `Ticket ID: ${persistedOffline.id}`);
    } else {
      reportFail(7, 'Grievance was corrupted or lost during AI outage', null);
    }

    // Restore real URL
    process.env.AI_SERVICE_URL = originalUrl;
  } catch (err) {
    reportFail(7, 'Offline failover test threw uncaught error', err.message);
  }

  // -------------------------------------------------------------------------
  // TEST CASE 4: Citizen Visibility & Official Dashboard Filtering
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 4: Citizen Retrieval & Department Workflow Integrity ---');
  try {
    // Citizen queries their tickets
    const citizenTickets = await GrievanceService.getCitizenGrievances(citizenProfile.id);

    if (citizenTickets && citizenTickets.some(t => t.id === highConfidenceGrievanceId)) {
      reportPass(8, 'Citizen can view submitted & routed grievances in their list', `Found ${citizenTickets.length} total tickets for citizen`);
    } else {
      reportFail(8, 'Citizen cannot find routed ticket in list', null);
    }

    // Official query for "Water Supply" department
    const { data: waterDeptsGrievances, error: waterErr } = await supabaseServer
      .from('grievances')
      .select('id, subject, department')
      .eq('department', 'Water Supply');

    const hasWaterTicket = waterDeptsGrievances?.some(t => t.id === highConfidenceGrievanceId);
    const hasUnassignedTicket = waterDeptsGrievances?.some(t => t.id === lowConfidenceGrievanceId);

    if (hasWaterTicket && !hasUnassignedTicket) {
      reportPass(9, 'Official Department Filter: "Water Supply" official dashboard sees only Water Supply tickets', 
        `Water Department pool contains ticket ${highConfidenceGrievanceId} and excludes unassigned ticket ${lowConfidenceGrievanceId}`);
    } else {
      reportFail(9, 'Department filtering violation', `hasWater: ${hasWaterTicket}, hasUnassigned: ${hasUnassignedTicket}`);
    }

    // Phase 7 Official Status Workflow test: Update status to 'in_progress' and log history
    const { data: updatedStatus, error: statusErr } = await supabaseServer
      .from('grievances')
      .update({ status: 'in_progress', updated_at: new Date().toISOString() })
      .eq('id', highConfidenceGrievanceId)
      .select()
      .single();

    const { error: historyErr } = await supabaseServer
      .from('grievance_status_history')
      .insert([{
        grievance_id: highConfidenceGrievanceId,
        old_status: 'submitted',
        new_status: 'in_progress',
        notes: 'Assigned to field engineer for pipeline repair.',
        changed_by: citizenProfile.id
      }]);

    if (!statusErr && !historyErr && updatedStatus.status === 'in_progress') {
      reportPass(10, 'Phase 7 Official status workflow continues to work seamlessly', 
        `Status transitioned: submitted -> in_progress, status history record created.`);
    } else {
      reportFail(10, 'Status transition failed', statusErr?.message || historyErr?.message);
    }
  } catch (err) {
    reportFail(8, 'Workflow test threw exception', err.message);
  }

  // -------------------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------------------
  console.log('\n======================================================================');
  console.log(`FINAL RESULTS: ${passedCount} Passed, ${failedCount} Failed`);
  console.log('======================================================================');

  if (failedCount === 0) {
    console.log('\n🌟 PHASE 8 — END-TO-END VERIFIED 🌟\n');
  } else {
    console.error('\n❌ PHASE 8 VERIFICATION FAILED\n');
    process.exit(1);
  }
}

runEndToEndVerification();
