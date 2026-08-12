import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import {
  CreateCustomerInput,
  UpdateCustomerInput,
} from '../validators/customer.validator';

interface ListParams {
  page: number;
  limit: number;
  search?: string;
  status?: 'LEAD' | 'ACTIVE' | 'INACTIVE';
  customerType?: 'RETAIL' | 'WHOLESALE' | 'DISTRIBUTOR';
}

export async function listCustomers(params: ListParams) {
  const { page, limit, search, status, customerType } = params;

  const where: Prisma.CustomerWhereInput = {
    ...(status ? { status } : {}),
    ...(customerType ? { customerType } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { mobile: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { businessName: { contains: search, mode: 'insensitive' } },
            { gstNumber: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.customer.count({ where }),
  ]);

  return { data, total };
}

export async function getCustomerById(id: string) {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      followUps: { orderBy: { createdAt: 'desc' }, include: { createdBy: { select: { name: true } } } },
      challans: { orderBy: { createdAt: 'desc' }, take: 10 },
      owner: { select: { id: true, name: true } },
    },
  });
  if (!customer) throw AppError.notFound('Customer not found');
  return customer;
}

export async function createCustomer(input: CreateCustomerInput, ownerId: string) {
  return prisma.customer.create({
    data: {
      ...input,
      email: input.email || null,
      ownerId,
    },
  });
}

export async function updateCustomer(id: string, input: UpdateCustomerInput) {
  await ensureExists(id);
  return prisma.customer.update({
    where: { id },
    data: {
      ...input,
      ...(input.email !== undefined ? { email: input.email || null } : {}),
    },
  });
}

export async function addFollowUpNote(
  customerId: string,
  note: string,
  followUpAt: Date | undefined,
  createdById: string
) {
  await ensureExists(customerId);

  return prisma.$transaction(async (tx) => {
    const created = await tx.customerNote.create({
      data: { customerId, note, followUpAt, createdById },
    });

    if (followUpAt) {
      await tx.customer.update({
        where: { id: customerId },
        data: { followUpDate: followUpAt },
      });
    }

    return created;
  });
}

async function ensureExists(id: string) {
  const exists = await prisma.customer.findUnique({ where: { id }, select: { id: true } });
  if (!exists) throw AppError.notFound('Customer not found');
}
