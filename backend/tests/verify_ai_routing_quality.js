import { supabaseServer } from '../src/config/supabase.js';
import { AIRoutingService } from '../src/services/aiRoutingService.js';

async function testBusGrievanceRouting() {
  console.log('='.repeat(70));
  console.log('END-TO-END AI SEMANTIC ROUTING VERIFICATION');
  console.log('='.repeat(70));

  const busGrievance = {
    subject: 'Bus are not regular to our area',
    description: 'Bus are not regular to our area, Bus are not regular to our area',
    category: 'Roads & Transport',
    location: 'Sector 7, North Ward',
    preferred_language: 'en'
  };

  console.log('Testing grievance input:', JSON.stringify(busGrievance, null, 2));

  // Direct AI microservice call
  const aiResult = await AIRoutingService.callAIService(busGrievance);
  console.log('\nAI Microservice Response:');
  console.log(JSON.stringify(aiResult, null, 2));

  // Department validation check
  const isValid = await AIRoutingService.validateDepartment(aiResult.predicted_department);
  console.log(`\nPredicted Department Valid in DB: ${isValid}`);

  // Test Out of Domain query
  const oodQuery = {
    subject: 'Quantum physics equation is wrong',
    description: 'The Schrodinger equation wave function derivative calculation seems mathematically inconsistent.',
    category: null
  };
  const oodResult = await AIRoutingService.callAIService(oodQuery);
  console.log('\nOut-of-Domain Response:');
  console.log(JSON.stringify(oodResult, null, 2));

  console.log('\nVerification complete.');
  process.exit(0);
}

testBusGrievanceRouting().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
