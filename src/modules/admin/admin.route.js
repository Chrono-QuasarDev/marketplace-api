import { Router } from "express";
import { authorization } from "../../shared/middleware/authz.middleware.js";
import { users, userInfo, deleteUser } from "./admin.controller.js";
import { authenticate } from "../../shared/middleware/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.get('/user', authorization(['admin']), users);
router.get('/user/:id', authorization(['admin']), userInfo);
router.delete('/user/:id', authorization(['admin']), deleteUser);

export default router;