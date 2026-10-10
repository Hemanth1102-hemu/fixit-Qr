import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { apiRequest } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch full user profile from backend/database
  const refreshProfile = async (sessionUser) => {
    if (!sessionUser || !isSupabaseConfigured) {
      setProfile(null);
      return;
    }
    try {
      // First try backend me endpoint
      const res = await apiRequest('/me');
      setProfile(res.data);
    } catch {
      // Direct supabase fallback
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sessionUser.id)
        .single();
      if (!error && data) {
        setProfile(data);
      }
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        refreshProfile(currentUser).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Listen to auth state transitions
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        await refreshProfile(currentUser);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const signIn = async (email, password) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured yet. Please update .env with your credentials.');
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setProfile(null);
  };

  const role = profile?.role || 'student';

  const value = {
    user,
    profile,
    role,
    loading,
    isConfigured: isSupabaseConfigured,
    signIn,
    signOut,
    refreshProfile: () => refreshProfile(user),
    isStudent: role === 'student',
    isFaculty: role === 'faculty',
    isTechnician: role === 'technician',
    isAdmin: role === 'admin',
    isSystemAdmin: role === 'system_admin',
    canManageCampus: role === 'admin' || role === 'system_admin',
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
