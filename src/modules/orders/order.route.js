import { Router } from "express";
import { authenticate } from "../../shared/middleware/auth.middleware.js";
import { authorization } from "../../shared/middleware/authz.middleware.js";
import { validate } from "../../shared/middleware/validate.middleware.js";
import { purchaseProductSchema, updateOrderStatusSchema } from "../../shared/validators/zod.validator.js";
import { purchase, getOrders, getOrderById, patchOrderStatus } from './order.controller.js';

const router = Router();
router.use(authenticate);
router.use(authorization(['buyer', 'seller', 'admin']));

router.post('/purchase', validate(purchaseProductSchema), purchase);
router.get('/', getOrders);
router.get('/:id', getOrderById);
router.patch('/:id', validate(updateOrderStatusSchema), authorization(['seller', 'admin']), patchOrderStatus);

export default router;