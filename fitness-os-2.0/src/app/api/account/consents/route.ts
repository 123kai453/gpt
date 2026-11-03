import { accountError, dbError, enforceRateLimit, listWindow, requireAccount } from "@/lib/account/server";
import { consentSchema } from "@/lib/account/validation";
import { privateJson, readJson, RequestError, requireTrustedOrigin } from "@/lib/security/request";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    const { client, user } = await requireAccount();
    const { offset, limit } = listWindow(request);
    const { data, error } = await client.from("user_consents").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).order("id").range(offset, offset + limit);
    if (error) throw dbError(error);
    const current: Record<string, unknown> = {};
    for (const scope of ["privacy_policy", "terms", "health_data", "analytics", "notifications"]) {
      const latest = await client.from("user_consents").select("*").eq("user_id", user.id).eq("scope", scope).order("created_at", { ascending: false }).order("id").limit(1).maybeSingle();
      if (latest.error) throw dbError(latest.error);
      if (latest.data) current[scope] = latest.data;
    }
    return privateJson({ consents: data?.slice(0, limit) ?? [], current, nextOffset: data && data.length > limit ? offset + limit : null });
  } catch (error) { return accountError(error); }
}
export async function POST(request: Request) {
  try {
    requireTrustedOrigin(request);
    const { client, user } = await requireAccount();
    await enforceRateLimit(client, "consent");
    const parsed = consentSchema.safeParse(await readJson(request));
    if (!parsed.success) throw new RequestError(400, "INVALID_CONSENT", "授权记录格式无效。");
    const { data, error } = await client.from("user_consents").insert({ ...parsed.data, user_id: user.id }).select("*").single();
    if (error) throw dbError(error);
    return privateJson({ consent: data }, 201);
  } catch (error) { return accountError(error); }
}
