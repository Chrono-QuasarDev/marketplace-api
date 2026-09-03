import { Router } from "express";

import authRoutes from './auth/auth.route.js';
import adminRoutes from './admin/admin.route.js';
import userRoutes from './users/user.route.js';
import productRoutes from './products/product.route.js';
import orderRoutes from './orders/order.route.js';
import reviewRoutes from './reviews/review.router.js';

const v1Router = Router();

v1Router.use('/auth', authRoutes);
v1Router.use('/admin', adminRoutes);
v1Router.use('/users', userRoutes);
v1Router.use('/products', productRoutes);
v1Router.use('/orders', orderRoutes);
v1Router.use('/reviews', reviewRoutes);

export default v1Router;