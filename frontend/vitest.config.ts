import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  esbuild: {
    jsx: "automatic",
  },
  test: {
    environment: "jsdom",
    setupFiles: [path.join(rootDir, "../test/frontend-test/setup.ts")],
    include: [path.join(rootDir, "../test/frontend-test/**/*.{test,spec}.{ts,tsx}")],
  },
});
