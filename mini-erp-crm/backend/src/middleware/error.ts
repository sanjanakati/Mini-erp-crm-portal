import { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { AppError } from '../utils/AppError';

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) {
  // Known application errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.errors ? { errors: err.errors } : {}),
    });
  }

  // Prisma known request errors -> map to sensible HTTP codes
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002': {
        const target = (err.meta?.target as string[] | undefined)?.join(', ') ?? 'field';
        return res.status(409).json({
          success: false,
          message: `A record with this ${target} already exists`,
        });
      }
      case 'P2025':
        return res.status(404).json({ success: false, message: 'Record not found' });
      case 'P2003':
        return res.status(400).json({
          success: false,
          message: 'Invalid reference to a related record (foreign key constraint failed)',
        });
      default:
        return res.status(400).json({ success: false, message: `Database error (${err.code})` });
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({ success: false, message: 'Invalid data sent to database' });
  }

  // Unknown/unexpected errors
  // eslint-disable-next-line no-console
  console.error('Unhandled error:', err);
  const message = err instanceof Error ? err.message : 'Internal server error';
  return res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : message,
  });
}
