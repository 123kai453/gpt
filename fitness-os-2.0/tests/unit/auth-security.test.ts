import { afterEach, describe, expect, it, vi } from "vitest";
import { authCallbackUrl, safeAuthNextPath } from "../../src/features/auth/redirects";
import { resetPasswordSchema, signInSchema, signUpSchema } from "../../src/features/auth/validation";
import { getSupabasePublicConfig } from "../../src/lib/supabase/config";

afterEach(() => vi.unstubAllEnvs());

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
