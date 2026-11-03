import "server-only";
import type { PostgrestError, SupabaseClient, User } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { RequestError, privateJson } from "@/lib/security/request";

export const PRIVATE_BUCKET = "private-media";
export const PRIVATE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
  "Vary": "Cookie",
  "X-Content-Type-Options": "nosniff",
};
export type AccountContext = { client: SupabaseClient; user: User };

export async function requireAccount(allowDeleting = false): Promise<AccountContext> {
  const client = await createServerSupabaseClient();
  if (!client) throw new RequestError(503, "SUPABASE_NOT_CONFIGURED", "尚未配置 Supabase，当前操作不可用。");
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) throw new RequestError(401, "AUTH_REQUIRED", "登录已失效，请重新登录后继续。");
  const { data: activeSession, error: sessionError } = await client.rpc("has_current_auth_session");
  if (sessionError) throw dbError(sessionError);
  if (!activeSession) throw new RequestError(401, "AUTH_REQUIRED", "登录已失效，请重新登录后继续。");
  const { data: profile, error: profileError } = await client.from("profiles").select("id,deletion_requested_at").eq("id", user.id).maybeSingle();
  if (profileError) throw dbError(profileError);
  if (!profile) throw new RequestError(409, "ACCOUNT_NOT_READY", "账号数据尚未建立，请检查数据库迁移状态。");
  if (!allowDeleting && profile.deletion_requested_at) throw new RequestError(409, "ACCOUNT_DELETING", "账号删除正在处理中，请在隐私页面重试完成删除。");
  return { client, user };
}

export function dbError(error: Pick<PostgrestError, "code" | "message" | "details">): RequestError {
  if (error.message === "rate_limit_exceeded") {
    let retry = 60;
    try { const details = JSON.parse(error.details ?? "{}"); retry = Number(details.retry_after) || retry; } catch { /* Never expose raw server errors. */ }
    return new RateLimitError(retry);
  }
  if (error.message === "session_revoked_or_expired" || error.message === "authentication_required") return new RequestError(401, "AUTH_REQUIRED", "登录已失效，请重新登录后继续。");
  if (error.message === "account_deletion_in_progress") return new RequestError(409, "ACCOUNT_DELETING", "账号删除正在处理中。");
  if (error.message === "mutation_id_reused_with_different_payload") return new RequestError(409, "IDEMPOTENCY_KEY_REUSED", "同一个操作编号不能用于不同内容，请重新创建操作。");
  if (error.code === "23505") return new RequestError(409, "VALUE_ALREADY_USED", "该用户名或记录已被使用，请修改后重试。");
  if (["22023", "23514", "22P02"].includes(error.code)) return new RequestError(400, "INVALID_DATA", "提交的数据不符合要求，请检查输入。");
  if (error.code === "42501") return new RequestError(403, "ACCESS_DENIED", "当前账号没有执行此操作的权限。");
  return new RequestError(503, "DATABASE_UNAVAILABLE", "数据库操作暂时失败，请稍后重试。");
}

export class RateLimitError extends RequestError {
  constructor(public retryAfter: number) { super(429, "RATE_LIMITED", "操作过于频繁，请稍后重试。"); }
}
export async function enforceRateLimit(client: SupabaseClient, action: "media" | "export" | "consent") {
  const { data, error } = await client.rpc("consume_account_rate_limit", { p_action: action });
  if (error) throw dbError(error);
  if (!data?.allowed) throw new RateLimitError(Math.max(1, Number(data?.retry_after) || 60));
}

export function accountError(error: unknown): Response {
  const known = error instanceof RequestError ? error : new RequestError(500, "REQUEST_FAILED", "操作未完成，请稍后重试。");
  const response = privateJson({ error: { code: known.code, message: known.message } }, known.status);
  if (error instanceof RateLimitError) response.headers.set("Retry-After", String(Math.max(1, Math.ceil(error.retryAfter))));
  return response;
}

export function listWindow(request: Request): { offset: number; limit: number } {
  const params = new URL(request.url).searchParams;
  const offset = Number(params.get("offset") ?? 0);
  const limit = Number(params.get("limit") ?? 200);
  if (!Number.isSafeInteger(offset) || offset < 0 || !Number.isSafeInteger(limit) || limit < 1 || limit > 200) {
    throw new RequestError(400, "INVALID_PAGINATION", "列表分页参数无效。");
  }
  return { offset, limit };
}
