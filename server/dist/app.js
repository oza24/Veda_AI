"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const env_1 = require("./config/env");
const requestLogger_1 = require("./middleware/requestLogger");
const errorHandler_1 = require("./middleware/errorHandler");
const appError_1 = require("./utils/appError");
const db_1 = require("./config/db");
const redis_1 = require("./config/redis");
const test_routes_1 = __importDefault(require("./routes/test.routes"));
const assignment_routes_1 = __importDefault(require("./routes/assignment.routes"));
const upload_routes_1 = __importDefault(require("./routes/upload.routes"));
const job_routes_1 = __importDefault(require("./routes/job.routes"));
const app = (0, express_1.default)();
// Security Middlewares
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin)
            return callback(null, true);
        const allowed = env_1.env.CORS_ORIGIN.split(',').map(o => o.trim());
        if (allowed.includes(origin) || allowed.includes('*')) {
            callback(null, true);
        }
        else {
            callback(new Error(`Not allowed by CORS: Origin ${origin} not matched.`));
        }
    },
    credentials: true,
}));
// Body Parsers
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Logging HTTP Requests
app.use(requestLogger_1.requestLogger);
// Health Check Endpoint
app.get('/health', (_req, res) => {
    const dbHealth = (0, db_1.checkDbHealth)();
    const redisHealth = (0, redis_1.checkRedisHealth)();
    const serverHealthy = true;
    // Overall success depends on server, MongoDB, and Redis all being healthy
    const isHealthy = serverHealthy && dbHealth.status === 'healthy' && redisHealth.status === 'healthy';
    res.status(isHealthy ? 200 : 503).json({
        status: isHealthy ? 'success' : 'error',
        timestamp: new Date().toISOString(),
        env: env_1.env.NODE_ENV,
        uptime: process.uptime(),
        services: {
            server: 'healthy',
            mongodb: dbHealth,
            redis: redisHealth,
        },
    });
});
// Stand-in base API route
app.get('/api/v1', (_req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Welcome to Veda AI API v1. Backend infrastructure initialized.',
    });
});
// Temporary Test Endpoints
app.use('/api/test', test_routes_1.default);
// Main Core Resource Endpoints
app.use('/api/assignments', assignment_routes_1.default);
app.use('/api/uploads', upload_routes_1.default);
app.use('/api/jobs', job_routes_1.default);
// Fallback for unhandled routes - Throw a 404 AppError
app.all('*', (req, _res, next) => {
    next(new appError_1.AppError(`Cannot find ${req.originalUrl} on this server!`, 404));
});
// Centralized Global Error Handler Middleware
app.use(errorHandler_1.errorHandler);
exports.default = app;
