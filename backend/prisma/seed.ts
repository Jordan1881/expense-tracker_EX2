import { PrismaClient } from "@prisma/client";
import { seedCategories } from "../src/services/categories.js";

const prisma = new PrismaClient();

async function main() {
  await seedCategories(prisma);
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
