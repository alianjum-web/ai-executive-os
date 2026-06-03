"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, clearUser } = useUser();

  useEffect(() => {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      return;
    }
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      const session = data.session;
      if (session?.user) {
        setUser({ email: session.user.email ?? null });
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({ email: session.user.email ?? null });
      } else {
        clearUser();
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser, clearUser]);

  return children;
}
