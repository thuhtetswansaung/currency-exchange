import { Request, Response } from "express";
import { asyncHandler } from "../utils/async-handler";
import RateHistoryService from "../services/rate-history.service";
import { buildQuery } from "../utils/pagination";

const rateHistoryService = new RateHistoryService()

export const getRateHistoryByExchange = asyncHandler(async (req: Request, res: Response) => {
    const { exchangeRateId } = req.params as { exchangeRateId: string };

    const history = await rateHistoryService.getRateHistoryByExchangeRate(exchangeRateId);

    res.json({
      success: true,
      data: history,
    });
  }
);

export const getAllRateHistory = asyncHandler(async(req: Request, res: Response)=>{
  const query = buildQuery(req)

  const result = await rateHistoryService.getAllExchangeRateHistories(query)

  res.json({
    success: true,
    data: result.data,
    pagination: {
      page: result.page,
      total: result.total,
      totalPages: result.totalPages,
      limit: query.limit,
    },
  });
})