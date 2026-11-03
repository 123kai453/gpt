import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { accountCsv, csvCell, detectImageType, MAX_IMAGE_BYTES } from "../../src/lib/account/files";

const png = new Uint8Array(Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aJxkAAAAASUVORK5CYII=", "base64"));
describe("private raster image boundary", () => {
  it("recognizes actual PNG and project WebP file signatures", () => {
    expect(detectImageType(png)).toEqual({ mime: "image/png", extension: "png" });
    const webp = new Uint8Array(readFileSync(new URL("../../public/images/hero/athlete-desktop.webp", import.meta.url)));
    expect(detectImageType(webp)).toEqual({ mime: "image/webp", extension: "webp" });
    expect(MAX_IMAGE_BYTES).toBe(5 * 1024 * 1024);
  });
  it("rejects text, SVG, executable signatures and truncated images", () => {
    for (const value of ["<svg onload=alert(1)></svg>", "<html><script>alert(1)</script>", "MZ executable", ""]) {
      expect(detectImageType(new TextEncoder().encode(value))).toBeNull();
    }
    expect(detectImageType(png.slice(0,16))).toBeNull();
    expect(detectImageType(png.slice(0,-1))).toBeNull();
  });
  it("rejects forged WebP container length and unknown WebP payloads", () => {
    const fake = new Uint8Array(20);
    fake.set(new TextEncoder().encode("RIFF"),0);
    fake.set(new TextEncoder().encode("WEBPVP8X"),8);
    expect(detectImageType(fake)).toBeNull();
    new DataView(fake.buffer).setUint32(4,12,true);
    fake.set(new TextEncoder().encode("HTML"),12);
    expect(detectImageType(fake)).toBeNull();
  });
});

describe("account CSV portability and spreadsheet safety", () => {
  it.each(["=HYPERLINK(\"evil\")", "+SUM(1,2)", "-2+3", "@cmd", " \t=1", "\r@formula"])("neutralizes formula-like cells %j", (value) => {
    expect(csvCell(value).startsWith('"\'')).toBe(true);
  });
  it("quotes delimiters, embedded quotes and multiline text", () => {
    expect(csvCell('a,"b"\nc')).toBe('"a,""b""\nc"');
    expect(csvCell(null)).toBe('""');
  });
  it("retains nested settings as JSON rather than dropping fields", () => {
    const result = accountCsv({ user_preferences: [{ theme: "dark", notification_preferences: { push: true, email: false } }] });
    expect(result).toContain('"entity","record_json"\r\n');
    expect(result).toContain('""push"":true');
    expect(result).toContain('""email"":false');
  });
});
