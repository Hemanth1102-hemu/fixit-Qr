import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { errorHandler } from './middleware/errorHandler.js';

import healthRouter from './routes/health.js';
import authRouter from './routes/auth.js';
import equipmentRouter from './routes/equipment.js';
import complaintsRouter from './routes/complaints.js';
import buildingsRouter from './routes/buildings.js';
import adminRouter from './routes/admin.js';

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// REST API v1 Routes
app.use('/api/v1/health', healthRouter);
app.use('/api/v1/me', authRouter);
app.use('/api/v1/equipment', equipmentRouter);
app.use('/api/v1/complaints', complaintsRouter);
app.use('/api/v1/buildings', buildingsRouter);
app.use('/api/v1/admin', adminRouter);

// 404 Catch-all
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint Not Found',
    message: `API route ${req.method} ${req.originalUrl} does not exist.`
  });
});

// Centralized error handler
app.use(errorHandler);

export default app;
