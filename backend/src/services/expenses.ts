import type { Currency, Expense, PrismaClient } from "@prisma/client";
import { CURRENCIES, type CurrencyCode } from "../types/domain.js";

export type ExpenseDto = {
  id: string;
  amountMinor: number;
  currency: CurrencyCode;
  date: string;
  note: string | null;
  categoryId: string;
  categoryName: string;
};

export class ExpenseError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ExpenseError";
  }
}

type ExpenseWithCategory = Expense & {
  category: { id: string; name: string };
};

function toDto(expense: ExpenseWithCategory): ExpenseDto {
  return {
    id: expense.id,
    amountMinor: expense.amountMinor,
    currency: expense.currency as CurrencyCode,
    date: expense.date.toISOString().slice(0, 10),
    note: expense.note,
    categoryId: expense.categoryId,
    categoryName: expense.category.name,
  };
}

function parseAmountMinor(raw: unknown): number {
  if (typeof raw !== "number" || !Number.isInteger(raw) || raw <= 0) {
    throw new ExpenseError(
      "amountMinor must be a positive integer (minor units)",
      400,
    );
  }
  return raw;
}

function parseCurrency(raw: unknown): Currency {
  if (typeof raw !== "string" || !(CURRENCIES as string[]).includes(raw)) {
    throw new ExpenseError("currency must be one of USD, ILS, EUR", 400);
  }
  return raw as Currency;
}

function parseDate(raw: unknown): Date {
  if (typeof raw !== "string" || raw.trim().length === 0) {
    throw new ExpenseError("date is required", 400);
  }
  const trimmed = raw.trim();
  // Accept YYYY-MM-DD or full ISO; store as UTC noon for date-only strings
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(trimmed)
    ? `${trimmed}T12:00:00.000Z`
    : trimmed;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    throw new ExpenseError("date must be a valid ISO date", 400);
  }
  return date;
}

function parseNote(raw: unknown): string | null {
  if (raw === undefined || raw === null || raw === "") {
    return null;
  }
  if (typeof raw !== "string") {
    throw new ExpenseError("note must be a string", 400);
  }
  return raw;
}

function parseCategoryId(raw: unknown): string {
  if (typeof raw !== "string" || raw.trim().length === 0) {
    throw new ExpenseError("categoryId is required", 400);
  }
  return raw.trim();
}

export type CreateExpenseInput = {
  amountMinor?: unknown;
  currency?: unknown;
  date?: unknown;
  note?: unknown;
  categoryId?: unknown;
};

export type ListExpensesFilters = {
  categoryId?: string;
  from?: string;
  to?: string;
};

function parseOptionalDateBound(raw: string, bound: "start" | "end"): Date {
  const trimmed = raw.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    throw new ExpenseError(
      `${bound === "start" ? "from" : "to"} must be YYYY-MM-DD`,
      400,
    );
  }
  const iso =
    bound === "start" ? `${trimmed}T00:00:00.000Z` : `${trimmed}T23:59:59.999Z`;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    throw new ExpenseError(
      `${bound === "start" ? "from" : "to"} must be a valid date`,
      400,
    );
  }
  return date;
}

export function createExpenseService(prisma: PrismaClient) {
  return {
    async list(filters: ListExpensesFilters = {}): Promise<ExpenseDto[]> {
      const where: {
        categoryId?: string;
        date?: { gte?: Date; lte?: Date };
      } = {};

      if (filters.categoryId !== undefined && filters.categoryId !== "") {
        where.categoryId = filters.categoryId;
      }

      if (filters.from !== undefined && filters.from !== "") {
        where.date = {
          ...where.date,
          gte: parseOptionalDateBound(filters.from, "start"),
        };
      }

      if (filters.to !== undefined && filters.to !== "") {
        where.date = {
          ...where.date,
          lte: parseOptionalDateBound(filters.to, "end"),
        };
      }

      if (
        where.date?.gte &&
        where.date?.lte &&
        where.date.gte.getTime() > where.date.lte.getTime()
      ) {
        throw new ExpenseError("`from` must be on or before `to`", 400);
      }

      const expenses = await prisma.expense.findMany({
        where,
        include: { category: { select: { id: true, name: true } } },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      });
      return expenses.map(toDto);
    },

    async create(body: CreateExpenseInput): Promise<ExpenseDto> {
      const amountMinor = parseAmountMinor(body.amountMinor);
      const currency = parseCurrency(body.currency);
      const date = parseDate(body.date);
      const note = parseNote(body.note);
      const categoryId = parseCategoryId(body.categoryId);

      const category = await prisma.category.findUnique({
        where: { id: categoryId },
      });
      if (!category) {
        throw new ExpenseError("Category not found", 404);
      }

      const expense = await prisma.expense.create({
        data: {
          amountMinor,
          currency,
          date,
          note,
          categoryId,
        },
        include: { category: { select: { id: true, name: true } } },
      });
      return toDto(expense);
    },
  };
}

export type ExpenseService = ReturnType<typeof createExpenseService>;
