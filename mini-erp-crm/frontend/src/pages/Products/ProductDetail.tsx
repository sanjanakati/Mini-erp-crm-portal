import { FormEvent, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { addStockMovement, getProduct } from '../../api/products';
import { Product } from '../../api/types';
import { StatusBadge } from '../../components/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage } from '../../api/client';

export default function ProductDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const canManage = user && ['ADMIN', 'WAREHOUSE'].includes(user.role);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState('');
  const [movementType, setMovementType] = useState<'IN' | 'OUT'>('IN');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function reload() {
    if (!id) return;
    const p = await getProduct(id);
    setProduct(p);
    setLoading(false);
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleAddMovement(e: FormEvent) {
    e.preventDefault();
    if (!id || !quantity || !reason.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      await addStockMovement(id, { quantity: Number(quantity), movementType, reason });
      setQuantity('');
      setReason('');
      await reload();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !product) return <p className="text-slate-500">Loading…</p>;

  const low = product.stock <= product.minStock;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">{product.name}</h1>
          <p className="text-sm text-slate-500">
            {product.sku} {product.category && `· ${product.category}`}
          </p>
        </div>
        {canManage && (
          <Link to={`/products/${product.id}/edit`} className="btn-secondary">
            Edit
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card space-y-3 p-4 lg:col-span-1">
          <h2 className="font-semibold text-slate-800">Details</h2>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Current Stock</span>
            <span className={`font-semibold ${low ? 'text-red-600' : 'text-slate-800'}`}>
              {product.stock} {low && '⚠ Low'}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Minimum Stock</span>
            <span className="text-slate-800">{product.minStock}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Unit Price</span>
            <span className="text-slate-800">₹{Number(product.unitPrice).toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Location</span>
            <span className="text-slate-800">{product.location ?? '—'}</span>
          </div>
        </div>

        <div className="card space-y-4 p-4 lg:col-span-2">
          <h2 className="font-semibold text-slate-800">Stock Movements</h2>

          {canManage && (
            <form onSubmit={handleAddMovement} className="space-y-2 rounded-md bg-slate-50 p-3">
              {error && <div className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}
              <div className="flex gap-2">
                <select
                  className="input max-w-[110px]"
                  value={movementType}
                  onChange={(e) => setMovementType(e.target.value as 'IN' | 'OUT')}
                >
                  <option value="IN">IN</option>
                  <option value="OUT">OUT</option>
                </select>
                <input
                  type="number"
                  min="1"
                  placeholder="Quantity"
                  className="input max-w-[120px]"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
                <input
                  placeholder="Reason (e.g. Purchase, Damage, Correction)"
                  className="input"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
                <button type="submit" disabled={submitting} className="btn-primary btn-sm shrink-0">
                  {submitting ? 'Saving…' : 'Log'}
                </button>
              </div>
            </form>
          )}

          <ul className="divide-y divide-slate-100">
            {product.stockMovements && product.stockMovements.length > 0 ? (
              product.stockMovements.map((m) => (
                <li key={m.id} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <StatusBadge value={m.movementType} />
                    <span className="ml-2 text-slate-700">{m.reason}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-slate-800">
                      {m.movementType === 'IN' ? '+' : '-'}
                      {m.quantity}
                    </p>
                    <p className="text-xs text-slate-400">{new Date(m.createdAt).toLocaleString()}</p>
                  </div>
                </li>
              ))
            ) : (
              <p className="text-sm text-slate-400">No stock movements yet.</p>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
