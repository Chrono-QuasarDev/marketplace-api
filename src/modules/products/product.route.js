import { Router } from "express";
import { authenticate } from '../../shared/middleware/auth.middleware.js';
import { authorization } from '../../shared/middleware/authz.middleware.js';
import { createProduct } from './product.controller.js';

const router = Router();
router.use(authenticate);
router.use(authorization(['seller']));

router.post('/', createProduct);

export default router;