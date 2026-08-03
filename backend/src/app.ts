import cors from "cors";
import express from "express";
import type { PrismaClient } from "@prisma/client";
import { createCategoriesRouter } from "./routes/categories.js";
import { expensesRouter } from "./routes/expenses.js";
import { healthRouter } from "./routes/health.js";
import { getPrisma } from "./db.js";

export type AppDeps = {
  prisma?: PrismaClient;
};

export function createApp(deps: AppDeps = {}) {
  const app = express();
  const frontendOrigins = (
    process.env.FRONTEND_ORIGIN ??
    "http://localhost:5173,http://127.0.0.1:5173,http://127.0.0.1:5174,http://localhost:5174"
  )
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  const prisma = deps.prisma ?? getPrisma();

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || frontendOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error(`CORS blocked for origin ${origin}`));
      },
    }),
  );
  app.use(express.json());

  app.use("/api/health", healthRouter);
  app.use("/api/expenses", expensesRouter);
  app.use("/api/categories", createCategoriesRouter(prisma));

  return app;
}
