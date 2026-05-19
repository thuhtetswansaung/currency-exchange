import { Request, Response } from "express";
import ExchangeRateService from "../services/exchange-rate.service";
import { buildQuery } from "../utils/pagination";
import { AuthRequest } from "../middlewares/authentication";

const exchangeRateService = new ExchangeRateService();

export const createExchangeRate = async (req: AuthRequest, res: Response) => {
    const userId = req.user?._id as string
    console.log(userId);
    
    // const rate = await service.create({ // ...req.body, // changedBy: userId, // });

    const rate = await exchangeRateService.create({
        ...req.body,
        changedBy: userId
    });

    res.status(201).json({
        success: true,
        data: rate,
    });
};

export const updateExchangeRate = async (req: AuthRequest, res: Response) => {
    const userId = req.user?._id as string
    const { exchangeRateId } = req.params as { exchangeRateId: string };

    const updated = await exchangeRateService.update(exchangeRateId, req.body, userId);

    res.status(200).json({
        success: true,
        data: updated,
    });
};

export const getExchangeRateById = async (req: Request, res: Response) => {
    const { exchangeRateId } = req.params as { exchangeRateId: string };

    const rate = await exchangeRateService.getById(exchangeRateId);

    res.status(200).json({
        success: true,
        data: rate,
    });
};

export const getAllExchangeRate = async (req: Request, res: Response) => {
    const query = buildQuery(req);

    const result = await exchangeRateService.getAll(query);

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
};
