// Creates and removes only temporary audit fixtures. No existing user is promoted.
// Exit 1 means the hosted database still permits forged note attribution.
import { createClient } from "@supabase/supabase-js";
import { randomUUID, randomBytes } from "node:crypto";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
  key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key || !process.env.SUPABASE_SERVICE_ROLE_KEY)
  throw new Error(
    "Configure Supabase URL, publishable key and server service-role key.",
  );
const owner = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const token = randomUUID().slice(0, 8),
  users = [];
let lead, note;
const must = (r) => {
  if (r.error) throw new Error("Hosted audit fixture operation failed");
  return r.data;
};
try {
  for (const label of ["agent", "other"]) {
    const email = `audit-${token}-${label}@example.com`,
      password = randomBytes(24).toString("hex");
    const u = must(
      await owner.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: `Audit fixture ${token} ${label}` },
      }),
    ).user;
    users.push({ id: u.id, email, password });
  }
  must(
    await owner
      .from("profiles")
      .update({ role: "agent" })
      .eq("id", users[0].id),
  );
  lead = must(
    await owner
      .from("leads")
      .insert({
        full_name: "Audit fixture " + token,
        email: `audit-${token}@example.com`,
        consent_at: new Date().toISOString(),
        consent_text: "Temporary acceptance fixture",
      })
      .select("id")
      .single(),
  );
  const agent = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  must(
    await agent.auth.signInWithPassword({
      email: users[0].email,
      password: users[0].password,
    }),
  );
  note = must(
    await agent
      .from("notes")
      .insert({
        lead_id: lead.id,
        body: "Temporary attribution audit",
        author_id: users[0].id,
      })
      .select("id")
      .single(),
  );
  const update = await agent
    .from("notes")
    .update({ author_id: users[1].id })
    .eq("id", note.id)
    .select("author_id");
  const protectedAttribution =
    update.error !== null || update.data?.length === 0;
  console.log(
    JSON.stringify({
      hostedNoteAttributionProtected: protectedAttribution,
      requiredMigration: protectedAttribution
        ? null
        : "202610270006_note_attribution.sql",
    }),
  );
  process.exitCode = protectedAttribution ? 0 : 1;
} finally {
  if (note) must(await owner.from("notes").delete().eq("id", note.id));
  if (lead) must(await owner.from("leads").delete().eq("id", lead.id));
  for (const user of users) must(await owner.auth.admin.deleteUser(user.id));
}
