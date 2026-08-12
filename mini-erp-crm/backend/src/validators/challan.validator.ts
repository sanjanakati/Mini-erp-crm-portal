import { z } from 'zod';

export const challanItemSchema = z.object({
  productId: z.string().uuid('Invalid product id'),
  quantity: z.coerce.number().int().positive('Quantity must be a positive integer'),
});

export const createChallanSchema = z.object({
  customerId: z.string().uuid('Invalid customer id'),
  items: z.array(challanItemSchema).min(1, 'At least one product line is required'),
});

export const updateChallanSchema = z.object({
  customerId: z.string().uuid().optional(),
  items: z.array(challanItemSchema).min(1).optional(),
});

export const listChallansQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['DRAFT', 'CONFIRMED', 'CANCELLED']).optional(),
  customerId: z.string().uuid().optional(),
});

export type CreateChallanInput = z.infer<typeof createChallanSchema>;
export type UpdateChallanInput = z.infer<typeof updateChallanSchema>;
