import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listProducts } from '../../api/products';
import { Product } from '../../api/types';
import { Pagination } from '../../components/Pagination';
import { useAuth } from '../../context/AuthContext';

export default function ProductList() {
  const { user } = useAuth();
  const canManage = user && ['ADMIN', 'WAREHOUSE'].includes(user.role);

  const [data, setData] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    listProducts({ page, limit: 10, search: search || undefined, lowStock: lowStockOnly || undefined }).then(
      (res) => {
        if (!active) return;
        setData(res.data);
        setTotalPages(res.meta.totalPages);
        setLoading(false);
      }
    );
    return () => {
      active = false;
    };
  }, [page, search, lowStockOnly]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">Products</h1>
        {canManage && (
          <Link to="/products/new" className="btn-primary">
            + Add Product
          </Link>
        )}
      </div>

      <div className="flex items-center gap-3">
        <input
          className="input max-w-xs"
          placeholder="Search name or SKU…"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
        />
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={lowStockOnly}
            onChange={(e) => {
              setPage(1);
              setLowStockOnly(e.target.checked);
            }}
          />
          Low stock only
        </label>
      </div>

      <div className="card overflow-hidden">
        <table className="ledger w-full text-left text-sm">
          <thead>
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Unit Price</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Location</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                  Loading…
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                  No products found.
                </td>
              </tr>
            ) : (
              data.map((p) => {
                const low = p.stock <= p.minStock;
                return (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link to={`/products/${p.id}`} className="font-medium text-brand-700 hover:underline">
                        {p.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-stamp-slate">{p.sku}</td>
                    <td className="px-4 py-3 text-slate-500">{p.category ?? '—'}</td>
                    <td className="px-4 py-3 font-mono">₹{Number(p.unitPrice).toFixed(2)}</td>
                    <td className={`px-4 py-3 font-medium ${low ? 'text-red-600' : 'text-slate-800'}`}>
                      {p.stock} {low && '⚠'}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{p.location ?? '—'}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </div>
    </div>
  );
}
