import type { PrismaClient } from "@prisma/client";
import type { CurrencyCode } from "../types/domain.js";

export type CategoryCurrencyTotal = {
  currency: CurrencyCode;
  amountMinor: number;
};

export type CategorySummaryRow = {
  categoryId: string;
  categoryName: string;
  totals: CategoryCurrencyTotal[];
};

export function createSummaryService(prisma: PrismaClient) {
  return {
    async byCategory(): Promise<CategorySummaryRow[]> {
      const expenses = await prisma.expense.findMany({
        select: {
          amountMinor: true,
          currency: true,
          categoryId: true,
          category: { select: { name: true } },
        },
      });

      const byCategory = new Map<
        string,
        { categoryName: string; byCurrency: Map<string, number> }
      >();

      for (const expense of expenses) {
        let entry = byCategory.get(expense.categoryId);
        if (!entry) {
          entry = {
            categoryName: expense.category.name,
            byCurrency: new Map(),
          };
          byCategory.set(expense.categoryId, entry);
        }
        const prev = entry.byCurrency.get(expense.currency) ?? 0;
        entry.byCurrency.set(expense.currency, prev + expense.amountMinor);
      }

      const rows: CategorySummaryRow[] = [...byCategory.entries()].map(
        ([categoryId, entry]) => ({
          categoryId,
          categoryName: entry.categoryName,
          totals: [...entry.byCurrency.entries()]
            .map(([currency, amountMinor]) => ({
              currency: currency as CurrencyCode,
              amountMinor,
            }))
            .sort((a, b) => a.currency.localeCompare(b.currency)),
        }),
      );

      rows.sort((a, b) => a.categoryName.localeCompare(b.categoryName));
      return rows;
    },
  };
}

export type SummaryService = ReturnType<typeof createSummaryService>;
