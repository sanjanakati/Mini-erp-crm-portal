import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = 'Password@123';

async function main() {
  console.log('🌱 Seeding database...');

  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  const [admin, sales, warehouse, accounts] = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: { name: 'Aditi Admin', email: 'admin@example.com', password: hashedPassword, role: 'ADMIN' },
    }),
    prisma.user.upsert({
      where: { email: 'sales@example.com' },
      update: {},
      create: { name: 'Sanjay Sales', email: 'sales@example.com', password: hashedPassword, role: 'SALES' },
    }),
    prisma.user.upsert({
      where: { email: 'warehouse@example.com' },
      update: {},
      create: { name: 'Waseem Warehouse', email: 'warehouse@example.com', password: hashedPassword, role: 'WAREHOUSE' },
    }),
    prisma.user.upsert({
      where: { email: 'accounts@example.com' },
      update: {},
      create: { name: 'Anita Accounts', email: 'accounts@example.com', password: hashedPassword, role: 'ACCOUNTS' },
    }),
  ]);

  console.log('✅ Users created (password for all: %s)', DEFAULT_PASSWORD);

  const products = await Promise.all(
    [
      { name: 'Steel Pipe 1 inch', sku: 'SP-1IN', category: 'Pipes', unitPrice: 250.0, stock: 500, minStock: 50, location: 'Warehouse A - Rack 1' },
      { name: 'Steel Pipe 2 inch', sku: 'SP-2IN', category: 'Pipes', unitPrice: 420.0, stock: 300, minStock: 40, location: 'Warehouse A - Rack 2' },
      { name: 'PVC Elbow Joint', sku: 'PVC-EJ', category: 'Fittings', unitPrice: 35.0, stock: 20, minStock: 100, location: 'Warehouse B - Rack 5' },
      { name: 'Copper Wire 2.5mm', sku: 'CW-25', category: 'Electrical', unitPrice: 890.0, stock: 150, minStock: 30, location: 'Warehouse B - Rack 1' },
      { name: 'Cement Bag 50kg', sku: 'CEM-50', category: 'Construction', unitPrice: 380.0, stock: 8, minStock: 50, location: 'Warehouse C - Yard' },
    ].map((p) => prisma.product.upsert({ where: { sku: p.sku }, update: {}, create: p }))
  );

  console.log('✅ %d products created', products.length);

  const customers = await Promise.all(
    [
      {
        name: 'Ramesh Traders',
        mobile: '9876500001',
        email: 'ramesh@rameshtraders.example',
        businessName: 'Ramesh Traders Pvt Ltd',
        gstNumber: '29ABCDE1234F1Z5',
        customerType: 'WHOLESALE' as const,
        address: 'MG Road, Bengaluru',
        status: 'ACTIVE' as const,
        ownerId: sales.id,
      },
      {
        name: 'Priya Enterprises',
        mobile: '9876500002',
        email: 'priya@priyaent.example',
        businessName: 'Priya Enterprises',
        customerType: 'DISTRIBUTOR' as const,
        address: 'Sector 21, Gurugram',
        status: 'ACTIVE' as const,
        ownerId: sales.id,
      },
      {
        name: 'Kumar Hardware',
        mobile: '9876500003',
        customerType: 'RETAIL' as const,
        address: 'Anna Nagar, Chennai',
        status: 'LEAD' as const,
        followUpDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        ownerId: sales.id,
      },
    ].map((c) => prisma.customer.create({ data: c }))
  );

  console.log('✅ %d customers created', customers.length);

  const existingChallan = await prisma.challan.findFirst();
  if (!existingChallan) {
    await prisma.challan.create({
      data: {
        challanNumber: `CH-${new Date().getFullYear()}-000001`,
        customerId: customers[0].id,
        status: 'DRAFT',
        totalQuantity: 15,
        createdById: sales.id,
        items: {
          create: [
            {
              productId: products[0].id,
              productNameSnapshot: products[0].name,
              productSkuSnapshot: products[0].sku,
              unitPriceSnapshot: products[0].unitPrice,
              quantity: 10,
            },
            {
              productId: products[2].id,
              productNameSnapshot: products[2].name,
              productSkuSnapshot: products[2].sku,
              unitPriceSnapshot: products[2].unitPrice,
              quantity: 5,
            },
          ],
        },
      },
    });
    console.log('✅ Sample draft challan created');
  }

  console.log('\n🎉 Seed complete. Login credentials (all use the same password):\n');
  console.log('  Admin:     admin@example.com     / %s', DEFAULT_PASSWORD);
  console.log('  Sales:     sales@example.com     / %s', DEFAULT_PASSWORD);
  console.log('  Warehouse: warehouse@example.com / %s', DEFAULT_PASSWORD);
  console.log('  Accounts:  accounts@example.com  / %s', DEFAULT_PASSWORD);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
