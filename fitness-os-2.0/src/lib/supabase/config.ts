export type SupabasePublicConfig = Readonly<{ url: string; key: string }>;

/** Public keys are intended for the browser. Authorization is enforced by RLS. */
export function getSupabasePublicConfig(): SupabasePublicConfig | null {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)?.trim();
  if (!rawUrl || !key || /\s/.test(key) || key.startsWith("sb_secret_")) return null;
  if (key.split(".").length === 3) {
    try {
      const payload = JSON.parse(atob(key.split(".")[1].replaceAll("-", "+").replaceAll("_", "/"))) as { role?: unknown };
      if (payload.role !== "anon") return null;
    } catch { return null; }
  }

  try {
    const url = new URL(rawUrl);
    const local = ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname);
    if (url.protocol !== "https:" && !(local && url.protocol === "http:")) return null;
    if (url.username || url.password || url.search || url.hash || !["", "/"].includes(url.pathname)) return null;
    return { url: url.origin, key };
  } catch {
    return null;
  }
}

export function isSupabaseConfigured(): boolean {
  return getSupabasePublicConfig() !== null;
}
