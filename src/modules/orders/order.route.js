import { Router } from "express";
import { authenticate } from "../../shared/middleware/auth.middleware.js";
import { authorization } from "../../shared/middleware/authz.middleware.js";
import { purchase } from './order.controller.js';

const router = Router();
router.use(authenticate);
router.use(authorization(['buyer', 'seller', 'admin']));

router.post('/purchase', purchase);

export default router;