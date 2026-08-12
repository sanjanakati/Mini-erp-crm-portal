export type Role = 'ADMIN' | 'SALES' | 'WAREHOUSE' | 'ACCOUNTS';
export type CustomerType = 'RETAIL' | 'WHOLESALE' | 'DISTRIBUTOR';
export type CustomerStatus = 'LEAD' | 'ACTIVE' | 'INACTIVE';
export type MovementType = 'IN' | 'OUT';
export type ChallanStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface CustomerNote {
  id: string;
  note: string;
  followUpAt: string | null;
  createdAt: string;
  createdBy?: { name: string };
}

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email: string | null;
  businessName: string | null;
  gstNumber: string | null;
  customerType: CustomerType;
  address: string | null;
  status: CustomerStatus;
  followUpDate: string | null;
  notes: string | null;
  createdAt: string;
  followUps?: CustomerNote[];
  challans?: Challan[];
  owner?: { id: string; name: string } | null;
}

export interface StockMovement {
  id: string;
  productId: string;
  quantity: number;
  movementType: MovementType;
  reason: string;
  createdAt: string;
  createdBy?: { name: string };
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string | null;
  unitPrice: string | number;
  stock: number;
  minStock: number;
  location: string | null;
  createdAt: string;
  stockMovements?: StockMovement[];
}

export interface ChallanItem {
  id: string;
  productId: string;
  productNameSnapshot: string;
  productSkuSnapshot: string;
  unitPriceSnapshot: string | number;
  quantity: number;
  product?: { id: string; name: string; sku: string };
}

export interface Challan {
  id: string;
  challanNumber: string;
  customerId: string;
  status: ChallanStatus;
  totalQuantity: number;
  createdAt: string;
  confirmedAt: string | null;
  cancelledAt: string | null;
  customer?: { id: string; name: string; mobile: string; businessName: string | null };
  createdBy?: { id: string; name: string };
  items: ChallanItem[];
}

export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface ApiResponse<T> {
  success: true;
  data: T;
}
