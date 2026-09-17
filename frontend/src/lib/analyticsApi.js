import { supabase } from './supabaseClient';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

async function getAuthHeaders() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  } catch (err) {
    console.error('[AnalyticsAPI] Session error:', err);
    return { 'Content-Type': 'application/json' };
  }
}

export const analyticsApi = {
  async getOverview({ days = 30 } = {}) {
    const headers = await getAuthHeaders();
    const params = new URLSearchParams();
    if (days) params.append('days', days);

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${API_BASE_URL}/admin/analytics/overview${qs}`, {
      method: 'GET',
      headers,
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch analytics overview');
    }
    return data.data;
  },
};
