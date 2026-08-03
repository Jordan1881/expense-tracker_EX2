import { PrismaClient } from "@prisma/client";
import { SEED_CATEGORIES, SYSTEM_CATEGORY_NAME } from "./types/domain.js";
import { getPrisma } from "./db.js";

export async function ensureSeedCategories(
  prisma: PrismaClient = getPrisma(),
): Promise<void> {
  for (const name of SEED_CATEGORIES) {
    await prisma.category.upsert({
      where: { name },
      update: {
        isSystem: name === SYSTEM_CATEGORY_NAME,
      },
      create: {
        name,
        isSystem: name === SYSTEM_CATEGORY_NAME,
      },
    });
  }
}
