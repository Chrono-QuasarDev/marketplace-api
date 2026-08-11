import { Router } from "express";
import { profile, updateProfile } from './user.controller.js';
import { authenticate } from "../../shared/middleware/auth.middleware.js";

const router = Router();

router.get('/profile', authenticate, profile);
router.put('/profile', authenticate, updateProfile);

export default router;