import { createClient } from "@/lib/supabase/client";

export async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  try {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    const session = data.session;
    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
      const meta = session.user.user_metadata ?? {};
      if (meta.org_id) headers["X-Org-Id"] = String(meta.org_id);
      if (meta.role) headers["X-User-Role"] = String(meta.role);
      if (session.user.id) headers["X-User-Id"] = session.user.id;
    }
  } catch {
    // Supabase not configured — dev headers optional
  }

  return headers;
}
