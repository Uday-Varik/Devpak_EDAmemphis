import { defineConfig, devices } from "@playwright/test";

// E2E_BASE_URL is the preferred override; PLAYWRIGHT_BASE_URL is kept for backwards compatibility.
// Credentials for authenticated specs (E2E_EMAIL, E2E_PASSWORD) are read in the spec files only.
export default defineConfig({
  testDir: "e2e",
  use: {
    baseURL: process.env.E2E_BASE_URL || process.env.PLAYWRIGHT_BASE_URL || "http://localhost:8080",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
