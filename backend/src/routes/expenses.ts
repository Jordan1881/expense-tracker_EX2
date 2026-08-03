import { Router } from "express";
import type { PrismaClient } from "@prisma/client";
import { createExpensesController } from "../controllers/expenses.js";
import { createExpenseService } from "../services/expenses.js";

export function createExpensesRouter(prisma: PrismaClient) {
  const router = Router();
  const service = createExpenseService(prisma);
  const controller = createExpensesController(service);

  router.get("/", (req, res) => {
    void controller.list(req, res);
  });

  router.post("/", (req, res) => {
    void controller.create(req, res);
  });

  router.patch("/:id", (req, res) => {
    void controller.update(req, res);
  });

  router.delete("/:id", (req, res) => {
    void controller.remove(req, res);
  });

  return router;
}
