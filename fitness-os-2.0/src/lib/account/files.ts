/** Allowed uploads are raster images only. SVG, HTML and executables are rejected. */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export type ImageType = { mime: "image/png" | "image/jpeg" | "image/webp"; extension: "png" | "jpg" | "webp" };
export function detectImageType(bytes: Uint8Array): ImageType | null {
  const starts = (...values: number[]) => values.every((v, i) => bytes[i] === v);
  if (bytes.length >= 33 && starts(0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a)
      && bytes[12] === 0x49 && bytes[13] === 0x48 && bytes[14] === 0x44 && bytes[15] === 0x52
      && [...bytes.slice(-8,-4)].every((v,i) => v === [0x49,0x45,0x4e,0x44][i])) return { mime: "image/png", extension: "png" };
  if (bytes.length >= 4 && starts(0xff,0xd8,0xff) && bytes.at(-2) === 0xff && bytes.at(-1) === 0xd9) return { mime: "image/jpeg", extension: "jpg" };
  if (bytes.length >= 20 && starts(0x52,0x49,0x46,0x46) && new TextDecoder().decode(bytes.slice(8,12)) === "WEBP"
      && ["VP8 ", "VP8L", "VP8X"].includes(new TextDecoder().decode(bytes.slice(12,16)))
      && new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(4,true) + 8 === bytes.length) return { mime: "image/webp", extension: "webp" };
  return null;
}
export function csvCell(value: unknown): string {
  let text = typeof value === "string" ? value : value === null || value === undefined ? "" : JSON.stringify(value);
  // Spreadsheet formula protection also covers leading whitespace/control bytes.
  if (/^[\s\u0000-\u001f]*[=+\-@]/u.test(text)) text = "'" + text;
  return '"' + text.replaceAll('"', '""') + '"';
}
export function accountCsv(data: Record<string, unknown[]>): string {
  const rows = [["entity", "record_json"].map(csvCell).join(",")];
  for (const [entity, records] of Object.entries(data)) for (const record of records) rows.push([entity, JSON.stringify(record)].map(csvCell).join(","));
  return "\ufeff" + rows.join("\r\n") + "\r\n";
}
