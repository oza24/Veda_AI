import { Server } from 'http';
import app from './app';
import { env } from './config/env';
import { logger } from './utils/logger';
import { connectDB, disconnectDB } from './config/db';
import { disconnectRedis } from './config/redis';
import { initializeWorker, closeWorker } from './workers/ai-generation.worker';
import { initializeSocket } from './socket/socket';

let server: Server;

// Setup safety nets for unexpected process crashes
process.on('uncaughtException', (err: Error) => {
  logger.error('💥 UNCAUGHT EXCEPTION! Shutting down gracefully...');
  logger.error(err.message, err);
  process.exit(1);
});

const startServer = async () => {
  // Connect to MongoDB
  await connectDB();

  // Initialize BullMQ Worker
  initializeWorker();

  // Start HTTP Server
  server = app.listen(env.PORT, () => {
    logger.info(`🚀 Server running in [${env.NODE_ENV}] mode on port ${env.PORT}`);
  });

  // Hook up WebSockets (Socket.IO)
  initializeSocket(server);
};

startServer();

const gracefulShutdown = async (signal: string) => {
  logger.info(`👋 ${signal} received. Shutting down server and database connection gracefully...`);
  
  const shutdownTimeout = setTimeout(() => {
    logger.error('💥 Forced shutdown due to timeout!');
    process.exit(1);
  }, 10000); // 10s force exit limit

  if (server) {
    server.close(async () => {
      logger.info('💥 HTTP server closed.');
      await closeWorker();
      await disconnectDB();
      await disconnectRedis();
      clearTimeout(shutdownTimeout);
      process.exit(0);
    });
  } else {
    await closeWorker();
    await disconnectDB();
    await disconnectRedis();
    clearTimeout(shutdownTimeout);
    process.exit(0);
  }
};

process.on('unhandledRejection', (err: any) => {
  logger.error('💥 UNHANDLED REJECTION! Shutting down server and process...');
  logger.error(err?.message || 'Unknown rejection', err);
  
  if (server) {
    server.close(async () => {
      await closeWorker();
      await disconnectDB();
      await disconnectRedis();
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

// Capture Termination Signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
