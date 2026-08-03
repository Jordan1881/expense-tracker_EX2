import { Router } from "express";

/**
 * Category routes — implement with TDD (see test/backend-test).
 * Scaffold only: stub endpoints so the API surface is discoverable.
 */
export const categoriesRouter = Router();

categoriesRouter.get("/", (_req, res) => {
  res.status(501).json({ error: "Not implemented" });
});

categoriesRouter.post("/", (_req, res) => {
  res.status(501).json({ error: "Not implemented" });
});
