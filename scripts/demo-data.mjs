// Deliberately synthetic CRM fixtures. Never runs during a build or deployment.
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

export const DEMO_NAMESPACE = "ellison-crm-demo-v1";
const DAY = 86_400_000;

export function demoId(label) {
  const hex = createHash("sha256")
    .update(`${DEMO_NAMESPACE}:${label}`)
    .digest("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

export function createDemoDataset(now = Date.now()) {
  const ago = (days, minutes = 0) =>
    new Date(now - days * DAY - 3_600_000 + minutes * 60_000).toISOString();
  const id = demoId;
  const property = (key, fields) => ({
    id: id(`property:${key}`),
    slug: `ellison-demo-${key}`,
    location: "Little Rock, AR — fictional demo address",
    neighborhood: "Chenal",
    property_type: "Single-family",
    published: false,
    description:
      "[DEMO] Fictional property created only to demonstrate the CRM. This is not an available listing. Keep unpublished unless deliberately demonstrating the public website.",
    features: ["[DEMO] Synthetic listing", "Covered terrace", "Home office"],
    images: [],
    assigned_to: null,
    created_at: ago(14),
    updated_at: ago(1),
    ...fields,
  });
  const properties = [
    property("creekstone", {
      address: "[DEMO] 100 Creekstone Lane",
      price: 875000,
      beds: 4,
      baths: 3.5,
      sqft: 3650,
      illustration: "stone",
      listing_status: "For Sale",
    }),
    property("oak-terrace", {
      address: "[DEMO] 200 Oak Terrace Drive",
      neighborhood: "Pleasant Valley",
      price: 625000,
      beds: 3,
      baths: 2.5,
      sqft: 2850,
      illustration: "brick",
      listing_status: "Pending",
    }),
  ];
  const people = [
    ["avery", "Avery Morgan", "New", "form", 0],
    ["jordan", "Jordan Ellis", "Contacted", "chatbot", 1],
    ["riley", "Riley Parker", "Qualified", "google", 3],
    ["casey", "Casey Bennett", "Appointment Scheduled", "form", 5],
    ["taylor", "Taylor Reed", "Nurturing", "manual", 9],
    ["morgan", "Morgan Hayes", "Converted", "chatbot", 13],
  ];
  const leads = people.map(([key, name, status, source, age], index) => ({
    id: id(`lead:${key}`),
    full_name: `[DEMO] ${name}`,
    email: `ellison-demo-${key}@example.com`,
    phone: `(501) 555-01${String(index + 1).padStart(2, "0")}`,
    source,
    status,
    assigned_to: null,
    consent_at: ago(age),
    consent_text:
      "[DEMO] Synthetic fixture. No person submitted this form or gave privacy consent; do not contact this fictional record.",
    created_at: ago(age),
    updated_at: ago(Math.max(0, age - 1)),
  }));
  const inquirySpecs = [
    ["avery", "Property question", "New", "creekstone", "Could you explain the features of this fictional demo home?", 0],
    ["jordan", "Chatbot handoff", "In progress", "creekstone", "Please connect this demo conversation with the team.", 1],
    ["riley", "Valuation request", "Responded", null, "I would like a sample valuation for a fictional Pleasant Valley home.", 3],
    ["casey", "Showing request", "Scheduled", "oak-terrace", "Please demonstrate a showing request for this demo property.", 5],
    ["taylor", "General", "New", null, "I am exploring a move next year; this is a synthetic follow-up example.", 9],
    ["morgan", "Chatbot handoff", "Closed", "oak-terrace", "This completed demo inquiry illustrates a converted lead.", 13],
  ];
  const inquiries = inquirySpecs.map(([key, kind, status, prop, message, age]) => ({
    id: id(`inquiry:${key}`),
    request_id: id(`request:${key}`),
    lead_id: id(`lead:${key}`),
    property_id: prop ? id(`property:${prop}`) : null,
    kind,
    status,
    message: `[DEMO] ${message}`,
    context: {
      demo_seed: DEMO_NAMESPACE,
      full_name: leads.find((lead) => lead.id === id(`lead:${key}`)).full_name,
      email: `ellison-demo-${key}@example.com`,
      preferred_contact: "Email",
      ...(kind === "Valuation request"
        ? { address: "[DEMO] 300 Sample Court", property_type: "Single-family" }
        : {}),
    },
    preferred_date:
      kind === "Showing request"
        ? new Date(now + 3 * DAY).toISOString().slice(0, 10)
        : null,
    assigned_to: null,
    created_at: ago(age, 5),
  }));
  const conversationSpecs = [
    ["avery", "bot", "creekstone", 0],
    ["jordan", "human", "creekstone", 1],
    ["morgan", "resolved", "oak-terrace", 13],
  ];
  const conversations = conversationSpecs.map(([key, status, prop, age]) => ({
    id: id(`conversation:${key}`),
    visitor_hash: `${DEMO_NAMESPACE}:${key}`,
    lead_id: id(`lead:${key}`),
    property_id: id(`property:${prop}`),
    assigned_to: null,
    status,
    processing_until: null,
    created_at: ago(age, 10),
    updated_at: ago(age, 13),
  }));
  const messageSpecs = [
    ["avery", "visitor", "I am exploring the fictional Creekstone demo home. What features does it have?", 0, 10],
    ["avery", "assistant", "This is a saved demo transcript, not an AI response. The fictional draft record includes a covered terrace and home office. It is not a published listing.", 0, 11],
    ["avery", "visitor", "Could I speak with someone about my search preferences?", 0, 12],
    ["jordan", "visitor", "I would like help from a person with my sample property search.", 1, 10],
    ["jordan", "assistant", "This saved demo transcript illustrates a handoff. The conversation is now in human mode and automatic replies are disabled.", 1, 11],
    ["jordan", "system", "Demo fixture: human handling enabled. An authorized staff member can reply or resume the assistant.", 1, 12],
    ["morgan", "visitor", "Thank you. You can close this fictional example conversation.", 13, 10],
    ["morgan", "assistant", "This saved demo transcript illustrates a resolved conversation. No real request or appointment was made.", 13, 11],
    ["morgan", "system", "Demo fixture: conversation resolved.", 13, 12],
  ];
  const messages = messageSpecs.map(([key, sender, body, age, minute], index) => ({
    id: id(`message:${index}`),
    conversation_id: id(`conversation:${key}`),
    sender,
    body: `[DEMO] ${body}`,
    author_id: null,
    created_at: ago(age, minute),
  }));
  const taskSpecs = [
    ["avery", "Review the demo buyer's search preferences", -1, false],
    ["jordan", "Respond to the demo human-handoff conversation", 0, false],
    ["casey", "Confirm the fictional demo showing", 2, false],
    ["morgan", "Complete the demo closing follow-up", -3, true],
  ];
  const tasks = taskSpecs.map(([key, title, days, done]) => ({
    id: id(`task:${key}`),
    lead_id: id(`lead:${key}`),
    title: `[DEMO] ${title}`,
    due_at: new Date(now + days * DAY).toISOString(),
    done,
    assigned_to: null,
    created_at: ago(1),
  }));
  const lead_properties = [
    ["avery", "creekstone"],
    ["jordan", "creekstone"],
    ["riley", "oak-terrace"],
    ["casey", "oak-terrace"],
  ].map(([lead, prop]) => ({
    lead_id: id(`lead:${lead}`),
    property_id: id(`property:${prop}`),
  }));
  return { properties, leads, inquiries, lead_properties, conversations, messages, tasks };
}

function checked(result, operation) {
  if (result.error)
    throw new Error(`${operation} failed (${result.error.code || "network/configuration error"}). No credential values are included in this error.`);
  return result.data || [];
}

// Validate exact identity, not just a broad name prefix, before insertion/removal.
async function checkOwnership(db, dataset) {
  for (const table of ["properties", "leads", "inquiries", "conversations", "messages", "tasks"]) {
    const expected = new Map(dataset[table].map((row) => [row.id, row]));
    const rows = checked(
      await db.from(table).select("*").in("id", [...expected.keys()]),
      `Inspect demo ${table}`,
    );
    const identityFields = {
      properties: ["slug"],
      leads: ["email"],
      inquiries: ["lead_id", "request_id"],
      conversations: ["visitor_hash", "lead_id"],
      messages: ["conversation_id"],
      tasks: ["lead_id"],
    }[table];
    for (const row of rows) {
      if (identityFields.some((field) => row[field] !== expected.get(row.id)[field]))
        throw new Error(`Refusing to modify ${table}: a reserved demo ID has a different identity.`);
    }
  }
  for (const [table, field] of [["leads", "email"], ["properties", "slug"]]) {
    const expected = new Map(dataset[table].map((row) => [row[field], row.id]));
    const rows = checked(
      await db.from(table).select(`id,${field}`).in(field, [...expected.keys()]),
      `Inspect reserved demo ${field}`,
    );
    if (rows.some((row) => expected.get(row[field]) !== row.id))
      throw new Error(`Refusing to modify ${table}: a demo ${field} belongs to another record.`);
  }
}

async function run() {
  const args = process.argv.slice(2);
  if (args.length > 1 || (args.length === 1 && args[0] !== "--remove"))
    throw new Error("Usage: npm run seed:demo OR npm run remove:demo");
  try {
    process.loadEnvFile(".env.local");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY)
    throw new Error("Configure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the server environment or ignored .env.local.");
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const dataset = createDemoDataset();
  await checkOwnership(db, dataset);
  if (args[0] === "--remove") {
    // Audit events remain immutable. No accounts, settings or existing source drafts are touched.
    for (const table of ["conversations", "leads", "properties"]) {
      const rows = checked(
        await db.from(table).delete().in("id", dataset[table].map((row) => row.id)).select("id"),
        `Remove demo ${table}`,
      );
      console.log(`Removed ${rows.length} demo ${table}.`);
    }
    console.log("Dependent demo inquiries, messages, tasks and property interests were removed by foreign-key cascades. Audit history is retained.");
    return;
  }
  for (const [table, records] of Object.entries(dataset)) {
    const rows = checked(
      await db.from(table).upsert(records, {
        onConflict: table === "lead_properties" ? "lead_id,property_id" : "id",
        ignoreDuplicates: true,
      }).select(table === "lead_properties" ? "lead_id,property_id" : "id"),
      `Create demo ${table}`,
    );
    console.log(`Inserted ${rows.length} demo ${table}; existing rows were preserved.`);
  }
  await checkOwnership(db, dataset);
  for (const [table, records] of Object.entries(dataset)) {
    if (table === "lead_properties") {
      const rows = checked(
        await db.from(table).select("lead_id,property_id")
          .in("lead_id", dataset.leads.map((row) => row.id))
          .in("property_id", dataset.properties.map((row) => row.id)),
        `Verify demo ${table}`,
      );
      if (records.some((expected) => !rows.some((row) => row.lead_id === expected.lead_id && row.property_id === expected.property_id)))
        throw new Error("Demo verification failed: an interested-property link is missing.");
    } else {
      const result = await db.from(table).select("id", { count: "exact", head: true })
        .in("id", records.map((row) => row.id));
      checked(result, `Verify demo ${table}`);
      if (result.count !== records.length)
        throw new Error(`Demo verification failed for ${table}: expected ${records.length}, found ${result.count}.`);
    }
    console.log(`Verified ${records.length} persistent demo ${table}.`);
  }
  console.log("Demo data is ready in /admin. New demo properties are unpublished; no real contacts, users or settings were changed.");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
