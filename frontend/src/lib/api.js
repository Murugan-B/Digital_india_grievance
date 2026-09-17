import { supabase } from './supabaseClient';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Helper to fetch authenticated options with the current Supabase Bearer token.
 */
async function getAuthHeaders() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('[API Helper] Session error:', error.message);
    }
    const token = session?.access_token;

    const headers = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  } catch (err) {
    console.error('[API Helper] Failed to retrieve auth token:', err);
    return {
      'Content-Type': 'application/json',
    };
  }
}

/**
 * Unified request executor with normalized error handling
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  let response;

  try {
    response = await fetch(url, options);
  } catch (networkErr) {
    console.error('[API Network Error]:', networkErr);
    throw new Error('Unable to connect to the grievance service. Please check your network connection and try again.');
  }

  let data;
  try {
    data = await response.json();
  } catch (parseErr) {
    console.error('[API Response Parsing Error]:', parseErr);
    throw new Error('Received an unparseable response from the server.');
  }

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Your session has expired. Please sign in again.');
    }
    if (response.status === 403) {
      throw new Error(data.message || 'You do not have permission to perform this action.');
    }
    if (response.status === 429) {
      throw new Error(data.message || 'Too many requests. Please slow down and try again in a few moments.');
    }
    if (response.status >= 500) {
      throw new Error('Something went wrong on the server. Please try again later.');
    }
    throw new Error(data.message || 'An error occurred while processing your request.');
  }

  return data;
}

export const api = {
  /**
   * Health check endpoint (GET /api/health)
   */
  async getHealth() {
    return apiRequest('/health', { method: 'GET' });
  },

  /**
   * Submit a new grievance (POST /api/grievances)
   */
  async submitGrievance(payload) {
    const headers = await getAuthHeaders();
    return apiRequest('/grievances', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
  },

  /**
   * Get all grievances for authenticated citizen (GET /api/grievances)
   */
  async getMyGrievances() {
    const headers = await getAuthHeaders();
    const result = await apiRequest('/grievances', {
      method: 'GET',
      headers,
    });
    return result.data || [];
  },

  /**
   * Get single grievance by ID for authenticated citizen (GET /api/grievances/:id)
   */
  async getGrievanceById(id) {
    const headers = await getAuthHeaders();
    const result = await apiRequest(`/grievances/${encodeURIComponent(id)}`, {
      method: 'GET',
      headers,
    });
    return result.data;
  },

  // ============================================================================
  // OFFICIAL PORTAL APIS (Phase 7)
  // ============================================================================

  /**
   * Get grievances assigned to the official's department (GET /api/official/grievances)
   */
  async getOfficialGrievances({ status, priority, search } = {}) {
    const headers = await getAuthHeaders();
    const params = new URLSearchParams();
    if (status && status !== 'all') params.append('status', status);
    if (priority && priority !== 'all') params.append('priority', priority);
    if (search && search.trim()) params.append('search', search.trim());

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const result = await apiRequest(`/official/grievances${queryString}`, {
      method: 'GET',
      headers,
    });
    return result.data || [];
  },

  /**
   * Get department dashboard statistics (GET /api/official/grievances/stats)
   */
  async getOfficialStats() {
    const headers = await getAuthHeaders();
    const result = await apiRequest('/official/grievances/stats', {
      method: 'GET',
      headers,
    });
    return result.data;
  },

  /**
   * Get single department grievance detail with timeline (GET /api/official/grievances/:id)
   */
  async getOfficialGrievanceById(id) {
    const headers = await getAuthHeaders();
    const result = await apiRequest(`/official/grievances/${encodeURIComponent(id)}`, {
      method: 'GET',
      headers,
    });
    return result.data;
  },

  /**
   * Update status of department grievance (PATCH /api/official/grievances/:id/status)
   */
  async updateOfficialGrievanceStatus(id, status, notes = '') {
    const headers = await getAuthHeaders();
    return apiRequest(`/official/grievances/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status, notes }),
    });
  },
};
