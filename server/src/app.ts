import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler } from './middleware/errorHandler';
import { AppError } from './utils/appError';
import { checkDbHealth } from './config/db';
import { checkRedisHealth } from './config/redis';
import testRouter from './routes/test.routes';
import assignmentRouter from './routes/assignment.routes';
import uploadRouter from './routes/upload.routes';
import jobRouter from './routes/job.routes';

const app: Express = express();

// Security Middlewares
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const allowed = env.CORS_ORIGIN.split(',').map(o => o.trim());
      if (allowed.includes(origin) || allowed.includes('*')) {
        callback(null, true);
      } else {
        callback(new Error(`Not allowed by CORS: Origin ${origin} not matched.`));
      }
    },
    credentials: true,
  })
);

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging HTTP Requests
app.use(requestLogger);

// Health Check Endpoint
app.get('/health', (_req: Request, res: Response) => {
  const dbHealth = checkDbHealth();
  const redisHealth = checkRedisHealth();
  const serverHealthy = true;

  // Overall success depends on server, MongoDB, and Redis all being healthy
  const isHealthy = serverHealthy && dbHealth.status === 'healthy' && redisHealth.status === 'healthy';

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'success' : 'error',
    timestamp: new Date().toISOString(),
    env: env.NODE_ENV,
    uptime: process.uptime(),
    services: {
      server: 'healthy',
      mongodb: dbHealth,
      redis: redisHealth,
    },
  });
});

// Stand-in base API route
app.get('/api/v1', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'Welcome to Veda AI API v1. Backend infrastructure initialized.',
  });
});

// Temporary Test Endpoints
app.use('/api/test', testRouter);

// Main Core Resource Endpoints
app.use('/api/assignments', assignmentRouter);
app.use('/api/uploads', uploadRouter);
app.use('/api/jobs', jobRouter);


app.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Veda AI Backend is running successfully 🚀',
  });
});


// Fallback for unhandled routes - Throw a 404 AppError
app.all('*', (req: Request, _res: Response, next: NextFunction) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server!`, 404));
});

// Centralized Global Error Handler Middleware
app.use(errorHandler);

export default app;
