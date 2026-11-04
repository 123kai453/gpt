/** Redirects must use the configured app origin, never a server bind address. */
export function authRedirectOrigin(requestUrl: string): string | null {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!configured && process.env.NODE_ENV === "production") return null;
  try {
    const url = new URL(configured || requestUrl);
    const local = ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname);
    const parts = url.hostname.split(".").map(Number);
    const privateIPv4 = parts.length === 4 && parts.every(n => Number.isInteger(n) && n >= 0 && n <= 255) &&
      (parts[0] === 10 || (parts[0] === 192 && parts[1] === 168) || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31));
    const developmentLan = Boolean(configured) && process.env.NODE_ENV === "development" && privateIPv4;
    if (url.protocol !== "https:" && !((local || developmentLan) && url.protocol === "http:")) return null;
    if (url.username || url.password || url.search || url.hash || url.pathname !== "/") return null;
    if (!configured && !local) return null;
    return url.origin;
  } catch { return null; }
}
