import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listCustomers } from '../api/customers';
import { listProducts } from '../api/products';
import { listChallans } from '../api/challans';
import { Customer, Product, Challan } from '../api/types';
import { StatusBadge } from '../components/StatusBadge';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [customerCount, setCustomerCount] = useState(0);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [recentChallans, setRecentChallans] = useState<Challan[]>([]);
  const [leadCustomers, setLeadCustomers] = useState<Customer[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [draftChallans, setDraftChallans] = useState(0);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [customers, products, low, challans, drafts, leads] = await Promise.all([
        listCustomers({ page: 1, limit: 1 }),
        listProducts({ page: 1, limit: 1 }),
        listProducts({ page: 1, limit: 5, lowStock: true }),
        listChallans({ page: 1, limit: 5 }),
        listChallans({ page: 1, limit: 1, status: 'DRAFT' }),
        listCustomers({ page: 1, limit: 5, status: 'LEAD' }),
      ]);
      setCustomerCount(customers.meta.total);
      setTotalProducts(products.meta.total);
      setLowStockProducts(low.data);
      setRecentChallans(challans.data);
      setDraftChallans(drafts.meta.total);
      setLeadCustomers(leads.data);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <p className="text-slate-500">Loading dashboard…</p>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Customers" value={customerCount} to="/customers" />
        <StatCard label="Products" value={totalProducts} to="/products" />
        <StatCard label="Draft Challans" value={draftChallans} to="/challans" />
        <StatCard label="Low Stock Items" value={lowStockProducts.length} to="/products" warn />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-4">
          <h2 className="mb-3 font-semibold text-slate-800">Low stock alerts</h2>
          {lowStockProducts.length === 0 ? (
            <p className="text-sm text-slate-500">No products are below minimum stock.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {lowStockProducts.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-2 text-sm">
                  <Link to={`/products/${p.id}`} className="text-brand-700 hover:underline">
                    {p.name} <span className="text-slate-400">({p.sku})</span>
                  </Link>
                  <span className="text-red-600">
                    {p.stock} / min {p.minStock}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-4">
          <h2 className="mb-3 font-semibold text-slate-800">Recent challans</h2>
          {recentChallans.length === 0 ? (
            <p className="text-sm text-slate-500">No challans yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentChallans.map((c) => (
                <li key={c.id} className="flex items-center justify-between py-2 text-sm">
                  <Link to={`/challans/${c.id}`} className="text-brand-700 hover:underline">
                    {c.challanNumber}
                  </Link>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">{c.customer?.name}</span>
                    <StatusBadge value={c.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="card p-4">
        <h2 className="mb-3 font-semibold text-slate-800">Leads needing follow-up</h2>
        {leadCustomers.length === 0 ? (
          <p className="text-sm text-slate-500">No leads at the moment.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {leadCustomers.map((c) => (
              <li key={c.id} className="flex items-center justify-between py-2 text-sm">
                <Link to={`/customers/${c.id}`} className="text-brand-700 hover:underline">
                  {c.name}
                </Link>
                <span className="text-slate-500">{c.mobile}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, to, warn }: { label: string; value: number; to: string; warn?: boolean }) {
  return (
    <Link to={to} className="card relative block p-4 pt-5 transition-shadow hover:shadow-md">
      <span className="card-tab">{label}</span>
      <p className={`font-mono text-3xl font-semibold ${warn && value > 0 ? 'text-stamp-red' : 'text-brand-600'}`}>
        {String(value).padStart(2, '0')}
      </p>
    </Link>
  );
}
