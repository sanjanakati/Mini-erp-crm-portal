import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { created, ok, paginated } from '../utils/response';
import * as customerService from '../services/customer.service';
import { AppError } from '../utils/AppError';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, search, status, customerType } = req.query as unknown as {
    page: number;
    limit: number;
    search?: string;
    status?: 'LEAD' | 'ACTIVE' | 'INACTIVE';
    customerType?: 'RETAIL' | 'WHOLESALE' | 'DISTRIBUTOR';
  };
  const { data, total } = await customerService.listCustomers({ page, limit, search, status, customerType });
  paginated(res, data, page, limit, total);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const customer = await customerService.getCustomerById(req.params.id);
  ok(res, customer);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const customer = await customerService.createCustomer(req.body, req.user.userId);
  created(res, customer);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const customer = await customerService.updateCustomer(req.params.id, req.body);
  ok(res, customer);
});

export const addNote = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const { note, followUpAt } = req.body;
  const created_ = await customerService.addFollowUpNote(req.params.id, note, followUpAt, req.user.userId);
  created(res, created_);
});
