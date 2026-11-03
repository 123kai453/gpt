import { test, expect, type Page } from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { modules } from "../../src/lib/navigation";

async function waitForWorker(page: Page) {
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
}

async function assertNoOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({ width: window.innerWidth, content: document.documentElement.scrollWidth }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.width + 1);
}

test("every registered route is reachable and unknown paths show a recoverable 404", async ({ request, page }) => {
  for (const entry of modules) {
    const response = await request.get(`/${entry.slug}`);
    expect(response.status(), entry.slug).toBe(200);
    expect(await response.text(), entry.slug).toContain(entry.title);
  }
  const unknown = await page.goto("/this-page-does-not-exist");
  expect(unknown?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "这个页面还未抵达。" })).toBeVisible();
  await page.getByRole("link", { name: "返回总览", exact: false }).click();
  await expect(page.getByRole("heading", { name: /突破极限，\s*持续进化。/ })).toBeVisible();
});

test("desktop Dashboard has honest empty states, working links and no external API calls", async ({ page }, testInfo) => {
  const externalRequests: string[] = [];
  const errors: string[] = [];
  page.on("request", (request) => { if (!new URL(request.url()).hostname.match(/^(127\.0\.0\.1|localhost)$/)) externalRequests.push(request.url()); });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /突破极限，\s*持续进化。/ })).toBeVisible();
  await expect(page.getByText("你的故事，从这里开始", { exact: true })).toBeVisible();
  await expect(page.getByText("等待开始", { exact: true })).toBeVisible();
  await expect(page.getByText("尚未记录", { exact: true })).toBeVisible();
  await expect(page.getByText("当前未调用 AI 服务，也未读取任何设备数据。", { exact: true })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "主导航" })).toBeVisible();
  await assertNoOverflow(page);
  await page.screenshot({ path: testInfo.outputPath("desktop-dark.png"), fullPage: true, animations: "disabled" });
  const links = [...new Set(await page.locator("a[href^='/']").evaluateAll((anchors) => anchors.map((anchor) => anchor.getAttribute("href")!).filter(Boolean)))];
  for (const href of links) {
    const response = await page.request.get(href);
    expect(response.ok(), `Rendered broken link ${href}`).toBe(true);
  }
  await page.getByRole("navigation", { name: "主导航" }).getByRole("link", { name: "运动中心", exact: true }).click();
  await expect(page.getByRole("heading", { name: "运动中心.", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /划船机/ })).toBeVisible();
  expect(externalRequests).toEqual([]);
  expect(errors).toEqual([]);
});

test("theme changes persist across reload and settings controls remain synchronized", async ({ page }, testInfo) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "切换主题", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect.poll(() => page.evaluate(() => localStorage.getItem("fitness-os-theme"))).toBe("light");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.screenshot({ path: testInfo.outputPath("desktop-light.png"), fullPage: true, animations: "disabled" });
  await page.goto("/settings");
  await expect(page.getByRole("button", { name: /浅色模式/ })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: /深色模式/ }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.getByRole("button", { name: /深色模式/ })).toHaveAttribute("aria-pressed", "true");
});

test("mobile navigation reaches all centers and layouts fit narrow touch screens", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("navigation", { name: "手机导航" })).toBeVisible();
  await assertNoOverflow(page);
  await page.screenshot({ path: testInfo.outputPath("mobile-dark.png"), fullPage: true, animations: "disabled" });
  await page.getByRole("navigation", { name: "手机导航" }).getByRole("link", { name: "全部", exact: true }).click();
  await expect(page.getByRole("heading", { name: "探索 FITNESS OS.", exact: true })).toBeVisible();
  for (const title of ["运动中心", "营养中心", "AI 私人教练", "数据中心", "设备中心", "社区", "智能导入", "偏好设置"]) {
    await expect(page.locator(".module-grid").getByRole("link", { name: new RegExp(title) })).toBeVisible();
  }
  await page.locator(".module-grid").getByRole("link", { name: /设备中心/ }).click();
  await expect(page.getByText("当前没有连接任何设备。", { exact: false })).toBeVisible();
  await assertNoOverflow(page);
  await page.setViewportSize({ width: 320, height: 740 });
  for (const path of ["/", "/sports", "/nutrition/recognition", "/ai/memory", "/devices/huawei", "/settings"]) {
    await page.goto(path);
    await assertNoOverflow(page);
  }
});

test("manifest, original icons, install guidance and service-worker registration are usable", async ({ page, request }) => {
  const manifestResponse = await request.get("/manifest.json");
  expect(manifestResponse.ok()).toBe(true);
  const manifest = await manifestResponse.json() as { name: string; start_url: string; display: string; icons: { src: string; sizes: string }[] };
  expect(manifest.name).toContain("FITNESS OS");
  expect(manifest.start_url).toBe("/");
  expect(manifest.display).toBe("standalone");
  expect(manifest.icons.map((icon) => icon.sizes)).toContain("192x192");
  expect(manifest.icons.map((icon) => icon.sizes)).toContain("512x512");
  for (const icon of manifest.icons) {
    const response = await request.get(icon.src);
    expect(response.ok(), icon.src).toBe(true);
    expect(response.headers()["content-type"]).toContain("image/");
  }
  await page.goto("/");
  await waitForWorker(page);
  await page.getByRole("button", { name: "安装应用", exact: true }).click();
  await expect(page.getByRole("heading", { name: "把 FITNESS OS 放在手边" })).toBeVisible();
  await expect(page.getByText("离线应用外壳已就绪", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "关闭安装说明" }).click();
  await expect(page.getByRole("heading", { name: "把 FITNESS OS 放在手边" })).not.toBeVisible();
});

test("offline reload opens the public shell and caches exclude pages and private requests", async ({ page, context }) => {
  await page.goto("/");
  await waitForWorker(page);
  await page.evaluate(async () => {
    await fetch("/api/phase1-cache-probe", { headers: { Authorization: "Bearer synthetic-test-only" } });
    await fetch("/private/phase1-cache-probe");
  });
  const paths = await page.evaluate(async () => {
    const entries: { path: string; contentType: string }[] = [];
    for (const name of await caches.keys()) {
      const cache = await caches.open(name);
      for (const request of await cache.keys()) {
        const response = await cache.match(request);
        entries.push({ path: new URL(request.url).pathname, contentType: response?.headers.get("Content-Type") ?? "" });
      }
    }
    return entries;
  });
  expect(paths.some((entry) => entry.path === "/offline.html")).toBe(true);
  for (const entry of paths) {
    expect(entry.path).not.toMatch(/^\/(api|auth|account|private|storage|supabase)(\/|$)/);
    expect(entry.path === "/offline.html" || !entry.contentType.includes("text/html")).toBe(true);
    expect(entry.path).not.toBe("/");
  }
  await context.setOffline(true);
  await expect(page.getByText("当前离线 · 业务记录与云同步尚未启用", { exact: true })).toBeVisible();
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /连接暂停，\s*节奏还在。/ })).toBeVisible();
  await context.setOffline(false);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /突破极限，\s*持续进化。/ })).toBeVisible();
});

test("new service-worker version waits for user confirmation, reloads and removes only stale app cache", async ({ page }) => {
  const workerPath = resolve("public/sw.js");
  const original = await readFile(workerPath, "utf8");
  const version = /const VERSION = "([^"]+)"/.exec(original)?.[1];
  expect(version).toBeTruthy();
  const nextVersion = `${version}-e2e-${Date.now()}`;
  await page.goto("/");
  await waitForWorker(page);
  await page.evaluate(async () => { await caches.open("unrelated-app-cache"); });
  try {
    await writeFile(workerPath, original.replace(`const VERSION = "${version}"`, `const VERSION = "${nextVersion}"`));
    await page.evaluate(async () => { await (await navigator.serviceWorker.ready).update(); });
    await expect(page.getByText("发现新版本", { exact: true })).toBeVisible();
    await expect.poll(() => page.evaluate(async () => Boolean((await navigator.serviceWorker.getRegistration())?.waiting))).toBe(true);
    const before = await page.evaluate(async () => caches.keys());
    expect(before).toContain(`fitness-os-public-${version}`);
    await Promise.all([
      page.waitForEvent("load"),
      page.getByRole("button", { name: "更新并刷新", exact: true }).click(),
    ]);
    await expect(page.getByRole("heading", { name: /突破极限，\s*持续进化。/ })).toBeVisible();
    await expect.poll(() => page.evaluate(async () => caches.keys())).not.toContain(`fitness-os-public-${version}`);
    const after = await page.evaluate(async () => caches.keys());
    expect(after).toContain(`fitness-os-public-${nextVersion}`);
    expect(after).toContain("unrelated-app-cache");
  } finally {
    await writeFile(workerPath, original);
  }
});
