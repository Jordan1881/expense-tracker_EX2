import { Router } from "express";

/**
 * Expense routes — implement with TDD (see test/backend-test).
 * Scaffold only: stub endpoints so the API surface is discoverable.
 */
export const expensesRouter = Router();

expensesRouter.get("/", (_req, res) => {
  res.status(501).json({ error: "Not implemented" });
});

expensesRouter.post("/", (_req, res) => {
  res.status(501).json({ error: "Not implemented" });
});
