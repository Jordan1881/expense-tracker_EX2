import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";
import {
  SEED_CATEGORIES,
  SYSTEM_CATEGORY_NAME,
} from "../../../backend/src/types/domain.js";

const backendRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../backend",
);

export type TestDb = {
  prisma: PrismaClient;
  databaseUrl: string;
  cleanup: () => Promise<void>;
};

export async function createTestDb(options?: {
  seed?: boolean;
}): Promise<TestDb> {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "expense-tracker-a-cat-"));
  const dbPath = path.join(dir, "test.db");
  const databaseUrl = `file:${dbPath}`;

  execSync("npx prisma migrate deploy", {
    cwd: backendRoot,
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: "pipe",
  });

  const prisma = new PrismaClient({
    datasources: { db: { url: databaseUrl } },
  });

  if (options?.seed !== false) {
    await seedCategories(prisma);
  }

  return {
    prisma,
    databaseUrl,
    cleanup: async () => {
      await prisma.$disconnect();
      fs.rmSync(dir, { recursive: true, force: true });
    },
  };
}

export async function seedCategories(prisma: PrismaClient): Promise<void> {
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
