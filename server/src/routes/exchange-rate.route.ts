import { createExchangeRate, getAllExchangeRate, getExchangeRateById, updateExchangeRate } from "../controllers/exchange-rate.controller";
import { Router } from "express";
import { protect } from "../middlewares/authentication";
import { superAdmin } from "../middlewares/authorization";
import { validate } from "../middlewares/validation";
import { createExchangeRateSchema, updateExchangeRateSchema } from "../validation/exchange-rate";

const router = Router();

router.post("/", protect, superAdmin, validate(createExchangeRateSchema), createExchangeRate);
router.put("/:exchangeRateId", protect, superAdmin, validate(updateExchangeRateSchema), updateExchangeRate);
router.get("/:exchangeRateId", getExchangeRateById);
router.get("/", getAllExchangeRate);

export default router;