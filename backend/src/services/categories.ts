import type { Category, PrismaClient } from "@prisma/client";
import { SYSTEM_CATEGORY_NAME } from "../types/domain.js";

export type CategoryDto = {
  id: string;
  name: string;
  isSystem: boolean;
};

export class CategoryError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "CategoryError";
  }
}

function toDto(category: Category): CategoryDto {
  return {
    id: category.id,
    name: category.name,
    isSystem: category.isSystem,
  };
}

function normalizeName(raw: unknown): string {
  if (typeof raw !== "string") {
    throw new CategoryError("Category name is required", 400);
  }
  const name = raw.trim();
  if (name.length === 0) {
    throw new CategoryError("Category name cannot be empty", 400);
  }
  return name;
}

export function createCategoryService(prisma: PrismaClient) {
  return {
    async list(): Promise<CategoryDto[]> {
      const categories = await prisma.category.findMany({
        orderBy: { name: "asc" },
      });
      return categories.map(toDto);
    },

    async create(rawName: unknown): Promise<CategoryDto> {
      const name = normalizeName(rawName);
      const existing = await prisma.category.findUnique({ where: { name } });
      if (existing) {
        throw new CategoryError("A category with this name already exists", 409);
      }

      const category = await prisma.category.create({
        data: { name, isSystem: false },
      });
      return toDto(category);
    },

    async rename(id: string, rawName: unknown): Promise<CategoryDto> {
      const name = normalizeName(rawName);
      const category = await prisma.category.findUnique({ where: { id } });
      if (!category) {
        throw new CategoryError("Category not found", 404);
      }
      if (category.isSystem || category.name === SYSTEM_CATEGORY_NAME) {
        throw new CategoryError("System category cannot be renamed", 403);
      }

      if (name !== category.name) {
        const collision = await prisma.category.findUnique({ where: { name } });
        if (collision) {
          throw new CategoryError(
            "A category with this name already exists",
            409,
          );
        }
      }

      const updated = await prisma.category.update({
        where: { id },
        data: { name },
      });
      return toDto(updated);
    },

    async remove(id: string): Promise<void> {
      const category = await prisma.category.findUnique({ where: { id } });
      if (!category) {
        throw new CategoryError("Category not found", 404);
      }
      if (category.isSystem || category.name === SYSTEM_CATEGORY_NAME) {
        throw new CategoryError("System category cannot be deleted", 403);
      }

      const other = await prisma.category.findUnique({
        where: { name: SYSTEM_CATEGORY_NAME },
      });
      if (!other) {
        throw new CategoryError("System category Other is missing", 500);
      }

      await prisma.$transaction(async (tx) => {
        await tx.expense.updateMany({
          where: { categoryId: id },
          data: { categoryId: other.id },
        });
        await tx.category.delete({ where: { id } });
      });
    },
  };
}

export type CategoryService = ReturnType<typeof createCategoryService>;
