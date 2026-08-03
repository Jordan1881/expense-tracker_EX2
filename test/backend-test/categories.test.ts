import { afterEach, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import type { PrismaClient } from "@prisma/client";
import { createApp } from "../../backend/src/app.js";
import {
  SEED_CATEGORIES,
  SYSTEM_CATEGORY_NAME,
} from "../../backend/src/types/domain.js";
import { createTestDb, type TestDb } from "./helpers/testDb.js";

type CategoryBody = {
  id: string;
  name: string;
  isSystem: boolean;
};

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
    it("returns all seeded categories including system Other", async () => {
      const response = await request(app).get("/api/categories");

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(SEED_CATEGORIES.length);

      const names = response.body.map((c: CategoryBody) => c.name);
      for (const seed of SEED_CATEGORIES) {
        expect(names).toContain(seed);
      }

      const other = response.body.find(
        (c: CategoryBody) => c.name === SYSTEM_CATEGORY_NAME,
      );
      expect(other).toMatchObject({ name: "Other", isSystem: true });
      expect(typeof other.id).toBe("string");

      for (const category of response.body as CategoryBody[]) {
        expect(category).toEqual(
          expect.objectContaining({
            id: expect.any(String),
            name: expect.any(String),
            isSystem: expect.any(Boolean),
          }),
        );
        expect(Object.keys(category).sort()).toEqual(
          ["id", "isSystem", "name"].sort(),
        );
      }
    });

    it("returns categories sorted by name ascending", async () => {
      await request(app).post("/api/categories").send({ name: "Zoo" });
      await request(app).post("/api/categories").send({ name: "Alpha" });

      const response = await request(app).get("/api/categories");
      const names = response.body.map((c: CategoryBody) => c.name);
      expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
    });

    it("marks only Other as system among seeds", async () => {
      const response = await request(app).get("/api/categories");
      const systemOnes = (response.body as CategoryBody[]).filter(
        (c) => c.isSystem,
      );
      expect(systemOnes).toHaveLength(1);
      expect(systemOnes[0]?.name).toBe(SYSTEM_CATEGORY_NAME);
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
      expect(listed.body.map((c: CategoryBody) => c.name)).toContain(
        "Healthcare",
      );
    });

    it("trims surrounding whitespace before saving", async () => {
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
        .send({ name: "   \t  " });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
    });

    it("rejects a missing name field", async () => {
      const response = await request(app).post("/api/categories").send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
    });

    it("rejects a non-string name", async () => {
      const response = await request(app)
        .post("/api/categories")
        .send({ name: 42 });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
    });

    it("rejects null name", async () => {
      const response = await request(app)
        .post("/api/categories")
        .send({ name: null });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
    });

    it("rejects duplicate of a seeded name", async () => {
      const response = await request(app)
        .post("/api/categories")
        .send({ name: "Food" });

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty("error");
    });

    it("rejects duplicate after trimming", async () => {
      const response = await request(app)
        .post("/api/categories")
        .send({ name: "  Food  " });

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty("error");
    });

    it("rejects duplicate of a previously created category", async () => {
      await request(app)
        .post("/api/categories")
        .send({ name: "Pets" })
        .expect(201);

      const response = await request(app)
        .post("/api/categories")
        .send({ name: "Pets" });

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty("error");
    });

    it("does not create system categories via POST", async () => {
      const response = await request(app)
        .post("/api/categories")
        .send({ name: "Custom" });

      expect(response.status).toBe(201);
      expect(response.body.isSystem).toBe(false);
    });
  });

  describe("PATCH /api/categories/:id", () => {
    it("renames a non-system custom category", async () => {
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

    it("renames a seeded non-system category", async () => {
      const listed = await request(app).get("/api/categories");
      const food = (listed.body as CategoryBody[]).find(
        (c) => c.name === "Food",
      );
      expect(food?.isSystem).toBe(false);

      const response = await request(app)
        .patch(`/api/categories/${food!.id}`)
        .send({ name: "Groceries" });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe("Groceries");
    });

    it("trims rename input", async () => {
      const created = await request(app)
        .post("/api/categories")
        .send({ name: "Custom" });

      const response = await request(app)
        .patch(`/api/categories/${created.body.id}`)
        .send({ name: "  Renamed  " });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe("Renamed");
    });

    it("allows renaming to the same name (idempotent)", async () => {
      const created = await request(app)
        .post("/api/categories")
        .send({ name: "Stable" });

      const response = await request(app)
        .patch(`/api/categories/${created.body.id}`)
        .send({ name: "Stable" });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe("Stable");
    });

    it("rejects rename collisions with another category", async () => {
      const created = await request(app)
        .post("/api/categories")
        .send({ name: "Custom" });

      const response = await request(app)
        .patch(`/api/categories/${created.body.id}`)
        .send({ name: "Food" });

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty("error");
    });

    it("rejects rename collisions after trimming", async () => {
      const created = await request(app)
        .post("/api/categories")
        .send({ name: "Custom" });

      const response = await request(app)
        .patch(`/api/categories/${created.body.id}`)
        .send({ name: "  Bills  " });

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty("error");
    });

    it("rejects empty rename", async () => {
      const created = await request(app)
        .post("/api/categories")
        .send({ name: "Custom" });

      const response = await request(app)
        .patch(`/api/categories/${created.body.id}`)
        .send({ name: "" });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
    });

    it("rejects whitespace-only rename", async () => {
      const created = await request(app)
        .post("/api/categories")
        .send({ name: "Custom" });

      const response = await request(app)
        .patch(`/api/categories/${created.body.id}`)
        .send({ name: "   " });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
    });

    it("rejects missing name on rename", async () => {
      const created = await request(app)
        .post("/api/categories")
        .send({ name: "Custom" });

      const response = await request(app)
        .patch(`/api/categories/${created.body.id}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
    });

    it("rejects non-string rename", async () => {
      const created = await request(app)
        .post("/api/categories")
        .send({ name: "Custom" });

      const response = await request(app)
        .patch(`/api/categories/${created.body.id}`)
        .send({ name: true });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
    });

    it("rejects renaming the system Other category", async () => {
      const listed = await request(app).get("/api/categories");
      const other = (listed.body as CategoryBody[]).find(
        (c) => c.name === SYSTEM_CATEGORY_NAME,
      );

      const response = await request(app)
        .patch(`/api/categories/${other!.id}`)
        .send({ name: "Misc" });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty("error");

      const after = await request(app).get("/api/categories");
      expect(
        after.body.some(
          (c: CategoryBody) => c.name === "Other" && c.isSystem === true,
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
    it("deletes an unused custom category", async () => {
      const created = await request(app)
        .post("/api/categories")
        .send({ name: "Temporary" });

      const response = await request(app).delete(
        `/api/categories/${created.body.id}`,
      );

      expect(response.status).toBe(204);
      expect(response.body).toEqual({});

      const listed = await request(app).get("/api/categories");
      expect(listed.body.map((c: CategoryBody) => c.name)).not.toContain(
        "Temporary",
      );
    });

    it("deletes an unused seeded non-system category", async () => {
      const listed = await request(app).get("/api/categories");
      const shopping = (listed.body as CategoryBody[]).find(
        (c) => c.name === "Shopping",
      );

      const response = await request(app).delete(
        `/api/categories/${shopping!.id}`,
      );
      expect(response.status).toBe(204);

      const after = await request(app).get("/api/categories");
      expect(after.body.map((c: CategoryBody) => c.name)).not.toContain(
        "Shopping",
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

      const second = await prisma.expense.create({
        data: {
          amountMinor: 200,
          currency: "USD",
          date: new Date("2026-08-02"),
          categoryId: created.body.id,
        },
      });

      const response = await request(app).delete(
        `/api/categories/${created.body.id}`,
      );
      expect(response.status).toBe(204);

      const listed = await request(app).get("/api/categories");
      expect(listed.body.map((c: CategoryBody) => c.name)).not.toContain(
        "Doomed",
      );

      const moved = await prisma.expense.findUniqueOrThrow({
        where: { id: expense.id },
      });
      expect(moved.categoryId).toBe(other.id);

      const movedSecond = await prisma.expense.findUniqueOrThrow({
        where: { id: second.id },
      });
      expect(movedSecond.categoryId).toBe(other.id);
    });

    it("leaves expenses already on Other untouched when deleting another category", async () => {
      const created = await request(app)
        .post("/api/categories")
        .send({ name: "Doomed" });

      const other = await prisma.category.findUniqueOrThrow({
        where: { name: SYSTEM_CATEGORY_NAME },
      });

      const onOther = await prisma.expense.create({
        data: {
          amountMinor: 100,
          currency: "EUR",
          date: new Date("2026-08-01"),
          categoryId: other.id,
        },
      });

      await prisma.expense.create({
        data: {
          amountMinor: 50,
          currency: "ILS",
          date: new Date("2026-08-01"),
          categoryId: created.body.id,
        },
      });

      await request(app).delete(`/api/categories/${created.body.id}`).expect(204);

      const still = await prisma.expense.findUniqueOrThrow({
        where: { id: onOther.id },
      });
      expect(still.categoryId).toBe(other.id);
    });

    it("rejects deleting Other and leaves it in place", async () => {
      const listed = await request(app).get("/api/categories");
      const other = (listed.body as CategoryBody[]).find(
        (c) => c.name === SYSTEM_CATEGORY_NAME,
      );

      const response = await request(app).delete(
        `/api/categories/${other!.id}`,
      );

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty("error");

      const after = await request(app).get("/api/categories");
      const stillThere = after.body.find(
        (c: CategoryBody) => c.name === SYSTEM_CATEGORY_NAME,
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
