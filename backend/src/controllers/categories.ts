import type { Request, Response } from "express";
import {
  CategoryError,
  type CategoryService,
} from "../services/categories.js";

export function createCategoriesController(service: CategoryService) {
  return {
    async list(_req: Request, res: Response): Promise<void> {
      try {
        const categories = await service.list();
        res.status(200).json(categories);
      } catch (error) {
        handleError(res, error);
      }
    },

    async create(req: Request, res: Response): Promise<void> {
      try {
        const category = await service.create(req.body?.name);
        res.status(201).json(category);
      } catch (error) {
        handleError(res, error);
      }
    },

    async rename(req: Request, res: Response): Promise<void> {
      try {
        const category = await service.rename(routeId(req), req.body?.name);
        res.status(200).json(category);
      } catch (error) {
        handleError(res, error);
      }
    },

    async remove(req: Request, res: Response): Promise<void> {
      try {
        await service.remove(routeId(req));
        res.status(204).send();
      } catch (error) {
        handleError(res, error);
      }
    },
  };
}

function routeId(req: Request): string {
  const id = req.params.id;
  return Array.isArray(id) ? id[0]! : id;
}

function handleError(res: Response, error: unknown): void {
  if (error instanceof CategoryError) {
    res.status(error.status).json({ error: error.message });
    return;
  }
  console.error(error);
  res.status(500).json({ error: "Internal server error" });
}
