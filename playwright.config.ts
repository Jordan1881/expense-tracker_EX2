import { defineConfig, devices } from "@playwright/test";

/**
 * E2E — categories panel + shell smoke.
 * Dedicated ports avoid colliding with other worktrees' default 5173/3001 servers.
 */
const FRONTEND_PORT = 5174;
const BACKEND_PORT = 3002;
const FRONTEND_URL = `http://127.0.0.1:${FRONTEND_PORT}`;
const BACKEND_URL = `http://127.0.0.1:${BACKEND_PORT}`;

export default defineConfig({
  testDir: "./test/e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: FRONTEND_URL,
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
      command: `npm run db:seed --workspace=backend && npm run dev --workspace=backend`,
      url: `${BACKEND_URL}/api/health`,
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        ...process.env,
        PORT: String(BACKEND_PORT),
        FRONTEND_ORIGIN: `${FRONTEND_URL},http://localhost:${FRONTEND_PORT}`,
      },
    },
    {
      command: `npm run dev --workspace=frontend -- --host 127.0.0.1 --port ${FRONTEND_PORT} --strictPort`,
      url: FRONTEND_URL,
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        ...process.env,
        VITE_API_BASE_URL: `${BACKEND_URL}/api`,
      },
    },
  ],
});
