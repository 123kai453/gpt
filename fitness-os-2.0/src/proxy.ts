import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabasePublicConfig } from "@/lib/supabase/config";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const config = getSupabasePublicConfig();
  if (config) {
    const supabase = createServerClient(config.url, config.key, {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    });
    try { await supabase.auth.getUser(); } catch {
      // Temporary network failures must not turn public navigation into a 500.
      // Private route handlers independently require a verified user.
    }
  }
  const hasAuthCookie = request.cookies.getAll().some(({ name }) => name.startsWith("sb-"));
  if (hasAuthCookie || request.nextUrl.pathname.startsWith("/auth") || request.nextUrl.pathname.startsWith("/account") || request.nextUrl.pathname.startsWith("/api")) {
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Vary", "Cookie");
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons/|images/|fonts/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2)$).*)"],
};
