import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import {
  CreateProductInput,
  StockMovementInput,
  UpdateProductInput,
} from '../validators/product.validator';

interface ListParams {
  page: number;
  limit: number;
  search?: string;
  category?: string;
  lowStock?: boolean;
}

export async function listProducts(params: ListParams) {
  const { page, limit, search, category, lowStock } = params;

  const where: Prisma.ProductWhereInput = {
    isActive: true,
    ...(category ? { category } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { sku: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  let data = await prisma.product.findMany({
    where,
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { createdAt: 'desc' },
  });
  let total = await prisma.product.count({ where });

  // Low-stock filter compares two columns on the same row, which Prisma's
  // query builder can't express directly, so we filter in application code.
  if (lowStock) {
    const all = await prisma.product.findMany({ where, orderBy: { createdAt: 'desc' } });
    const filtered = all.filter((p) => p.stock <= p.minStock);
    total = filtered.length;
    data = filtered.slice((page - 1) * limit, (page - 1) * limit + limit);
  }

  return { data, total };
}

export async function getProductById(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      stockMovements: {
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: { createdBy: { select: { name: true } } },
      },
    },
  });
  if (!product) throw AppError.notFound('Product not found');
  return product;
}

export async function createProduct(input: CreateProductInput) {
  return prisma.product.create({ data: input });
}

export async function updateProduct(id: string, input: UpdateProductInput) {
  await ensureExists(id);
  return prisma.product.update({ where: { id }, data: input });
}

/**
 * Records a manual stock movement (IN/OUT) and atomically updates the
 * product's stock counter. Stock is never allowed to go negative.
 */
export async function recordStockMovement(
  productId: string,
  input: StockMovementInput,
  createdById: string
) {
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id: productId } });
    if (!product) throw AppError.notFound('Product not found');

    const delta = input.movementType === 'IN' ? input.quantity : -input.quantity;
    const newStock = product.stock + delta;

    if (newStock < 0) {
      throw AppError.badRequest(
        `Insufficient stock: current stock is ${product.stock}, cannot remove ${input.quantity}`
      );
    }

    const movement = await tx.stockMovement.create({
      data: {
        productId,
        quantity: input.quantity,
        movementType: input.movementType,
        reason: input.reason,
        createdById,
      },
    });

    await tx.product.update({ where: { id: productId }, data: { stock: newStock } });

    return movement;
  });
}

async function ensureExists(id: string) {
  const exists = await prisma.product.findUnique({ where: { id }, select: { id: true } });
  if (!exists) throw AppError.notFound('Product not found');
}
