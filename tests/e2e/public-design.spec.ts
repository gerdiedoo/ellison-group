import { test, expect } from "@playwright/test";

test("prototype home collection filters and navigation remain connected", async ({
  page,
}, info) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Three to linger over" }),
  ).toBeVisible();
  const collection = page.locator("#inventory");
  await expect(
    collection.getByRole("heading", { name: "The full collection" }),
  ).toBeVisible();
  await collection.getByRole("button", { name: "Chenal", exact: true }).click();
  await expect(page).toHaveURL(/area=Chenal.*#inventory/);
  await expect(
    collection.getByRole("button", { name: "Chenal", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await collection
    .getByLabel("Maximum price", { exact: true })
    .selectOption("500000");
  await expect(page).toHaveURL(/max=500000/);
  await collection.getByLabel("Bedrooms", { exact: true }).selectOption("3");
  await expect(page).toHaveURL(/beds=3/);
  await collection.getByLabel("Available only", { exact: true }).check();
  await expect(page).toHaveURL(/status=For\+Sale/);
  await collection
    .getByLabel("Search homes", { exact: true })
    .fill("Main Street");
  await collection.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page).toHaveURL(/q=Main\+Street/);
  await page.reload();
  await expect(
    collection.getByLabel("Maximum price", { exact: true }),
  ).toHaveValue("500000");
  await expect(collection.getByLabel("Bedrooms", { exact: true })).toHaveValue(
    "3",
  );
  await expect(
    collection.getByLabel("Search homes", { exact: true }),
  ).toHaveValue("Main Street");
  if (info.project.name === "mobile") {
    await page.getByRole("button", { name: "Menu", exact: true }).click();
    const mobile = page.getByRole("navigation", {
      name: "Mobile",
      exact: true,
    });
    await expect(mobile).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Close menu" }),
    ).toHaveAttribute("aria-expanded", "true");
    await expect(
      mobile.getByRole("link", { name: "Journal", exact: true }),
    ).toBeVisible();
    expect(
      await mobile.evaluate((node) => getComputedStyle(node).backgroundColor),
    ).toBe("rgb(20, 34, 27)");
    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("button", { name: "Menu", exact: true }),
    ).toHaveAttribute("aria-expanded", "false");
    await page.getByRole("button", { name: "Menu", exact: true }).click();
    await mobile.getByRole("link", { name: "Favorites", exact: true }).click();
  } else {
    await page.getByLabel("Your account", { exact: true }).click();
    await page
      .locator(".account-links")
      .getByRole("link", { name: "Favorites", exact: true })
      .click();
  }
  await expect(page).toHaveURL(/\/favorites/);
});
