import { Router } from "express";
import {
  CategoryError,
  createCategory,
  deleteCategory,
  listCategories,
  renameCategory,
} from "../services/categories.js";

export const categoriesRouter = Router();

function handleError(res: import("express").Response, error: unknown) {
  if (error instanceof CategoryError) {
    res.status(error.status).json({ error: error.message });
    return;
  }
  console.error(error);
  res.status(500).json({ error: "Internal server error" });
}

categoriesRouter.get("/", async (_req, res) => {
  try {
    const categories = await listCategories();
    res.status(200).json(categories);
  } catch (error) {
    handleError(res, error);
  }
});

categoriesRouter.post("/", async (req, res) => {
  try {
    const category = await createCategory(req.body?.name);
    res.status(201).json(category);
  } catch (error) {
    handleError(res, error);
  }
});

categoriesRouter.patch("/:id", async (req, res) => {
  try {
    const category = await renameCategory(
      req.params.id as string,
      req.body?.name,
    );
    res.status(200).json(category);
  } catch (error) {
    handleError(res, error);
  }
});

categoriesRouter.delete("/:id", async (req, res) => {
  try {
    const result = await deleteCategory(req.params.id as string);
    res.status(200).json({
      deleted: true,
      reassignedCount: result.reassignedCount,
    });
  } catch (error) {
    handleError(res, error);
  }
});
