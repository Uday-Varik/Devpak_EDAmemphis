import { test, expect } from "@playwright/test";

test("landing page loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#root")).not.toBeEmpty();
});

test("unauthenticated visit to /dashboard leaves /dashboard", async ({ page }) => {
  await page.goto("/dashboard");
  await page.waitForURL((url) => url.pathname !== "/dashboard");
});
