import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { apiRequest } from '../lib/api';
import { getDashboardForRole } from '../constants/routes';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isProvisioned, setIsProvisioned] = useState(true);
  const [isActive, setIsActive] = useState(true);

  // Authoritative role resolution from backend /me endpoint
  const resolveTrustedIdentity = async (sessionUser) => {
    if (!sessionUser) {
      setProfile(null);
      setIsProvisioned(true);
      setIsActive(true);
      return null;
    }

    if (!isSupabaseConfigured) {
      // In preview mode before Supabase credentials set:
      // Derive role deterministically from user email for demonstration
      const email = sessionUser.email || '';
      let mockRole = 'student';
      if (email.includes('faculty')) mockRole = 'faculty';
      else if (email.includes('tech')) mockRole = 'technician';
      else if (email.includes('admin') || email.includes('estate')) mockRole = 'maintenance_admin';
      else if (email.includes('supervisor')) mockRole = 'supervisor';

      const mockProfile = {
        id: sessionUser.id,
        email: sessionUser.email,
        full_name: sessionUser.user_metadata?.full_name || email.split('@')[0],
        role: mockRole,
        roles: [mockRole],
        default_destination: getDashboardForRole(mockRole),
        is_active: true
      };
      setProfile(mockProfile);
      setIsProvisioned(true);
      setIsActive(true);
      return mockProfile;
    }

    try {
      const res = await apiRequest('/me');
      if (res && res.data) {
        setProfile(res.data);
        setIsProvisioned(true);
        setIsActive(res.data.is_active !== false);
        return res.data;
      }
    } catch (err) {
      if (err.data?.error === 'AccountNotProvisioned') {
        setIsProvisioned(false);
      } else if (err.data?.error === 'AccountDisabled') {
        setIsActive(false);
      } else {
        // Fallback query to profiles table directly
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', sessionUser.id)
          .single();

        if (error || !data || !data.role) {
          setIsProvisioned(false);
        } else {
          setProfile({
            ...data,
            default_destination: getDashboardForRole(data.role)
          });
          setIsProvisioned(true);
          setIsActive(data.is_active !== false);
          return data;
        }
      }
    }
    return null;
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      // Auto-restore dummy session if available
      const savedUserStr = localStorage.getItem('fixit_demo_user');
      if (savedUserStr) {
        try {
          const savedUser = JSON.parse(savedUserStr);
          setUser(savedUser);
          resolveTrustedIdentity(savedUser);
        } catch {
          // ignore
        }
      }
      setLoading(false);
      return;
    }

    // Get current Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        resolveTrustedIdentity(currentUser).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Listen to Supabase auth transitions
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        await resolveTrustedIdentity(currentUser);
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
      // Preview mode mock login
      const demoUser = {
        id: `usr_${Date.now()}`,
        email,
        user_metadata: { full_name: email.split('@')[0] }
      };
      localStorage.setItem('fixit_demo_user', JSON.stringify(demoUser));
      setUser(demoUser);
      const prof = await resolveTrustedIdentity(demoUser);
      return { user: demoUser, profile: prof, destination: prof?.default_destination || '/student/dashboard' };
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    setUser(data.user);
    const resolved = await resolveTrustedIdentity(data.user);
    return {
      user: data.user,
      profile: resolved,
      destination: resolved?.default_destination || getDashboardForRole(resolved?.role)
    };
  };

  const signOut = async () => {
    localStorage.removeItem('fixit_demo_user');
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setProfile(null);
    setIsProvisioned(true);
    setIsActive(true);
  };

  const role = profile?.role || 'student';
  const defaultDestination = profile?.default_destination || getDashboardForRole(role);

  const value = {
    user,
    profile,
    role,
    roles: profile?.roles || [role],
    defaultDestination,
    isProvisioned,
    isActive,
    loading,
    isConfigured: isSupabaseConfigured,
    signIn,
    signOut,
    refreshProfile: () => resolveTrustedIdentity(user),
    // Role helpers
    isStudent: role === 'student',
    isFaculty: role === 'faculty',
    isTechnician: role === 'technician',
    isMaintenanceAdmin: role === 'maintenance_admin' || role === 'admin',
    isSupervisor: role === 'supervisor' || role === 'system_admin'
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
