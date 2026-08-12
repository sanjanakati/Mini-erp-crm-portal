import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { ok } from '../utils/response';
import * as authService from '../services/auth.service';
import { AppError } from '../utils/AppError';

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.login(req.body);
  ok(res, result);
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const profile = await authService.getProfile(req.user.userId);
  ok(res, profile);
});
