const allowedPaths = new Set([
  "/", "/dashboard", "/account/profile", "/account/security", "/account/sync", "/account/privacy", "/auth/reset-password",
]);

/** Only explicitly supported local destinations may receive an auth redirect. */
export function safeAuthNextPath(value: string | null | undefined, fallback = "/account/profile"): string {
  if (!value || value.length > 256 || !value.startsWith("/") || value.startsWith("//")) return fallback;
  if (/[\\\u0000-\u0020\u007f?#%]/.test(value)) return fallback;
  return allowedPaths.has(value) ? value : fallback;
}

export function authCallbackUrl(origin: string, next = "/account/profile"): string {
  const url = new URL("/auth/callback", origin);
  url.searchParams.set("next", safeAuthNextPath(next));
  return url.toString();
}
