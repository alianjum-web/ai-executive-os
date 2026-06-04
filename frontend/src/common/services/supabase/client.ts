import { createBrowserClient } from "@supabase/ssr";

import { getSupabasePublishableKey, getSupabaseUrl } from "@/common/services/supabase/env";

export function createClient() {
  return createBrowserClient(getSupabaseUrl(), getSupabasePublishableKey());
}
