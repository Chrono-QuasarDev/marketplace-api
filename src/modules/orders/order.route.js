import { Router } from "express";
import { authenticate } from "../../shared/middleware/auth.middleware.js";
import { authorization } from "../../shared/middleware/authz.middleware.js";
import { purchase, getOrders, getOrderById } from './order.controller.js';

const router = Router();
router.use(authenticate);
router.use(authorization(['buyer', 'seller', 'admin']));

router.post('/purchase', purchase);
router.get('/', getOrders);
router.get('/:id', getOrderById);

export default router;