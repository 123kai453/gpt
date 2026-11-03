import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { safeAuthNextPath } from "@/features/auth/redirects";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get("type");
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const next = type === "recovery" ? "/auth/reset-password" : safeAuthNextPath(request.nextUrl.searchParams.get("next"));
  const response = (path: string) => {
    const result = NextResponse.redirect(new URL(path, request.url), 303);
    result.headers.set("Cache-Control", "private, no-store, max-age=0");
    result.headers.set("Referrer-Policy", "no-referrer");
    return result;
  };
  if (!tokenHash || tokenHash.length > 2048 || (type !== "email" && type !== "recovery" && type !== "signup")) return response("/auth/sign-in?error=callback");
  const client = await createServerSupabaseClient();
  if (!client) return response("/auth/sign-in?error=callback");
  try {
    const { error } = await client.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) return response(next);
  } catch { /* Tokens and provider error details never leave this handler. */ }
  return response("/auth/sign-in?error=callback");
}
