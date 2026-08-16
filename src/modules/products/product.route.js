import { Router } from "express";
import { authenticate } from '../../shared/middleware/auth.middleware.js';
import { authorization } from '../../shared/middleware/authz.middleware.js';
import { createProduct, getProducts, getProductById, updateProductById, deleteProductById } from './product.controller.js';

const router = Router();
router.use(authenticate);

router.post('/', authorization(['seller']), createProduct);
router.get('/', authorization(['buyer', 'seller', 'admin']), getProducts);
router.get('/:id', getProductById);
router.put('/:id', authorization(['seller']), updateProductById);
router.delete('/:id', authorization(['seller']), deleteProductById);

export default router;