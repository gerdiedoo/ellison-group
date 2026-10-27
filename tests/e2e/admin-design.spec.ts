import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { randomUUID, randomBytes } from "node:crypto";
import { testIngress } from "./ingress";

test("original admin geometry, sidebar behavior and responsive screens", async ({
  page,
  browser,
}, info) => {
  test.skip(
    !process.env.SUPABASE_SERVICE_ROLE_KEY,
    "Requires a configured test backend",
  );
  test.setTimeout(120000);
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const token = randomUUID().slice(0, 8),
    email = `design-${token}@example.com`,
    password = randomBytes(24).toString("hex");
  let userId: string | undefined,
    leadId: string | undefined,
    conversationId: string | undefined;
  const must = (error: unknown) => {
    if (error) throw new Error("Design fixture operation failed");
  };
  const reference = await browser.newContext({
    viewport: page.viewportSize()!,
  });
  const original = await reference.newPage();
  const dimensions = () => ({
    side: document.querySelector(".side")
      ? getComputedStyle(document.querySelector(".side")!).width
      : "",
    background: getComputedStyle(document.querySelector(".side")!)
      .backgroundColor,
    header: getComputedStyle(document.querySelector(".top")!).height,
    heading: getComputedStyle(document.querySelector(".ph h1")!).fontSize,
    cardRadius: getComputedStyle(document.querySelector(".card")!).borderRadius,
  });
  try {
    const account = await db.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: "Design review " + token },
    });
    must(account.error);
    userId = account.data.user!.id;
    must(
      (await db.from("profiles").update({ role: "admin" }).eq("id", userId))
        .error,
    );
    const lead = await db
      .from("leads")
      .insert({
        full_name: "Design review client",
        email: `design-lead-${token}@example.com`,
        source: "form",
        consent_at: new Date().toISOString(),
        consent_text: "Temporary design review fixture",
      })
      .select("id")
      .single();
    must(lead.error);
    leadId = lead.data!.id;
    const conversation = await db
      .from("conversations")
      .insert({
        lead_id: leadId,
        visitor_hash: "design-" + token,
        status: "human",
      })
      .select("id")
      .single();
    must(conversation.error);
    conversationId = conversation.data!.id;
    must(
      (
        await db.from("messages").insert([
          {
            conversation_id: conversationId,
            sender: "visitor",
            body: "I would like help finding a home in Little Rock.",
          },
          {
            conversation_id: conversationId,
            sender: "assistant",
            body: "Our team can help you explore published homes.",
          },
        ])
      ).error,
    );
    await testIngress(page, token);
    await page.goto("/login?next=/admin");
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page).toHaveURL("http://localhost:3000/admin");
    await expect(
      page.getByRole("heading", { name: "Overview", exact: true }),
    ).toBeVisible({ timeout: 15000 });
    await expect(page.locator(".kpi")).toHaveCount(8);
    if (process.env.PROTOTYPE_PREVIEW_URL) {
      await original.goto(process.env.PROTOTYPE_PREVIEW_URL + "/admin.html");
      await expect(
        original.getByRole("heading", { name: "Overview", exact: true }),
      ).toBeVisible();
      expect(await page.evaluate(dimensions)).toEqual(
        await original.evaluate(dimensions),
      );
      await original.screenshot({
        path: `work/admin-parity/prototype-overview-${info.project.name}.png`,
        fullPage: true,
        animations: "disabled",
      });
    }
    await page.evaluate(() => document.fonts.ready.then(() => true));
    await page.screenshot({
      path: `work/admin-parity/overview-${info.project.name}.png`,
      fullPage: true,
      animations: "disabled",
    });
    if (info.project.name === "desktop") {
      await page
        .getByRole("button", { name: "Collapse sidebar", exact: true })
        .click();
      await expect(page.locator(".app")).toHaveClass(/collapsed/);
      await expect
        .poll(() =>
          page
            .locator(".side")
            .evaluate((el) => Math.round(el.getBoundingClientRect().width)),
        )
        .toBe(72);
      await page.reload();
      await expect(page.locator(".app")).toHaveClass(/collapsed/);
      await page
        .getByRole("button", { name: "Expand sidebar", exact: true })
        .click();
    } else {
      await page
        .getByRole("button", { name: "Open navigation", exact: true })
        .click();
      await expect(page.locator(".app")).toHaveClass(/mopen/);
      await page.keyboard.press("Escape");
      await expect(page.locator(".app")).not.toHaveClass(/mopen/);
    }
    await page.goto("/admin/leads");
    await expect(
      page.getByRole("heading", { name: "Leads", exact: true }),
    ).toBeVisible();
    await page.screenshot({
      path: `work/admin-parity/leads-${info.project.name}.png`,
      fullPage: true,
      animations: "disabled",
    });
    await page.goto("/admin/leads/" + leadId);
    await expect(page.locator(".dg")).toBeVisible();
    await page.screenshot({
      path: `work/admin-parity/lead-detail-${info.project.name}.png`,
      fullPage: true,
      animations: "disabled",
    });
    await page.goto("/admin/properties");
    await expect(
      page.getByRole("heading", { name: "Properties", exact: true }),
    ).toBeVisible();
    await page.screenshot({
      path: `work/admin-parity/properties-${info.project.name}.png`,
      fullPage: true,
      animations: "disabled",
    });
    await page.goto("/admin/conversations/" + conversationId);
    await expect(
      page
        .getByRole("log", { name: "Conversation transcript" })
        .getByText("I would like help finding a home in Little Rock.", {
          exact: true,
        }),
    ).toBeVisible();
    await page.screenshot({
      path: `work/admin-parity/conversations-${info.project.name}.png`,
      fullPage: true,
      animations: "disabled",
    });
    for (const route of ["assistant", "lead-capture", "settings"]) {
      await page.goto("/admin/" + route);
      await expect(page.locator(".ph h1")).toBeVisible();
      if (route === "assistant") {
        const prompts = page.locator('input[name="prompts"]');
        const savedCount = await prompts.count();
        if (savedCount < 12) {
          await page.getByRole("button", { name: "Add prompt", exact: true }).click();
          await expect(prompts).toHaveCount(savedCount + 1);
          await prompts.last().fill("Design preview suggestion");
          await page
            .getByRole("button", { name: `Remove prompt ${savedCount + 1}`, exact: true })
            .click();
          await expect(prompts).toHaveCount(savedCount);
        }
        await page.getByRole("button", { name: "Restore default prompts", exact: true }).click();
        await expect(prompts).toHaveCount(6);
        // Editing a draft never writes settings until the administrator saves.
        await page.reload();
        await expect(prompts).toHaveCount(savedCount);
        await page.getByText("Advanced settings", { exact: true }).click();
        await expect(page.getByLabel("Tone preference", { exact: true })).toBeVisible();
        await page.getByText("Advanced settings", { exact: true }).click();
      }
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
      await page.screenshot({
        path: `work/admin-parity/${route}-${info.project.name}.png`,
        fullPage: true,
        animations: "disabled",
      });
    }
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      )
      .toBe(true);
    await page.locator(".prof > button").click();
    await page.getByRole("menuitem", { name: "Sign out", exact: true }).click();
    await expect(page).toHaveURL("http://localhost:3000/");
  } finally {
    await reference.close();
    if (conversationId)
      must(
        (await db.from("conversations").delete().eq("id", conversationId))
          .error,
      );
    if (leadId) must((await db.from("leads").delete().eq("id", leadId)).error);
    if (userId) must((await db.auth.admin.deleteUser(userId)).error);
  }
});
