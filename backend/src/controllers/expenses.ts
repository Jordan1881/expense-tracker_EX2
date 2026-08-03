import type { Request, Response } from "express";
import { ExpenseError, type ExpenseService } from "../services/expenses.js";

export function createExpensesController(service: ExpenseService) {
  return {
    async list(_req: Request, res: Response): Promise<void> {
      try {
        const expenses = await service.list();
        res.status(200).json(expenses);
      } catch (error) {
        handleError(res, error);
      }
    },

    async create(req: Request, res: Response): Promise<void> {
      try {
        const expense = await service.create(req.body ?? {});
        res.status(201).json(expense);
      } catch (error) {
        handleError(res, error);
      }
    },
  };
}

function handleError(res: Response, error: unknown): void {
  if (error instanceof ExpenseError) {
    res.status(error.status).json({ error: error.message });
    return;
  }
  console.error(error);
  res.status(500).json({ error: "Internal server error" });
}
