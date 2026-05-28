"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const zod_1 = require("zod");
// Load environmental variables from .env file
dotenv_1.default.config({ path: path_1.default.resolve(process.cwd(), '.env') });
const envSchema = zod_1.z.object({
    PORT: zod_1.z.coerce.number().default(5000),
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    CORS_ORIGIN: zod_1.z.string().default('http://localhost:3000'),
    MONGO_URI: zod_1.z.string({
        required_error: 'MONGO_URI is required for database connections',
    }),
    // REDIS_HOST: z.string().default('localhost'),
    // REDIS_PORT: z.coerce.number().default(6379),
    // REDIS_URL: z.string().optional(),
    REDIS_URL: zod_1.z.string({
        required_error: 'REDIS_URL is required for Redis connections',
    }),
    GROQ_API_KEY: zod_1.z.string({
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
exports.env = parseEnv();
