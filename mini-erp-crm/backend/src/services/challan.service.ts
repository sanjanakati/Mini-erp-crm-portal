import { Prisma, PrismaClient } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import { CreateChallanInput, UpdateChallanInput } from '../validators/challan.validator';

type Tx = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

interface ListParams {
  page: number;
  limit: number;
  status?: 'DRAFT' | 'CONFIRMED' | 'CANCELLED';
  customerId?: string;
}

const challanInclude = {
  customer: { select: { id: true, name: true, mobile: true, businessName: true } },
  createdBy: { select: { id: true, name: true } },
  items: { include: { product: { select: { id: true, name: true, sku: true } } } },
} satisfies Prisma.ChallanInclude;

export async function listChallans(params: ListParams) {
  const { page, limit, status, customerId } = params;
  const where: Prisma.ChallanWhereInput = {
    ...(status ? { status } : {}),
    ...(customerId ? { customerId } : {}),
  };

  const [data, total] = await Promise.all([
    prisma.challan.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: challanInclude,
    }),
    prisma.challan.count({ where }),
  ]);

  return { data, total };
}

export async function getChallanById(id: string) {
  const challan = await prisma.challan.findUnique({ where: { id }, include: challanInclude });
  if (!challan) throw AppError.notFound('Challan not found');
  return challan;
}

/**
 * Generates a sequential challan number of the form CH-<year>-<6 digit seq>.
 * Must be called from inside the same transaction that creates the challan
 * so the count-and-insert is atomic with respect to other concurrent calls.
 */
async function generateChallanNumber(tx: Tx): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `CH-${year}-`;

  const count = await tx.challan.count({
    where: { challanNumber: { startsWith: prefix } },
  });

  const sequence = String(count + 1).padStart(6, '0');
  return `${prefix}${sequence}`;
}

export async function createChallan(input: CreateChallanInput, createdById: string) {
  return prisma.$transaction(async (tx) => {
    const customer = await tx.customer.findUnique({ where: { id: input.customerId } });
    if (!customer) throw AppError.notFound('Customer not found');

    // Validate products exist and snapshot their current data.
    const productIds = input.items.map((i) => i.productId);
    const products = await tx.product.findMany({ where: { id: { in: productIds } } });

    if (products.length !== new Set(productIds).size) {
      throw AppError.badRequest('One or more products in the challan do not exist');
    }

    const productMap = new Map(products.map((p) => [p.id, p]));
    const totalQuantity = input.items.reduce((sum, i) => sum + i.quantity, 0);
    const challanNumber = await generateChallanNumber(tx);

    const challan = await tx.challan.create({
      data: {
        challanNumber,
        customerId: input.customerId,
        status: 'DRAFT',
        totalQuantity,
        createdById,
        items: {
          create: input.items.map((item) => {
            const product = productMap.get(item.productId)!;
            return {
              productId: item.productId,
              productNameSnapshot: product.name,
              productSkuSnapshot: product.sku,
              unitPriceSnapshot: product.unitPrice,
              quantity: item.quantity,
            };
          }),
        },
      },
      include: challanInclude,
    });

    return challan;
  });
}

/**
 * Draft challans can have their customer/line items replaced wholesale.
 * Confirmed/cancelled challans are immutable.
 */
export async function updateChallan(id: string, input: UpdateChallanInput) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.challan.findUnique({ where: { id } });
    if (!existing) throw AppError.notFound('Challan not found');
    if (existing.status !== 'DRAFT') {
      throw AppError.badRequest(`Cannot edit a challan with status ${existing.status}`);
    }

    if (input.items) {
      const productIds = input.items.map((i) => i.productId);
      const products = await tx.product.findMany({ where: { id: { in: productIds } } });
      if (products.length !== new Set(productIds).size) {
        throw AppError.badRequest('One or more products in the challan do not exist');
      }
      const productMap = new Map(products.map((p) => [p.id, p]));
      const totalQuantity = input.items.reduce((sum, i) => sum + i.quantity, 0);

      await tx.challanItem.deleteMany({ where: { challanId: id } });
      await tx.challan.update({
        where: { id },
        data: {
          ...(input.customerId ? { customerId: input.customerId } : {}),
          totalQuantity,
          items: {
            create: input.items.map((item) => {
              const product = productMap.get(item.productId)!;
              return {
                productId: item.productId,
                productNameSnapshot: product.name,
                productSkuSnapshot: product.sku,
                unitPriceSnapshot: product.unitPrice,
                quantity: item.quantity,
              };
            }),
          },
        },
      });
    } else if (input.customerId) {
      await tx.challan.update({ where: { id }, data: { customerId: input.customerId } });
    }

    return tx.challan.findUnique({ where: { id }, include: challanInclude });
  });
}

/**
 * Confirms a DRAFT challan: validates stock availability for every line,
 * deducts stock (never allowing it to go negative), and logs a stock
 * movement (OUT) per product — all inside one DB transaction so a partial
 * failure can't leave stock in an inconsistent state.
 */
export async function confirmChallan(id: string, confirmedById: string) {
  return prisma.$transaction(async (tx) => {
    const challan = await tx.challan.findUnique({ where: { id }, include: { items: true } });
    if (!challan) throw AppError.notFound('Challan not found');
    if (challan.status !== 'DRAFT') {
      throw AppError.badRequest(`Only DRAFT challans can be confirmed (current status: ${challan.status})`);
    }

    // Validate stock for every line first, so we fail fast with a clear
    // error before mutating anything.
    for (const item of challan.items) {
      const product = await tx.product.findUnique({ where: { id: item.productId } });
      if (!product) throw AppError.notFound(`Product ${item.productSkuSnapshot} no longer exists`);
      if (product.stock < item.quantity) {
        throw AppError.badRequest(
          `Insufficient stock for ${product.name} (${product.sku}): available ${product.stock}, required ${item.quantity}`
        );
      }
    }

    // All lines have sufficient stock — apply the deductions.
    for (const item of challan.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          quantity: item.quantity,
          movementType: 'OUT',
          reason: `Challan ${challan.challanNumber} confirmed`,
          createdById: confirmedById,
        },
      });
    }

    return tx.challan.update({
      where: { id },
      data: { status: 'CONFIRMED', confirmedAt: new Date() },
      include: challanInclude,
    });
  });
}

/**
 * Cancels a challan. If it was already CONFIRMED, stock is restored
 * (an IN movement is logged per line) so inventory stays accurate.
 */
export async function cancelChallan(id: string, cancelledById: string) {
  return prisma.$transaction(async (tx) => {
    const challan = await tx.challan.findUnique({ where: { id }, include: { items: true } });
    if (!challan) throw AppError.notFound('Challan not found');
    if (challan.status === 'CANCELLED') {
      throw AppError.badRequest('Challan is already cancelled');
    }

    if (challan.status === 'CONFIRMED') {
      for (const item of challan.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            quantity: item.quantity,
            movementType: 'IN',
            reason: `Challan ${challan.challanNumber} cancelled — stock restored`,
            createdById: cancelledById,
          },
        });
      }
    }

    return tx.challan.update({
      where: { id },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
      include: challanInclude,
    });
  });
}
