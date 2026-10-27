import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
process.loadEnvFile(".env.local");
const source = await readFile(
  new URL("../prototype/store.js", import.meta.url),
  "utf8",
);
const block = source.match(/const PROPS = \[([\s\S]*?)\n  \];/)[1];
const areas = {
  chenal: "Chenal",
  pleasant: "Pleasant Valley",
  downtown: "Historic Downtown",
  beyond: "Beyond Little Rock",
};
const records = [...block.matchAll(/\{([^}]+)\}/g)].map(([, row]) => {
  const p = Object.fromEntries(
    [...row.matchAll(/(\w+):\s*(?:'([^']*)'|(\d+))/g)].map((m) => [
      m[1],
      m[2] ?? Number(m[3]),
    ]),
  );
  return {
    slug: p.addr
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, ""),
    address: p.addr,
    location: p.loc,
    neighborhood: areas[p.area],
    property_type: p.pt,
    price: p.p,
    beds: p.bd,
    baths: p.ba,
    sqft: p.sf,
    illustration: p.type,
    listing_status: p.st,
    published: false,
  };
});
if (records.length !== 16)
  throw new Error("Unexpected prototype record count; import aborted.");
const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
const { data, error } = await db
  .from("properties")
  .upsert(records, { onConflict: "slug", ignoreDuplicates: true })
  .select("id");
if (error) throw new Error("Draft import failed: " + error.code);
console.log(
  `Preserved ${records.length} source records; inserted ${data.length} missing drafts. Existing records were not overwritten.`,
);
