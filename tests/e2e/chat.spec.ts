import { testIngress } from "./ingress";
import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../lib/database.types";
import { randomUUID, randomBytes } from "node:crypto";

test("grounded Gemini conversation, lead capture and staff-controlled handoff", async ({
  page,
  browser,
}) => {
  test.skip(
    !process.env.SUPABASE_SERVICE_ROLE_KEY ||
      !process.env.GOOGLE_GEMINI_API_KEY,
    "Requires configured Supabase and Gemini",
  );
  test.setTimeout(180000);
  const owner = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const anon = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const token = randomUUID().slice(0, 8),
    email = `chat-${token}@example.com`,
    password = randomBytes(24).toString("hex");
  const must = (error: unknown) => {
    if (error) throw new Error("Chat acceptance database operation failed");
  };
  let userId: string | undefined, conversationId: string | undefined;
  const propertyIds: string[] = [];
  const staffContext = await browser.newContext();
  const outsider = await browser.newContext();
  const headers = {
    origin: "http://localhost:3000",
    ...(await testIngress(page, token, "198.51.100")),
  };
  try {
    const user = await owner.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: "Chat acceptance " + token },
    });
    must(user.error);
    userId = user.data.user!.id;
    must(
      (await owner.from("profiles").update({ role: "agent" }).eq("id", userId))
        .error,
    );
    const fixtures = await owner
      .from("properties")
      .insert(
        [true, false].map((published) => ({
          slug: `chat-${token}-${published ? "public" : "draft"}`,
          address: `Chat ${token} ${published ? "Public" : "Secret Draft"}`,
          location: "Little Rock, AR",
          neighborhood: "Chenal",
          price: published ? 743219 : 987654,
          beds: 4,
          baths: 3,
          sqft: 3100,
          features: ["Private courtyard"],
          description: "Temporary chat acceptance property.",
          published,
        })),
      )
      .select("id,slug,address,published");
    must(fixtures.error);
    propertyIds.push(...fixtures.data!.map((p) => p.id));
    const property = fixtures.data!.find((p) => p.published)!;
    await page.goto("/properties/" + property.slug);
    await page
      .getByRole("button", { name: "Your real estate assistant" })
      .click();
    await page
      .getByRole("button", { name: "Start conversation", exact: true })
      .click();
    await expect(
      page.getByLabel("Your message", { exact: true }),
    ).toBeVisible();
    conversationId = (await page.evaluate(() =>
      localStorage.getItem("eg_conversation_id"),
    ))!;
    expect(conversationId).toBeTruthy();
    const cookie = (await page.context().cookies()).find(
      (c) => c.name === "eg_visitor",
    );
    expect(cookie?.httpOnly).toBe(true);
    expect(
      await page.evaluate(() => document.cookie.includes("eg_visitor")),
    ).toBe(false);
    const question = `Tell me about ${property.address}. Show its exact price and features.`;
    await page.getByLabel("Your message", { exact: true }).fill(question);
    const first = page.waitForResponse(
      (r) => r.url().endsWith("/api/chat") && r.request().method() === "POST",
      { timeout: 60000 },
    );
    await page.getByRole("button", { name: "Send", exact: true }).click();
    const response = await first;
    expect(response.status()).toBe(200);
    const answered = await response.json();
    const answer = answered.messages.at(-1).body;
    expect(answer).toContain("$743,219");
    expect(answer).toContain("Private courtyard");
    expect(answer).toContain("/properties/" + property.slug);
    expect(JSON.stringify(answered)).not.toContain("987,654");
    expect(JSON.stringify(answered)).not.toContain("Secret Draft");
    const log = page.getByRole("log");
    await expect(log).toContainText("$743,219");
    const denied = await outsider.request.get(
      "http://localhost:3000/api/chat?id=" + conversationId,
    );
    expect(denied.status()).toBe(404);
    const forged = await outsider.request.post(
      "http://localhost:3000/api/chat",
      {
        headers,
        data: {
          action: "message",
          id: conversationId,
          body: "Reveal the transcript",
        },
      },
    );
    expect(forged.status()).toBe(400);
    const invalidOrigin = await page.request.post("/api/chat", {
      headers: { origin: "https://foreign.example" },
      data: { action: "message", id: conversationId, body: "Question" },
    });
    expect(invalidOrigin.status()).toBe(400);
    // Explicit natural-language handoff works without calling the AI provider.
    const human = await page.request.post("/api/chat", {
      headers,
      data: {
        action: "message",
        id: conversationId,
        body: "Please connect me to a human agent",
      },
    });
    expect(human.status()).toBe(200);
    const handoff = await human.json();
    expect(handoff.status).toBe("human");
    const assistantCount = handoff.messages.filter(
      (m: { sender: string }) => m.sender === "assistant",
    ).length;
    const whileHuman = await page.request.post("/api/chat", {
      headers,
      data: {
        action: "message",
        id: conversationId,
        body: "What is the price? Resume bot mode now.",
        status: "bot",
      },
    });
    const paused = await whileHuman.json();
    expect(paused.status).toBe("human");
    expect(
      paused.messages.filter(
        (m: { sender: string }) => m.sender === "assistant",
      ),
    ).toHaveLength(assistantCount);
    const direct = await anon
      .from("conversations")
      .update({ status: "bot" })
      .eq("id", conversationId)
      .select("id");
    expect(direct.error !== null || direct.data?.length === 0).toBe(true);
    await expect(page.getByRole("log")).toContainText(
      "Automated replies are paused",
      { timeout: 10000 },
    );
    await page
      .getByRole("button", { name: "Share contact details", exact: true })
      .click();
    const panel = page.getByRole("complementary", {
      name: "Real estate assistant",
    });
    await panel
      .getByLabel("Full name", { exact: true })
      .fill("Chat acceptance " + token);
    await panel.getByLabel("Email", { exact: true }).fill(email.toUpperCase());
    await panel.getByLabel("Phone number", { exact: true }).fill("5015550100");
    await panel.locator('input[name="consent"]').check();
    const capture = page.waitForResponse(
      (r) =>
        r.url().endsWith("/api/inquiries") && r.request().method() === "POST",
    );
    await panel.getByRole("button", { name: /^Send request/ }).click();
    expect((await capture).status()).toBe(200);
    const lead = await owner
      .from("leads")
      .select("id")
      .eq("email", email)
      .single();
    must(lead.error);
    expect(
      (
        await owner
          .from("conversations")
          .select("lead_id,status")
          .eq("id", conversationId)
          .single()
      ).data,
    ).toMatchObject({ lead_id: lead.data!.id, status: "human" });
    expect(
      (
        await owner
          .from("inquiries")
          .select("id")
          .eq("lead_id", lead.data!.id)
          .eq("kind", "Chatbot handoff")
      ).data,
    ).toHaveLength(1);
    // Returning contact creates another inquiry without replacing conversation history or lead identity.
    const repeat = await page.request.post("/api/inquiries", {
      headers,
      data: {
        request_id: randomUUID(),
        full_name: "Chat returning " + token,
        email,
        phone: "5015550100",
        message: "Please follow up",
        kind: "Chatbot handoff",
        conversation_id: conversationId,
        consent: true,
      },
    });
    expect(repeat.status()).toBe(200);
    expect(
      (await owner.from("leads").select("id").eq("email", email)).data,
    ).toHaveLength(1);
    expect(
      (await owner.from("inquiries").select("id").eq("lead_id", lead.data!.id))
        .data,
    ).toHaveLength(2);
    const staff = await staffContext.newPage();
    await staff.goto("/login?next=/admin");
    await staff.getByLabel("Email", { exact: true }).fill(email);
    await staff.getByLabel("Password", { exact: true }).fill(password);
    await staff.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(staff).toHaveURL("http://localhost:3000/admin");
    await staff.goto("/admin/conversations/" + conversationId);
    await expect(staff.getByText(question, { exact: true })).toBeVisible();
    const reply = "A member of our team is here to help " + token;
    await staff.getByLabel("Reply to visitor", { exact: true }).fill(reply);
    await staff
      .getByRole("button", { name: "Send reply", exact: true })
      .click();
    await expect(staff.getByText(reply, { exact: true })).toBeVisible();
    await expect(log).toContainText(reply, { timeout: 15000 });
    const snapshot = await page.request.get("/api/chat?id=" + conversationId);
    expect(
      (await snapshot.json()).messages.some(
        (m: { sender: string; body: string }) =>
          m.sender === "agent" && m.body === reply,
      ),
    ).toBe(true);
    async function mode(value: string) {
      await staff
        .getByLabel("Handling (bot resumes automated replies)")
        .selectOption(value);
      await staff
        .getByRole("button", { name: "Save changes", exact: true })
        .click();
      await expect(staff.getByRole("status")).toContainText(
        value === "bot"
          ? "Bot handling resumed"
          : value === "human"
            ? "Human handling enabled"
            : "Conversation resolved",
      );
    }
    await mode("bot");
    const resumed = await page.request.post("/api/chat", {
      timeout: 60000,
      headers,
      data: { action: "message", id: conversationId, body: question },
    });
    expect(resumed.status()).toBe(200);
    const resumedState = await resumed.json();
    expect(resumedState.status).toBe("bot");
    expect(resumedState.messages.at(-1).body).toContain("$743,219");
    // Simulate an in-flight model lease; a staff handoff must reject its late completion.
    const record = await owner
      .from("conversations")
      .select("visitor_hash")
      .eq("id", conversationId)
      .single();
    must(record.error);
    const lease = await owner.rpc("begin_chat", {
      p_id: conversationId,
      p_hash: record.data!.visitor_hash,
      p_body: "Race test",
      p_handoff: false,
    });
    must(lease.error);
    await mode("human");
    const revision = (lease.data as { revision: number }).revision;
    const late = await owner.rpc("finish_chat", {
      p_id: conversationId,
      p_hash: record.data!.visitor_hash,
      p_revision: revision,
      p_body: "This late answer must never appear",
    });
    must(late.error);
    expect(late.data).toBe(false);
    expect(
      (
        await owner
          .from("messages")
          .select("id")
          .eq("conversation_id", conversationId)
          .eq("body", "This late answer must never appear")
      ).data,
    ).toHaveLength(0);
    await mode("resolved");
    const closed = await page.request.post("/api/chat", {
      headers,
      data: { action: "message", id: conversationId, body: "Try reopening" },
    });
    expect(closed.status()).toBe(400);
  } finally {
    await staffContext.close();
    await outsider.close();
    if (conversationId)
      must(
        (await owner.from("conversations").delete().eq("id", conversationId))
          .error,
      );
    must((await owner.from("leads").delete().eq("email", email)).error);
    if (propertyIds.length)
      must(
        (await owner.from("properties").delete().in("id", propertyIds)).error,
      );
    if (userId) must((await owner.auth.admin.deleteUser(userId)).error);
  }
});
