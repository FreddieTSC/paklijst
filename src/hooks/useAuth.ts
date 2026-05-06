import { useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

const AUTO_EMAIL = 'tiemen@namibia.app';
const AUTO_PW = 'inpaklijst2024';

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({ user: null, session: null, loading: true });

  useEffect(() => {
    let alive = true;

    async function init() {
      const { data } = await supabase.auth.getSession();
      if (!alive) return;

      if (data.session) {
        setState({ session: data.session, user: data.session.user, loading: false });
        return;
      }

      const { data: signInData } = await supabase.auth.signInWithPassword({
        email: AUTO_EMAIL,
        password: AUTO_PW,
      });
      if (!alive) return;
      setState({
        session: signInData.session,
        user: signInData.session?.user ?? null,
        loading: false,
      });
    }

    init();

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      if (!alive) return;
      setState({ session, user: session?.user ?? null, loading: false });
    });

    return () => { alive = false; sub.subscription.unsubscribe(); };
  }, []);

  return state;
}
