import { Router } from "express";
import type { PrismaClient } from "@prisma/client";
import { createCategoriesController } from "../controllers/categories.js";
import { createCategoryService } from "../services/categories.js";
import { getPrisma } from "../db.js";

export function createCategoriesRouter(prisma: PrismaClient = getPrisma()) {
  const router = Router();
  const controller = createCategoriesController(createCategoryService(prisma));

  router.get("/", (req, res, next) => void controller.list(req, res, next));
  router.post("/", (req, res, next) => void controller.create(req, res, next));
  router.patch("/:id", (req, res, next) =>
    void controller.update(req, res, next),
  );
  router.delete("/:id", (req, res, next) =>
    void controller.remove(req, res, next),
  );

  return router;
}
