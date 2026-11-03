import { accountError, dbError, enforceRateLimit, PRIVATE_BUCKET, requireAccount, listWindow } from "@/lib/account/server";
import { detectImageType, MAX_IMAGE_BYTES } from "@/lib/account/files";
import { privateJson, RequestError, requireTrustedOrigin } from "@/lib/security/request";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function boundedForm(request: Request): Promise<FormData> {
  const max = MAX_IMAGE_BYTES + 32_768;
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("multipart/form-data;")) throw new RequestError(415, "MULTIPART_REQUIRED", "请以表单形式上传图片。");
  if (Number(request.headers.get("content-length")) > max) throw new RequestError(413, "FILE_TOO_LARGE", "图片大小不能超过 5 MB。");
  const reader = request.body?.getReader();
  if (!reader) throw new RequestError(400, "FILE_REQUIRED", "请选择图片。");
  const chunks: Uint8Array[] = []; let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > max) { await reader.cancel(); throw new RequestError(413, "FILE_TOO_LARGE", "图片大小不能超过 5 MB。"); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size); let offset=0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  try {
    return await new Response(bytes, { headers: { "Content-Type": request.headers.get("content-type")! } }).formData();
  } catch { throw new RequestError(400, "INVALID_FORM", "上传表单无效。"); }
}
export async function GET(request: Request) {
  try {
    const { client, user } = await requireAccount();
    const { offset, limit } = listWindow(request);
    const { data, error } = await client.from("user_media").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).order("id").range(offset, offset + limit);
    if (error) throw dbError(error);
    return privateJson({ media: data?.slice(0, limit) ?? [], nextOffset: data && data.length > limit ? offset + limit : null });
  } catch (error) { return accountError(error); }
}
export async function POST(request: Request) {
  try {
    requireTrustedOrigin(request);
    const { client, user } = await requireAccount();
    await enforceRateLimit(client, "media");
    const form = await boundedForm(request);
    const entries = [...form.entries()];
    if (entries.length !== 1 || entries[0][0] !== "file" || !(entries[0][1] instanceof File)) throw new RequestError(400, "FILE_REQUIRED", "每次请选择一张图片。");
    const file = entries[0][1];
    if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) throw new RequestError(413, "FILE_TOO_LARGE", "图片必须大于 0 字节且不超过 5 MB。");
    const bytes = new Uint8Array(await file.arrayBuffer());
    const type = detectImageType(bytes);
    if (!type || type.mime !== file.type) throw new RequestError(415, "INVALID_IMAGE", "仅接受类型和文件内容一致的 PNG、JPEG 或 WebP 图片。");
    const id = crypto.randomUUID();
    const objectPath = `${user.id}/${id}.${type.extension}`;
    const { error: metadataError } = await client.from("user_media").insert({
      id, user_id: user.id, object_path: objectPath, mime_type: type.mime, size_bytes: bytes.byteLength, status: "pending",
    });
    if (metadataError) throw dbError(metadataError);
    const { error: uploadError } = await client.storage.from(PRIVATE_BUCKET).upload(objectPath, bytes, { contentType: type.mime, upsert: false, cacheControl: "0" });
    if (uploadError) {
      await client.from("user_media").update({ status: "failed" }).eq("id", id).eq("user_id", user.id);
      throw new RequestError(503, "UPLOAD_FAILED", "图片未能完成上传，请重试。失败记录可在列表中清理。");
    }
    const { data, error: readyError } = await client.from("user_media").update({ status: "ready" }).eq("id", id).eq("user_id", user.id).select("*").single();
    if (readyError || !data) {
      // If metadata finalization fails, never return a false-success upload.
      const { error: cleanupError } = await client.storage.from(PRIVATE_BUCKET).remove([objectPath]);
      await client.from("user_media").update({ status: cleanupError ? "deleting" : "failed" }).eq("id", id).eq("user_id", user.id);
      throw new RequestError(503, "UPLOAD_FINALIZATION_FAILED", "图片上传尚未完成，已尝试清理。请刷新列表后重试或删除失败记录。");
    }
    return privateJson({ media: data }, 201);
  } catch (error) { return accountError(error); }
}
