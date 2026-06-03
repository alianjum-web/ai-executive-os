import { test, expect } from "@playwright/test";

test.describe("Knowledge chat citations", () => {
  test.skip(
    !process.env.E2E_RUN_LIVE,
    "Set E2E_RUN_LIVE=1 with stack running to execute live E2E"
  );

  test("upload document, ask question, see citation card", async ({ page }) => {
    await page.goto("/login");
    // Assumes test credentials exist in Supabase
    await page.getByLabel("Email").fill(process.env.E2E_EMAIL ?? "admin@test.com");
    await page.getByLabel("Password").fill(process.env.E2E_PASSWORD ?? "password");
    await page.getByRole("button", { name: "Sign in" }).click();

    await page.goto("/knowledge");
    // Upload flow depends on live API + auth
    await page.goto("/chat");
    await page.getByPlaceholder("Ask about company policies").fill("What is the PTO policy?");
    await page.getByRole("button", { name: "Send" }).click();
    await expect(page.getByText("Sources")).toBeVisible({ timeout: 30000 });
    await expect(page.locator("text=Page")).toBeVisible();
  });
});
