import { Role } from '@prisma/client';

export interface JwtPayload {
  userId: string;
  role: Role;
  email: string;
}

// Augment Express's Request type so `req.user` is available
// after the auth middleware runs, without using `any`.
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export interface Paginated<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  success: false;
  message: string;
  errors?: unknown;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
}
