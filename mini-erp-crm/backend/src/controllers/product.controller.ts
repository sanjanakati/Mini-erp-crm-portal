import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { created, ok, paginated } from '../utils/response';
import * as productService from '../services/product.service';
import { AppError } from '../utils/AppError';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, search, category, lowStock } = req.query as unknown as {
    page: number;
    limit: number;
    search?: string;
    category?: string;
    lowStock?: boolean;
  };
  const { data, total } = await productService.listProducts({ page, limit, search, category, lowStock });
  paginated(res, data, page, limit, total);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.getProductById(req.params.id);
  ok(res, product);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.createProduct(req.body);
  created(res, product);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.updateProduct(req.params.id, req.body);
  ok(res, product);
});

export const addStockMovement = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const movement = await productService.recordStockMovement(req.params.id, req.body, req.user.userId);
  created(res, movement);
});
