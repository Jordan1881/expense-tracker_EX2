import { afterAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { PrismaClient } from "@prisma/client";
import { createApp } from "../../backend/src/app.js";
import {
  SEED_CATEGORIES,
  SYSTEM_CATEGORY_NAME,
} from "../../backend/src/types/domain.js";
import { seedCategories } from "../../backend/src/services/categories.js";

const prisma = new PrismaClient();
const app = createApp();

async function resetDatabase() {
  await prisma.expense.deleteMany();
  await prisma.category.deleteMany();
  await seedCategories(prisma);
}

describe("Categories API", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("GET /api/categories", () => {
    it("lists seeded categories including protected Other", async () => {
      const response = await request(app).get("/api/categories");

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(SEED_CATEGORIES.length);

      const names = response.body.map((c: { name: string }) => c.name);
      expect(names).toEqual(expect.arrayContaining([...SEED_CATEGORIES]));

      const other = response.body.find(
        (c: { name: string }) => c.name === SYSTEM_CATEGORY_NAME,
      );
      expect(other).toMatchObject({ name: "Other", isSystem: true });
    });
  });

  describe("POST /api/categories", () => {
    it("creates a category with a valid unique name", async () => {
      const response = await request(app)
        .post("/api/categories")
        .send({ name: "Healthcare" });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        name: "Healthcare",
        isSystem: false,
      });
      expect(response.body.id).toBeTruthy();

      const listed = await request(app).get("/api/categories");
      expect(listed.body.map((c: { name: string }) => c.name)).toContain(
        "Healthcare",
      );
    });

    it("rejects empty name", async () => {
      const response = await request(app)
        .post("/api/categories")
        .send({ name: "" });

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/name/i);
    });

    it("rejects whitespace-only name", async () => {
      const response = await request(app)
        .post("/api/categories")
        .send({ name: "   " });

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/name/i);
    });

    it("rejects duplicate name", async () => {
      const response = await request(app)
        .post("/api/categories")
        .send({ name: "Food" });

      expect(response.status).toBe(409);
      expect(response.body.error).toMatch(/exists|duplicate/i);
    });

    it("trims surrounding whitespace on create", async () => {
      const response = await request(app)
        .post("/api/categories")
        .send({ name: "  Pets  " });

      expect(response.status).toBe(201);
      expect(response.body.name).toBe("Pets");
    });
  });

  describe("PATCH /api/categories/:id", () => {
    it("renames a non-system category", async () => {
      const created = await request(app)
        .post("/api/categories")
        .send({ name: "Gym" });

      const response = await request(app)
        .patch(`/api/categories/${created.body.id}`)
        .send({ name: "Fitness" });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: created.body.id,
        name: "Fitness",
        isSystem: false,
      });
    });

    it("rejects rename collisions", async () => {
      const created = await request(app)
        .post("/api/categories")
        .send({ name: "Gym" });

      const response = await request(app)
        .patch(`/api/categories/${created.body.id}`)
        .send({ name: "Food" });

      expect(response.status).toBe(409);
      expect(response.body.error).toMatch(/exists|duplicate/i);
    });

    it("rejects renaming Other", async () => {
      const categories = await request(app).get("/api/categories");
      const other = categories.body.find(
        (c: { name: string }) => c.name === SYSTEM_CATEGORY_NAME,
      );

      const response = await request(app)
        .patch(`/api/categories/${other.id}`)
        .send({ name: "Misc" });

      expect(response.status).toBe(403);
      expect(response.body.error).toMatch(/other|system/i);
    });

    it("rejects empty rename", async () => {
      const created = await request(app)
        .post("/api/categories")
        .send({ name: "Gym" });

      const response = await request(app)
        .patch(`/api/categories/${created.body.id}`)
        .send({ name: "  " });

      expect(response.status).toBe(400);
    });

    it("returns 404 for unknown id", async () => {
      const response = await request(app)
        .patch("/api/categories/does-not-exist")
        .send({ name: "Nope" });

      expect(response.status).toBe(404);
    });
  });

  describe("DELETE /api/categories/:id", () => {
    it("deletes an unused category", async () => {
      const created = await request(app)
        .post("/api/categories")
        .send({ name: "Temporary" });

      const response = await request(app).delete(
        `/api/categories/${created.body.id}`,
      );

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        deleted: true,
        reassignedCount: 0,
      });

      const listed = await request(app).get("/api/categories");
      expect(listed.body.map((c: { name: string }) => c.name)).not.toContain(
        "Temporary",
      );
    });

    it("reassigns expenses to Other then removes the category", async () => {
      const created = await request(app)
        .post("/api/categories")
        .send({ name: "Travel" });

      const other = await prisma.category.findUniqueOrThrow({
        where: { name: SYSTEM_CATEGORY_NAME },
      });

      const expense = await prisma.expense.create({
        data: {
          amountMinor: 2500,
          currency: "ILS",
          date: new Date("2026-08-01"),
          note: "Flight",
          categoryId: created.body.id,
        },
      });

      const response = await request(app).delete(
        `/api/categories/${created.body.id}`,
      );

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        deleted: true,
        reassignedCount: 1,
      });

      const moved = await prisma.expense.findUniqueOrThrow({
        where: { id: expense.id },
      });
      expect(moved.categoryId).toBe(other.id);

      const listed = await request(app).get("/api/categories");
      expect(listed.body.map((c: { name: string }) => c.name)).not.toContain(
        "Travel",
      );
      expect(
        listed.body.some(
          (c: { name: string }) => c.name === SYSTEM_CATEGORY_NAME,
        ),
      ).toBe(true);
    });

    it("rejects deleting Other and leaves it intact", async () => {
      const categories = await request(app).get("/api/categories");
      const other = categories.body.find(
        (c: { name: string }) => c.name === SYSTEM_CATEGORY_NAME,
      );

      const response = await request(app).delete(
        `/api/categories/${other.id}`,
      );

      expect(response.status).toBe(403);
      expect(response.body.error).toMatch(/other|system|cannot be deleted/i);

      const after = await request(app).get("/api/categories");
      expect(
        after.body.some(
          (c: { name: string; isSystem: boolean }) =>
            c.name === SYSTEM_CATEGORY_NAME && c.isSystem,
        ),
      ).toBe(true);
    });

    it("returns 404 for unknown id", async () => {
      const response = await request(app).delete(
        "/api/categories/does-not-exist",
      );

      expect(response.status).toBe(404);
    });
  });

  describe("persistence", () => {
    it("keeps categories after reconnecting to the database", async () => {
      await request(app).post("/api/categories").send({ name: "Books" });

      await prisma.$disconnect();
      const reopened = new PrismaClient();
      const rows = await reopened.category.findMany({
        orderBy: { name: "asc" },
      });
      expect(rows.map((c) => c.name)).toContain("Books");
      await reopened.$disconnect();
      await prisma.$connect();
    });
  });
});
