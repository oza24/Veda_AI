"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const env_1 = require("./config/env");
const logger_1 = require("./utils/logger");
const db_1 = require("./config/db");
const redis_1 = require("./config/redis");
const ai_generation_worker_1 = require("./workers/ai-generation.worker");
const socket_1 = require("./socket/socket");
let server;
// Setup safety nets for unexpected process crashes
process.on('uncaughtException', (err) => {
    logger_1.logger.error('💥 UNCAUGHT EXCEPTION! Shutting down gracefully...');
    logger_1.logger.error(err.message, err);
    process.exit(1);
});
const startServer = async () => {
    // Connect to MongoDB
    await (0, db_1.connectDB)();
    // Initialize BullMQ Worker
    (0, ai_generation_worker_1.initializeWorker)();
    // Start HTTP Server
    server = app_1.default.listen(env_1.env.PORT, () => {
        logger_1.logger.info(`🚀 Server running in [${env_1.env.NODE_ENV}] mode on port ${env_1.env.PORT}`);
    });
    // Hook up WebSockets (Socket.IO)
    (0, socket_1.initializeSocket)(server);
};
startServer();
const gracefulShutdown = async (signal) => {
    logger_1.logger.info(`👋 ${signal} received. Shutting down server and database connection gracefully...`);
    const shutdownTimeout = setTimeout(() => {
        logger_1.logger.error('💥 Forced shutdown due to timeout!');
        process.exit(1);
    }, 10000); // 10s force exit limit
    if (server) {
        server.close(async () => {
            logger_1.logger.info('💥 HTTP server closed.');
            await (0, ai_generation_worker_1.closeWorker)();
            await (0, db_1.disconnectDB)();
            await (0, redis_1.disconnectRedis)();
            clearTimeout(shutdownTimeout);
            process.exit(0);
        });
    }
    else {
        await (0, ai_generation_worker_1.closeWorker)();
        await (0, db_1.disconnectDB)();
        await (0, redis_1.disconnectRedis)();
        clearTimeout(shutdownTimeout);
        process.exit(0);
    }
};
process.on('unhandledRejection', (err) => {
    logger_1.logger.error('💥 UNHANDLED REJECTION! Shutting down server and process...');
    logger_1.logger.error(err?.message || 'Unknown rejection', err);
    if (server) {
        server.close(async () => {
            await (0, ai_generation_worker_1.closeWorker)();
            await (0, db_1.disconnectDB)();
            await (0, redis_1.disconnectRedis)();
            process.exit(1);
        });
    }
    else {
        process.exit(1);
    }
});
// Capture Termination Signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
