import { test, expect } from "@playwright/test";
import { writeFile } from "node:fs/promises";
import { modules } from "../../src/lib/navigation";

test("final delivery audits every rendered module, navigation target and browser console", async ({ page, request }, testInfo) => {
  test.setTimeout(100_000);
  const browserErrors: string[] = [];
  const badResponses: string[] = [];
  const targets = new Set<string>();
  const routes: { route: string; status: number | undefined; title: string }[] = [];
  page.on("pageerror", (error) => browserErrors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") browserErrors.push(message.text()); });
  page.on("response", (response) => { if (response.status() >= 400) badResponses.push(`${response.status()} ${response.url()}`); });
  for (const entry of [{ slug: "", title: "突破极限，持续进化。" }, ...modules]) {
    const route = `/${entry.slug}`;
    const response = await page.goto(route);
    expect(response?.status(), route).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(entry.title);
    await page.waitForLoadState("networkidle");
    for (const target of await page.locator("a[href^='/']").evaluateAll((links) => links.map((link) => link.getAttribute("href")!))) targets.add(target);
    routes.push({ route, status: response?.status(), title: entry.title });
  }
  for (const target of targets) expect((await request.get(target)).status(), target).toBe(200);
  expect(browserErrors).toEqual([]);
  expect(badResponses).toEqual([]);
  const cacheEntries = await page.evaluate(async () => {
    const entries: string[] = [];
    for (const name of await caches.keys()) {
      for (const request of await (await caches.open(name)).keys()) entries.push(new URL(request.url).pathname);
    }
    return entries;
  });
  for (const path of cacheEntries) {
    expect(path === "/offline.html" || path === "/manifest.json" || path.startsWith("/icons/") || path.startsWith("/_next/static/"), path).toBe(true);
    expect(path).not.toMatch(/^\/(api|auth|private|account|storage|supabase)(\/|$)/);
  }
  await writeFile(testInfo.outputPath("navigation-and-console-audit.json"), JSON.stringify({ routes, uniqueNavigationTargets: [...targets].sort(), browserErrors, badResponses, cacheEntries }, null, 2));
});

test("captures seven requested final-delivery views from the running application", async ({ page }, testInfo) => {
  test.setTimeout(60_000);
  const captures = [
    { filename: "01-dashboard-desktop-dark.png", route: "/", theme: "dark", width: 1440, height: 1000 },
    { filename: "02-dashboard-desktop-light.png", route: "/", theme: "light", width: 1440, height: 1000 },
    { filename: "03-dashboard-mobile.png", route: "/", theme: "dark", width: 390, height: 844 },
    { filename: "04-sports-center.png", route: "/sports", theme: "dark", width: 1440, height: 1000 },
    { filename: "05-nutrition-center.png", route: "/nutrition", theme: "dark", width: 1440, height: 1000 },
    { filename: "06-ai-coach.png", route: "/ai", theme: "dark", width: 1440, height: 1000 },
    { filename: "07-device-center.png", route: "/devices", theme: "dark", width: 1440, height: 1000 },
  ];
  for (const capture of captures) {
    await page.setViewportSize({ width: capture.width, height: capture.height });
    await page.goto("/");
    await page.evaluate((theme) => { localStorage.setItem("fitness-os-theme", theme); }, capture.theme);
    await page.goto(capture.route);
    await expect(page.locator("html")).toHaveAttribute("data-theme", capture.theme);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: testInfo.outputPath(capture.filename), fullPage: true, animations: "disabled" });
  }
  await writeFile(testInfo.outputPath("screenshot-manifest.json"), JSON.stringify(captures, null, 2));
});
