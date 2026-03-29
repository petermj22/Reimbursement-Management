// =============================================================
// SERVER ENTRY POINT - Express + Socket.IO + Rate Limiting + Cron
// =============================================================
import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

import logger from './config/logger.js';
import { sanitize } from './middleware/validate.js';
import { initSocketService } from './services/socketService.js';
import { initScheduledJobs } from './services/scheduler.js';

import authRoutes from './routes/auth.js';
import expenseRoutes from './routes/expenses.js';
import userRoutes from './routes/users.js';
import notificationRoutes from './routes/notifications.js';
import analyticsRoutes from './routes/analytics.js';
import categoryRoutes from './routes/categories.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// ---- Socket.IO ----
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Socket.IO auth + room joining
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Authentication required'));
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    (socket as any).userId = payload.userId;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  const userId = (socket as any).userId;
  socket.join(`user:${userId}`);
  logger.info(`🔌 Socket connected: ${userId}`);

  socket.on('disconnect', () => {
    logger.info(`🔌 Socket disconnected: ${userId}`);
  });
});

// Initialize socket service for emitting from routes
initSocketService(io);

// ---- Global Rate Limiters ----
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // Strict for auth
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts, please try again later' },
});

// ---- Middleware ----
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('combined', { stream: { write: (msg: string) => logger.http(msg.trim()) } }));
app.use(sanitize); // XSS input sanitization
app.use(generalLimiter); // Global rate limit

// ---- Health Check ----
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      database: 'connected',
      websocket: `${io.engine.clientsCount} clients`,
      scheduler: 'running',
    },
  });
});

// ---- Routes ----
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/categories', categoryRoutes);

// ---- Custom Error Handler ----
class AppError extends Error {
  constructor(public statusCode: number, message: string, public isOperational = true) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

app.use((err: Error | AppError, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message = err instanceof AppError ? err.message : 'Internal server error';
  logger.error('Unhandled error', { error: err.message, stack: err.stack, statusCode });
  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ---- Start Server ----
const PORT = parseInt(process.env.PORT || '3001');
httpServer.listen(PORT, () => {
  logger.info(`🚀 ReimburseFlow API: http://localhost:${PORT}`);
  logger.info(`🔌 WebSocket: ws://localhost:${PORT}`);
  logger.info(`🛡️ Rate limiting: 200 req/15min (general), 20 req/15min (auth)`);

  // Initialize scheduled jobs
  initScheduledJobs();
});

export { AppError };
