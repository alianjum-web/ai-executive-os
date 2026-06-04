import type { AuthError, Session, User } from "@supabase/supabase-js";
import { createClient } from "@/common/services/supabase/client";

export type SignInCredentials = {
  email: string;
  password: string;
};

export type SignUpCredentials = SignInCredentials & {
  fullName?: string;
  metadata?: Record<string, unknown>;
};

export const authService = {
  getClient() {
    return createClient();
  },

  async signIn(credentials: SignInCredentials) {
    const supabase = createClient();
    return supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });
  },

  async signUp(credentials: SignUpCredentials) {
    const supabase = createClient();
    const data = credentials.metadata
      ? credentials.metadata
      : credentials.fullName
        ? { full_name: credentials.fullName }
        : undefined;
    return supabase.auth.signUp({
      email: credentials.email,
      password: credentials.password,
      options: data ? { data } : undefined,
    });
  },

  async signOut() {
    const supabase = createClient();
    return supabase.auth.signOut();
  },

  async getSession(): Promise<{
    session: Session | null;
    error: AuthError | null;
  }> {
    const supabase = createClient();
    const { data, error } = await supabase.auth.getSession();
    return { session: data.session, error };
  },

  onAuthStateChange(
    callback: (event: string, session: Session | null) => void
  ) {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
    return subscription;
  },

  getUserFromSession(session: Session | null): User | null {
    return session?.user ?? null;
  },
};
