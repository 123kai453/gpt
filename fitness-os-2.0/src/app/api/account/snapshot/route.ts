import { accountError, dbError, requireAccount } from "@/lib/account/server";
import { privateJson, RequestError } from "@/lib/security/request";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const { client, user } = await requireAccount();
    const [profile, preferences] = await Promise.all([
      client.from("profiles").select("*").eq("id", user.id).single(),
      client.from("user_preferences").select("*").eq("user_id", user.id).single(),
    ]);
    if (profile.error) throw dbError(profile.error);
    if (preferences.error) throw dbError(preferences.error);
    if (!profile.data || !preferences.data) throw new RequestError(409, "ACCOUNT_NOT_READY", "账号数据尚未建立。");
    return privateJson({ profile: profile.data, preferences: preferences.data });
  } catch (error) { return accountError(error); }
}
