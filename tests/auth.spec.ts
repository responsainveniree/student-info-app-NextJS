import { test, expect } from "@playwright/test";

test.describe("Authentication & Account Creation", () => {
  // Need to fix
  test("Sign in with valid credentials", async ({ page }) => {
    // Navigate to sign-in page
    await page.goto("http://localhost:3000/sign-in");

    // Fill in credentials
    await page.fill('input[name="email"]', "student@test.com");
    await page.fill('input[name="password"]', "Test@12345");

    // Click Sign In button
    await page.click('button[type="submit"]');

    // Wait for navigation to dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator("text=Student Portal")).toBeVisible();
  });

  test("Create student account (as Vice Principal)", async ({ page }) => {
    // Login as Vice Principal (who has permission to create accounts)
    await page.goto("http://localhost:3000/sign-in");
    await page.fill('input[name="email"]', "viceprincipal@test.com");
    await page.fill('input[name="password"]', "Test@12345");
    await page.click('button[type="submit"]');

    // Ensure we are on the dashboard
    await expect(page).toHaveURL(/\/dashboard/);

    // Navigate to Create Account page
    await page.goto("http://localhost:3000/create-account");

    // Click on Create Student Account button
    await page.click('[data-testid="create-student-btn"]');

    // Wait for modal to be visible
    await expect(page.locator("text=Student Registration")).toBeVisible();

    // Fill in the form
    const randomSuffix = Math.floor(Math.random() * 10000);
    const newStudentEmail = `newstudent${randomSuffix}@test.com`;
    const newStudentUsername = `New Student ${randomSuffix}`;

    await page.fill('input[name="username"]', newStudentUsername);
    await page.fill('input[name="email"]', newStudentEmail);

    // Select dropdowns
    // Grade
    await page.click("text=Select grade"); // Click the trigger
    await page.click("text=10"); // Select option (e.g. 10th Grade) - Adjust based on actual text in dropdown

    // Major
    await page.click("text=Select major");
    await page.click("text=Software Engineering"); // Adjust based on actual text

    // Class Number
    await page.click("text=Select class");
    await page.click("text=Class 1"); // Adjust based on actual text

    // Role
    await page.click("text=Select role");
    await page.click("text=Student"); // Adjust based on actual text

    // Password
    await page.fill('input[name="password"]', "Test@12345");
    await page.fill('input[name="confirmPassword"]', "Test@12345");

    // Submit form
    await page.click('button:has-text("Create Student Account")');

    // Wait for success message/toast
    await expect(
      page.locator("text=Student account created successfully"),
    ).toBeVisible();
  });

  test("Sign out", async ({ page }) => {
    // Login first
    await page.goto("http://localhost:3000/sign-in");
    await page.fill('input[name="email"]', "student@test.com");
    await page.fill('input[name="password"]', "Test@12345");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);

    // Click Sign Out
    await page.click('button:has-text("Sign Out")');

    // Assert redirection to sign-in
    await expect(page).toHaveURL(/\/sign-in/);
  });
});
