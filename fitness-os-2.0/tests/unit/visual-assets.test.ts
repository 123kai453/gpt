import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { sportsArt } from "../../src/features/visual/sports-art";
import { getModule } from "../../src/lib/navigation";
const manifest = JSON.parse(readFileSync(new URL("../../docs/VISUAL_ASSETS.json", import.meta.url), "utf8")) as { assets: { file: string; source_type: string; rights: string; sha256: string; bytes: number; width: number; height: number; format: string }[] };
describe("local editorial media delivery", () => {
  it("gives every supported sport a unique, local and correctly linked scene", () => {
    expect(sportsArt).toHaveLength(11);
    expect(new Set(sportsArt.map((sport) => sport.image)).size).toBe(11);
    for (const sport of sportsArt) {
      expect(getModule(`sports/${sport.slug}`)).toBeDefined();
      expect(sport.image).toMatch(/^\/images\/sports\/[a-z-]+\.webp$/);
      expect(existsSync(`public${sport.image}`)).toBe(true);
      expect(existsSync(`public${sport.image.replace(".webp", "-480.webp")}`)).toBe(true);
    }
  });
  it("ships the exact recorded WebP files with explicit generated provenance", () => {
    expect(manifest.assets).toHaveLength(30);
    for (const asset of manifest.assets) {
      const file = readFileSync(`public${asset.file}`);
      expect(file.subarray(0, 4).toString()).toBe("RIFF");
      expect(file.subarray(8, 12).toString()).toBe("WEBP");
      expect(createHash("sha256").update(file).digest("hex")).toBe(asset.sha256);
      expect(file.length).toBe(asset.bytes);
      expect(asset.source_type).toBe("original-generated");
      expect(asset.rights).toContain("not a photograph of an identified athlete");
    }
  });
  it("keeps the complete media set and each hero crop within the agreed local budgets", () => {
    expect(manifest.assets.reduce((total, asset) => total + asset.bytes, 0)).toBeLessThan(1_500_000);
    const heroes = manifest.assets.filter((asset) => asset.file.includes("/hero/"));
    expect(heroes).toHaveLength(4);
    for (const hero of heroes) expect(hero.bytes).toBeLessThan(120_000);
    expect(heroes.find((asset) => asset.file.endsWith("athlete-mobile.webp"))?.width).toBeLessThan(800);
  });
});
