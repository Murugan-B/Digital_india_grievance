import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch profile record from public.profiles table or secure backend endpoint
  const fetchProfile = useCallback(async (userId, tokenOverride = null) => {
    if (!userId) {
      setProfile(null);
      return null;
    }

    try {
      // 1. Direct Supabase PostgREST profile query
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (!error && data) {
        setProfile(data);
        return data;
      }

      if (error) {
        console.warn('[AuthContext] Supabase profile query note:', error.message);
      }

      // 2. Resilient fallback to backend authenticated profile endpoint
      let token = tokenOverride;
      if (!token) {
        const { data: sessionData } = await supabase.auth.getSession();
        token = sessionData?.session?.access_token;
      }

      if (token) {
        const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
        const res = await fetch(`${apiBase}/auth/profile`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const body = await res.json();
          if (body?.data) {
            setProfile(body.data);
            return body.data;
          }
        }
      }

      return null;
    } catch (err) {
      console.error('[AuthContext] Profile fetch exception:', err);
      return null;
    }
  }, []);

  // Initialize auth state and subscribe to auth changes
  useEffect(() => {
    let mounted = true;

    async function getInitialSession() {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (mounted) {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          if (currentSession?.user) {
            await fetchProfile(currentSession.user.id);
          }
        }
      } catch (err) {
        console.warn('[AuthContext] Initial session check:', err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    getInitialSession();

    // Listen for auth state transitions (SIGN_IN, SIGN_OUT, TOKEN_REFRESHED, USER_UPDATED)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;

      setSession(newSession);
      const currentUser = newSession?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        await fetchProfile(currentUser.id);
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [fetchProfile]);

  // Sign In with email and password
  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) throw error;

    if (data.user) {
      const userProfile = await fetchProfile(data.user.id, data.session?.access_token);
      return { user: data.user, session: data.session, profile: userProfile };
    }

    return data;
  };

  // Sign Up with user metadata
  const signUp = async (email, password, metadata = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: metadata.fullName,
          mobile_number: metadata.mobile,
          role: metadata.role || 'citizen',
          department: metadata.department || null,
          designation: metadata.designation || null,
          preferred_language: metadata.preferredLang || 'en',
        },
      },
    });

    if (error) throw error;
    return data;
  };

  // Sign Out
  const signOut = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  // Password Recovery email
  const resetPassword = async (email) => {
    const redirectUrl = `${window.location.origin}/reset-password`;
    const { data, error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: redirectUrl,
    });
    if (error) throw error;
    return data;
  };

  // Update password
  const updatePassword = async (newPassword) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
    return data;
  };

  // Resend signup verification email
  const resendVerificationEmail = async (email) => {
    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim(),
    });
    if (error) throw error;
    return data;
  };

  const value = {
    user,
    profile,
    session,
    loading,
    isAuthenticated: Boolean(user),
    isSupabaseConfigured,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    resendVerificationEmail,
    refreshProfile: () => fetchProfile(user?.id),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
