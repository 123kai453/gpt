import "server-only";
export class RequestError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}
export function requireTrustedOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  const expected = configured ? new URL(configured).origin : new URL(request.url).origin;
  if (!origin || origin !== expected || request.headers.get("sec-fetch-site") === "cross-site") {
    throw new RequestError(403, "UNTRUSTED_ORIGIN", "请求来源验证失败，请从本站重新操作。");
  }
}
export function privateJson(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: { "Cache-Control": "private, no-store, max-age=0", "Vary": "Cookie", "X-Content-Type-Options": "nosniff" } });
}
export async function readJson(request: Request, maxBytes = 16_384): Promise<unknown> {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) throw new RequestError(415, "JSON_REQUIRED", "请使用 JSON 请求。");
  if (Number(request.headers.get("content-length")) > maxBytes) throw new RequestError(413, "BODY_TOO_LARGE", "请求过大。");
  const reader = request.body?.getReader();
  if (!reader) throw new RequestError(400, "EMPTY_BODY", "缺少请求内容。");
  const chunks: Uint8Array[] = []; let size = 0;
  try { for (;;) { const {done,value} = await reader.read(); if (done) break; size += value.byteLength; if (size > maxBytes) { await reader.cancel(); throw new RequestError(413,"BODY_TOO_LARGE","请求过大。"); } chunks.push(value); } }
  finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size); let offset=0; for (const c of chunks) { bytes.set(c,offset); offset+=c.byteLength; }
  try { return JSON.parse(new TextDecoder().decode(bytes)); } catch { throw new RequestError(400,"INVALID_JSON","JSON 格式无效。"); }
}
