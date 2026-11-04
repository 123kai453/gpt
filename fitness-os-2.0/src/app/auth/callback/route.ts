import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { safeAuthNextPath } from "@/features/auth/redirects";
import { authRedirectOrigin } from "@/features/auth/origin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const origin = authRedirectOrigin(request.url);
  if (!origin) return NextResponse.json({ error: "账户回调需要配置可信的 NEXT_PUBLIC_APP_URL。" }, { status: 503, headers: { "Cache-Control": "private, no-store, max-age=0", "Referrer-Policy": "no-referrer" } });
  const next = safeAuthNextPath(request.nextUrl.searchParams.get("next"));
  const response = (path: string) => {
    const result = NextResponse.redirect(new URL(path, origin), 303);
    result.headers.set("Cache-Control", "private, no-store, max-age=0");
    result.headers.set("Referrer-Policy", "no-referrer");
    return result;
  };
  const code = request.nextUrl.searchParams.get("code");
  const flowId = request.nextUrl.searchParams.get("sb_flow_id");
  if (!code || code.length > 2048) return response("/auth/sign-in?error=callback");
  // Matches the SDK's documented URL/storage-key boundary for flow identifiers.
  if (flowId !== null && !/^[a-zA-Z0-9_-]{8,64}$/.test(flowId)) return response("/auth/sign-in?error=callback");
  const client = await createServerSupabaseClient();
  if (!client) return response("/auth/sign-in?error=callback");
  try {
    const { error } = await client.auth.exchangeCodeForSession(code, flowId ? { flowId } : undefined);
    if (!error) return response(next);
  } catch { /* Never include auth codes or provider errors in the URL/logs. */ }
  return response("/auth/sign-in?error=callback");
}
