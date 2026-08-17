import { Router } from "express";
import { addReview, editReview } from './review.controller.js';
import { authenticate } from "../../shared/middleware/auth.middleware.js";
import { authorization } from "../../shared/middleware/authz.middleware.js";

const router = Router();
router.use(authenticate);

router.post('/', addReview);
router.put('/:id', editReview);

export default router;