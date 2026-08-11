import { Router } from "express";
import { profile } from './user.controller.js';
import { authenticate } from "../../shared/middleware/auth.middleware.js";

const router = Router();

router.get('/profile', authenticate, profile);

export default router;