import { Router } from "express";
import { authenticate } from '../../shared/middleware/auth.middleware.js';
import { authorization } from '../../shared/middleware/authz.middleware.js';
import { validate } from "../../shared/middleware/validate.middleware.js";
import { createProductSchema, updateProductSchema } from "../../shared/validators/zod.validator.js";
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
router.post('/', authenticate, validate(createProductSchema), createProduct);
router.put('/:id', authenticate, validate(updateProductSchema), authorization(['seller']), updateProductById);
router.delete('/:id', authenticate, authorization(['seller']), deleteProductById);

export default router;