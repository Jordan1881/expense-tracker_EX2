import cors from "cors";
import express from "express";
import type { PrismaClient } from "@prisma/client";
import { getPrisma } from "./db.js";
import { createCategoriesRouter } from "./routes/categories.js";
import { createExpensesRouter } from "./routes/expenses.js";
import { createSummaryRouter } from "./routes/summary.js";
import { healthRouter } from "./routes/health.js";

export type AppDeps = {
  prisma?: PrismaClient;
};

export function createApp(deps: AppDeps = {}) {
  const app = express();
  const frontendOrigin = process.env.FRONTEND_ORIGIN ?? "http://localhost:5173";
  const prisma = deps.prisma ?? getPrisma();

  app.use(cors({ origin: frontendOrigin }));
  app.use(express.json());

  app.use("/api/health", healthRouter);
  app.use("/api/expenses", createExpensesRouter(prisma));
  app.use("/api/categories", createCategoriesRouter(prisma));
  app.use("/api/summary", createSummaryRouter(prisma));

  return app;
}
