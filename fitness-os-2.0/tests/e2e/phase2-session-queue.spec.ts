import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { expect, test, type Page } from "@playwright/test";
import type { AccountSnapshot } from "../../src/lib/account/types";

const enabled = process.env.PHASE2_AUTH_INTEGRATION === "1";
if (enabled && existsSync(".env.local")) process.loadEnvFile(".env.local");
function localClients(): { admin: SupabaseClient; remote: SupabaseClient } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const adminKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !adminKey || !publicKey || !["127.0.0.1", "localhost", "[::1]"].includes(new URL(url).hostname)) {
    throw new Error("Session/outbox integration requires isolated local Supabase; it never creates users on hosted projects.");
  }
  const options = { auth: { persistSession: false, autoRefreshToken: false } };
  return { admin: createClient(url, adminKey, options), remote: createClient(url, publicKey, options) };
}
async function login(page: Page, email: string, password: string) {
  await page.goto("/auth/sign-in");
  await expect(page.getByRole("button", { name: "登录账户", exact: true })).toBeEnabled();
  await page.getByLabel("邮箱地址", { exact: true }).fill(email);
  await page.getByLabel("密码", { exact: true }).fill(password);
  await page.getByRole("button", { name: "登录账户", exact: true }).click();
  await expect(page).toHaveURL(/\/account\/profile$/);
  await expect(page.getByTestId("profile-display-name")).toBeVisible();
}
type Stored = { snapshot: AccountSnapshot | null; queue: Array<{ mutation: { mutationId: string; patch: Record<string, unknown> } }> };
async function privateState(page: Page, userId: string): Promise<Stored | null> {
  return page.evaluate(async (uid) => {
    const name = "fitness-os-private-" + uid;
    if (!(await indexedDB.databases()).some((db) => db.name === name)) return null;
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const open = indexedDB.open(name);
      open.onsuccess = () => resolve(open.result);
      open.onerror = () => reject(new Error("Unable to inspect the real browser private store."));
    });
    try {
      return await new Promise<Stored | null>((resolve, reject) => {
        const read = db.transaction("state", "readonly").objectStore("state").get("current");
        read.onsuccess = () => resolve(read.result ?? null);
        read.onerror = () => reject(new Error("Unable to inspect the real browser outbox."));
      });
    } finally { db.close(); }
  }, userId);
}

test("remote session revocation preserves an offline outbox across account isolation and original-account reauthentication", async ({ browser }) => {
  test.skip(!enabled, "Requires PHASE2_AUTH_INTEGRATION=1 and actual local Auth/DB; no mocked session or outbox acceptance.");
  test.setTimeout(150_000);
  const { admin, remote } = localClients();
  const users: string[] = [];
  const password = `Session-Only!${randomUUID()}`;
  const aEmail = `session-a-${randomUUID()}@fitness.local`;
  const bEmail = `session-b-${randomUUID()}@fitness.local`;
  const context = await browser.newContext({ baseURL: "http://127.0.0.1:3000", serviceWorkers: "allow" });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  try {
    const a = await admin.auth.admin.createUser({ email: aEmail, password, email_confirm: true, user_metadata: { display_name: "Session A Initial" } });
    if (a.error || !a.data.user) throw new Error("Unable to create isolated local user A.");
    users.push(a.data.user.id);
    const b = await admin.auth.admin.createUser({ email: bEmail, password, email_confirm: true, user_metadata: { display_name: "Session B Only" } });
    if (b.error || !b.data.user) throw new Error("Unable to create isolated local user B.");
    users.push(b.data.user.id);
    const userA = a.data.user.id;
    await login(page, aEmail, password);
    await expect(page.getByTestId("profile-display-name")).toHaveValue("Session A Initial");
    await context.setOffline(true);
    await page.getByTestId("profile-display-name").fill("Offline A survives revoked session");
    await page.getByRole("button", { name: "保存个人资料", exact: true }).click();
    await expect.poll(async () => (await privateState(page, userA))?.queue.length).toBe(1);
    const mutationId = (await privateState(page, userA))!.queue[0].mutation.mutationId;

    // An independent real Auth session revokes all sessions while A is offline.
    const remoteLogin = await remote.auth.signInWithPassword({ email: aEmail, password });
    expect(remoteLogin.error).toBeNull();
    const revoked = await remote.auth.signOut({ scope: "global" });
    expect(revoked.error).toBeNull();
    await context.setOffline(false);
    await expect(page.getByRole("heading", { name: "登录后访问你的私人空间", exact: true })).toBeVisible({ timeout: 30_000 });
    await expect.poll(async () => {
      const stored = await privateState(page, userA);
      return stored?.snapshot === null && stored.queue.length === 1;
    }).toBe(true);
    expect((await privateState(page, userA))!.queue[0].mutation.mutationId).toBe(mutationId);

    // Another account never projects or submits A's preserved private operations.
    await login(page, bEmail, password);
    await expect(page.getByTestId("profile-display-name")).toHaveValue("Session B Only");
    const bSnapshot = await context.request.get("/api/account/snapshot");
    expect(bSnapshot.ok()).toBe(true);
    expect((await bSnapshot.json() as AccountSnapshot).profile.id).toBe(b.data.user.id);
    const aWhileB = await privateState(page, userA);
    expect(aWhileB?.snapshot).toBeNull();
    expect(aWhileB?.queue).toHaveLength(1);
    expect(aWhileB?.queue[0].mutation.mutationId).toBe(mutationId);
    await page.goto("/account/security");
    await page.getByRole("button", { name: "退出登录", exact: true }).click();
    await expect(page).toHaveURL(/\/auth\/sign-in$/);

    // Only verified reauthentication as A reopens and sends A's stable mutation.
    await login(page, aEmail, password);
    await expect.poll(async () => {
      const response = await context.request.get("/api/account/snapshot");
      return response.ok() ? (await response.json() as AccountSnapshot).profile.display_name : null;
    }, { timeout: 30_000 }).toBe("Offline A survives revoked session");
    await expect.poll(async () => (await privateState(page, userA))?.queue.length).toBe(0);
    await expect(page.getByTestId("profile-display-name")).toHaveValue("Offline A survives revoked session");
    expect(errors).toEqual([]);
  } finally {
    await context.close();
    await remote.auth.signOut({ scope: "local" });
    for (const userId of users) await admin.auth.admin.deleteUser(userId);
  }
});
