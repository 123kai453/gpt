import { describe, expect, it } from "vitest";
import { getChildren, getModule, modules, phaseLabel, topModules } from "../../src/lib/navigation";

describe("product navigation and phase boundaries", () => {
  it("preserves every required initial sport, including manually authored plans", () => {
    const required = ["sports/strength", "sports/swimming", "sports/outdoor-run", "sports/treadmill", "sports/indoor-cycle", "sports/hike", "sports/elliptical", "sports/rowing", "sports/jump-rope", "sports/stair-climber", "sports/other"];
    for (const slug of required) {
      expect(getModule(slug), `Missing ${slug}`).toMatchObject({ parent: "sports", phase: 3 });
    }
    expect(getModule("sports/strength")?.capabilities.join(" ")).toContain("手动计划");
  });

  it("provides all requested product centers and nested capabilities", () => {
    for (const center of ["sports", "nutrition", "ai", "data", "devices", "community"]) {
      expect(topModules.some((entry) => entry.slug === center)).toBe(true);
      expect(getChildren(center).length).toBeGreaterThanOrEqual(center === "community" ? 4 : 3);
    }
    for (const slug of ["nutrition/log", "nutrition/library", "nutrition/recognition", "nutrition/analysis", "nutrition/plans", "ai/training", "ai/nutrition", "ai/memory", "ai/models", "data/body", "data/trends", "data/history", "data/personal", "devices/apple", "devices/huawei", "devices/health-connect", "devices/files", "community/plans", "community/favorites", "community/share", "community/profile", "import"]) {
      expect(getModule(slug), `Missing ${slug}`).toBeDefined();
    }
  });

  it("cannot register duplicate, unsafe, orphaned or unexplained navigation destinations", () => {
    const slugs = modules.map((entry) => entry.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const entry of modules) {
      expect(entry.slug).toMatch(/^[a-z0-9-]+(?:\/[a-z0-9-]+)*$/);
      expect(entry.title.trim()).not.toBe("");
      expect(entry.description.trim()).not.toBe("");
      expect(entry.capabilities.length).toBeGreaterThan(0);
      if (entry.parent) {
        expect(getModule(entry.parent)).toBeDefined();
        expect(entry.slug.startsWith(`${entry.parent}/`)).toBe(true);
      }
    }
    expect(getModule("does-not-exist")).toBeUndefined();
  });

  it("marks future functionality as unavailable instead of implying completed business workflows", () => {
    for (const entry of modules) {
      expect(entry.phase).toBeGreaterThanOrEqual(1);
      expect(entry.phase).toBeLessThanOrEqual(10);
      if (!["settings", "explore"].includes(entry.slug)) {
        expect(entry.phase).toBeGreaterThan(1);
        expect(phaseLabel(entry.phase)).toContain("尚未开放");
      }
    }
    expect(phaseLabel(1)).toContain("基础已开放");
    expect(getModule("devices/apple")?.description).toContain("未连接");
    expect(getModule("devices/huawei")?.description).toContain("待官方与真机验证");
  });
});
