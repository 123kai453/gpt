import { afterEach, describe, expect, it, vi } from "vitest";
import { authCallbackUrl, safeAuthNextPath } from "../../src/features/auth/redirects";
import { resetPasswordSchema, signInSchema, signUpSchema } from "../../src/features/auth/validation";
import { getSupabasePublicConfig } from "../../src/lib/supabase/config";
import { markIntentionalSignOut, wasIntentionalSignOut } from "../../src/features/auth/signout";
import { authRedirectOrigin } from "../../src/features/auth/origin";

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.useRealTimers(); });

describe("trusted callback origin", () => {
  it("uses the configured browser origin instead of the server bind address", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://fitness.example");
    expect(authRedirectOrigin("http://0.0.0.0:3000/auth/callback")).toBe("https://fitness.example");
  });
  it("requires a configured trusted origin in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
    expect(authRedirectOrigin("http://127.0.0.1:3000/auth/callback")).toBeNull();
  });
  it("allows an explicitly configured private LAN origin only during development", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://192.168.1.12:3000");
    vi.stubEnv("NODE_ENV", "development");
    expect(authRedirectOrigin("http://0.0.0.0:3000/auth/callback")).toBe("http://192.168.1.12:3000");
    vi.stubEnv("NODE_ENV", "production");
    expect(authRedirectOrigin("http://0.0.0.0:3000/auth/callback")).toBeNull();
  });
  it("rejects insecure remote origins and URLs containing credentials or paths", () => {
    for (const url of ["http://fitness.example", "https://user:password@fitness.example", "https://fitness.example/path", "https://fitness.example?next=bad"]) {
      vi.stubEnv("NEXT_PUBLIC_APP_URL", url);
      expect(authRedirectOrigin("http://0.0.0.0:3000")).toBeNull();
    }
  });
});

describe("intentional signout boundary", () => {
  it("requires a recent explicit action for the same account", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-01T00:00:00Z"));
    const values = new Map<string, string>();
    vi.stubGlobal("localStorage", { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value), removeItem: (key: string) => values.delete(key) });
    expect(wasIntentionalSignOut("no-explicit-action")).toBe(false);
    markIntentionalSignOut("account-a");
    expect(wasIntentionalSignOut("account-a")).toBe(true);
    expect(wasIntentionalSignOut("account-b")).toBe(false);
    vi.advanceTimersByTime(5001);
    expect(wasIntentionalSignOut("account-a")).toBe(false);
    expect(values.size).toBe(0);
  });
  it("retains the explicit signal in this tab when browser storage is blocked", () => {
    vi.useFakeTimers();
    vi.stubGlobal("localStorage", { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); }, removeItem: () => { throw new Error("blocked"); } });
    markIntentionalSignOut("storage-blocked-account");
    expect(wasIntentionalSignOut("storage-blocked-account")).toBe(true);
    vi.advanceTimersByTime(5001);
    expect(wasIntentionalSignOut("storage-blocked-account")).toBe(false);
  });
});

describe("Supabase public configuration boundary", () => {
  function configure(url: string, key = "sb_publishable_unit_test") {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", url);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", key);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
  }
  it("supports hosted HTTPS and the real local stack", () => {
    configure("http://127.0.0.1:54321/");
    expect(getSupabasePublicConfig()?.url).toBe("http://127.0.0.1:54321");
    configure("https://project.supabase.co");
    expect(getSupabasePublicConfig()?.url).toBe("https://project.supabase.co");
  });
  it.each(["http://project.supabase.co", "https://user:password@project.supabase.co", "https://project.supabase.co/path", "https://project.supabase.co?x=1", "invalid"])("rejects unsafe URL %s", (url) => {
    configure(url);
    expect(getSupabasePublicConfig()).toBeNull();
  });
  it("rejects partial configuration and accidentally assigned elevated keys", () => {
    configure("https://project.supabase.co", "");
    expect(getSupabasePublicConfig()).toBeNull();
    configure("https://project.supabase.co", "sb_secret_unit_test");
    expect(getSupabasePublicConfig()).toBeNull();
    const role = Buffer.from(JSON.stringify({ role: "service_role" })).toString("base64url");
    configure("https://project.supabase.co", `test.${role}.test`);
    expect(getSupabasePublicConfig()).toBeNull();
  });
});

describe("auth return path boundary", () => {
  it("accepts known internal destinations", () => {
    expect(safeAuthNextPath("/account/sync")).toBe("/account/sync");
    expect(safeAuthNextPath("/auth/reset-password")).toBe("/auth/reset-password");
  });
  it.each(["https://evil.test", "//evil.test", "/\\evil.test", "/%2f%2fevil.test", "/%252fevil.test", "/account/profile?next=//evil.test", "/account/profile#x", "/account/profile\n", "/not-a-route"])("rejects unsafe or unknown redirect %s", (next) => {
    expect(safeAuthNextPath(next)).toBe("/account/profile");
  });
  it("constructs an origin-local PKCE callback", () => {
    const callback = new URL(authCallbackUrl("https://fitness.example", "//evil.test"));
    expect(callback.origin).toBe("https://fitness.example");
    expect(callback.pathname).toBe("/auth/callback");
    expect(callback.searchParams.get("next")).toBe("/account/profile");
  });
});

describe("auth form input boundaries", () => {
  it("normalizes email without changing passwords", () => {
    expect(signInSchema.parse({ email: " Test@Example.com ", password: " password " })).toEqual({ email: "test@example.com", password: " password " });
  });
  it("requires a long new password and matching confirmation", () => {
    expect(signUpSchema.safeParse({ email: "a@example.com", displayName: "A", password: "short" }).success).toBe(false);
    expect(resetPasswordSchema.safeParse({ password: "long-test-password", confirmation: "different-password" }).success).toBe(false);
  });
});
