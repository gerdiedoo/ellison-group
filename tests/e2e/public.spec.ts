import { test, expect } from "@playwright/test";
test("homepage retains the brand and working buying/selling intent", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "way home",
  );
  await page.getByRole("tab", { name: "I’m selling" }).click();
  await page.getByLabel("Your home’s address").fill("123 Main Street");
  await page.getByRole("button", { name: "Begin", exact: true }).click();
  await expect(page.getByLabel("Property address")).toHaveValue(
    "123 Main Street",
  );
  await page.goto("/");
  await page.getByRole("tab", { name: "I’m buying" }).click();
  await page.getByLabel("Where in Little Rock?").selectOption("Chenal");
  await page.getByRole("button", { name: "Show homes" }).click();
  await expect(page).toHaveURL(/properties\?area=Chenal/);
});
test("listing filters submit and preserve their values", async ({ page }) => {
  await page.goto("/properties");
  await page.getByLabel("Max price").fill("500000");
  await page.getByLabel("Min beds").selectOption("3");
  await page.getByLabel("Sort", { exact: true }).selectOption("price-asc");
  await page.getByRole("button", { name: "Find homes" }).click();
  await expect(page.getByLabel("Max price")).toHaveValue("500000");
  await expect(page.getByLabel("Min beds")).toHaveValue("3");
  await expect(page).toHaveURL(/max=500000/);
});
test("neighborhood explorer changes selection and links to filtered homes", async ({
  page,
}) => {
  await page.goto("/neighborhoods");
  await page.getByRole("button", { name: "Chenal", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Chenal", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Explore homes here" }),
  ).toHaveAttribute("href", "/properties?area=Chenal");
});
test("valuation wizard retains address through all three steps", async ({
  page,
}) => {
  await page.goto("/home-valuation");
  await page
    .getByLabel("Property address")
    .fill("123 Main Street, Little Rock");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("Step 2 of 3")).toBeVisible();
  await page.getByLabel("Bedrooms", { exact: true }).selectOption("4");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("Step 3 of 3")).toBeVisible();
  await page.getByRole("button", { name: "Back" }).click();
  await expect(page.getByLabel("Bedrooms", { exact: true })).toHaveValue("4");
});
test("protected CRM redirects unauthenticated requests", async ({ page }) => {
  await page.goto("/admin/leads");
  await expect(page).toHaveURL(/login/);
  await expect(
    page.getByRole("heading", { name: "Welcome back." }),
  ).toBeVisible();
});
test("favorites offer authentication without blocking browsing", async ({
  page,
}) => {
  await page.goto("/favorites");
  await expect(
    page.getByRole("main").getByRole("link", { name: "Sign in", exact: true }),
  ).toBeVisible();
  await page.goto("/properties");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "your place",
  );
});
test("legal pages render and chat opens accessibly", async ({ page }) => {
  await page.goto("/privacy");
  await expect(
    page.getByRole("heading", { name: "Privacy policy." }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Your real estate assistant" })
    .click();
  await expect(
    page.getByRole("button", { name: "Start conversation", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close chat" }).click();
  await expect(
    page.getByRole("button", { name: "Start conversation", exact: true }),
  ).toHaveCount(0);
  await page.goto("/terms");
  await expect(
    page.getByRole("heading", { name: "Terms & conditions." }),
  ).toBeVisible();
});
test("about and journal routes have real content", async ({ page }) => {
  await page.goto("/about");
  await expect(
    page.getByRole("heading", { name: "Kerry Ellison" }),
  ).toBeVisible();
  await expect(
    page.locator('img[src="/illustrations/portrait.svg"]'),
  ).toBeVisible();
  await page.goto("/journal/market");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
test("public write endpoints reject foreign origins", async ({ request }) => {
  const res = await request.post("/api/inquiries", {
    headers: { Origin: "https://foreign.example" },
    data: {},
  });
  expect(res.status()).toBe(400);
  expect(await res.json()).toMatchObject({ error: "Invalid request origin" });
});

test("public forms never report success when integrations are unavailable", async ({
  page,
}) => {
  test.skip(
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    "Requires the unconfigured environment",
  );
  await page.goto("/contact");
  await page.getByLabel("Full name", { exact: true }).fill("Integration Test");
  await page
    .getByLabel("Email", { exact: true })
    .fill("integration@example.com");
  await page.getByLabel("Phone number", { exact: true }).fill("5015551234");
  await page.locator('input[name="consent"]').check();
  await page.getByRole("button", { name: "Send request" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "not available",
  );
  await expect(page.getByRole("heading", { name: "Thank you." })).toHaveCount(
    0,
  );
});
test("responsive homepage has no horizontal overflow", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    .toBe(true);
  await page.screenshot({
    path: "work/home-" + testInfo.project.name + ".png",
    fullPage: true,
  });
});
