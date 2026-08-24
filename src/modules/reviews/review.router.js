import { Router } from "express";
import { authenticate } from "../../shared/middleware/auth.middleware.js";
import { authorization } from "../../shared/middleware/authz.middleware.js";
import { validate } from "../../shared/middleware/validate.middleware.js";
import { addReviewSchema } from "../../shared/validators/zod.validator.js";
import { addReview, editReview, removeReview, getReview } from './review.controller.js';

const router = Router();
router.use(authenticate);

router.post('/', validate(addReviewSchema), addReview);
router.put('/:id', editReview);
router.delete('/:id', authorization(['admin','buyer']), removeReview);
router.get('/:id', getReview);

export default router;