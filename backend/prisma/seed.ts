import { PrismaClient } from "@prisma/client";
import { SEED_CATEGORIES, SYSTEM_CATEGORY_NAME } from "../src/types/domain.js";

const prisma = new PrismaClient();

async function main() {
  for (const name of SEED_CATEGORIES) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: {
        name,
        isSystem: name === SYSTEM_CATEGORY_NAME,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
