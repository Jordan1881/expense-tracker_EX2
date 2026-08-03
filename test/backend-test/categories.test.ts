import { afterEach, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import type { PrismaClient } from "@prisma/client";
import { createApp } from "../../backend/src/app.js";
import { SEED_CATEGORIES, SYSTEM_CATEGORY_NAME } from "../../backend/src/types/domain.js";
import { createTestDb, type TestDb } from "./helpers/testDb.js";

describe("Categories API", () => {
  let db: TestDb;
  let prisma: PrismaClient;
  let app: ReturnType<typeof createApp>;

  beforeEach(async () => {
    db = await createTestDb();
    prisma = db.prisma;
    app = createApp({ prisma });
  });

  afterEach(async () => {
    await db.cleanup();
  });

  describe("GET /api/categories", () => {
    it("returns seeded categories including system Other", async () => {
      const response = await request(app).get("/api/categories");

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(SEED_CATEGORIES.length);

      const names = response.body.map((c: { name: string }) => c.name);
      for (const seed of SEED_CATEGORIES) {
        expect(names).toContain(seed);
      }

      const other = response.body.find(
        (c: { name: string }) => c.name === SYSTEM_CATEGORY_NAME,
      );
      expect(other).toMatchObject({ name: "Other", isSystem: true });
      expect(typeof other.id).toBe("string");
    });

    it("lists categories after process reconnect (persistence)", async () => {
      await request(app)
        .post("/api/categories")
        .send({ name: "Pets" })
        .expect(201);

      await prisma.$disconnect();
      const reopened = new (await import("@prisma/client")).PrismaClient({
        datasources: { db: { url: db.databaseUrl } },
      });
      const reopenedApp = createApp({ prisma: reopened });

      const response = await request(reopenedApp).get("/api/categories");
      expect(response.status).toBe(200);
      expect(response.body.map((c: { name: string }) => c.name)).toContain(
        "Pets",
      );

      await reopened.$disconnect();
      // Recreate connected client so afterEach cleanup can disconnect cleanly
      db.prisma = new (await import("@prisma/client")).PrismaClient({
        datasources: { db: { url: db.databaseUrl } },
      });
      prisma = db.prisma;
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
      expect(typeof response.body.id).toBe("string");

      const listed = await request(app).get("/api/categories");
      expect(listed.body.map((c: { name: string }) => c.name)).toContain(
        "Healthcare",
      );
    });

    it("trims whitespace around a valid name", async () => {
      const response = await request(app)
        .post("/api/categories")
        .send({ name: "  Travel  " });

      expect(response.status).toBe(201);
      expect(response.body.name).toBe("Travel");
    });

    it("rejects an empty name", async () => {
      const response = await request(app)
        .post("/api/categories")
        .send({ name: "" });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
    });

    it("rejects a whitespace-only name", async () => {
      const response = await request(app)
        .post("/api/categories")
        .send({ name: "   " });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
    });

    it("rejects a missing name", async () => {
      const response = await request(app).post("/api/categories").send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
    });

    it("rejects a duplicate name", async () => {
      const response = await request(app)
        .post("/api/categories")
        .send({ name: "Food" });

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty("error");
    });
  });

  describe("PATCH /api/categories/:id", () => {
    it("renames a non-system category", async () => {
      const created = await request(app)
        .post("/api/categories")
        .send({ name: "Old Name" });

      const response = await request(app)
        .patch(`/api/categories/${created.body.id}`)
        .send({ name: "New Name" });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: created.body.id,
        name: "New Name",
        isSystem: false,
      });
    });

    it("rejects rename collisions", async () => {
      const created = await request(app)
        .post("/api/categories")
        .send({ name: "Custom" });

      const response = await request(app)
        .patch(`/api/categories/${created.body.id}`)
        .send({ name: "Food" });

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty("error");
    });

    it("rejects empty rename", async () => {
      const created = await request(app)
        .post("/api/categories")
        .send({ name: "Custom" });

      const response = await request(app)
        .patch(`/api/categories/${created.body.id}`)
        .send({ name: "  " });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
    });

    it("rejects renaming the system Other category", async () => {
      const listed = await request(app).get("/api/categories");
      const other = listed.body.find(
        (c: { name: string }) => c.name === SYSTEM_CATEGORY_NAME,
      );

      const response = await request(app)
        .patch(`/api/categories/${other.id}`)
        .send({ name: "Misc" });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty("error");

      const after = await request(app).get("/api/categories");
      expect(
        after.body.some(
          (c: { name: string; isSystem: boolean }) =>
            c.name === "Other" && c.isSystem,
        ),
      ).toBe(true);
    });

    it("returns 404 for unknown id", async () => {
      const response = await request(app)
        .patch("/api/categories/does-not-exist")
        .send({ name: "Nope" });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error");
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

      expect(response.status).toBe(204);

      const listed = await request(app).get("/api/categories");
      expect(listed.body.map((c: { name: string }) => c.name)).not.toContain(
        "Temporary",
      );
    });

    it("reassigns expenses to Other then deletes the category", async () => {
      const created = await request(app)
        .post("/api/categories")
        .send({ name: "Doomed" });

      const other = await prisma.category.findUniqueOrThrow({
        where: { name: SYSTEM_CATEGORY_NAME },
      });

      const expense = await prisma.expense.create({
        data: {
          amountMinor: 1500,
          currency: "ILS",
          date: new Date("2026-08-01"),
          note: "lunch",
          categoryId: created.body.id,
        },
      });

      const response = await request(app).delete(
        `/api/categories/${created.body.id}`,
      );
      expect(response.status).toBe(204);

      const listed = await request(app).get("/api/categories");
      expect(listed.body.map((c: { name: string }) => c.name)).not.toContain(
        "Doomed",
      );

      const moved = await prisma.expense.findUniqueOrThrow({
        where: { id: expense.id },
      });
      expect(moved.categoryId).toBe(other.id);
    });

    it("rejects deleting Other and leaves it in place", async () => {
      const listed = await request(app).get("/api/categories");
      const other = listed.body.find(
        (c: { name: string }) => c.name === SYSTEM_CATEGORY_NAME,
      );

      const response = await request(app).delete(
        `/api/categories/${other.id}`,
      );

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty("error");

      const after = await request(app).get("/api/categories");
      const stillThere = after.body.find(
        (c: { name: string }) => c.name === SYSTEM_CATEGORY_NAME,
      );
      expect(stillThere).toMatchObject({ name: "Other", isSystem: true });
    });

    it("returns 404 for unknown id", async () => {
      const response = await request(app).delete(
        "/api/categories/does-not-exist",
      );

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error");
    });
  });
});
