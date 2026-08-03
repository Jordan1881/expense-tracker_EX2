import type { Request, Response } from "express";
import type { SummaryService } from "../services/summary.js";

export function createSummaryController(service: SummaryService) {
  return {
    async byCategory(_req: Request, res: Response): Promise<void> {
      try {
        const summary = await service.byCategory();
        res.status(200).json(summary);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
      }
    },
  };
}
