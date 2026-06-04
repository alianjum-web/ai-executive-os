"use client";

import { useEffect } from "react";
import { createClient } from "@/common/services/supabase/client";
import { isSupabaseConfigured } from "@/common/services/supabase/env";
import { useOrg } from "@/common/hooks/useOrg";
import { useUser } from "@/common/hooks/useUser";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, clearUser } = useUser();
  const { setOrg, clearOrg } = useOrg();

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      return;
    }
    const supabase = createClient();

    const syncSession = (session: { user: { email?: string; user_metadata?: Record<string, unknown>; id: string } } | null) => {
      if (session?.user) {
        const meta = session.user.user_metadata ?? {};
        setUser({
          email: session.user.email ?? null,
          role: (meta.role as string) ?? "employee",
        });
        setOrg({
          orgId: meta.org_id ? String(meta.org_id) : null,
          orgName: meta.org_name ? String(meta.org_name) : null,
        });
      } else {
        clearUser();
        clearOrg();
      }
    };

    supabase.auth.getSession().then(({ data }) => syncSession(data.session));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => syncSession(session));

    return () => subscription.unsubscribe();
  }, [setUser, clearUser, setOrg, clearOrg]);

  return children;
}
