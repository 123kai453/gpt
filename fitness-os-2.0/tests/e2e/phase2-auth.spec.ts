import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { test, expect, type APIRequestContext, type Page } from "@playwright/test";

const integrationEnabled = process.env.PHASE2_AUTH_INTEGRATION === "1";
const mailpitOrigin = process.env.PHASE2_MAILPIT_URL ?? "http://127.0.0.1:54324";
type MailSummary = { ID: string };
type MailMessage = { HTML?: string; Text?: string };

function localAdmin(): SupabaseClient {
  if (existsSync(".env.local")) loadEnvFile(".env.local");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !secret || !["127.0.0.1", "localhost", "[::1]"].includes(new URL(url).hostname)) {
    throw new Error("Real Auth integration requires isolated local Supabase admin configuration for test cleanup.");
  }
  return createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function cleanTestAccount(admin: SupabaseClient, request: APIRequestContext, email: string) {
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw new Error("Unable to find the isolated local test account for cleanup.");
  const user = data.users.find((candidate) => candidate.email === email);
  if (user && (await admin.auth.admin.deleteUser(user.id)).error) throw new Error("Unable to delete the isolated local test account.");
  const mail = await request.get(`${mailpitOrigin}/api/v1/search`, { params: { query: `to:${email}` } });
  if (!mail.ok()) throw new Error("Unable to find isolated local test mail for cleanup.");
  const body = await mail.json() as { messages?: MailSummary[] };
  const ids = body.messages?.map(({ ID }) => ID) ?? [];
  if (ids.length && !(await request.delete(`${mailpitOrigin}/api/v1/messages`, { data: { IDs: ids } })).ok()) throw new Error("Unable to delete isolated local test mail.");
}

async function confirmationMail(request: APIRequestContext, email: string, excluded = new Set<string>()) {
  const mailUrl = new URL(mailpitOrigin);
  if (!["127.0.0.1", "localhost", "[::1]"].includes(mailUrl.hostname)) throw new Error("Auth integration requires the local Mailpit test service.");
  let result: MailSummary | undefined;
  await expect.poll(async () => {
    const response = await request.get(`${mailpitOrigin}/api/v1/search`, { params: { query: `to:${email}` } });
    if (!response.ok()) return false;
    const body = await response.json() as { messages?: MailSummary[] };
    result = body.messages?.find(({ ID }) => !excluded.has(ID));
    return Boolean(result);
  }, { timeout: 30_000, message: "Local Auth must deliver a real message to Mailpit" }).toBe(true);
  const message = await request.get(`${mailpitOrigin}/api/v1/message/${result!.ID}`);
  expect(message.ok()).toBe(true);
  const body = await message.json() as MailMessage;
  const candidates = `${body.HTML ?? ""}\n${body.Text ?? ""}`.match(/https?:\/\/[^\s<>"']+/g) ?? [];
  const link = candidates.map((value) => value.replaceAll("&amp;", "&")).find((value) => /\/auth\/v1\/verify\?|\/auth\/confirm\?/.test(value));
  if (!link) throw new Error("The local Auth email did not contain a confirmation link.");
  const linkUrl = new URL(link);
  if (!["127.0.0.1", "localhost", "[::1]"].includes(linkUrl.hostname)) throw new Error("Refusing a non-local test confirmation link.");
  return { id: result!.ID, link };
}

async function signOut(page: Page) {
  await page.goto("/account/security");
  await page.getByRole("button", { name: "退出登录", exact: true }).click();
  await expect(page).toHaveURL(/\/auth\/sign-in$/);
}

test("auth callbacks reject malformed input and prevent caching", async ({ request }) => {
  for (const path of ["/auth/callback?next=//evil.example", "/auth/confirm?type=untrusted&token_hash=test&next=%2F%2Fevil.example"]) {
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.status()).toBe(303);
    expect(new URL(response.headers().location).pathname).toBe("/auth/sign-in");
    expect(new URL(response.headers().location).origin).toBe("http://127.0.0.1:3000");
    expect(response.headers()["cache-control"]).toContain("no-store");
    expect(response.headers()["referrer-policy"]).toBe("no-referrer");
  }
});

test("real local email signup, resend, PKCE verification, signin, signout and password recovery", async ({ page, request }) => {
  test.skip(!integrationEnabled, "Requires PHASE2_AUTH_INTEGRATION=1, real local Supabase and Mailpit; never claims mock Auth integration.");
  test.setTimeout(180_000);
  const admin = localAdmin();
  const email = `auth-${randomUUID()}@fitness.local`;
  const password = `Local-Only!${randomUUID()}`;
  const newPassword = `Recovered-Only!${randomUUID()}`;
  const unexpectedAuthHosts: string[] = [];
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.route("**/auth/v1/**", (route) => {
    const hostname = new URL(route.request().url()).hostname;
    if (!["127.0.0.1", "localhost", "[::1]"].includes(hostname)) {
      unexpectedAuthHosts.push(hostname);
      return route.abort("blockedbyclient");
    }
    return route.continue();
  });

  try {
  await page.goto("/auth/sign-up");
  await expect(page.getByRole("button", { name: "创建账户", exact: true })).toBeEnabled();
  await page.getByLabel("怎么称呼你", { exact: false }).fill("Local Auth Athlete");
  await page.getByLabel("邮箱地址", { exact: true }).fill(email);
  await page.getByLabel("密码", { exact: true }).fill(password);
  await page.getByRole("button", { name: "创建账户", exact: true }).click();
  await expect(page).toHaveURL(/\/auth\/verify-email$/);
  const initial = await confirmationMail(request, email);

  // The real local provider has a one-second SMTP throttle, separate from UI cooldown.
  await page.waitForTimeout(1200);
  await page.getByLabel("邮箱地址", { exact: true }).fill(email);
  await page.getByRole("button", { name: "重新发送确认邮件", exact: true }).click();
  await expect(page.getByText("如果账户需要验证，我们会向该邮箱发送确认邮件。请稍候再检查收件箱。", { exact: true })).toBeVisible();
  const resent = await confirmationMail(request, email, new Set([initial.id]));
  await page.goto(resent.link);
  await expect(page).toHaveURL(/\/account\/profile$/);
  await page.goto("/auth/verify-email");
  await expect(page.getByText("邮箱已确认", { exact: true })).toBeVisible();

  await signOut(page);
  await page.getByLabel("邮箱地址", { exact: true }).fill(email);
  await page.getByLabel("密码", { exact: true }).fill("Incorrect-Password-For-Test");
  await page.getByRole("button", { name: "登录账户", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveText("登录未完成，请检查邮箱和密码，或稍后再试。");
  await page.getByLabel("密码", { exact: true }).fill(password);
  await expect(page.getByRole("button", { name: "登录账户", exact: true })).toBeEnabled({ timeout: 10_000 });
  await page.getByRole("button", { name: "登录账户", exact: true }).click();
  await expect(page).toHaveURL(/\/account\/profile$/);
  await page.reload();
  await page.goto("/account/security");
  await expect(page.getByText(email, { exact: true })).toBeVisible();
  await signOut(page);

  await page.goto("/auth/forgot-password");
  await page.getByLabel("邮箱地址", { exact: true }).fill(email);
  await page.getByRole("button", { name: "发送重置邮件", exact: true }).click();
  await expect(page.getByText("如果该邮箱可以接收账户恢复邮件，你会收到重置指引。请检查邮箱和垃圾邮件文件夹。", { exact: true })).toBeVisible();
  const recovery = await confirmationMail(request, email, new Set([initial.id, resent.id]));
  await page.goto(recovery.link);
  await expect(page).toHaveURL(/\/auth\/reset-password$/);
  await expect(page.getByRole("button", { name: "保存新密码", exact: true })).toBeEnabled();
  await page.getByLabel("新密码", { exact: true }).fill(newPassword);
  await page.getByLabel("再次输入新密码", { exact: true }).fill(newPassword);
  await page.getByRole("button", { name: "保存新密码", exact: true }).click();
  await expect(page.getByText("新密码已保存。你可以继续管理个人账户。", { exact: true })).toBeVisible();
  await signOut(page);
  await page.getByLabel("邮箱地址", { exact: true }).fill(email);
  await page.getByLabel("密码", { exact: true }).fill(newPassword);
  await page.getByRole("button", { name: "登录账户", exact: true }).click();
  await expect(page).toHaveURL(/\/account\/profile$/);
  await signOut(page);
  expect(unexpectedAuthHosts).toEqual([]);
  expect(pageErrors).toEqual([]);
  } finally {
    await cleanTestAccount(admin, request, email);
  }
});
