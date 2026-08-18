import { Router } from "express";
import { authenticate } from '../../shared/middleware/auth.middleware.js';
import { authorization } from '../../shared/middleware/authz.middleware.js';
import { 
  createProduct, 
  getProducts, 
  getProductById, 
  updateProductById, 
  deleteProductById 
} from './product.controller.js';

const router = Router();

// Public 
router.get('/', getProducts);
router.get('/:id', getProductById);

// Protected
router.post('/', authorization(['seller']), createProduct);
router.put('/:id', authorization(['seller']), updateProductById);
router.delete('/:id', authorization(['seller']), deleteProductById);

export default router;