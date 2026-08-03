import { Router } from "express";
import type { PrismaClient } from "@prisma/client";
import { createSummaryController } from "../controllers/summary.js";
import { createSummaryService } from "../services/summary.js";

export function createSummaryRouter(prisma: PrismaClient) {
  const router = Router();
  const service = createSummaryService(prisma);
  const controller = createSummaryController(service);

  router.get("/by-category", (req, res) => {
    void controller.byCategory(req, res);
  });

  return router;
}
