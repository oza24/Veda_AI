import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load environmental variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  MONGO_URI: z.string({
    required_error: 'MONGO_URI is required for database connections',
  }),
  // REDIS_HOST: z.string().default('localhost'),
  // REDIS_PORT: z.coerce.number().default(6379),
  // REDIS_URL: z.string().optional(),


  REDIS_URL: z.string({
    required_error: 'REDIS_URL is required for Redis connections',
  }),


  GROQ_API_KEY: z.string({
    required_error: 'GROQ_API_KEY is required for AI generation',
  }),
});

const parseEnv = () => {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Invalid environment configuration:');
    console.error(JSON.stringify(result.error.format(), null, 2));
    process.exit(1);
  }

  return result.data;
};

export const env = parseEnv();
export type EnvConfig = z.infer<typeof envSchema>;
