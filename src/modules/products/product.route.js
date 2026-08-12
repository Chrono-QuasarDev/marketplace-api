import { Router } from "express";
import { authenticate } from '../../shared/middleware/auth.middleware.js';
import { authorization } from '../../shared/middleware/authz.middleware.js';
import { createProduct, getProducts, getProductById, updateProductById, deleteProductById } from './product.controller.js';

const router = Router();
router.use(authenticate);

router.post('/products', authorization(['seller']), createProduct);
router.get('/products', authorization(['buyer', 'seller', 'admin']), getProducts);
router.get('/products/:id', getProductById);
router.put('/products/:id', authorization(['seller']), updateProductById);
router.delete('/products/:id', authorization(['seller']), deleteProductById);

export default router;