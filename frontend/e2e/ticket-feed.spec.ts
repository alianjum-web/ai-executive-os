import { test, expect } from "@playwright/test";

test.describe("Ticket feed", () => {
  test("shows ticket row when API returns data", async ({ page }) => {
    await page.route("**/api/v1/tickets", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: "11111111-1111-1111-1111-111111111111",
            source: "slack",
            intent: "billing",
            priority: 4,
            summary: "Double charge on invoice",
            department: "billing",
            status: "assigned",
            assignee_email: "billing@example.com",
            assignee_id: null,
            slack_channel_id: "C123",
            created_at: new Date().toISOString(),
          },
        ]),
      });
    });

    await page.goto("/tickets");
    await expect(page.getByText("Double charge on invoice")).toBeVisible();
    await expect(page.getByText("billing")).toBeVisible();
    await expect(page.getByText("P4")).toBeVisible();
  });
});
