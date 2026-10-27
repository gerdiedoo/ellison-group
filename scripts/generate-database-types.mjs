import { spawnSync } from "node:child_process";
import { writeFile, rename, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const options = process.argv.slice(2);
const result = spawnSync(
  "supabase",
  ["gen", "types", "typescript", ...(options.length ? options : ["--local"])],
  { cwd: root, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 },
);
if (
  result.error ||
  result.status !== 0 ||
  !result.stdout.includes("export type Database =")
) {
  console.error(
    "Database type generation failed; the existing types were left unchanged. Configure the Supabase CLI and retry.",
  );
  process.exit(1);
}
// Keep stable domain aliases used by the application after every CLI regeneration.
const names = {
  Profile: "profiles",
  Property: "properties",
  Lead: "leads",
  Inquiry: "inquiries",
  Conversation: "conversations",
  Message: "messages",
  Note: "notes",
  Task: "tasks",
  Setting: "settings",
  Activity: "activity_logs",
  Favorite: "favorites",
  LeadProperty: "lead_properties",
  RateLimit: "rate_limits",
};
const aliases = Object.entries(names)
  .map(
    ([name, table]) =>
      `export type ${name} = Database["public"]["Tables"]["${table}"]["Row"];`,
  )
  .join("\n");
await mkdir(path.join(root, "work"), { recursive: true });
const temporary = path.join(root, "work", "database.types.ts");
await writeFile(
  temporary,
  result.stdout + "\n// Stable application domain aliases.\n" + aliases + "\n",
);
await rename(temporary, path.join(root, "lib", "database.types.ts"));
console.log(
  "Database types regenerated with application aliases. Run npm run typecheck.",
);
