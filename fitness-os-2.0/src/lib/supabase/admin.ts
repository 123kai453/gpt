import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getSupabasePublicConfig } from "./config";

/** Server maintenance only. Never import this module into client components. */
export function createAdminSupabaseClient() {
  const config = getSupabasePublicConfig();
  const secret = (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)?.trim();
  if (!config || !secret || /\s/.test(secret)) return null;
  return createClient(config.url, secret, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
}
