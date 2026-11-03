import { accountError, dbError, requireAccount } from "@/lib/account/server";
import { mutationSchema } from "@/lib/account/validation";
import { privateJson, readJson, RequestError, requireTrustedOrigin } from "@/lib/security/request";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try {
    requireTrustedOrigin(request);
    const { client } = await requireAccount();
    const parsed = mutationSchema.safeParse(await readJson(request));
    if (!parsed.success) throw new RequestError(400, "INVALID_MUTATION", "操作格式或资料内容无效，请检查输入。");
    const m = parsed.data;
    const { data, error } = await client.rpc("apply_account_mutation", {
      p_mutation_id: m.mutationId, p_device_id: m.deviceId, p_entity: m.entity,
      p_base_version: m.baseVersion, p_patch: m.patch,
    });
    if (error) throw dbError(error);
    if (!data || !["applied", "conflict"].includes(data.status)) throw new RequestError(503, "INVALID_DATABASE_RESPONSE", "同步服务返回了无效结果，请稍后重试。");
    return privateJson(data, data.status === "conflict" ? 409 : 200);
  } catch (error) { return accountError(error); }
}
