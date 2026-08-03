import cors from "cors";
import express from "express";
import { categoriesRouter } from "./routes/categories.js";
import { expensesRouter } from "./routes/expenses.js";
import { healthRouter } from "./routes/health.js";

export function createApp() {
  const app = express();
  const frontendOrigin = process.env.FRONTEND_ORIGIN ?? "http://localhost:5173";

  app.use(cors({ origin: frontendOrigin }));
  app.use(express.json());

  app.use("/api/health", healthRouter);
  app.use("/api/expenses", expensesRouter);
  app.use("/api/categories", categoriesRouter);

  return app;
}
