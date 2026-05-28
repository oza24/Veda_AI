"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const env_1 = require("../config/env");
const logger_1 = require("../utils/logger");
const appError_1 = require("../utils/appError");
const sendErrorDev = (err, res) => {
    const statusCode = err.statusCode || 500;
    const responsePayload = {
        status: err.status || 'error',
        message: err.message,
        stack: err.stack,
    };
    res.status(statusCode).json(responsePayload);
};
const sendErrorProd = (err, res) => {
    const statusCode = err.statusCode || 500;
    // Operational, trusted error: send message to client
    if (err.isOperational) {
        res.status(statusCode).json({
            status: err.status,
            message: err.message,
        });
    }
    else {
        // Programming or other unknown error: don't leak error details
        logger_1.logger.error('💥 Non-operational Error:', err);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error',
        });
    }
};
const errorHandler = (err, _req, res, _next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    // Log error locally
    logger_1.logger.error(`${err.message} - ${err.stack}`);
    if (env_1.env.NODE_ENV === 'development') {
        sendErrorDev(err, res);
    }
    else {
        // Create copy or cast to AppError
        let error = { ...err };
        error.message = err.message;
        error.stack = err.stack;
        error.isOperational = err.isOperational;
        // Handle Mongoose cast errors, validation errors, duplicate keys, JWT errors, etc. here if needed
        if (err.name === 'CastError') {
            error = new appError_1.AppError(`Invalid value for ${err.path}: ${err.value}`, 400);
        }
        if (err.code === 11000) {
            const value = err.errmsg ? err.errmsg.match(/(["'])(\\?.)*?\1/)?.[0] : 'duplicate value';
            error = new appError_1.AppError(`Duplicate field value: ${value}. Please use another value!`, 400);
        }
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map((val) => val.message);
            error = new appError_1.AppError(`Invalid input data. ${messages.join('. ')}`, 400);
        }
        if (err.name === 'JsonWebTokenError') {
            error = new appError_1.AppError('Invalid token. Please log in again!', 401);
        }
        if (err.name === 'TokenExpiredError') {
            error = new appError_1.AppError('Your token has expired! Please log in again.', 401);
        }
        sendErrorProd(error, res);
    }
};
exports.errorHandler = errorHandler;
