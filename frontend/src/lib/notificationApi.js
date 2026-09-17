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
    console.error('[NotificationAPI] Session error:', err);
    return { 'Content-Type': 'application/json' };
  }
}

async function notifRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Notification service error');
    }
    return data;
  } catch (err) {
    console.warn('[NotificationAPI] Request warning:', err.message);
    throw err;
  }
}

export const notificationApi = {
  async getMyNotifications({ page = 1, limit = 20, unread_only = false } = {}) {
    const headers = await getAuthHeaders();
    const params = new URLSearchParams();
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);
    if (unread_only) params.append('unread_only', 'true');

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await notifRequest(`/notifications${qs}`, { method: 'GET', headers });
    return {
      notifications: res.data || [],
      pagination: res.pagination || {},
    };
  },

  async getUnreadCount() {
    const headers = await getAuthHeaders();
    const res = await notifRequest('/notifications/unread-count', { method: 'GET', headers });
    return res.data?.unread_count || 0;
  },

  async markAsRead(id) {
    const headers = await getAuthHeaders();
    return notifRequest(`/notifications/${encodeURIComponent(id)}/read`, {
      method: 'PATCH',
      headers,
    });
  },

  async markAllAsRead() {
    const headers = await getAuthHeaders();
    return notifRequest('/notifications/read-all', {
      method: 'PATCH',
      headers,
    });
  },
};
