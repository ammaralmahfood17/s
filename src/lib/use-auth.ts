'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import type { Profile } from '@/types';

export interface UseAuthReturn {
  /** The current Supabase Auth user (null when signed out). */
  user: User | null;
  /** The current Supabase session. */
  session: Session | null;
  /** The user's profile row from the `profiles` table. */
  profile: Profile | null;
  /** True while the initial auth check is in flight. */
  loading: boolean;
  /** Sign the current user out and redirect to /login. */
  signOut: () => Promise<void>;
  /** True if the user is staff of at least one restaurant. */
  isStaff: boolean;
  /** True if the user is the owner of at least one restaurant. */
  isOwner: boolean;
  /** True if the user has a row in the `super_admins` table. */
  isAdmin: boolean;
}

/**
 * Custom hook that wraps Supabase Auth + Dokan-specific roles.
 *
 * Usage:
 * ```tsx
 * const { user, profile, loading, isOwner, isStaff, isAdmin, signOut } = useAuth();
 * ```
 */
export function useAuth(): UseAuthReturn {
  const supabase = createClient();

  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Role flags ───────────────────────────────────────────────
  const [isOwner, setIsOwner] = useState(false);
  const [isStaff, setIsStaff] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  /**
   * Fetch the user's profile, restaurant ownership, staff membership,
   * and admin status in parallel.
   */
  const loadUserData = useCallback(
    async (userId: string) => {
      const [profileRes, ownerRes, staffRes, adminRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('restaurants').select('id').eq('owner_id', userId).limit(1),
        supabase.from('restaurant_staff').select('id').eq('user_id', userId).limit(1),
        supabase.from('super_admins').select('id').eq('user_id', userId).single(),
      ]);

      if (profileRes.data) setProfile(profileRes.data as Profile);
      setIsOwner((ownerRes.data ?? []).length > 0);
      setIsStaff((staffRes.data ?? []).length > 0);
      setIsAdmin(!!adminRes.data);
    },
    [supabase],
  );

  useEffect(() => {
    let mounted = true;

    // 1. Get initial session
    const init = async () => {
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      if (!mounted) return;

      setSession(initialSession);
      setUser(initialSession?.user ?? null);

      if (initialSession?.user) {
        await loadUserData(initialSession.user.id);
      }

      setLoading(false);
    };

    init();

    // 2. Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (!mounted) return;

        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          await loadUserData(newSession.user.id);
        } else {
          setProfile(null);
          setIsOwner(false);
          setIsStaff(false);
          setIsAdmin(false);
        }

        setLoading(false);
      },
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, loadUserData]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    // The onAuthStateChange listener above will clear all state.
  }, [supabase]);

  return {
    user,
    session,
    profile,
    loading,
    signOut,
    isStaff,
    isOwner,
    isAdmin,
  };
}
