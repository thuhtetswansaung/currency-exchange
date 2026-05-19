import { Request, Response } from "express";
import CurrencyService from "../services/currency.service";
import { asyncHandler } from "../utils/async-handler";
import { buildQuery } from "../utils/pagination";

const currencyService = new CurrencyService();

export const createCurrency = asyncHandler(async (req: Request, res: Response) => {
    const currency = await currencyService.createCurrency(req.body);

    res.status(201).json({
        success: true,
        message: "Currency created successfully",
        data: currency,
    });
});

export const updateCurrency = asyncHandler(async (req: Request, res: Response) => {

    const { currencyId } = req.params as {currencyId: string};

    const currency = await currencyService.updateCurrency(currencyId, req.body);

    res.json({
        success: true,
        message: "Currency updated successfully",
        data: currency,
    });
});

export const getAllCurrencies = asyncHandler(async (req: Request, res: Response) => {
    const query = buildQuery(req);

    const result = await currencyService.getAllCurrencies(query);

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
});

// export const getCurrencyById = asyncHandler(async (req: Request, res: Response) => {

//     const { currencyId } = req.params as {currencyId: string};

//     const currency = await currencyService.getCurrencyById(currencyId);

//     res.json({
//         success: true,
//         data: currency,
//     });
// });

export const softDeleteCurrency = asyncHandler(async (req: Request, res: Response) => {
    
    const { currencyId } = req.params as {currencyId: string};

    await currencyService.softDeleteCurrency(currencyId);

    res.json({
        success: true,
        message: "Currency deactivated successfully",
    });
});

export const restoreCurrency = asyncHandler(async (req: Request, res: Response) => {

    const { currencyId } = req.params as {currencyId: string};

    await currencyService.restoreCurrency(currencyId);

    res.json({
        success: true,
        message: "Currency restored successfully",
    });
});

export const deleteCurrency = asyncHandler(async (req: Request, res: Response) => {
  
    const { currencyId } = req.params as {currencyId: string};
    
    await currencyService.deleteCurrency(currencyId);

    res.json({
        success: true,
        message: "Currency deleted permanently",
    });
});