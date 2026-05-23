import { Request, Response, NextFunction } from 'express';
import { AppError } from '../shared/errors/AppError';
import { environment } from '../config/environment';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      metadata: error.metadata,
      ...(environment.NODE_ENV === 'development' && { stack: error.stack }),
    });
  }

  // Mongoose validation error
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Database validation failed',
      errors: error.message,
    });
  }

  // Mongoose duplicate key error
  if ((error as any).code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'Duplicate key error',
      fields: (error as any).keyValue,
    });
  }

  // Default error
  console.error('Unhandled error:', error);
  return res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(environment.NODE_ENV === 'development' && { stack: error.stack }),
  });
};