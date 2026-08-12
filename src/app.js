import express from "express";
import authRoutes from './modules/auth/auth.route.js';
import userRoutes from './modules/users/user.route.js';
import productRoutes from './modules/products/product.route.js';
import { errorHandler } from './shared/middleware/error.middleware.js';

const app = express();
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);

app.use(errorHandler);

export default app;