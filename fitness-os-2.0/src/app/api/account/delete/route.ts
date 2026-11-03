import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { accountError, dbError, PRIVATE_BUCKET, requireAccount } from "@/lib/account/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { privateJson, readJson, RequestError, requireTrustedOrigin } from "@/lib/security/request";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const deletionSchema = z.object({ confirmation: z.literal("DELETE"), password: z.string().min(1).max(128) }).strict();

/** Process bounded batches from the first page so removed objects cannot shift an offset. */
async function emptyPrivateFolder(client: SupabaseClient, prefix: string, budget: { remaining: number }) {
  for (;;) {
    if (--budget.remaining < 0) throw new RequestError(409, "DELETE_RETRY_REQUIRED", "本批清理已完成一部分。请重试以继续删除剩余文件。");
    const { data, error } = await client.storage.from(PRIVATE_BUCKET).list(prefix, { limit: 100, offset: 0, sortBy: { column: "name", order: "asc" } });
    if (error || !data) throw new RequestError(503, "STORAGE_DELETE_FAILED", "私人文件清理尚未完成，请重试删除。");
    if (data.length === 0) return;
    const filePaths: string[] = [];
    for (const item of data) {
      const path = `${prefix}/${item.name}`;
      if (item.id) filePaths.push(path);
      else await emptyPrivateFolder(client, path, budget);
    }
    if (filePaths.length) {
      const { error: removeError } = await client.storage.from(PRIVATE_BUCKET).remove(filePaths);
      if (removeError) throw new RequestError(503, "STORAGE_DELETE_FAILED", "私人文件清理尚未完成，请重试删除。");
    }
  }
}

export async function POST(request: Request) {
  let context: Awaited<ReturnType<typeof requireAccount>> | undefined;
  let jobId: string | undefined;
  try {
    requireTrustedOrigin(request);
    const parsed = deletionSchema.safeParse(await readJson(request));
    if (!parsed.success) throw new RequestError(400, "DELETE_CONFIRMATION_REQUIRED", "请输入 DELETE 并提供当前密码以确认删除。");
    const admin = createAdminSupabaseClient();
    if (!admin) throw new RequestError(503, "ADMIN_NOT_CONFIGURED", "服务端尚未配置账号删除凭据，账号和数据尚未删除。");
    context = await requireAccount(true);
    const { client, user } = context;
    if (!user.email) throw new RequestError(409, "EMAIL_ACCOUNT_REQUIRED", "当前账号缺少可验证的邮箱，无法完成删除确认。");
    // Reauthentication occurs before marking or removing any data. Password never enters our database.
    const { data: reauthenticated, error: authError } = await client.auth.signInWithPassword({ email: user.email, password: parsed.data.password });
    if (authError || reauthenticated.user?.id !== user.id) throw new RequestError(401, "REAUTHENTICATION_FAILED", "密码验证失败，未执行删除。");
    const { data: job, error: requestError } = await client.rpc("request_account_deletion");
    if (requestError) throw dbError(requestError);
    if (!job?.id) throw new RequestError(503, "DELETE_NOT_STARTED", "未能建立删除任务，请重试。");
    jobId = job.id;
    const { error: stageError } = await client.from("account_deletion_jobs").update({ status: "deleting_storage", attempts: Number(job.attempts ?? 0) + 1, last_error: null }).eq("id", jobId).eq("user_id", user.id);
    if (stageError) throw dbError(stageError);
    // The RPC has disabled further private uploads. Include orphaned files, not only media metadata.
    await emptyPrivateFolder(client, user.id, { remaining: 200 });
    const { data: remaining, error: verifyError } = await client.storage.from(PRIVATE_BUCKET).list(user.id, { limit: 1 });
    if (verifyError || remaining?.length) throw new RequestError(409, "DELETE_RETRY_REQUIRED", "仍有私人文件待清理，请重试完成账号删除。");
    const { error: authStageError } = await client.from("account_deletion_jobs").update({ status: "deleting_auth" }).eq("id", jobId).eq("user_id", user.id);
    if (authStageError) throw dbError(authStageError);
    // This is the only operation that uses admin privileges; all prior access is owner-scoped.
    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id, false);
    if (deleteError) throw new RequestError(503, "AUTH_DELETE_INCOMPLETE", "私人文件已处理，账号删除尚未完成。请重试以继续完成删除。");
    // Auth row deletion cascades all user-owned SQL records, receipts and deletion job.
    await client.auth.signOut({ scope: "global" });
    return privateJson({ deleted: true, message: "账号、数据库记录及私人文件已删除。" });
  } catch (error) {
    if (jobId && context) {
      const code = error instanceof RequestError ? error.code : "DELETE_FAILED";
      await context.client.from("account_deletion_jobs").update({ status: "failed", last_error: /^[A-Z0-9_]{1,80}$/.test(code) ? code : "DELETE_FAILED" }).eq("id", jobId).eq("user_id", context.user.id);
    }
    return accountError(error);
  }
}
