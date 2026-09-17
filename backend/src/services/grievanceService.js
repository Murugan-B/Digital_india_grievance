import { supabaseServer } from '../config/supabase.js';

export class GrievanceService {
  /**
   * Submit a new grievance record for an authenticated citizen.
   * State variables (status, priority, department) are strictly controlled by the backend.
   */
  static async createGrievance(citizenId, { subject, description, category, location, preferred_language }) {
    const newGrievance = {
      citizen_id: citizenId,
      subject: subject.trim(),
      description: description.trim(),
      category: category ? category.trim() : null,
      department: null, // Left null for Phase 5 & 6 (AI routing will occur in Phase 8)
      location: location ? location.trim() : null,
      preferred_language: preferred_language ? preferred_language.trim() : 'en',
      status: 'submitted',
      priority: 'normal',
    };

    const { data, error } = await supabaseServer
      .from('grievances')
      .insert([newGrievance])
      .select('id, citizen_id, subject, description, category, department, location, preferred_language, status, priority, created_at, updated_at')
      .single();

    if (error) {
      console.error('[GrievanceService.createGrievance] DB insertion error:', error.message);
      const dbErr = new Error('Failed to record grievance in the database.');
      dbErr.statusCode = 500;
      throw dbErr;
    }

    return data;
  }

  /**
   * Get all grievances belonging strictly to the authenticated citizen.
   */
  static async getCitizenGrievances(citizenId) {
    const { data, error } = await supabaseServer
      .from('grievances')
      .select('id, citizen_id, subject, description, category, department, location, preferred_language, status, priority, created_at, updated_at')
      .eq('citizen_id', citizenId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[GrievanceService.getCitizenGrievances] DB query error:', error.message);
      const dbErr = new Error('Failed to retrieve citizen grievances.');
      dbErr.statusCode = 500;
      throw dbErr;
    }

    return data || [];
  }

  /**
   * Get a single grievance ensuring it belongs strictly to the authenticated citizen.
   */
  static async getGrievanceById(citizenId, grievanceId) {
    const { data, error } = await supabaseServer
      .from('grievances')
      .select('id, citizen_id, subject, description, category, department, location, preferred_language, status, priority, created_at, updated_at')
      .eq('id', grievanceId)
      .eq('citizen_id', citizenId)
      .maybeSingle();

    if (error) {
      console.error('[GrievanceService.getGrievanceById] DB query error:', error.message);
      const dbErr = new Error('Failed to retrieve grievance detail.');
      dbErr.statusCode = 500;
      throw dbErr;
    }

    return data;
  }
}
