import { PrismaClient } from "@prisma/client";
import { seedCategories } from "../../../backend/src/services/categories.js";

export const prisma = new PrismaClient();

export async function resetDatabase() {
  await prisma.expense.deleteMany();
  await prisma.category.deleteMany();
  await seedCategories(prisma);
}

export async function disconnectDb() {
  await prisma.$disconnect();
}
