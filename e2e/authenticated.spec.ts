import { test, expect, type Page } from "@playwright/test";

// Authenticated flows need a dedicated E2E account. Credentials come only from
// the environment; without them every test in this file is skipped so CI stays green.
const EMAIL = process.env.E2E_EMAIL;
const PASSWORD = process.env.E2E_PASSWORD;

// The live test project must never be written to by automated tests.
const PROTECTED_PROJECT_ID = "078f8715-57ee-48ce-9cab-ea96e1fdd9fe";

test.describe("authenticated flows", () => {
  test.skip(!EMAIL || !PASSWORD, "Set E2E_EMAIL and E2E_PASSWORD to run authenticated E2E tests.");

  const signIn = async (page: Page) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Sign in" }).first().click();
    await page.getByLabel("Email").fill(EMAIL!);
    await page.getByLabel("Password").fill(PASSWORD!);
    await page.getByRole("button", { name: "Sign In", exact: true }).click();
    await expect(page.getByRole("button", { name: "Sign In", exact: true })).toBeHidden();
  };

  // Creates a throwaway project in the E2E account and returns its id.
  const createProject = async (page: Page): Promise<string> => {
    await page.goto("/dashboard");
    await page.getByRole("button", { name: "New Project" }).first().click();
    await page.locator("#projectName").fill(`E2E ${Date.now()}`);
    await page.getByRole("button", { name: "Create Project" }).click();
    await page.waitForURL(/\/project\/[0-9a-f-]{36}$/);
    const id = new URL(page.url()).pathname.split("/").pop()!;
    expect(id).not.toBe(PROTECTED_PROJECT_ID);
    return id;
  };

  test("signs in and loads the dashboard", async ({ page }) => {
    await signIn(page);
    await page.goto("/dashboard");
    await expect(page.getByRole("button", { name: "New Project" }).first()).toBeVisible();
  });

  test("creates a project and opens its builder", async ({ page }) => {
    await signIn(page);
    await createProject(page);
    await expect(page.locator("#root")).not.toBeEmpty();
  });

  test("autosaves a builder section", async ({ page }) => {
    await signIn(page);
    await createProject(page);
    await page.getByRole("button", { name: "Project Scope" }).first().click();

    const saved = page.waitForResponse(
      (r) =>
        r.url().includes("/rest/v1/project_details") &&
        ["POST", "PATCH"].includes(r.request().method()) &&
        r.ok(),
      { timeout: 15_000 }
    );
    await page.locator("#numberOfUnits").fill("2");
    // Autosave debounces 1.5 s before writing.
    await saved;
  });

  test("pre-export validation modal opens before an export and can be cancelled", async ({ page }) => {
    await signIn(page);
    await createProject(page);
    await page.getByRole("button", { name: "Executive Summary" }).first().click();
    await page.getByRole("button", { name: /export/i }).first().click();
    await page.getByRole("menuitem", { name: "Lender Summary" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText("Pre-Export Review")).toBeVisible();
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(dialog).toBeHidden();
  });
});
