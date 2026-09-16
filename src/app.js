import express from "express";
import helmet from "helmet";
import cors from "cors";
import './database/associations.js';
import v1Routes from './modules/v1.routes.js';
import { errorHandler } from './shared/middleware/error.middleware.js';

const app = express();
app.use(helmet());
app.use(express.json());
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));

app.use('/api/v1', v1Routes);

app.use(errorHandler);

export default app;
