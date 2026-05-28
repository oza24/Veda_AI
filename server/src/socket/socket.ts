import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { env } from '../config/env';
import { logger } from '../utils/logger';

let io: Server | null = null;

/**
 * Initialize the Socket.IO server hooked to the HTTP server
 */
export const initializeSocket = (httpServer: HttpServer): Server => {
  // CORS_ORIGIN may be a comma-separated string — split into array for Socket.IO
  const corsOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim());

  io = new Server(httpServer, {
    cors: {
      origin: corsOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
  });

  logger.info('📡 Socket.IO server initialized successfully.');

  // Set up connection handlers
  io.on('connection', (socket: Socket) => {
    logger.info(`🔌 Client connected to WebSockets [Socket ID: ${socket.id}]`);

    // Handle joining job-specific rooms for targeted progress updates
    socket.on('join:job', (jobId: string) => {
      if (jobId) {
        socket.join(jobId);
        logger.info(`📢 Socket ${socket.id} joined room for Job ID: ${jobId}`);
      }
    });

    // Handle joining user-specific rooms for general user alerts
    socket.on('join:user', (userId: string) => {
      if (userId) {
        socket.join(userId);
        logger.info(`📢 Socket ${socket.id} joined room for User ID: ${userId}`);
      }
    });

    // Handle disconnections
    socket.on('disconnect', (reason: string) => {
      logger.info(`🔌 Client disconnected from WebSockets [Socket ID: ${socket.id}] - Reason: ${reason}`);
    });
  });

  return io;
};

/**
 * Retrieve the active Socket.IO Server singleton
 */
export const getIO = (): Server => {
  if (!io) {
    throw new Error('💥 Socket.IO has not been initialized yet!');
  }
  return io;
};

/**
 * Emit a targeted real-time event to clients listening in a specific Job ID room
 */
export const emitToJobRoom = (jobId: string, event: string, data: any): void => {
  try {
    const ioInstance = getIO();
    ioInstance.to(jobId).emit(event, data);
    logger.info(`📡 Realtime Emit [Room: ${jobId}] Event "${event}"`, data);
  } catch (error: any) {
    logger.warn(`⚠️ Failed to emit real-time event via Socket.IO: ${error.message}`);
  }
};

/**
 * Emit a targeted real-time event to clients listening in a specific User ID room
 */
export const emitToUserRoom = (userId: string, event: string, data: any): void => {
  try {
    const ioInstance = getIO();
    ioInstance.to(userId).emit(event, data);
    logger.info(`📡 Realtime Emit [Room: ${userId}] Event "${event}"`, data);
  } catch (error: any) {
    logger.warn(`⚠️ Failed to emit real-time event via Socket.IO: ${error.message}`);
  }
};
