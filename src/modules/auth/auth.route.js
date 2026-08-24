import { Router } from "express";
import { signUpSchema, loginSchema } from "../../shared/validators/zod.validator.js";
import { validate } from "../../shared/middleware/validate.middleware.js";
import { register, login } from './auth.controller.js';

const router = Router();

router.post('/signup', validate(signUpSchema), register);
router.post('/login', validate(loginSchema), login);

export default router;