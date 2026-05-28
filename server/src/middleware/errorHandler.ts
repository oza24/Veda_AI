import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { AppError } from '../utils/appError';

interface ErrorResponse {
  status: string;
  message: string;
  stack?: string;
  errors?: unknown;
}

const sendErrorDev = (err: AppError, res: Response) => {
  const statusCode = err.statusCode || 500;
  const responsePayload: ErrorResponse = {
    status: err.status || 'error',
    message: err.message,
    stack: err.stack,
  };
  
  res.status(statusCode).json(responsePayload);
};

const sendErrorProd = (err: AppError, res: Response) => {
  const statusCode = err.statusCode || 500;

  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    // Programming or other unknown error: don't leak error details
    logger.error('💥 Non-operational Error:', err);

    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
};

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Log error locally
  logger.error(`${err.message} - ${err.stack}`);

  if (env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    // Create copy or cast to AppError
    let error = { ...err };
    error.message = err.message;
    error.stack = err.stack;
    error.isOperational = err.isOperational;

    // Handle Mongoose cast errors, validation errors, duplicate keys, JWT errors, etc. here if needed
    if (err.name === 'CastError') {
      error = new AppError(`Invalid value for ${err.path}: ${err.value}`, 400);
    }
    if (err.code === 11000) {
      const value = err.errmsg ? err.errmsg.match(/(["'])(\\?.)*?\1/)?.[0] : 'duplicate value';
      error = new AppError(`Duplicate field value: ${value}. Please use another value!`, 400);
    }
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((val: any) => val.message);
      error = new AppError(`Invalid input data. ${messages.join('. ')}`, 400);
    }
    if (err.name === 'JsonWebTokenError') {
      error = new AppError('Invalid token. Please log in again!', 401);
    }
    if (err.name === 'TokenExpiredError') {
      error = new AppError('Your token has expired! Please log in again.', 401);
    }

    sendErrorProd(error as AppError, res);
  }
};
