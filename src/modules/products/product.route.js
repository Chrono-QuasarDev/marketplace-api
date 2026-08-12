import { Router } from "express";
import { authenticate } from '../../shared/middleware/auth.middleware.js';
import { authorization } from '../../shared/middleware/authz.middleware.js';
import { createProduct, getProducts, getProductById } from './product.controller.js';

const router = Router();
router.use(authenticate);

router.post('/products', authorization(['seller']), createProduct);
router.get('/products', authorization(['buyer', 'seller', 'admin']), getProducts);
router.get('/products/:id', authorization(['buyer', 'seller', 'admin']), getProductById);

export default router;