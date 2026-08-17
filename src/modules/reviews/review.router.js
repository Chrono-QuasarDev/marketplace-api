import { Router } from "express";
import { addReview } from './review.controller.js';
import { authenticate } from "../../shared/middleware/auth.middleware.js";
import { authorization } from "../../shared/middleware/authz.middleware.js";

const router = Router();
router.use(authenticate);

router.post('/', addReview);

export default router;