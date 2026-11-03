import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";

test("the fixed brand hero and all local editorial pictures load without an external image service", async ({ page }, testInfo) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("突破极限，持续进化。");
  await expect(page.locator(".hero-english")).toContainText("PUSH BEYOND.");
  await expect(page.locator(".hero-english")).toContainText("EVOLVE EVERY DAY.");
  await expect(page.locator(".hero-primary-action")).toHaveAttribute("href", "/explore");
  await expect(page.locator(".hero-secondary-action")).toHaveAttribute("href", "/sports/strength");
  const hero = page.locator(".hero-photograph img");
  await expect.poll(() => hero.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
  await expect(hero).toHaveAttribute("fetchpriority", "high");
  const assets = JSON.parse(await readFile("docs/VISUAL_ASSETS.json", "utf8")) as { assets: { file: string }[] };
  const decoded = await page.evaluate(async (paths) => {
    return Promise.all(paths.map((path) => new Promise<{ path: string; width: number; height: number }>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve({ path, width: image.naturalWidth, height: image.naturalHeight });
      image.onerror = () => reject(new Error(`Broken image: ${path}`));
      image.src = path;
    })));
  }, assets.assets.map((asset) => asset.file));
  expect(decoded).toHaveLength(30);
  for (const image of decoded) expect(image.width).toBeGreaterThan(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect.poll(() => hero.evaluate((image: HTMLImageElement) => image.currentSrc)).toContain("athlete-mobile");
  await expect(page.locator(".premium-hero")).toHaveAttribute("data-motion", "reduced");
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("突破极限，持续进化。");
  await page.goto("/sports");
  await expect(page.locator(".sports-catalog .editorial-sport-card")).toHaveCount(11);
  const registered = await page.locator(".sports-catalog .editorial-image").evaluateAll((images) => images.map((image) => image.getAttribute("data-image-src")));
  expect(new Set(registered).size).toBe(11);
  await testInfo.attach("decoded-local-images.json", { body: JSON.stringify(decoded, null, 2), contentType: "application/json" });
});

test("reduced-motion preferences disable ambient and parallax motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".premium-hero")).toHaveAttribute("data-motion", "reduced");
  const lightMotion = await page.locator(".hero-light").evaluate((element) => getComputedStyle(element).animationName);
  expect(lightMotion).toBe("none");
  const particles = await page.locator(".hero-particles").evaluate((element) => getComputedStyle(element).display);
  expect(particles).toBe("none");
  await page.goto("/ai");
  const nodeMotion = await page.locator(".signal-node").first().evaluate((element) => getComputedStyle(element).animationName);
  expect(nodeMotion).toBe("none");
});

test("image failure has a readable fallback and does not break genuine navigation", async ({ page }) => {
  await page.route("**/images/hero/**", (route) => route.abort());
  await page.goto("/");
  await expect(page.locator("[data-image-fallback='true']")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("突破极限，持续进化。");
  await page.locator(".hero-primary-action").click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("探索 FITNESS OS");
});

test("records desktop motion pacing without claiming real-phone performance", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.mouse.move(1100, 380);
  const sample = await page.evaluate(() => new Promise<{ frames: number; duration: number; meanFrameMs: number; p95FrameMs: number }>((resolve) => {
    const timings: number[] = [];
    const start = performance.now(); let last = start;
    function frame(now: number) {
      timings.push(now - last); last = now;
      if (now - start < 1500) requestAnimationFrame(frame);
      else { const sorted = [...timings].sort((a, b) => a - b); resolve({ frames: timings.length, duration: now - start, meanFrameMs: timings.reduce((a, b) => a + b) / timings.length, p95FrameMs: sorted[Math.floor(sorted.length * .95)] }); }
    }
    requestAnimationFrame(frame);
  }));
  expect(sample.frames).toBeGreaterThan(10);
  await testInfo.attach("desktop-motion-sample.json", { body: JSON.stringify(sample, null, 2), contentType: "application/json" });
});
