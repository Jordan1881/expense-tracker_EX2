import { defineConfig, devices } from "@playwright/test";

/**
 * E2E scaffold — enable when UI + API features are implemented.
 * Run: npm run test:e2e (requires frontend + backend servers).
 */
export default defineConfig({
  testDir: "./test/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command: "npm run dev --workspace=frontend",
      url: "http://localhost:5173",
      reuseExistingServer: !process.env.CI,
    },
    {
      command: "npm run dev --workspace=backend",
      url: "http://localhost:3001/api/health",
      reuseExistingServer: !process.env.CI,
    },
  ],
});
