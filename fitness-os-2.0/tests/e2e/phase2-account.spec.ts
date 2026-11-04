import { test, expect, type Page } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";

if(process.env.PHASE2_ACCOUNT_INTEGRATION === "1" && existsSync(".env.local"))process.loadEnvFile(".env.local");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publicKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
const enabled = process.env.PHASE2_ACCOUNT_INTEGRATION === "1" && Boolean(supabaseUrl && publicKey && adminKey);
const origin = new URL(process.env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:3000").origin;
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l1cAAAAASUVORK5CYII=", "base64");
const password = `Account-2-${randomUUID()}-Test`;
type FixtureUser = { id: string; email: string };
let admin: SupabaseClient;
let userA: FixtureUser;
let userB: FixtureUser;

async function createUser(email: string): Promise<FixtureUser> {
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error || !data.user) throw new Error(`Cannot create isolated test account (${error?.code || "missing_user"}).`);
  return { id: data.user.id, email };
}
async function login(page: Page, user: FixtureUser, next = "/account/privacy") {
  await page.goto(`${origin}/auth/sign-in?next=${encodeURIComponent(next)}`);
  const form = page.locator(".auth-form:visible");
  await expect(form).toHaveCount(1);
  const submit = form.getByRole("button", { name: "登录账户", exact: true });
  await expect(submit).toBeEnabled();
  await form.getByRole("textbox", { name: "邮箱地址", exact: true }).fill(user.email);
  await form.locator('input[name="password"]').fill(password);
  await submit.click();
  await expect(page).toHaveURL(new RegExp(`${next.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`));
  await expect(page.getByRole("heading", { name: "属于你的 FITNESS OS." })).toBeVisible();
}
async function cleanupFolder(prefix: string) {
  for (;;) {
    const { data, error } = await admin.storage.from("private-media").list(prefix, { limit: 100 });
    if (error || !data?.length) return;
    const files: string[] = [];
    for (const item of data) {
      const path = `${prefix}/${item.name}`;
      if (item.id) files.push(path); else await cleanupFolder(path);
    }
    if (files.length) { const { error: removeError } = await admin.storage.from("private-media").remove(files); if (removeError) return; }
  }
}

test.describe.serial("PHASE 2 real account privacy and lifecycle", () => {
  test.skip(!enabled, "Requires PHASE2_ACCOUNT_INTEGRATION=1 and real Supabase URL/public/server credentials; no mocked backend.");
  test.beforeAll(async () => {
    if(!supabaseUrl || !["127.0.0.1", "localhost", "[::1]"].includes(new URL(supabaseUrl).hostname))throw new Error("Account integration only permits real local Supabase services, never hosted-project test user creation or deletion.");
    admin = createClient(supabaseUrl!, adminKey!, { auth: { persistSession: false, autoRefreshToken: false } });
    const marker = randomUUID();
    userA = await createUser(`phase2-account-a-${marker}@example.test`);
    userB = await createUser(`phase2-account-b-${marker}@example.test`);
  });
  test.afterAll(async () => {
    if (!admin) return;
    for (const user of [userA, userB].filter(Boolean)) {
      await cleanupFolder(user.id);
      await admin.auth.admin.deleteUser(user.id, false);
    }
  });

  test("profile saves to the real database; own JSON/CSV exports and CSRF controls", async ({ page, browser }) => {
    await login(page, userA, "/account/profile");
    const displayName = `Account test ${randomUUID().slice(0, 8)}`;
    await page.getByTestId("profile-display-name").fill(displayName);
    await page.getByRole("button", { name: "保存个人资料", exact: true }).click();
    await expect.poll(async () => {
      const { data } = await admin.from("profiles").select("display_name").eq("id", userA.id).single();
      return data?.display_name;
    }).toBe(displayName);

    const noSession = await browser.newContext();
    const denied = await noSession.request.get(`${origin}/api/account/snapshot`);
    expect(denied.status()).toBe(401);
    await noSession.close();
    const csrf = await page.request.post("/api/account/export", { headers: { Origin: "https://foreign.invalid" }, data: { format: "json" } });
    expect(csrf.status()).toBe(403);
    const mutationCsrf = await page.request.post("/api/account/mutations", { headers: { Origin: "https://foreign.invalid" }, data: { mutationId: randomUUID(), deviceId: randomUUID(), entity: "profile", baseVersion: 1, patch: { display_name: "blocked by origin" } } });
    expect(mutationCsrf.status()).toBe(403);
    const spoofOwner = await page.request.post("/api/account/mutations", { headers: { Origin: origin }, data: { mutationId: randomUUID(), deviceId: randomUUID(), entity: "profile", baseVersion: 1, patch: { display_name: "forbidden", user_id: userB.id } } });
    expect(spoofOwner.status()).toBe(400);

    const exported = await page.request.post("/api/account/export", { headers: { Origin: origin }, data: { format: "json" } });
    expect(exported.status()).toBe(200);
    expect(exported.headers()["cache-control"]).toContain("no-store");
    const payload = await exported.json();
    expect(payload.account.id).toBe(userA.id);
    expect(payload.data.profiles).toHaveLength(1);
    expect(payload.data.profiles[0].display_name).toBe(displayName);
    for (const [table, records] of Object.entries(payload.data) as [string, Record<string, unknown>[]][]) {
      for (const record of records) expect(record[table === "profiles" ? "id" : "user_id"]).toBe(userA.id);
    }
    const serialized = JSON.stringify(payload);
    expect(serialized.includes(userB.id)).toBe(false);
    expect(serialized.includes(password)).toBe(false);
    expect(serialized.includes(adminKey!)).toBe(false);
    const csv = await page.request.post("/api/account/export", { headers: { Origin: origin }, data: { format: "csv" } });
    expect(csv.status()).toBe(200);
    expect(csv.headers()["content-type"]).toContain("text/csv");
    expect((await csv.text()).includes(displayName)).toBe(true);
    await page.goto("/account/privacy");
    await expect(page.getByRole("button", { name: "导出 JSON", exact: true })).toBeVisible();
    await expect(page.getByText("每一次授权，都由你决定", { exact: true })).toBeVisible();
    const consent = page.getByRole("checkbox", { name: /可选使用分析/ });
    await expect(consent).toBeEnabled();
    await consent.check();
    await expect.poll(async () => {
      const { data } = await admin.from("user_consents").select("granted").eq("user_id", userA.id).eq("scope", "analytics").order("created_at", { ascending: false }).limit(1).maybeSingle();
      return data?.granted;
    }).toBe(true);
    await expect(consent).toBeEnabled();
    await consent.uncheck();
    await expect.poll(async () => {
      const { data } = await admin.from("user_consents").select("granted").eq("user_id", userA.id).eq("scope", "analytics").order("created_at", { ascending: false }).limit(1).maybeSingle();
      return data?.granted;
    }).toBe(false);
  });

  test("real private media validates bytes, rejects cross-user reads, and deletes file plus metadata", async ({ page, browser }) => {
    await login(page, userA);
    const invalid = await page.request.post("/api/account/media", { headers: { Origin: origin }, multipart: { file: { name: "forged.png", mimeType: "image/png", buffer: Buffer.from("<script>invalid image</script>") } } });
    expect(invalid.status()).toBe(415);
    const oversized = await page.request.post("/api/account/media", { headers: { Origin: origin }, multipart: { file: { name: "large.png", mimeType: "image/png", buffer: Buffer.alloc(5 * 1024 * 1024 + 1) } } });
    expect(oversized.status()).toBe(413);
    await page.getByLabel("选择私人图片", { exact: true }).setInputFiles({ name: "pixel.png", mimeType: "image/png", buffer: png });
    const uploaded = page.waitForResponse((r) => r.url().endsWith("/api/account/media") && r.request().method() === "POST");
    await page.getByRole("button", { name: "上传私人图片", exact: true }).click();
    const uploadResponse = await uploaded;
    expect(uploadResponse.status()).toBe(201);
    const { media } = await uploadResponse.json();
    expect(media.user_id).toBe(userA.id);
    expect(media.object_path.startsWith(`${userA.id}/`)).toBe(true);
    await expect(page.getByText(media.id, { exact: true })).toBeVisible();
    const download = await page.request.get(`/api/account/media/${media.id}`);
    expect(download.status()).toBe(200);
    expect(download.headers()["cache-control"]).toContain("no-store");
    expect(Buffer.compare(await download.body(), png)).toBe(0);
    const noSession = await browser.newContext();
    expect((await noSession.request.get(`${origin}/api/account/media/${media.id}`)).status()).toBe(401);
    await noSession.close();
    const anonymous = createClient(supabaseUrl!, publicKey!, { auth: { persistSession: false, autoRefreshToken: false } });
    const publicDownload = await anonymous.storage.from("private-media").download(media.object_path);
    expect(Boolean(publicDownload.error)).toBe(true);
    const foreignContext = await browser.newContext();
    const foreignPage = await foreignContext.newPage();
    await login(foreignPage, userB);
    expect((await foreignContext.request.get(`${origin}/api/account/media/${media.id}`)).status()).toBe(404);
    expect((await foreignContext.request.delete(`${origin}/api/account/media/${media.id}`, { headers: { Origin: origin } })).status()).toBe(404);
    await foreignContext.close();
    page.once("dialog", (dialog) => void dialog.accept());
    const removed = page.waitForResponse((r) => r.url().endsWith(`/api/account/media/${media.id}`) && r.request().method() === "DELETE");
    await page.getByRole("button", { name: "删除图片", exact: true }).click();
    expect((await removed).status()).toBe(200);
    await expect(page.getByText(media.id, { exact: true })).toHaveCount(0);
    const { data: metadata } = await admin.from("user_media").select("id").eq("id", media.id);
    expect(metadata).toHaveLength(0);
    const { data: storage } = await admin.storage.from("private-media").download(media.object_path);
    expect(storage).toBeNull();
  });

  test("confirmed deletion removes Auth, SQL and private storage including orphan files", async ({ page }) => {
    await login(page, userA);
    // Include a file without user_media metadata to prove deletion scans the owner prefix.
    const orphanPath = `${userA.id}/orphan/subfolder/pixel-${randomUUID()}.png`;
    const { error: seedError } = await admin.storage.from("private-media").upload(orphanPath, png, { contentType: "image/png" });
    expect(seedError).toBeNull();
    const invalid = await page.request.post("/api/account/delete", { headers: { Origin: origin }, data: { confirmation: "not-confirmed", password } });
    expect(invalid.status()).toBe(400);
    const wrongPassword = await page.request.post("/api/account/delete", { headers: { Origin: origin }, data: { confirmation: "DELETE", password: "wrong-password" } });
    expect(wrongPassword.status()).toBe(401);
    const { data: stillExists } = await admin.auth.admin.getUserById(userA.id);
    expect(stillExists.user?.id).toBe(userA.id);
    await page.getByRole("button", { name: "开始删除账号", exact: true }).click();
    await page.getByRole("checkbox", { name: /我已确认删除不可撤销/ }).check();
    await page.getByLabel("输入 DELETE 确认", { exact: true }).fill("DELETE");
    await page.getByLabel("当前密码（再次验证身份）", { exact: true }).fill(password);
    const deletion = page.waitForResponse((r) => r.url().endsWith("/api/account/delete") && r.request().method() === "POST");
    await page.getByRole("button", { name: "最终确认：永久删除我的账号", exact: true }).click();
    expect((await deletion).status()).toBe(200);
    await expect(page).toHaveURL(/\/auth\/sign-in/);
    const authAfter = await admin.auth.admin.getUserById(userA.id);
    expect(authAfter.data.user).toBeNull();
    for (const table of ["profiles", "user_preferences", "user_consents", "sync_metadata", "user_data_exports", "user_media", "account_deletion_jobs"]) {
      const { data, error } = await admin.from(table).select("*").eq(table === "profiles" ? "id" : "user_id", userA.id);
      expect(error).toBeNull(); expect(data).toHaveLength(0);
    }
    const { data: remaining, error: listError } = await admin.storage.from("private-media").list(userA.id);
    expect(listError).toBeNull(); expect(remaining).toHaveLength(0);
    const foreign = await admin.auth.admin.getUserById(userB.id);
    expect(foreign.data.user?.id).toBe(userB.id);
  });
});
