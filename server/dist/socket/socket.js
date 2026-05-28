"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitToUserRoom = exports.emitToJobRoom = exports.getIO = exports.initializeSocket = void 0;
const socket_io_1 = require("socket.io");
const env_1 = require("../config/env");
const logger_1 = require("../utils/logger");
let io = null;
/**
 * Initialize the Socket.IO server hooked to the HTTP server
 */
const initializeSocket = (httpServer) => {
    // CORS_ORIGIN may be a comma-separated string — split into array for Socket.IO
    const corsOrigins = env_1.env.CORS_ORIGIN.split(',').map((o) => o.trim());
    io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: corsOrigins,
            methods: ['GET', 'POST'],
            credentials: true,
        },
        pingTimeout: 60000,
    });
    logger_1.logger.info('📡 Socket.IO server initialized successfully.');
    // Set up connection handlers
    io.on('connection', (socket) => {
        logger_1.logger.info(`🔌 Client connected to WebSockets [Socket ID: ${socket.id}]`);
        // Handle joining job-specific rooms for targeted progress updates
        socket.on('join:job', (jobId) => {
            if (jobId) {
                socket.join(jobId);
                logger_1.logger.info(`📢 Socket ${socket.id} joined room for Job ID: ${jobId}`);
            }
        });
        // Handle joining user-specific rooms for general user alerts
        socket.on('join:user', (userId) => {
            if (userId) {
                socket.join(userId);
                logger_1.logger.info(`📢 Socket ${socket.id} joined room for User ID: ${userId}`);
            }
        });
        // Handle disconnections
        socket.on('disconnect', (reason) => {
            logger_1.logger.info(`🔌 Client disconnected from WebSockets [Socket ID: ${socket.id}] - Reason: ${reason}`);
        });
    });
    return io;
};
exports.initializeSocket = initializeSocket;
/**
 * Retrieve the active Socket.IO Server singleton
 */
const getIO = () => {
    if (!io) {
        throw new Error('💥 Socket.IO has not been initialized yet!');
    }
    return io;
};
exports.getIO = getIO;
/**
 * Emit a targeted real-time event to clients listening in a specific Job ID room
 */
const emitToJobRoom = (jobId, event, data) => {
    try {
        const ioInstance = (0, exports.getIO)();
        ioInstance.to(jobId).emit(event, data);
        logger_1.logger.info(`📡 Realtime Emit [Room: ${jobId}] Event "${event}"`, data);
    }
    catch (error) {
        logger_1.logger.warn(`⚠️ Failed to emit real-time event via Socket.IO: ${error.message}`);
    }
};
exports.emitToJobRoom = emitToJobRoom;
/**
 * Emit a targeted real-time event to clients listening in a specific User ID room
 */
const emitToUserRoom = (userId, event, data) => {
    try {
        const ioInstance = (0, exports.getIO)();
        ioInstance.to(userId).emit(event, data);
        logger_1.logger.info(`📡 Realtime Emit [Room: ${userId}] Event "${event}"`, data);
    }
    catch (error) {
        logger_1.logger.warn(`⚠️ Failed to emit real-time event via Socket.IO: ${error.message}`);
    }
};
exports.emitToUserRoom = emitToUserRoom;
