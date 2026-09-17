import { AIRoutingService } from '../src/services/aiRoutingService.js';
import { supabaseServer } from '../src/config/supabase.js';

console.log('--- STARTING NODE.JS AI ROUTING INTEGRATION TESTS ---');

async function runTests() {
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

  // Test 1: Fetch active catalogue from Supabase
  console.log('\n[Test 1] Validating active departments catalogue in Supabase...');
  try {
    const { data: depts, error } = await supabaseServer
      .from('departments')
      .select('name, code, is_active')
      .eq('is_active', true);
    
    assert(!error && depts && depts.length > 0, `Active departments fetched successfully (${depts ? depts.length : 0} active departments in DB)`);
  } catch (err) {
    assert(false, `Failed to query departments: ${err.message}`);
  }

  // Test 2: Department existence validation logic
  console.log('\n[Test 2] Testing Node Department Validation Logic...');
  try {
    const isValidWater = await AIRoutingService.validateDepartment('Water Supply');
    assert(isValidWater === true, 'Known department "Water Supply" validated as TRUE');

    const isInvalidDept = await AIRoutingService.validateDepartment('NonExistentDepartment_XYZ');
    assert(isInvalidDept === false, 'Invalid/Unknown department validated as FALSE');
  } catch (err) {
    assert(false, `Department validation failed with error: ${err.message}`);
  }

  // Test 3: Live call from Node.js to Python FastAPI AI service
  console.log('\n[Test 3] Testing Node.js -> Python FastAPI AI Service Communication...');
  try {
    const routingResult = await AIRoutingService.routeGrievance({
      subject: 'Drinking water pipeline contamination',
      description: 'The drinking water pipeline has burst and dirty water is leaking continuously on main road.'
    });

    assert(routingResult !== null, 'AI Service returned a non-null routing response');
    assert(typeof routingResult.predicted_department === 'string', `Predicted department: "${routingResult.predicted_department}"`);
    assert(typeof routingResult.confidence_score === 'number', `Confidence score: ${routingResult.confidence_score}`);
    assert(['completed', 'flagged_for_review'].includes(routingResult.routing_status), `Routing status valid: "${routingResult.routing_status}"`);
    assert(Array.isArray(routingResult.top_predictions) && routingResult.top_predictions.length > 0, `Top-K predictions returned (${routingResult.top_predictions.length} items)`);
  } catch (err) {
    assert(false, `Live call to AI service failed: ${err.message}`);
  }

  // Test 4: Graceful Failover when AI service receives invalid endpoint
  console.log('\n[Test 4] Testing Graceful Failover when AI service is unavailable...');
  try {
    const originalUrl = process.env.AI_SERVICE_URL;
    process.env.AI_SERVICE_URL = 'http://127.0.0.1:9999'; // Dead port
    
    const fallbackResult = await AIRoutingService.routeGrievance({
      subject: 'Power outage',
      description: 'Electricity cut'
    });

    assert(fallbackResult === null, 'Graceful failover: returns null on network outage without crashing');
    process.env.AI_SERVICE_URL = originalUrl;
  } catch (err) {
    assert(false, `Failover threw uncaught error: ${err.message}`);
  }

  console.log(`\n========================================`);
  console.log(`Integration Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
