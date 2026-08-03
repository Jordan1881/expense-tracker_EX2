import type { Request, Response, NextFunction } from "express";
import {
  CategoryError,
  type CategoryService,
} from "../services/categories.js";

export function createCategoriesController(service: CategoryService) {
  return {
    async list(_req: Request, res: Response, next: NextFunction) {
      try {
        const categories = await service.list();
        res.status(200).json(categories);
      } catch (error) {
        next(error);
      }
    },

    async create(req: Request, res: Response, next: NextFunction) {
      try {
        const category = await service.create(req.body?.name);
        res.status(201).json(category);
      } catch (error) {
        if (error instanceof CategoryError) {
          res.status(error.status).json({ error: error.message });
          return;
        }
        next(error);
      }
    },

    async update(req: Request, res: Response, next: NextFunction) {
      try {
        const id = String(req.params.id);
        const category = await service.rename(id, req.body?.name);
        res.status(200).json(category);
      } catch (error) {
        if (error instanceof CategoryError) {
          res.status(error.status).json({ error: error.message });
          return;
        }
        next(error);
      }
    },

    async remove(req: Request, res: Response, next: NextFunction) {
      try {
        const id = String(req.params.id);
        await service.remove(id);
        res.status(204).send();
      } catch (error) {
        if (error instanceof CategoryError) {
          res.status(error.status).json({ error: error.message });
          return;
        }
        next(error);
      }
    },
  };
}
