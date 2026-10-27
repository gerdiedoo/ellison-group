import { readFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const manifest = JSON.parse(
  await readFile(path.join(root, "docs/prototype-manifest.json"), "utf8"),
);
const digest = (data) => createHash("sha256").update(data).digest("hex");
for (const entry of [...manifest.files, ...manifest.assets]) {
  const data = await readFile(path.join(root, entry.path));
  if (data.length !== entry.bytes || digest(data) !== entry.sha256)
    throw new Error("Preservation check failed: " + entry.path);
}
const names = (await readdir(path.join(root, "prototype"))).sort();
if (
  JSON.stringify(names) !==
  JSON.stringify(
    manifest.files.map((entry) => path.basename(entry.path)).sort(),
  )
)
  throw new Error("Prototype file inventory changed.");
console.log(
  `Verified ${manifest.files.length} original prototype files and ${manifest.assets.length} preserved illustration assets.`,
);
