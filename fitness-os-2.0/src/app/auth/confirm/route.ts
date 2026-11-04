import { NextResponse, type NextRequest } from "next/server";
import { authRedirectOrigin } from "@/features/auth/origin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const origin = authRedirectOrigin(request.url);
  if (!origin) return NextResponse.json({ error: "账户回调需要配置可信的 NEXT_PUBLIC_APP_URL。" }, { status: 503, headers: { "Cache-Control": "private, no-store, max-age=0", "Referrer-Policy": "no-referrer" } });
  // Authentication is bound to the initiating browser's PKCE verifier. Direct
  // token-hash exchanges could replace another user's session without that bind.
  // Keep the legacy URL recoverable, but never consume or log its token values.
  const response = NextResponse.redirect(new URL("/auth/sign-in?error=callback", origin), 303);
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
