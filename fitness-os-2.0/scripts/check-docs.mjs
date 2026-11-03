import { readFile, access, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
const root = process.cwd();
const manifest = JSON.parse(await readFile(path.join(root, "DOCUMENT_MANIFEST.json"), "utf8"));
if (manifest.documents.length !== 17) throw new Error("Expected exactly 17 original documents");
for (const document of manifest.documents) {
  const original = await readFile(path.join(root, "documentation-originals", document.archive_path));
  if (createHash("sha256").update(original).digest("hex") !== document.original_sha256) {
    throw new Error(`Original document changed: ${document.archive_path}`);
  }
  await access(path.join(root, document.docs_path));
}
const files = await readdir(root);
if (!files.includes("pnpm-lock.yaml") || files.some((file) => ["package-lock.json", "yarn.lock", "bun.lock", "bun.lockb"].includes(file))) {
  throw new Error("Use pnpm-lock.yaml as the only dependency lockfile");
}
for (const name of ["docs/INDEX.md", "README.md"]) {
  const text = await readFile(path.join(root, name), "utf8");
  for (const match of text.matchAll(/\]\(([^)]+)\)/g)) {
    const destination = match[1];
    if (/^(?:https?:|#|mailto:)/.test(destination)) continue;
    await access(path.resolve(root, path.dirname(name), destination.split("#")[0]));
  }
}
console.log("PASS: 17 original SHA-256 hashes; 17 working documents; pnpm-only lockfile; local documentation links.");
