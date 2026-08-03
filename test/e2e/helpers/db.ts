import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { seedCategories } from "../../../backend/src/services/categories.js";

const dbPath = path.resolve(process.cwd(), "backend/prisma/dev.db");
process.env.DATABASE_URL = `file:${dbPath}`;

const prisma = new PrismaClient();

export async function resetCategoriesDb() {
  await prisma.expense.deleteMany();
  await prisma.category.deleteMany();
  await seedCategories(prisma);
}

export async function createExpenseForCategory(categoryName: string) {
  const category = await prisma.category.findUniqueOrThrow({
    where: { name: categoryName },
  });
  return prisma.expense.create({
    data: {
      amountMinor: 4200,
      currency: "ILS",
      date: new Date("2026-08-01"),
      note: "E2E seeded expense",
      categoryId: category.id,
    },
  });
}

export async function getExpenseCategoryName(expenseId: string) {
  const expense = await prisma.expense.findUniqueOrThrow({
    where: { id: expenseId },
    include: { category: true },
  });
  return expense.category.name;
}

export async function disconnectE2eDb() {
  await prisma.$disconnect();
}
