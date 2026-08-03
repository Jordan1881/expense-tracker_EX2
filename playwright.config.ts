import { defineConfig, devices } from "@playwright/test";

/**
 * Agent D E2E — dedicated ports; non-watch servers so sibling agents' file
 * writes do not restart/kill the stack mid-run.
 */
export default defineConfig({
  testDir: "./test/e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  timeout: 60_000,
  use: {
    baseURL: "http://localhost:5174",
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
      command:
        "VITE_PORT=5174 VITE_API_BASE_URL=http://localhost:3002/api npm run dev --workspace=frontend",
      url: "http://localhost:5174",
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command:
        "PORT=3002 FRONTEND_ORIGIN=http://localhost:5174 npx tsx src/index.ts",
      cwd: "backend",
      url: "http://localhost:3002/api/health",
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
