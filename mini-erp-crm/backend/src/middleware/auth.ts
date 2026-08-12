import { NextFunction, Request, Response } from 'express';
import { Role } from '@prisma/client';
import { verifyToken } from '../utils/jwt';
import { AppError } from '../utils/AppError';

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(AppError.unauthorized('Missing or invalid Authorization header'));
  }

  const token = header.slice('Bearer '.length);

  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch {
    next(AppError.unauthorized('Invalid or expired token'));
  }
}

/**
 * Restrict a route to the given roles. Must be used after `authenticate`.
 * Example: router.post('/', authenticate, authorize('ADMIN', 'SALES'), handler)
 */
export function authorize(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(AppError.unauthorized());
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(AppError.forbidden(`Role '${req.user.role}' is not permitted to perform this action`));
    }
    next();
  };
}
