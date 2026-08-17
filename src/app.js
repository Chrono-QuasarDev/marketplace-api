import express from "express";
import './database/associations.js';
import authRoutes from './modules/auth/auth.route.js';
import userRoutes from './modules/users/user.route.js';
import productRoutes from './modules/products/product.route.js';
import orderRoutes from './modules/orders/order.route.js';
import reviewRoutes from './modules/reviews/review.router.js';
import { errorHandler } from './shared/middleware/error.middleware.js';

const app = express();
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);

app.use(errorHandler);

export default app;