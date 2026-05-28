"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkDbHealth = exports.disconnectDB = exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("./env");
const logger_1 = require("../utils/logger");
// Setup connection lifecycle listeners
mongoose_1.default.connection.on('connecting', () => {
    logger_1.logger.info('🔌 Connecting to MongoDB...');
});
mongoose_1.default.connection.on('connected', () => {
    logger_1.logger.info('✅ MongoDB connection established successfully!');
});
mongoose_1.default.connection.on('error', (err) => {
    logger_1.logger.error(`❌ MongoDB connection error: ${err.message}`, err);
});
mongoose_1.default.connection.on('disconnected', () => {
    logger_1.logger.warn('🔌 MongoDB connection disconnected!');
});
/**
 * Connect to MongoDB using Mongoose
 */
const connectDB = async () => {
    try {
        const options = {
            autoIndex: env_1.env.NODE_ENV !== 'production', // Don't build indexes in production for performance
        };
        await mongoose_1.default.connect(env_1.env.MONGO_URI, options);
    }
    catch (error) {
        logger_1.logger.error(`💥 Failed to connect to MongoDB on startup: ${error.message}`, error);
        process.exit(1);
    }
};
exports.connectDB = connectDB;
/**
 * Gracefully close the MongoDB connection
 */
const disconnectDB = async () => {
    try {
        if (mongoose_1.default.connection.readyState !== 0) {
            await mongoose_1.default.disconnect();
            logger_1.logger.info('✅ Mongoose connection closed gracefully.');
        }
    }
    catch (error) {
        logger_1.logger.error(`💥 Error while closing Mongoose connection: ${error.message}`, error);
    }
};
exports.disconnectDB = disconnectDB;
/**
 * Check the health status of the MongoDB database connection
 */
const checkDbHealth = () => {
    const states = {
        0: 'unhealthy', // Disconnected
        1: 'healthy', // Connected
        2: 'connecting',
        3: 'disconnecting',
    };
    const stateNames = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting',
    };
    const readyState = mongoose_1.default.connection.readyState;
    return {
        status: states[readyState] || 'unhealthy',
        readyState: stateNames[readyState] || 'unknown',
    };
};
exports.checkDbHealth = checkDbHealth;
