import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export type Role = 'employee' | 'admin';

/** A row from the `profiles` table, joined to the signed-in auth user. */
export interface Profile {
  id: string;
  full_name: string;
  employee_id: string | null;
  department: string | null;
  role: Role;
  shift: string | null;
  birth_date: string | null;
  join_date: string | null;
}

interface AuthValue {
  session: Session | null;
  profile: Profile | null;
  /** True during the initial session restore — App shows a splash meanwhile. */
  loading: boolean;
  configured: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, employee_id, department, role, shift, birth_date, join_date')
      .eq('id', userId)
      .single();
    setProfile((data as Profile) ?? null);
  }, []);

  // Restore any persisted session on launch, then keep in sync with auth events.
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session) await loadProfile(data.session.user.id);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, next) => {
      setSession(next);
      if (next) {
        await loadProfile(next.user.id);
      } else {
        setProfile(null);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [loadProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    return { error: error?.message };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session) await loadProfile(session.user.id);
  }, [session, loadProfile]);

  const value = useMemo<AuthValue>(
    () => ({ session, profile, loading, configured: isSupabaseConfigured, signIn, signOut, refreshProfile }),
    [session, profile, loading, signIn, signOut, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an <AuthProvider>');
  return ctx;
}
