"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicConfig } from "./config";

let browserClient: SupabaseClient | null = null;

export function createBrowserSupabaseClient(): SupabaseClient | null {
  const config = getSupabasePublicConfig();
  if (!config) return null;
  browserClient ??= createBrowserClient(config.url, config.key, {
    auth: { flowType: "pkce", detectSessionInUrl: false, experimental: { appendPkceFlowIdToRedirects: true } },
  });
  return browserClient;
}
