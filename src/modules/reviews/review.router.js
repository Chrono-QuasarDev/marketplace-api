import { Router } from "express";
import { addReview, editReview, removeReview, getReview } from './review.controller.js';
import { authenticate } from "../../shared/middleware/auth.middleware.js";
import { authorization } from "../../shared/middleware/authz.middleware.js";

const router = Router();
router.use(authenticate);

router.post('/', addReview);
router.put('/:id', editReview);
router.delete('/:id', authorization(['admin','buyer']), removeReview);
router.get('/:id', getReview);

export default router;