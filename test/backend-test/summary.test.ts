import { afterEach, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import type { PrismaClient } from "@prisma/client";
import { createApp } from "../../backend/src/app.js";
import { createTestDb, type TestDb } from "./helpers/testDb.js";

describe("Summary API", () => {
  let db: TestDb;
  let prisma: PrismaClient;
  let app: ReturnType<typeof createApp>;
  let foodId: string;
  let transportId: string;

  beforeEach(async () => {
    db = await createTestDb();
    prisma = db.prisma;
    app = createApp({ prisma });
    foodId = (
      await prisma.category.findUniqueOrThrow({ where: { name: "Food" } })
    ).id;
    transportId = (
      await prisma.category.findUniqueOrThrow({
        where: { name: "Transport" },
      })
    ).id;
  });

  afterEach(async () => {
    await db.cleanup();
  });

  it("returns empty array when there are no expenses", async () => {
    const response = await request(app).get("/api/summary/by-category");
    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it("groups totals by category and currency without cross-summing", async () => {
    await request(app).post("/api/expenses").send({
      amountMinor: 1000,
      currency: "ILS",
      date: "2026-08-01",
      categoryId: foodId,
    });
    await request(app).post("/api/expenses").send({
      amountMinor: 500,
      currency: "ILS",
      date: "2026-08-02",
      categoryId: foodId,
    });
    await request(app).post("/api/expenses").send({
      amountMinor: 2000,
      currency: "USD",
      date: "2026-08-03",
      categoryId: foodId,
    });
    await request(app).post("/api/expenses").send({
      amountMinor: 300,
      currency: "EUR",
      date: "2026-08-04",
      categoryId: transportId,
    });

    const response = await request(app).get("/api/summary/by-category");
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);

    const food = response.body.find(
      (row: { categoryName: string }) => row.categoryName === "Food",
    );
    expect(food.totals).toEqual([
      { currency: "ILS", amountMinor: 1500 },
      { currency: "USD", amountMinor: 2000 },
    ]);

    const transport = response.body.find(
      (row: { categoryName: string }) => row.categoryName === "Transport",
    );
    expect(transport.totals).toEqual([{ currency: "EUR", amountMinor: 300 }]);
  });

  it("moves totals to Other after category delete with reassignment", async () => {
    await request(app).post("/api/expenses").send({
      amountMinor: 1000,
      currency: "ILS",
      date: "2026-08-01",
      categoryId: foodId,
    });
    await request(app).delete(`/api/categories/${foodId}`);

    const response = await request(app).get("/api/summary/by-category");
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].categoryName).toBe("Other");
    expect(response.body[0].totals).toEqual([
      { currency: "ILS", amountMinor: 1000 },
    ]);
  });
});
