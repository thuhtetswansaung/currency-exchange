import { validate } from "../middlewares/validation";
import { createTransaction, getAllTransactions, getTransactionById, updateStatus } from "../controllers/transaction.controller";
import { Router } from "express";
import { createTransactionSchema, updateStatusSchema } from "../validation/transaction";
import { protect } from "../middlewares/authentication";
import { both } from "../middlewares/authorization";
import { limiter } from "../middlewares/rate-limiter";

const route = Router()

route.post('/', limiter, validate(createTransactionSchema),createTransaction)
route.put('/:transactionId/status',protect,both,validate(updateStatusSchema),updateStatus)
route.get('/:transactionId',protect, both, getTransactionById)
route.get('/',protect, both, getAllTransactions)

export default route