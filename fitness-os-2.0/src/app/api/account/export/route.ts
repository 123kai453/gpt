import { z } from "zod";
import { accountCsv } from "@/lib/account/files";
import { accountError, dbError, enforceRateLimit, PRIVATE_HEADERS, requireAccount } from "@/lib/account/server";
import { readJson, RequestError, requireTrustedOrigin } from "@/lib/security/request";
export const dynamic = "force-dynamic";
const exportSchema = z.object({ format: z.enum(["json", "csv"]) }).strict();
const exportTables = ["profiles", "user_preferences", "user_consents", "sync_metadata", "user_data_exports", "user_media", "account_deletion_jobs"] as const;

export async function POST(request: Request) {
  let jobId: string | undefined;
  let context: Awaited<ReturnType<typeof requireAccount>> | undefined;
  try {
    requireTrustedOrigin(request);
    const parsed = exportSchema.safeParse(await readJson(request));
    if (!parsed.success) throw new RequestError(400, "INVALID_EXPORT_FORMAT", "请选择 JSON 或 CSV 格式。");
    context = await requireAccount();
    const { client, user } = context;
    await enforceRateLimit(client, "export");
    const { data: job, error: jobError } = await client.from("user_data_exports").insert({ user_id: user.id, format: parsed.data.format, status: "processing" }).select("id").single();
    if (jobError || !job) throw jobError ? dbError(jobError) : new RequestError(503, "EXPORT_NOT_STARTED", "无法开始导出。");
    jobId = job.id;
    const tables: Record<string, unknown[]> = {};
    for (const table of exportTables) {
      const records: unknown[] = [];
      // Supabase caps REST result pages; pagination avoids silent export truncation.
      for (let offset=0;; offset+=500) {
        const owner = table === "profiles" ? "id" : "user_id";
        const primary = table === "user_preferences" ? "user_id" : table === "sync_metadata" ? "device_id" : "id";
        const { data, error } = await client.from(table).select("*").eq(owner, user.id).order(primary).range(offset, offset + 499);
        if (error) throw dbError(error);
        records.push(...(data ?? []));
        if ((data?.length ?? 0) < 500) break;
      }
      tables[table] = records;
    }
    const payload = {
      schema_version: "fitness-os-account-v1", exported_at: new Date().toISOString(),
      account: { id: user.id, email: user.email ?? null, created_at: user.created_at, email_confirmed_at: user.email_confirmed_at ?? null },
      data: tables,
      media_note: "Private file metadata is included. Image binaries remain private and are available through authenticated media downloads.",
    };
    const { error: completeError } = await client.from("user_data_exports").update({ status: "completed", completed_at: new Date().toISOString(), error_code: null }).eq("id", jobId).eq("user_id", user.id);
    if (completeError) throw dbError(completeError);
    const csvTables = { account: [payload.account], ...tables };
    const format = parsed.data.format;
    const body = format === "json" ? JSON.stringify(payload, null, 2) : accountCsv(csvTables);
    return new Response(body, { headers: { ...PRIVATE_HEADERS,
      "Content-Type": format === "json" ? "application/json; charset=utf-8" : "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="fitness-os-account-${new Date().toISOString().slice(0,10)}.${format}"`,
    } });
  } catch (error) {
    if (jobId && context) await context.client.from("user_data_exports").update({ status: "failed", error_code: "EXPORT_FAILED" }).eq("id", jobId).eq("user_id", context.user.id);
    return accountError(error);
  }
}
