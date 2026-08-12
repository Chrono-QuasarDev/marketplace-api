import { Router } from "express";
import { authenticate } from '../../shared/middleware/auth.middleware.js';
import { authorization } from '../../shared/middleware/authz.middleware.js';
import { createProduct, getProducts } from './product.controller.js';

const router = Router();
router.use(authenticate);

router.post('/products', authorization(['seller']), createProduct);
router.get('/products', authorization(['buyer', 'seller', 'admin']), getProducts);

export default router;