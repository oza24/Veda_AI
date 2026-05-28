"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.groq = void 0;
const groq_sdk_1 = __importDefault(require("groq-sdk"));
const env_1 = require("./env");
const logger_1 = require("../utils/logger");
logger_1.logger.info('🔌 Initializing Groq SDK client...');
exports.groq = new groq_sdk_1.default({
    apiKey: env_1.env.GROQ_API_KEY,
});
logger_1.logger.info('✅ Groq SDK client initialized successfully.');
