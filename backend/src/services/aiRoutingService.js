import { supabaseServer } from '../config/supabase.js';
import { NotificationService } from './notificationService.js';

export class AIRoutingService {
  /**
   * Invokes the internal Python FastAPI AI Semantic Routing Microservice
   */
  static async callAIService({ subject, description, category = null, location = null, preferred_language = null }) {
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    const aiServiceSecret = process.env.AI_SERVICE_SECRET || '';

    const payload = {
      subject: subject ? subject.trim() : '',
      description: description ? description.trim() : '',
    };

    if (category && typeof category === 'string' && category.trim()) {
      payload.category = category.trim();
    }
    if (location && typeof location === 'string' && location.trim()) {
      payload.location = location.trim();
    }
    if (preferred_language && typeof preferred_language === 'string' && preferred_language.trim()) {
      payload.preferred_language = preferred_language.trim();
    }

    const response = await fetch(`${aiServiceUrl}/api/v1/route`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${aiServiceSecret}`,
      },
      body: JSON.stringify(payload),
      // Set reasonable timeout
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`AI Service returned status ${response.status}: ${errBody}`);
    }

    return await response.json();
  }

  static async routeGrievance({ subject, description, category, location, preferred_language }) {
    try {
      return await this.callAIService({ subject, description, category, location, preferred_language });
    } catch (err) {
      console.warn(`[AIRoutingService] routeGrievance failed: ${err.message}`);
      return null;
    }
  }

  /**
   * Verifies that the predicted department exists as an active entry in public.departments
   */
  static async validateDepartment(departmentName) {
    if (!departmentName || typeof departmentName !== 'string') return false;

    const { data, error } = await supabaseServer
      .from('departments')
      .select('name, is_active')
      .eq('name', departmentName.trim())
      .eq('is_active', true)
      .maybeSingle();

    if (error || !data) {
      return false;
    }
    return true;
  }

  /**
   * Persists an immutable audit log record to public.grievance_ai_routings
   */
  static async recordAIRoutingAudit(grievanceId, aiResult, finalRoutingStatus) {
    const auditRecord = {
      grievance_id: grievanceId,
      predicted_department: aiResult.predicted_department || 'Unassigned',
      confidence_score: aiResult.confidence_score !== undefined ? aiResult.confidence_score : 0.0,
      routing_status: finalRoutingStatus,
      model_name: aiResult.model_name || 'sentence-transformers/all-MiniLM-L6-v2',
      model_version: aiResult.model_version || '1.1',
      top_predictions: aiResult.top_predictions || [],
      routed_at: new Date().toISOString(),
    };

    const { error } = await supabaseServer
      .from('grievance_ai_routings')
      .insert([auditRecord]);

    if (error) {
      console.error('[AIRoutingService] Failed to write AI routing audit record:', error.message);
    }
  }

  /**
   * Full pipeline: routes the grievance, validates the department, logs the audit,
   * and conditionally assigns grievances.department if confidence meets threshold.
   */
  static async processGrievanceRouting(grievance) {
    if (!grievance || !grievance.id) {
      return grievance;
    }

    try {
      console.log(`[AIRoutingService] Initiating semantic routing for ticket: ${grievance.id}`);
      const aiResult = await this.callAIService({
        subject: grievance.subject,
        description: grievance.description,
        category: grievance.category,
        location: grievance.location,
        preferred_language: grievance.preferred_language,
      });

      const isValidDept = await this.validateDepartment(aiResult.predicted_department);
      let finalStatus = aiResult.routing_status;

      // If predicted department does not exist in master catalogue, flag for review
      if (!isValidDept) {
        console.warn(`[AIRoutingService] Predicted department "${aiResult.predicted_department}" not found in active departments.`);
        finalStatus = 'flagged_for_review';
      }

      // Record audit history regardless of confidence
      await this.recordAIRoutingAudit(grievance.id, aiResult, finalStatus);

      // High-confidence validated prediction -> assign department
      if (finalStatus === 'completed' && isValidDept) {
        const { data: updatedGrievance, error: updateErr } = await supabaseServer
          .from('grievances')
          .update({
            department: aiResult.predicted_department,
            updated_at: new Date().toISOString(),
          })
          .eq('id', grievance.id)
          .select()
          .single();

        if (updateErr) {
          console.error('[AIRoutingService] Failed to update grievance department:', updateErr.message);
          return grievance;
        }

        console.log(
          `[AIRoutingService] Successfully routed ticket ${grievance.id} to "${aiResult.predicted_department}" (Confidence: ${aiResult.confidence_score})`
        );

        // Phase 10 Notification: Citizen + Department Officials
        try {
          await NotificationService.notifyAIRouted(updatedGrievance, aiResult.predicted_department);
        } catch (notifErr) {
          console.warn('[AIRoutingService] Notification warning:', notifErr.message);
        }

        return updatedGrievance;
      }

      // Low confidence or flagged -> keep department = NULL
      console.log(
        `[AIRoutingService] Ticket ${grievance.id} flagged for review (Confidence: ${aiResult.confidence_score}). Kept unassigned.`
      );

      // Phase 10 Notification: Citizen Review Alert
      try {
        await NotificationService.notifyAIReviewRequired(grievance);
      } catch (notifErr) {
        console.warn('[AIRoutingService] Notification warning:', notifErr.message);
      }

      return grievance;
    } catch (err) {
      // Safe error handling: never fail the grievance creation if AI service is offline
      console.error(`[AIRoutingService] AI routing bypassed due to error: ${err.message}`);
      return grievance;
    }
  }
}
