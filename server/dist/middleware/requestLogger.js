"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = void 0;
const morgan_1 = __importDefault(require("morgan"));
const logger_1 = require("../utils/logger");
const env_1 = require("../config/env");
// Setup connection stream between Morgan and Winston
const stream = {
    write: (message) => logger_1.logger.http(message.trim()),
};
// Log only in non-testing environments
const skip = () => {
    return env_1.env.NODE_ENV === 'test';
};
// Build standard request logging format
const format = env_1.env.NODE_ENV === 'production' ? 'combined' : ':method :url :status :res[content-length] - :response-time ms';
exports.requestLogger = (0, morgan_1.default)(format, { stream, skip });
