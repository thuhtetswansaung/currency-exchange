import { getUsers, permanentDeleteUser, restoreUser, softDeleteUser } from "../controllers/user.controller";
import { Router } from "express";
import { protect } from "../middlewares/authentication";
import { both, superAdmin } from "../middlewares/authorization";

const router = Router();

router.patch("/:userId/archive", protect, superAdmin, softDeleteUser);
router.patch("/:userId/restore", protect, superAdmin, restoreUser);
router.delete("/:userId", protect, superAdmin, permanentDeleteUser);

// router.get("/me", protect, both, getCurrentUser);
router.get("/", protect, both, getUsers);


export default router;