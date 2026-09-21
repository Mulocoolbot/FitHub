import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../../shared/lib/supabase';
import { signOut as authSignOut } from '../api/auth';
import type { Session, User } from '@supabase/supabase-js';

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  initialized: boolean;
}

/**
 * Core auth hook. Manages session state and listens for auth changes.
 * Handles auto-refresh and expired refresh token (redirects to login).
 */
export function useAuth() {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    loading: true,
    initialized: false,
  });

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState({
        session,
        user: session?.user ?? null,
        loading: false,
        initialized: true,
      });
    });

    // Listen for auth changes (sign in, sign out, token refresh, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setState((prev) => ({
        ...prev,
        session,
        user: session?.user ?? null,
        loading: false,
      }));
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }));
    await authSignOut();
    setState({
      session: null,
      user: null,
      loading: false,
      initialized: true,
    });
  }, []);

  return {
    ...state,
    isAuthenticated: state.session !== null,
    signOut,
  };
}
