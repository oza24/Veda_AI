import Groq from 'groq-sdk';
import { env } from './env';
import { logger } from '../utils/logger';

logger.info('🔌 Initializing Groq SDK client...');

export const groq = new Groq({
  apiKey: env.GROQ_API_KEY,
});

logger.info('✅ Groq SDK client initialized successfully.');
