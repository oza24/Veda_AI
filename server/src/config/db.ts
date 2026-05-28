import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../utils/logger';

// Setup connection lifecycle listeners
mongoose.connection.on('connecting', () => {
  logger.info('🔌 Connecting to MongoDB...');
});

mongoose.connection.on('connected', () => {
  logger.info('✅ MongoDB connection established successfully!');
});

mongoose.connection.on('error', (err) => {
  logger.error(`❌ MongoDB connection error: ${err.message}`, err);
});

mongoose.connection.on('disconnected', () => {
  logger.warn('🔌 MongoDB connection disconnected!');
});

/**
 * Connect to MongoDB using Mongoose
 */
export const connectDB = async (): Promise<void> => {
  try {
    const options: mongoose.ConnectOptions = {
      autoIndex: env.NODE_ENV !== 'production', // Don't build indexes in production for performance
    };

    await mongoose.connect(env.MONGO_URI, options);
  } catch (error: any) {
    logger.error(`💥 Failed to connect to MongoDB on startup: ${error.message}`, error);
    process.exit(1);
  }
};

/**
 * Gracefully close the MongoDB connection
 */
export const disconnectDB = async (): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      logger.info('✅ Mongoose connection closed gracefully.');
    }
  } catch (error: any) {
    logger.error(`💥 Error while closing Mongoose connection: ${error.message}`, error);
  }
};

export interface DbHealth {
  status: 'healthy' | 'unhealthy' | 'connecting' | 'disconnecting';
  readyState: string;
}

/**
 * Check the health status of the MongoDB database connection
 */
export const checkDbHealth = (): DbHealth => {
  const states: Record<number, DbHealth['status']> = {
    0: 'unhealthy', // Disconnected
    1: 'healthy',   // Connected
    2: 'connecting',
    3: 'disconnecting',
  };

  const stateNames: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const readyState = mongoose.connection.readyState;

  return {
    status: states[readyState] || 'unhealthy',
    readyState: stateNames[readyState] || 'unknown',
  };
};
