import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { created, ok, paginated } from '../utils/response';
import * as challanService from '../services/challan.service';
import { AppError } from '../utils/AppError';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, status, customerId } = req.query as unknown as {
    page: number;
    limit: number;
    status?: 'DRAFT' | 'CONFIRMED' | 'CANCELLED';
    customerId?: string;
  };
  const { data, total } = await challanService.listChallans({ page, limit, status, customerId });
  paginated(res, data, page, limit, total);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const challan = await challanService.getChallanById(req.params.id);
  ok(res, challan);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const challan = await challanService.createChallan(req.body, req.user.userId);
  created(res, challan);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const challan = await challanService.updateChallan(req.params.id, req.body);
  ok(res, challan);
});

export const confirm = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const challan = await challanService.confirmChallan(req.params.id, req.user.userId);
  ok(res, challan);
});

export const cancel = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const challan = await challanService.cancelChallan(req.params.id, req.user.userId);
  ok(res, challan);
});
