import { afterEach, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import type { PrismaClient } from "@prisma/client";
import { createApp } from "../../backend/src/app.js";
import { createTestDb, type TestDb } from "./helpers/testDb.js";

type ExpenseBody = {
  id: string;
  amountMinor: number;
  currency: string;
  date: string;
  note: string | null;
  categoryId: string;
  categoryName: string;
};

describe("Expenses API", () => {
  let db: TestDb;
  let prisma: PrismaClient;
  let app: ReturnType<typeof createApp>;
  let foodId: string;

  beforeEach(async () => {
    db = await createTestDb();
    prisma = db.prisma;
    app = createApp({ prisma });
    const food = await prisma.category.findUniqueOrThrow({
      where: { name: "Food" },
    });
    foodId = food.id;
  });

  afterEach(async () => {
    await db.cleanup();
  });

  describe("GET /api/expenses", () => {
    it("returns an empty list when there are no expenses", async () => {
      const response = await request(app).get("/api/expenses");
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it("returns created expenses newest date first", async () => {
      await request(app).post("/api/expenses").send({
        amountMinor: 1000,
        currency: "ILS",
        date: "2026-01-01",
        categoryId: foodId,
      });
      await request(app).post("/api/expenses").send({
        amountMinor: 2000,
        currency: "USD",
        date: "2026-08-01",
        categoryId: foodId,
        note: "later",
      });

      const response = await request(app).get("/api/expenses");
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].date).toBe("2026-08-01");
      expect(response.body[1].date).toBe("2026-01-01");
    });

    it("filters by categoryId", async () => {
      const transport = await prisma.category.findUniqueOrThrow({
        where: { name: "Transport" },
      });
      await request(app).post("/api/expenses").send({
        amountMinor: 100,
        currency: "ILS",
        date: "2026-08-01",
        categoryId: foodId,
      });
      await request(app).post("/api/expenses").send({
        amountMinor: 200,
        currency: "ILS",
        date: "2026-08-02",
        categoryId: transport.id,
      });

      const response = await request(app)
        .get("/api/expenses")
        .query({ categoryId: transport.id });

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].categoryId).toBe(transport.id);
    });

    it("filters by date range inclusive", async () => {
      await request(app).post("/api/expenses").send({
        amountMinor: 100,
        currency: "ILS",
        date: "2026-07-01",
        categoryId: foodId,
      });
      await request(app).post("/api/expenses").send({
        amountMinor: 200,
        currency: "ILS",
        date: "2026-08-15",
        categoryId: foodId,
      });
      await request(app).post("/api/expenses").send({
        amountMinor: 300,
        currency: "ILS",
        date: "2026-09-01",
        categoryId: foodId,
      });

      const response = await request(app)
        .get("/api/expenses")
        .query({ from: "2026-08-01", to: "2026-08-31" });

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].date).toBe("2026-08-15");
    });

    it("combines category and date filters", async () => {
      const transport = await prisma.category.findUniqueOrThrow({
        where: { name: "Transport" },
      });
      await request(app).post("/api/expenses").send({
        amountMinor: 100,
        currency: "ILS",
        date: "2026-08-10",
        categoryId: foodId,
      });
      await request(app).post("/api/expenses").send({
        amountMinor: 200,
        currency: "ILS",
        date: "2026-08-10",
        categoryId: transport.id,
      });
      await request(app).post("/api/expenses").send({
        amountMinor: 300,
        currency: "ILS",
        date: "2026-07-10",
        categoryId: transport.id,
      });

      const response = await request(app).get("/api/expenses").query({
        categoryId: transport.id,
        from: "2026-08-01",
        to: "2026-08-31",
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toMatchObject({
        categoryId: transport.id,
        date: "2026-08-10",
      });
    });

    it("returns empty list when filters match nothing", async () => {
      await request(app).post("/api/expenses").send({
        amountMinor: 100,
        currency: "ILS",
        date: "2026-08-01",
        categoryId: foodId,
      });

      const response = await request(app)
        .get("/api/expenses")
        .query({ from: "2020-01-01", to: "2020-12-31" });

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it("rejects invalid from date", async () => {
      const response = await request(app)
        .get("/api/expenses")
        .query({ from: "not-a-date" });
      expect(response.status).toBe(400);
    });

    it("rejects from after to", async () => {
      const response = await request(app)
        .get("/api/expenses")
        .query({ from: "2026-08-31", to: "2026-08-01" });
      expect(response.status).toBe(400);
    });
  });

  describe("POST /api/expenses", () => {
    it("creates an expense with all fields", async () => {
      const response = await request(app).post("/api/expenses").send({
        amountMinor: 4990,
        currency: "ILS",
        date: "2026-08-03",
        note: "Lunch",
        categoryId: foodId,
      });

      expect(response.status).toBe(201);
      const body = response.body as ExpenseBody;
      expect(body).toMatchObject({
        amountMinor: 4990,
        currency: "ILS",
        date: "2026-08-03",
        note: "Lunch",
        categoryId: foodId,
        categoryName: "Food",
      });
      expect(typeof body.id).toBe("string");
    });

    it("creates an expense without a note", async () => {
      const response = await request(app).post("/api/expenses").send({
        amountMinor: 150,
        currency: "EUR",
        date: "2026-08-03",
        categoryId: foodId,
      });

      expect(response.status).toBe(201);
      expect(response.body.note).toBeNull();
      expect(response.body.currency).toBe("EUR");
    });

    it("rejects missing amountMinor", async () => {
      const response = await request(app).post("/api/expenses").send({
        currency: "ILS",
        date: "2026-08-03",
        categoryId: foodId,
      });
      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/amountMinor/i);
    });

    it("rejects non-positive amountMinor", async () => {
      const response = await request(app).post("/api/expenses").send({
        amountMinor: 0,
        currency: "ILS",
        date: "2026-08-03",
        categoryId: foodId,
      });
      expect(response.status).toBe(400);
    });

    it("rejects non-integer amountMinor", async () => {
      const response = await request(app).post("/api/expenses").send({
        amountMinor: 10.5,
        currency: "ILS",
        date: "2026-08-03",
        categoryId: foodId,
      });
      expect(response.status).toBe(400);
    });

    it("rejects invalid currency", async () => {
      const response = await request(app).post("/api/expenses").send({
        amountMinor: 100,
        currency: "GBP",
        date: "2026-08-03",
        categoryId: foodId,
      });
      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/currency/i);
    });

    it("rejects missing date", async () => {
      const response = await request(app).post("/api/expenses").send({
        amountMinor: 100,
        currency: "ILS",
        categoryId: foodId,
      });
      expect(response.status).toBe(400);
    });

    it("rejects missing categoryId", async () => {
      const response = await request(app).post("/api/expenses").send({
        amountMinor: 100,
        currency: "ILS",
        date: "2026-08-03",
      });
      expect(response.status).toBe(400);
    });

    it("rejects unknown categoryId", async () => {
      const response = await request(app).post("/api/expenses").send({
        amountMinor: 100,
        currency: "ILS",
        date: "2026-08-03",
        categoryId: "does-not-exist",
      });
      expect(response.status).toBe(404);
      expect(response.body.error).toMatch(/category/i);
    });
  });
});
