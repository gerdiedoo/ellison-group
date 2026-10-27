import type { Database } from "../../lib/database.types";
import { test, expect, type Page, type Locator } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { randomBytes, randomUUID } from "node:crypto";
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a+z8AAAAASUVORK5CYII=",
  "base64",
);
const must = (error: unknown) => {
  if (error) throw new Error("CRM acceptance database operation failed");
};
async function submit(page: Page, button: Locator) {
  const path = new URL(page.url()).pathname;
  const done = page.waitForResponse(
    (r) =>
      r.request().method() === "POST" && new URL(r.url()).pathname === path,
  );
  await button.click();
  return await done;
}
test("protected CRM workflows and direct API permissions", async ({
  page,
  browser,
}) => {
  test.skip(
    !process.env.SUPABASE_SERVICE_ROLE_KEY,
    "Requires a configured acceptance backend",
  );
  test.setTimeout(240000);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
  const owner = createClient<Database>(
    url,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
  const token = randomUUID().slice(0, 8),
    name = "CRM acceptance " + token,
    email = `crm-${token}@example.com`;
  const users: { id: string; email: string; password: string; role: string }[] =
    [];
  const propertyIds: string[] = [];
  let leadId: string | undefined, conversationId: string | undefined;
  let imageUrls: string[] = [];
  const createdContexts: Awaited<ReturnType<typeof browser.newContext>>[] = [];
  try {
    for (const role of ["admin", "agent", "visitor", "target"] as const) {
      const userEmail = `crm-${token}-${role}@example.com`,
        password = randomBytes(24).toString("hex");
      const r = await owner.auth.admin.createUser({
        email: userEmail,
        password,
        email_confirm: true,
        user_metadata: { full_name: name + " " + role },
      });
      must(r.error);
      const id = r.data.user!.id;
      users.push({ id, email: userEmail, password, role });
      if (role === "admin" || role === "agent") {
        const r = await owner.from("profiles").update({ role }).eq("id", id);
        must(r.error);
      }
    }
    const [admin, agent, visitor, target] = users;
    // Public SDK with real sessions; no service credential is used in permission checks.
    async function session(user: typeof admin) {
      const jar = new Map<
        string,
        { name: string; value: string; options: CookieOptions }
      >();
      const db = createServerClient<Database>(url, key, {
        cookies: {
          getAll: () => [...jar.values()],
          setAll: (cookies) => cookies.forEach((c) => jar.set(c.name, c)),
        },
      });
      const r = await db.auth.signInWithPassword({
        email: user.email,
        password: user.password,
      });
      must(r.error);
      return {
        db,
        cookies: () =>
          [...jar.values()].map((c) => ({
            name: c.name,
            value: c.value,
            domain: "localhost",
            path: "/",
            sameSite: "Lax" as const,
            secure: false,
          })),
      };
    }
    const sessions = {
      admin: await session(admin),
      agent: await session(agent),
      visitor: await session(visitor),
    };
    const anon = createClient<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    await page.context().setExtraHTTPHeaders({
      "x-real-ip": `192.0.2.${1 + (parseInt(token.slice(0, 2), 16) % 250)}`,
    });
    await page.goto("/login?next=/admin");
    await page.getByLabel("Email", { exact: true }).fill(admin.email);
    await page.getByLabel("Password", { exact: true }).fill(admin.password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page).toHaveURL("http://localhost:3000/admin");
    await expect(
      page.getByRole("heading", { name: "A considered overview." }),
    ).toBeVisible();
    await page.goto("/admin/properties/new");
    await page.getByLabel("Street address", { exact: true }).fill(name);
    await page.getByLabel("URL slug").fill("crm-" + token);
    await page.getByLabel("City, state and ZIP").fill("Little Rock, AR");
    await page
      .getByLabel("Neighborhood", { exact: true })
      .selectOption("Chenal");
    await page.getByLabel("Price (USD)", { exact: true }).fill("550000");
    await page.getByLabel("Bedrooms", { exact: true }).fill("3");
    await page.getByLabel("Bathrooms", { exact: true }).fill("2.5");
    await page.getByLabel("Square feet", { exact: true }).fill("2400");
    await page
      .getByLabel("Description", { exact: true })
      .fill("Temporary CRM acceptance property.");
    await page.getByLabel("Features (one per line)").fill("Garden\nGarage");
    await page.getByLabel("Assigned agent").selectOption(agent.id);
    await page.getByLabel("Published on the public website").check();
    await page.getByLabel("Add property photos").setInputFiles({
      name: "fake.png",
      mimeType: "image/png",
      buffer: Buffer.from("not an image"),
    });
    await submit(
      page,
      page.getByRole("button", { name: "Create property", exact: true }),
    );
    await expect(page.getByRole("main").getByRole("alert")).toContainText(
      "Only genuine",
    );
    expect(
      (
        await owner
          .from("properties")
          .select("id")
          .eq("slug", "crm-" + token)
      ).data,
    ).toHaveLength(0);
    await page.getByLabel("Add property photos").setInputFiles({
      name: "acceptance.png",
      mimeType: "image/png",
      buffer: png,
    });
    await submit(
      page,
      page.getByRole("button", { name: "Create property", exact: true }),
    );
    await expect(page.getByRole("status")).toContainText("Property saved.");
    const property = await owner
      .from("properties")
      .select("*")
      .eq("slug", "crm-" + token)
      .single();
    must(property.error);
    propertyIds.push(property.data!.id);
    imageUrls = property.data!.images;
    expect(imageUrls).toHaveLength(1);
    expect(property.data).toMatchObject({
      published: true,
      baths: 2.5,
      assigned_to: agent.id,
      features: ["Garden", "Garage"],
    });
    expect((await fetch(imageUrls[0])).status).toBe(200);
    await page.goto("/admin/properties/" + propertyIds[0]);
    await page.getByLabel("Price (USD)", { exact: true }).fill("560000");
    await page.getByLabel("Published on the public website").uncheck();
    await submit(
      page,
      page.getByRole("button", { name: "Save property", exact: true }),
    );
    expect(
      (
        await owner
          .from("properties")
          .select("price,published")
          .eq("id", propertyIds[0])
          .single()
      ).data,
    ).toMatchObject({ price: 560000, published: false });
    expect(
      (await anon.from("properties").select("id").eq("id", propertyIds[0]))
        .data,
    ).toEqual([]);
    await page.goto("/admin/leads/new");
    await page.getByLabel("Full name", { exact: true }).fill(name);
    await page.getByLabel("Email", { exact: true }).fill(email.toUpperCase());
    await page.getByLabel("Phone", { exact: true }).fill("5015550100");
    await page.getByLabel("Assigned agent").selectOption(agent.id);
    await page.getByLabel("Contact permission").check();
    await submit(
      page,
      page.getByRole("button", { name: "Create lead", exact: true }),
    );
    await expect(page.getByRole("status")).toContainText("Lead created.");
    const lead = await owner
      .from("leads")
      .select("*")
      .eq("email", email)
      .single();
    must(lead.error);
    leadId = lead.data!.id;
    expect(lead.data).toMatchObject({
      source: "manual",
      assigned_to: agent.id,
    });
    await page.goto("/admin/leads/" + leadId);
    await page.getByLabel("Status", { exact: true }).selectOption("Qualified");
    await submit(
      page,
      page.getByRole("button", { name: "Save changes", exact: true }),
    );
    expect(
      (await owner.from("leads").select("status").eq("id", leadId).single())
        .data?.status,
    ).toBe("Qualified");
    await page
      .getByLabel("Property", { exact: true })
      .selectOption(propertyIds[0]);
    await submit(
      page,
      page.getByRole("button", {
        name: "Add interested property",
        exact: true,
      }),
    );
    expect(
      (await owner.from("lead_properties").select("*").eq("lead_id", leadId))
        .data,
    ).toHaveLength(1);
    await page.getByLabel("New internal note").fill("Private note " + token);
    await submit(
      page,
      page.getByRole("button", { name: "Add note", exact: true }),
    );
    await expect(
      page.getByText("Private note " + token, { exact: true }),
    ).toBeVisible();
    const note = await owner
      .from("notes")
      .select("id,author_id")
      .eq("lead_id", leadId)
      .single();
    must(note.error);
    expect(note.data?.author_id).toBe(admin.id);
    await page.getByLabel("Task", { exact: true }).fill("Follow up " + token);
    await page.getByLabel("Due date (Central time)").fill("2030-12-01");
    await submit(
      page,
      page.getByRole("button", { name: "Add follow-up", exact: true }),
    );
    const task = await owner
      .from("tasks")
      .select("id")
      .eq("lead_id", leadId)
      .single();
    must(task.error);
    await page.getByLabel("Task title").fill("Updated follow up " + token);
    await page.getByLabel("Completed", { exact: true }).check();
    await submit(
      page,
      page.getByRole("button", { name: "Update task", exact: true }),
    );
    expect(
      (
        await owner
          .from("tasks")
          .select("done,title")
          .eq("id", task.data!.id)
          .single()
      ).data,
    ).toMatchObject({ done: true, title: "Updated follow up " + token });
    const inquiry = await owner
      .from("inquiries")
      .insert({
        lead_id: leadId,
        property_id: propertyIds[0],
        kind: "Property question",
        message: "CRM acceptance " + token,
        request_id: randomUUID(),
      })
      .select("id")
      .single();
    must(inquiry.error);
    await page.goto("/admin/inquiries");
    const card = page.locator("article").filter({
      has: page.locator(`[name="id"][value="${inquiry.data!.id}"]`),
    });
    await card.getByLabel("Status", { exact: true }).selectOption("Responded");
    await card.getByLabel("Assigned agent").selectOption(agent.id);
    await submit(
      page,
      card.getByRole("button", { name: "Save changes", exact: true }),
    );
    expect(
      (
        await owner
          .from("inquiries")
          .select("status,assigned_to")
          .eq("id", inquiry.data!.id)
          .single()
      ).data,
    ).toMatchObject({ status: "Responded", assigned_to: agent.id });
    const conv = await owner
      .from("conversations")
      .insert({ visitor_hash: "acceptance-" + token, lead_id: leadId })
      .select("id")
      .single();
    must(conv.error);
    conversationId = conv.data!.id;
    must(
      (
        await owner.from("messages").insert({
          conversation_id: conversationId,
          sender: "visitor",
          body: "Visitor question " + token,
        })
      ).error,
    );
    await page.goto("/admin/conversations/" + conversationId);
    await expect(
      page.getByText("Visitor question " + token, { exact: true }),
    ).toBeVisible();
    await page
      .getByLabel("Handling (bot resumes automated replies)")
      .selectOption("human");
    await page.getByLabel("Assigned agent").selectOption(agent.id);
    await submit(
      page,
      page.getByRole("button", { name: "Save changes", exact: true }),
    );
    await page.getByLabel("Reply to visitor").fill("Team reply " + token);
    await submit(
      page,
      page.getByRole("button", { name: "Send reply", exact: true }),
    );
    await expect(
      page.getByText("Team reply " + token, { exact: true }),
    ).toBeVisible();
    expect(
      (
        await owner
          .from("messages")
          .select("sender")
          .eq("conversation_id", conversationId)
          .eq("sender", "agent")
      ).data,
    ).toHaveLength(1);
    await page
      .getByLabel("Internal note (staff only)")
      .fill("Conversation note " + token);
    await submit(
      page,
      page.getByRole("button", { name: "Add note", exact: true }),
    );
    await page
      .getByLabel("Handling (bot resumes automated replies)")
      .selectOption("resolved");
    await submit(
      page,
      page.getByRole("button", { name: "Save changes", exact: true }),
    );
    expect(
      (
        await owner
          .from("conversations")
          .select("status")
          .eq("id", conversationId)
          .single()
      ).data?.status,
    ).toBe("resolved");
    // Each supported settings form executes a real update without changing the owner's configuration.
    let settingsRequest:
      | { url: string; body: Buffer | null; headers: Record<string, string> }
      | undefined;
    for (const route of ["settings", "assistant", "lead-capture"]) {
      const keyName =
        route === "settings"
          ? "company"
          : route === "assistant"
            ? "assistant"
            : "capture";
      const before = await owner
        .from("settings")
        .select("value,updated_at")
        .eq("key", keyName)
        .single();
      must(before.error);
      await page.goto("/admin/" + route);
      const request = page.waitForRequest(
        (r) =>
          r.method() === "POST" &&
          new URL(r.url()).pathname === "/admin/" + route,
      );
      await submit(
        page,
        page.getByRole("button", { name: "Save changes", exact: true }),
      );
      const captured = await request;
      if (route === "settings")
        settingsRequest = {
          url: captured.url(),
          body: captured.postDataBuffer(),
          headers: captured.headers(),
        };
      await expect(page.getByRole("status")).toContainText("Settings saved.");
      const after = await owner
        .from("settings")
        .select("value,updated_at")
        .eq("key", keyName)
        .single();
      expect(after.data?.value).toEqual(before.data?.value);
      expect(after.data?.updated_at).not.toBe(before.data?.updated_at);
    }
    await page.goto("/admin/team?q=" + token);
    const targetCard = page
      .locator(".card")
      .filter({ has: page.locator(`input[name="id"][value="${target.id}"]`) });
    await targetCard.getByLabel("Role", { exact: true }).selectOption("agent");
    await submit(
      page,
      targetCard.getByRole("button", { name: "Save changes", exact: true }),
    );
    expect(
      (await owner.from("profiles").select("role").eq("id", target.id).single())
        .data?.role,
    ).toBe("agent");
    await page.goto("/admin/analytics");
    await expect(
      page.getByRole("heading", { name: "Lead sources", exact: true }),
    ).toBeVisible();
    expect((await sessions.admin.db.rpc("crm_analytics")).error).toBeNull();
    await page.goto("/admin/activity?entity=leads");
    await expect(
      page.locator("td").filter({ hasText: leadId }).first(),
    ).toBeVisible();
    await page.goto("/admin");
    const count = await owner
      .from("leads")
      .select("id", { count: "exact" })
      .limit(1);
    must(count.error);
    await expect(
      page
        .locator("a.card")
        .filter({
          has: page.locator(".eyebrow").filter({ hasText: /^leads$/ }),
        })
        .locator(".metric"),
    ).toHaveText(String(count.count));
    const csv = await page.request.get("/admin/leads/export?q=" + token);
    expect(csv.status()).toBe(200);
    expect(await csv.text()).toContain(email);
    expect(csv.headers()["cache-control"]).toContain("private");
    // Direct API access: anonymous and visitors must not read protected records.
    for (const db of [anon, sessions.visitor.db])
      for (const table of [
        "leads",
        "inquiries",
        "notes",
        "tasks",
        "conversations",
        "messages",
        "settings",
        "activity_logs",
      ] as const) {
        const result = await db.from(table).select("*").limit(1);
        expect(
          result.error !== null || result.data?.length === 0,
          table + " must be private",
        ).toBe(true);
      }
    const escalation = await sessions.visitor.db
      .from("profiles")
      .update({ role: "admin" })
      .eq("id", visitor.id)
      .select("id");
    expect(escalation.error !== null || escalation.data?.length === 0).toBe(
      true,
    );
    expect(
      (
        await owner
          .from("profiles")
          .select("role")
          .eq("id", visitor.id)
          .single()
      ).data?.role,
    ).toBe("visitor");
    expect(
      (await sessions.agent.db.from("leads").select("id").eq("id", leadId))
        .data,
    ).toHaveLength(1);
    must(
      (
        await sessions.agent.db
          .from("leads")
          .update({ status: "Contacted" })
          .eq("id", leadId)
          .select("id")
          .single()
      ).error,
    );
    must(
      (
        await sessions.agent.db
          .from("properties")
          .update({ price: 561000 })
          .eq("id", propertyIds[0])
          .select("id")
          .single()
      ).error,
    );
    const directTask = await sessions.agent.db
      .from("tasks")
      .insert({
        lead_id: leadId,
        title: "Direct API task",
        due_at: "2030-12-01T17:00:00Z",
        assigned_to: agent.id,
      })
      .select("id")
      .single();
    must(directTask.error);
    must(
      (
        await sessions.agent.db
          .from("tasks")
          .update({ done: true })
          .eq("id", directTask.data!.id)
          .select("id")
          .single()
      ).error,
    );
    must(
      (
        await sessions.agent.db
          .from("tasks")
          .delete()
          .eq("id", directTask.data!.id)
          .select("id")
          .single()
      ).error,
    );
    must(
      (
        await sessions.agent.db
          .from("inquiries")
          .update({ status: "Scheduled" })
          .eq("id", inquiry.data!.id)
          .select("id")
          .single()
      ).error,
    );
    expect(
      (
        await sessions.agent.db.rpc("search_conversations", { p_query: token })
      ).data?.some((c) => c.id === conversationId),
    ).toBe(true);
    expect((await sessions.agent.db.rpc("crm_analytics")).error).toBeNull();
    const forgedNote = await sessions.agent.db
      .from("notes")
      .insert({ lead_id: leadId, body: "Forged author", author_id: admin.id });
    expect(forgedNote.error).not.toBeNull();
    const ownNote = await sessions.agent.db
      .from("notes")
      .insert({
        lead_id: leadId,
        body: "Direct agent note",
        author_id: agent.id,
      })
      .select("id")
      .single();
    must(ownNote.error);
    must(
      (
        await sessions.agent.db
          .from("notes")
          .delete()
          .eq("id", ownNote.data!.id)
      ).error,
    );
    const company = (
      await owner.from("settings").select("value").eq("key", "company").single()
    ).data!.value;
    must(
      (
        await sessions.admin.db
          .from("settings")
          .update({ value: company })
          .eq("key", "company")
          .select("key")
          .single()
      ).error,
    );
    must(
      (
        await sessions.admin.db
          .from("profiles")
          .update({ full_name: name + " target API" })
          .eq("id", target.id)
          .select("id")
          .single()
      ).error,
    );
    const denied = await sessions.agent.db
      .from("settings")
      .update({ value: company })
      .eq("key", "company")
      .select("key");
    expect(denied.error !== null || denied.data?.length === 0).toBe(true);
    const self = await sessions.admin.db
      .from("profiles")
      .update({ active: false })
      .eq("id", admin.id);
    expect(self.error).not.toBeNull();
    for (const db of [sessions.agent.db, sessions.admin.db]) {
      expect(
        (
          await db
            .from("activity_logs")
            .insert({ action: "FAKE", entity_type: "leads", entity_id: leadId })
        ).error,
      ).not.toBeNull();
      expect(
        (await db.from("activity_logs").delete().eq("entity_id", leadId)).error,
      ).not.toBeNull();
    }
    const visitorUpload = await sessions.visitor.db.storage
      .from("property-images")
      .upload(`properties/${propertyIds[0]}/visitor.png`, png, {
        contentType: "image/png",
      });
    expect(visitorUpload.error).not.toBeNull();
    const agentPath = `properties/${propertyIds[0]}/direct-${token}.png`;
    must(
      (
        await sessions.agent.db.storage
          .from("property-images")
          .upload(agentPath, png, { contentType: "image/png" })
      ).error,
    );
    must(
      (
        await sessions.agent.db.storage
          .from("property-images")
          .remove([agentPath])
      ).error,
    );
    // Replay an admin Server Action with a real visitor cookie, never the admin cookie.
    const visitorContext = await browser.newContext();
    createdContexts.push(visitorContext);
    await visitorContext.addCookies(sessions.visitor.cookies());
    const action = settingsRequest!;
    const headers: Record<string, string> = { origin: "http://localhost:3000" };
    for (const field of ["next-action", "content-type", "accept"])
      if (action.headers[field]) headers[field] = action.headers[field];
    const replay = await visitorContext.request.post(action.url, {
      headers,
      data: action.body!,
      maxRedirects: 0,
    });
    expect(
      replay.headers()["x-action-redirect"] ||
        replay.headers()["location"] ||
        String(replay.status()),
    ).toMatch(/login|40[13]/);
    const agentContext = await browser.newContext();
    createdContexts.push(agentContext);
    await agentContext.addCookies(sessions.agent.cookies());
    const agentPage = await agentContext.newPage();
    await agentPage.goto("/admin/settings");
    await expect(agentPage).toHaveURL(/\/login\?/);
    await agentPage.goto("/admin/leads");
    await expect(
      agentPage.getByRole("heading", { name: "Leads", exact: true }),
    ).toBeVisible();
    must(
      (
        await owner
          .from("profiles")
          .update({ active: false })
          .eq("id", agent.id)
      ).error,
    );
    const inactive = await sessions.agent.db
      .from("leads")
      .select("id")
      .eq("id", leadId);
    expect(inactive.error !== null || inactive.data?.length === 0).toBe(true);
    await agentPage.goto("/admin/leads");
    await expect(agentPage).toHaveURL(/\/login\?/);
    must(
      (await owner.from("profiles").update({ active: true }).eq("id", agent.id))
        .error,
    );
    await page.goto("/admin/leads/" + leadId);
    await submit(
      page,
      page.getByRole("button", { name: "Remove interest", exact: true }),
    );
    await submit(
      page,
      page.getByRole("button", { name: "Delete note", exact: true }),
    );
    await submit(
      page,
      page.getByRole("button", { name: "Delete task", exact: true }),
    );
    expect(
      (await owner.from("notes").select("id").eq("lead_id", leadId)).data,
    ).toHaveLength(0);
    expect(
      (await owner.from("tasks").select("id").eq("lead_id", leadId)).data,
    ).toHaveLength(0);
    await page.getByLabel("Confirm permanent lead deletion").check();
    await submit(
      page,
      page.getByRole("button", { name: "Delete lead", exact: true }),
    );
    expect(
      (await owner.from("leads").select("id").eq("id", leadId)).data,
    ).toHaveLength(0);
    await page.goto("/admin/properties/" + propertyIds[0]);
    await page.getByLabel("Remove this image").check();
    await submit(
      page,
      page.getByRole("button", { name: "Save property", exact: true }),
    );
    expect(
      (
        await owner
          .from("properties")
          .select("images")
          .eq("id", propertyIds[0])
          .single()
      ).data?.images,
    ).toEqual([]);
    expect(
      (
        await owner.storage
          .from("property-images")
          .list("properties/" + propertyIds[0])
      ).data,
    ).toHaveLength(0);
    await page.getByLabel("I confirm deletion").check();
    await submit(
      page,
      page.getByRole("button", { name: "Delete property", exact: true }),
    );
    expect(
      (await owner.from("properties").select("id").eq("id", propertyIds[0]))
        .data,
    ).toHaveLength(0);
  } finally {
    for (const c of createdContexts) await c.close();
    if (conversationId)
      must(
        (await owner.from("conversations").delete().eq("id", conversationId))
          .error,
      );
    must((await owner.from("leads").delete().eq("email", email)).error);
    if (leadId)
      must((await owner.from("leads").delete().eq("id", leadId)).error);
    const dangling = await owner
      .from("properties")
      .select("id,images")
      .eq("slug", "crm-" + token);
    must(dangling.error);
    for (const p of dangling.data || []) {
      const objects = await owner.storage
        .from("property-images")
        .list("properties/" + p.id);
      must(objects.error);
      if (objects.data?.length)
        must(
          (
            await owner.storage
              .from("property-images")
              .remove(
                objects.data.map((o) => "properties/" + p.id + "/" + o.name),
              )
          ).error,
        );
      const prefix = owner.storage
        .from("property-images")
        .getPublicUrl(`properties/${p.id}/`).data.publicUrl;
      const paths = [...p.images, ...imageUrls]
        .filter((u) => u.startsWith(prefix))
        .map((u) => `properties/${p.id}/` + u.slice(prefix.length));
      if (paths.length)
        must(
          (
            await owner.storage
              .from("property-images")
              .remove([...new Set(paths)])
          ).error,
        );
      must((await owner.from("properties").delete().eq("id", p.id)).error);
    }
    for (const user of users)
      must((await owner.auth.admin.deleteUser(user.id)).error);
  }
});
