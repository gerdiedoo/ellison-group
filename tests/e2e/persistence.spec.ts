import { testIngress } from "./ingress";
import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { randomUUID, randomBytes } from "node:crypto";
// Live acceptance fixtures are explicitly marked and deleted in finally. No real
// user is promoted, no historical draft is published, and no production lead is modified.
test("public catalog, favorites and all lead forms persist to Supabase", async ({
  page,
}) => {
  test.skip(
    !process.env.SUPABASE_SERVICE_ROLE_KEY,
    "Requires a configured Supabase test backend",
  );
  test.setTimeout(90000);
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const token = randomUUID().slice(0, 8),
    email = `acceptance-${token}@example.com`,
    password = randomBytes(24).toString("hex");
  // Emulate this local test ingress's client-IP header with a reserved test address.
  // Production ingress must replace client-supplied forwarding headers.
  await testIngress(page, token);
  let userId: string | undefined;
  let imagePath: string | undefined;
  const ids: string[] = [];
  const must = (error: unknown) => {
    if (error) throw new Error("Acceptance fixture database operation failed");
  };
  try {
    const user = await db.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    must(user.error);
    userId = user.data.user?.id;
    const fixture = await db
      .from("properties")
      .insert(
        [0, 1].map((i) => ({
          slug: `acceptance-${token}-${i}`,
          address: `Acceptance ${token} ${i}`,
          location: "Little Rock, AR",
          neighborhood: "Chenal",
          price: 450000 + i * 10000,
          beds: 3,
          baths: 2,
          sqft: 2000,
          published: true,
          description: "Temporary automated acceptance fixture.",
          images: ["/illustrations/stone.svg", "/illustrations/brick.svg"],
        })),
      )
      .select("id,slug,address");
    must(fixture.error);
    ids.push(...fixture.data!.map((p) => p.id));
    const property = fixture.data![0];
    imagePath = `properties/${property.id}/acceptance-${token}.png`;
    const image = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a+z8AAAAASUVORK5CYII=",
      "base64",
    );
    const upload = await db.storage
      .from("property-images")
      .upload(imagePath, image, { contentType: "image/png" });
    must(upload.error);
    const imageUrl = db.storage.from("property-images").getPublicUrl(imagePath)
      .data.publicUrl;
    const response = await fetch(imageUrl);
    expect(response.status).toBe(200);
    const updated = await db
      .from("properties")
      .update({ images: [imageUrl, "/illustrations/brick.svg"] })
      .eq("id", property.id);
    must(updated.error);

    await page.goto(
      "/properties?q=" + token + "&max=500000&beds=3&sort=price-asc",
    );
    await expect(
      page.getByText("2 homes in our current selection", { exact: true }),
    ).toBeVisible();
    await page
      .getByRole("link", { name: "View " + property.address, exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: property.address, exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Next image", exact: true }).click();
    await expect(page.getByText("Image 2 of 2")).toBeVisible();
    await page.goto("/login?next=/favorites");
    await expect(
      page.getByRole("button", { name: "Continue with Google" }),
    ).toBeVisible();
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page).toHaveURL("http://localhost:3000/favorites");
    await page.goto("/properties/" + property.slug);
    await page
      .getByRole("button", { name: "Save property", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Saved", exact: true }),
    ).toBeVisible();
    await page.goto("/favorites");
    await expect(
      page.getByRole("heading", { name: property.address, exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Saved", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: property.address, exact: true }),
    ).toHaveCount(0);
    async function details() {
      await page
        .getByLabel("Full name", { exact: true })
        .fill("Automated Acceptance");
      await page.getByLabel("Email", { exact: true }).fill(email.toUpperCase());
      await page.getByLabel("Phone number", { exact: true }).fill("5015550100");
      await page
        .getByLabel("Preferred contact method", { exact: true })
        .selectOption("Email");
      await page.locator('main input[name="consent"]').check();
    }
    await page.goto("/properties/" + property.slug);
    await details();
    await page.getByLabel("Preferred showing date").fill("2030-12-01");
    await page
      .getByLabel("Preferred showing time")
      .selectOption("Afternoon (12–5)");
    await page.getByRole("button", { name: "Send request" }).click();
    await expect(
      page.getByRole("heading", { name: "Thank you." }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Ask about this property", exact: true })
      .click();
    await details();
    await page
      .locator('main textarea[name="message"]')
      .fill("Please confirm the recorded features.");
    await page.getByRole("button", { name: "Send request" }).click();
    await expect(
      page.getByRole("heading", { name: "Thank you." }),
    ).toBeVisible();
    await page.goto("/home-valuation?address=123%20Acceptance%20Lane");
    await expect(page.getByLabel("Property address")).toHaveValue(
      "123 Acceptance Lane",
    );
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Continue" }).click();
    await details();
    await page.getByRole("button", { name: "Request my valuation" }).click();
    await expect(
      page.getByRole("heading", { name: "Thank you." }),
    ).toBeVisible();
    await page.goto("/contact");
    await details();
    await page.getByLabel("I’m interested in").selectOption("Buying");
    await page.getByRole("button", { name: "Send request" }).click();
    await expect(
      page.getByRole("heading", { name: "Thank you." }),
    ).toBeVisible();
    await page.goto("/newsletter");
    await details();
    await page.getByRole("button", { name: "Send request" }).click();
    await expect(
      page.getByRole("heading", { name: "Thank you." }),
    ).toBeVisible();
    const leads = await db.from("leads").select("id").eq("email", email);
    must(leads.error);
    expect(leads.data).toHaveLength(1);
    const inquiries = await db
      .from("inquiries")
      .select("kind,context,property_id")
      .eq("lead_id", leads.data![0].id);
    must(inquiries.error);
    expect(inquiries.data).toHaveLength(5);
    expect(
      inquiries.data!.find((i) => i.kind === "Showing request")?.context,
    ).toMatchObject({
      preferred_time: "Afternoon (12–5)",
      contact_method: "Email",
    });
    expect(
      inquiries.data!.find((i) => i.kind === "Valuation request")?.context,
    ).toMatchObject({ address: "123 Acceptance Lane" });
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    await expect(page).toHaveURL("http://localhost:3000/");
    await page.goto("/favorites");
    await expect(
      page
        .getByRole("main")
        .getByRole("link", { name: "Sign in", exact: true }),
    ).toBeVisible();
    // Provision only this temporary account as staff to follow the same public
    // inquiry through the protected CRM. No existing profile is changed.
    must(
      (await db.from("profiles").update({ role: "agent" }).eq("id", userId!))
        .error,
    );
    await page.goto("/login?next=/admin");
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page).toHaveURL("http://localhost:3000/admin");
    await page.goto("/admin/leads/" + leads.data![0].id);
    await expect(
      page.getByRole("heading", { name: "Automated Acceptance", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("link", { name: "Showing request · New", exact: true })
      .click();
    await expect(page).toHaveURL(/\/admin\/inquiries\/[0-9a-f-]+$/);
    await page.getByLabel("Status", { exact: true }).selectOption("Responded");
    await page
      .getByRole("button", { name: "Save changes", exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText("Inquiry updated");
    expect(
      (
        await db
          .from("inquiries")
          .select("status")
          .eq("lead_id", leads.data![0].id)
          .eq("kind", "Showing request")
          .single()
      ).data?.status,
    ).toBe("Responded");
    for (const record of [
      "leads",
      "properties",
      "conversations",
      "inquiries",
    ]) {
      await page.goto("/admin/" + record + "/not-a-record-id");
      await expect(
        page.getByRole("heading", { name: "Record unavailable." }),
      ).toBeVisible();
    }
  } finally {
    if (imagePath) {
      const removed = await db.storage
        .from("property-images")
        .remove([imagePath]);
      must(removed.error);
    }
    const deletion = await db.from("leads").delete().eq("email", email);
    must(deletion.error);
    if (ids.length) {
      const result = await db.from("properties").delete().in("id", ids);
      must(result.error);
    }
    if (userId) {
      const result = await db.auth.admin.deleteUser(userId);
      must(result.error);
    }
  }
});
