import { Router } from "express";
import type { PrismaClient } from "@prisma/client";
import { createCategoriesController } from "../controllers/categories.js";
import { createCategoryService } from "../services/categories.js";

export function createCategoriesRouter(prisma: PrismaClient) {
  const router = Router();
  const service = createCategoryService(prisma);
  const controller = createCategoriesController(service);

  router.get("/", (req, res) => {
    void controller.list(req, res);
  });

  router.post("/", (req, res) => {
    void controller.create(req, res);
  });

  router.patch("/:id", (req, res) => {
    void controller.rename(req, res);
  });

  router.delete("/:id", (req, res) => {
    void controller.remove(req, res);
  });

  return router;
}
