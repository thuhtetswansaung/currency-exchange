import { protect } from "../middlewares/authentication";
import { createCurrency, deleteCurrency, getAllCurrencies, restoreCurrency, softDeleteCurrency, updateCurrency } from "../controllers/currency.controller";
import { Router } from "express";
import { superAdmin } from "../middlewares/authorization";
import { validate } from "../middlewares/validation";
import { createCurrencySchema } from "../validation/currency";


const router = Router();

router.post("/", protect, superAdmin, validate(createCurrencySchema), createCurrency);
router.get("/", getAllCurrencies);
// router.get("/:currencyId", getCurrencyById);
router.put("/:currencyId", protect, superAdmin, updateCurrency);
router.patch("/:currencyId/archive", protect, superAdmin, softDeleteCurrency);
router.patch("/:currencyId/restore", protect, superAdmin, restoreCurrency);
router.delete("/:currencyId", protect, superAdmin, deleteCurrency);

export default router;