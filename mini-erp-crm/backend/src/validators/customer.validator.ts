import { z } from 'zod';

const customerTypeEnum = z.enum(['RETAIL', 'WHOLESALE', 'DISTRIBUTOR']);
const customerStatusEnum = z.enum(['LEAD', 'ACTIVE', 'INACTIVE']);

export const createCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  mobile: z.string().min(6, 'A valid mobile number is required'),
  email: z.string().email().optional().or(z.literal('')).optional(),
  businessName: z.string().optional(),
  gstNumber: z.string().optional(),
  customerType: customerTypeEnum.default('RETAIL'),
  address: z.string().optional(),
  status: customerStatusEnum.default('LEAD'),
  followUpDate: z.coerce.date().optional(),
  notes: z.string().optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const addCustomerNoteSchema = z.object({
  note: z.string().min(1, 'Note text is required'),
  followUpAt: z.coerce.date().optional(),
});

export const listCustomersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  status: customerStatusEnum.optional(),
  customerType: customerTypeEnum.optional(),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
