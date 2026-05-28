import morgan, { StreamOptions } from 'morgan';
import { logger } from '../utils/logger';
import { env } from '../config/env';

// Setup connection stream between Morgan and Winston
const stream: StreamOptions = {
  write: (message) => logger.http(message.trim()),
};

// Log only in non-testing environments
const skip = () => {
  return env.NODE_ENV === 'test';
};

// Build standard request logging format
const format = env.NODE_ENV === 'production' ? 'combined' : ':method :url :status :res[content-length] - :response-time ms';

export const requestLogger = morgan(format, { stream, skip });
