import type { Request, Response } from "express";
import { ExpenseError, type ExpenseService } from "../services/expenses.js";

export function createExpensesController(service: ExpenseService) {
  return {
    async list(req: Request, res: Response): Promise<void> {
      try {
        const categoryId = queryString(req.query.categoryId);
        const from = queryString(req.query.from);
        const to = queryString(req.query.to);
        const expenses = await service.list({
          ...(categoryId !== undefined ? { categoryId } : {}),
          ...(from !== undefined ? { from } : {}),
          ...(to !== undefined ? { to } : {}),
        });
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

function queryString(value: unknown): string | undefined {
  if (value === undefined) return undefined;
  if (Array.isArray(value)) {
    const first = value[0];
    return typeof first === "string" ? first : undefined;
  }
  return typeof value === "string" ? value : undefined;
}

function handleError(res: Response, error: unknown): void {
  if (error instanceof ExpenseError) {
    res.status(error.status).json({ error: error.message });
    return;
  }
  console.error(error);
  res.status(500).json({ error: "Internal server error" });
}
