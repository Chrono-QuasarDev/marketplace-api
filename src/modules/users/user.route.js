import { Router } from "express";
import { authenticate } from "../../shared/middleware/auth.middleware.js";
import { validate } from "../../shared/middleware/validate.middleware.js";
import { updateProfileSchema } from "../../shared/validators/zod.validator.js";
import { profile, updateProfile } from './user.controller.js';

const router = Router();

router.get('/profile', authenticate, profile);
router.put('/profile', authenticate, validate(updateProfileSchema), updateProfile);

export default router;