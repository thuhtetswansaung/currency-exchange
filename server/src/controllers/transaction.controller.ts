import { Request, Response } from "express";
import { asyncHandler } from "../utils/async-handler";
import TransactionService from "../services/transaction.service";
import { AuthRequest } from "../middlewares/authentication";
import { buildQuery } from "../utils/pagination";

const transactionService = new TransactionService()

export const createTransaction = asyncHandler(async (req: Request, res: Response) => {

  const ip =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
    req.socket?.remoteAddress ||
    req.ip;

  const transaction = await transactionService.createTransaction({
    ...req.body,
    userIP: ip, // inject here
  });

  res.status(201).json({
    success: true,
    message: "Transaction created successfully",
    data: transaction,
  });
});

export const updateStatus = asyncHandler(async(req: AuthRequest, res: Response)=>{
    const {transactionId} = req.params as {transactionId: string}
    const adminId = req.user?._id as string

    const {status} = req.body
    
    const result = await transactionService.updateStatus(transactionId, status, adminId)

    res.status(201).json({
        success: true,
        message: "Transaction status chnaged successfully",
        data: result,
    });
    
})

export const getTransactionById = asyncHandler(async(req: Request, res: Response)=>{
    const {transactionId} = req.params as {transactionId: string}

    const transaction = await transactionService.getTransactionById(transactionId)

    res.status(200).json({
        success: true,
        data: transaction,
    });
})

export const getAllTransactions = asyncHandler(async(req:Request, res: Response)=>{
    const query = buildQuery(req)

    const result = await transactionService.getTransactions(query);

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