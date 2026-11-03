import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { safeAuthNextPath } from "@/features/auth/redirects";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const next = safeAuthNextPath(request.nextUrl.searchParams.get("next"));
  const response = (path: string) => {
    const result = NextResponse.redirect(new URL(path, request.url), 303);
    result.headers.set("Cache-Control", "private, no-store, max-age=0");
    result.headers.set("Referrer-Policy", "no-referrer");
    return result;
  };
  const code = request.nextUrl.searchParams.get("code");
  if (!code || code.length > 2048) return response("/auth/sign-in?error=callback");
  const client = await createServerSupabaseClient();
  if (!client) return response("/auth/sign-in?error=callback");
  try {
    const { error } = await client.auth.exchangeCodeForSession(code);
    if (!error) return response(next);
  } catch { /* Never include auth codes or provider errors in the URL/logs. */ }
  return response("/auth/sign-in?error=callback");
}
