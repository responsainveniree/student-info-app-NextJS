import { test, expect } from "@playwright/test";

test("Has title", async ({ page }) => {
  await page.goto("http://localhost:3000/dashboard/student");
  await expect(page).toHaveTitle("Student-Info-App");
});
