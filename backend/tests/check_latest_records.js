import { supabaseServer } from '../src/config/supabase.js';

async function verifyLatest() {
  const { data: latestGrievances } = await supabaseServer
    .from('grievances')
    .select('id, subject, description, department, status, created_at')
    .order('created_at', { ascending: false })
    .limit(3);

  console.log('--- RECENT GRIEVANCES ---');
  console.table(latestGrievances);

  if (latestGrievances && latestGrievances.length > 0) {
    const ids = latestGrievances.map(g => g.id);
    const { data: routings } = await supabaseServer
      .from('grievance_ai_routings')
      .select('id, grievance_id, predicted_department, confidence_score, routing_status, model_name, routed_at')
      .in('grievance_id', ids)
      .order('routed_at', { ascending: false });

    console.log('\n--- CORRESPONDING AI ROUTING AUDIT ROWS ---');
    console.table(routings);
  }
}

verifyLatest();
