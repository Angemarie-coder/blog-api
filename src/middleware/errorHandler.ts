import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '../utils/errors';
import { ApiResponse } from '../types/common.types';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): void => {
  console.error('Error:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Validation errors
  if (error instanceof ValidationError) {
    res.status(400).json({
      success: false,
      message: error.message,
      errors: error.errors
    });
    return;
  }

  // Operational errors
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message
    });
    return;
  }

  // TypeORM/Database errors
  if (error.name === 'QueryFailedError') {
    let message = 'Database operation failed';
    let statusCode = 500;

    // Handle unique constraint violations
    if (error.message.includes('UNIQUE constraint failed')) {
      message = 'A record with this information already exists';
      statusCode = 409;
    }

    res.status(statusCode).json({
      success: false,
      message
    });
    return;
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
    return;
  }

  if (error.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      message: 'Token expired'
    });
    return;
  }

  // Default error
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message
  });
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};