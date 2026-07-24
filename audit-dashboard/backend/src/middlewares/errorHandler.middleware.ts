import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { AppError, PayloadTooLargeError, ValidationError } from '../utils/AppError';
import { logger } from '../utils/logger';
import { isProduction } from '../config/env';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  let error = err;

  // Normalize known third-party errors into AppError so the response shape
  // stays consistent regardless of where the failure originated.
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      error = new PayloadTooLargeError('Uploaded file exceeds the maximum allowed size');
    } else {
      error = new ValidationError(error.message);
    }
  } else if (error instanceof Error && error.message.includes('Unsupported file extension')) {
    error = new ValidationError(error.message);
  }

  if (error instanceof AppError) {
    if (!error.isOperational) {
      logger.error('Non-operational AppError', error);
    }
    res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        ...(error.details ? { details: error.details } : {}),
      },
    });
    return;
  }

  // Mongoose validation error
  if (error instanceof Error && error.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: error.message },
    });
    return;
  }

  // Mongo duplicate key error
  if (error && typeof error === 'object' && 'code' in error && (error as { code: number }).code === 11000) {
    res.status(409).json({
      success: false,
      error: { code: 'CONFLICT', message: 'A record with this data already exists' },
    });
    return;
  }

  // Unexpected/programmer error — never leak internals in production.
  logger.error('Unhandled error', error);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: isProduction ? 'An unexpected error occurred' : (error as Error)?.message,
      ...(isProduction ? {} : { stack: (error as Error)?.stack }),
    },
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.originalUrl} not found` },
  });
}
