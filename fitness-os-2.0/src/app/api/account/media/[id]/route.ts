import { z } from "zod";
import { accountError, dbError, enforceRateLimit, PRIVATE_BUCKET, PRIVATE_HEADERS, requireAccount } from "@/lib/account/server";
import { privateJson, RequestError, requireTrustedOrigin } from "@/lib/security/request";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };
async function ownMedia(client: Awaited<ReturnType<typeof requireAccount>>["client"], userId: string, id: string) {
  if (!z.uuid().safeParse(id).success) throw new RequestError(404, "MEDIA_NOT_FOUND", "找不到该图片。");
  const { data, error } = await client.from("user_media").select("*").eq("id", id).eq("user_id", userId).maybeSingle();
  if (error) throw dbError(error);
  if (!data) throw new RequestError(404, "MEDIA_NOT_FOUND", "找不到该图片。");
  return data;
}
export async function GET(_request: Request, context: Context) {
  try {
    const { client, user } = await requireAccount();
    const media = await ownMedia(client, user.id, (await context.params).id);
    if (media.status !== "ready") throw new RequestError(409, "MEDIA_NOT_READY", "图片尚未完成上传或正在清理。");
    const { data, error } = await client.storage.from(PRIVATE_BUCKET).download(media.object_path);
    if (error || !data) throw new RequestError(503, "DOWNLOAD_FAILED", "图片读取失败，请稍后重试。");
    return new Response(data, { headers: { ...PRIVATE_HEADERS, "Content-Type": media.mime_type, "Content-Disposition": `inline; filename="${media.id}.${media.mime_type === "image/jpeg" ? "jpg" : media.mime_type.split("/")[1]}"`, "Content-Security-Policy": "default-src 'none'; sandbox" } });
  } catch (error) { return accountError(error); }
}
export async function DELETE(request: Request, context: Context) {
  try {
    requireTrustedOrigin(request);
    const { client, user } = await requireAccount();
    await enforceRateLimit(client, "media");
    const media = await ownMedia(client, user.id, (await context.params).id);
    // The database atomically clears any matching avatar and increments its profile version.
    const { error: markError } = await client.from("user_media").update({ status: "deleting" }).eq("id", media.id).eq("user_id", user.id);
    if (markError) throw dbError(markError);
    const { error: storageError } = await client.storage.from(PRIVATE_BUCKET).remove([media.object_path]);
    if (storageError) throw new RequestError(503, "MEDIA_DELETE_INCOMPLETE", "图片删除尚未完成，已保留记录，请重试。");
    const { error: metadataError } = await client.from("user_media").delete().eq("id", media.id).eq("user_id", user.id);
    if (metadataError) throw new RequestError(503, "MEDIA_DELETE_INCOMPLETE", "文件已删除，记录清理尚未完成，请重试。");
    return privateJson({ deleted: true });
  } catch (error) { return accountError(error); }
}
