import { supabase } from './supabaseClient';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Fetch authenticated request headers with Supabase Bearer token
 */
async function getAuthHeaders() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  } catch (err) {
    console.error('[AdminAPI] Failed to get session token:', err);
    return { 'Content-Type': 'application/json' };
  }
}

/**
 * Common request executor
 */
async function adminRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  let response;

  try {
    response = await fetch(url, options);
  } catch (networkErr) {
    console.error('[AdminAPI Network Error]:', networkErr);
    throw new Error('Unable to connect to Admin Service. Please check server connectivity.');
  }

  let data;
  try {
    data = await response.json();
  } catch (parseErr) {
    console.error('[AdminAPI Parse Error]:', parseErr);
    throw new Error('Received an unparseable response from Admin Service.');
  }

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Admin session expired. Please sign in again.');
    }
    if (response.status === 403) {
      throw new Error(data.message || 'Access Denied: Administrator credentials required.');
    }
    const err = new Error(data.message || 'An error occurred processing the admin request.');
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}

export const adminApi = {
  /**
   * 1. Get live system oversight statistics
   */
  async getSystemStats() {
    const headers = await getAuthHeaders();
    const res = await adminRequest('/admin/stats', { method: 'GET', headers });
    return res.data;
  },

  /**
   * 2. Get paginated user directory
   */
  async getUsers({ page = 1, limit = 20, search = '', role = '', account_status = '' } = {}) {
    const headers = await getAuthHeaders();
    const params = new URLSearchParams();
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);
    if (search && search.trim()) params.append('search', search.trim());
    if (role && role !== 'all') params.append('role', role);
    if (account_status && account_status !== 'all') params.append('account_status', account_status);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const res = await adminRequest(`/admin/users${queryString}`, { method: 'GET', headers });
    return {
      users: res.data || [],
      pagination: res.pagination || {},
    };
  },

  /**
   * 3. Get single user details
   */
  async getUserById(id) {
    const headers = await getAuthHeaders();
    const res = await adminRequest(`/admin/users/${encodeURIComponent(id)}`, { method: 'GET', headers });
    return res.data;
  },

  /**
   * 4. Update user account status (active / pending / suspended)
   */
  async updateUserStatus(id, account_status) {
    const headers = await getAuthHeaders();
    return adminRequest(`/admin/users/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ account_status }),
    });
  },

  /**
   * 5. Verify official registration (approve / reject / suspend)
   */
  async verifyOfficial(id, action) {
    const headers = await getAuthHeaders();
    return adminRequest(`/admin/users/${encodeURIComponent(id)}/verification`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ action }),
    });
  },

  /**
   * 6. Get departments list with active grievance counts
   */
  async getDepartments({ search = '', is_active = '' } = {}) {
    const headers = await getAuthHeaders();
    const params = new URLSearchParams();
    if (search && search.trim()) params.append('search', search.trim());
    if (is_active !== '' && is_active !== 'all') params.append('is_active', is_active);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const res = await adminRequest(`/admin/departments${queryString}`, { method: 'GET', headers });
    return res.data || [];
  },

  /**
   * 7. Create new department
   */
  async createDepartment({ name, code, description }) {
    const headers = await getAuthHeaders();
    return adminRequest('/admin/departments', {
      method: 'POST',
      headers,
      body: JSON.stringify({ name, code, description }),
    });
  },

  /**
   * 8. Update department (edit description or active status with safety check)
   */
  async updateDepartment(id, { description, is_active, force = false }) {
    const headers = await getAuthHeaders();
    return adminRequest(`/admin/departments/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ description, is_active, force }),
    });
  },

  /**
   * 9. Get paginated grievances with multifaceted filters
   */
  async getGrievances({
    page = 1,
    limit = 20,
    search = '',
    status = '',
    priority = '',
    department = '',
    assigned = '',
    from_date = '',
    to_date = '',
  } = {}) {
    const headers = await getAuthHeaders();
    const params = new URLSearchParams();
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);
    if (search && search.trim()) params.append('search', search.trim());
    if (status && status !== 'all') params.append('status', status);
    if (priority && priority !== 'all') params.append('priority', priority);
    if (department && department !== 'all') params.append('department', department);
    if (assigned !== '' && assigned !== 'all') params.append('assigned', assigned);
    if (from_date) params.append('from_date', from_date);
    if (to_date) params.append('to_date', to_date);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const res = await adminRequest(`/admin/grievances${queryString}`, { method: 'GET', headers });
    return {
      grievances: res.data || [],
      pagination: res.pagination || {},
    };
  },

  /**
   * 10. Get full grievance inspection details (citizen + status history + AI routing history)
   */
  async getGrievanceById(id) {
    const headers = await getAuthHeaders();
    const res = await adminRequest(`/admin/grievances/${encodeURIComponent(id)}`, { method: 'GET', headers });
    return res.data;
  },

  /**
   * 11. Get AI semantic routing audit history
   */
  async getAIRoutings({ page = 1, limit = 20, routing_status = '' } = {}) {
    const headers = await getAuthHeaders();
    const params = new URLSearchParams();
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);
    if (routing_status && routing_status !== 'all') params.append('routing_status', routing_status);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const res = await adminRequest(`/admin/ai-routings${queryString}`, { method: 'GET', headers });
    return {
      routings: res.data || [],
      pagination: res.pagination || {},
    };
  },

  /**
   * 12. Get Flagged AI Routings queue
   */
  async getFlaggedAIRoutings({ page = 1, limit = 20 } = {}) {
    const headers = await getAuthHeaders();
    const params = new URLSearchParams();
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const res = await adminRequest(`/admin/ai-routings/flagged${queryString}`, { method: 'GET', headers });
    return {
      routings: res.data || [],
      pagination: res.pagination || {},
    };
  },

  /**
   * 13. Manual department assignment by Administrator
   */
  async manualAssignDepartment(id, department, reason = '') {
    const headers = await getAuthHeaders();
    return adminRequest(`/admin/grievances/${encodeURIComponent(id)}/department`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ department, reason }),
    });
  },
};
