import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createChallan } from '../../api/challans';
import { listCustomers } from '../../api/customers';
import { listProducts } from '../../api/products';
import { Customer, Product } from '../../api/types';
import { getErrorMessage } from '../../api/client';

interface Line {
  productId: string;
  quantity: string;
}

export default function ChallanForm() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [lines, setLines] = useState<Line[]>([{ productId: '', quantity: '1' }]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      listCustomers({ page: 1, limit: 100 }),
      listProducts({ page: 1, limit: 100 }),
    ]).then(([c, p]) => {
      setCustomers(c.data);
      setProducts(p.data);
      setLoading(false);
    });
  }, []);

  function updateLine(index: number, patch: Partial<Line>) {
    setLines((ls) => ls.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }

  function addLine() {
    setLines((ls) => [...ls, { productId: '', quantity: '1' }]);
  }

  function removeLine(index: number) {
    setLines((ls) => ls.filter((_, i) => i !== index));
  }

  function productStock(productId: string) {
    return products.find((p) => p.id === productId)?.stock;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (!customerId) {
      setError('Please select a customer');
      return;
    }
    const items = lines
      .filter((l) => l.productId && Number(l.quantity) > 0)
      .map((l) => ({ productId: l.productId, quantity: Number(l.quantity) }));

    if (items.length === 0) {
      setError('Add at least one product line');
      return;
    }

    setSubmitting(true);
    try {
      const created = await createChallan({ customerId, items });
      navigate(`/challans/${created.id}`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="text-slate-500">Loading…</p>;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-4 text-xl font-bold text-slate-800">New Sales Challan</h1>
      <form onSubmit={handleSubmit} className="card space-y-4 p-6">
        {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        <div>
          <label className="label">Customer *</label>
          <select required className="input" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
            <option value="">Select a customer…</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.businessName ? `(${c.businessName})` : ''}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-400">
            Note: the challan is saved as Draft. Stock is only deducted when you confirm it — and confirming will
            fail if stock isn't sufficient.
          </p>
        </div>

        <div>
          <label className="label">Products *</label>
          <div className="space-y-2">
            {lines.map((line, i) => {
              const stock = productStock(line.productId);
              return (
                <div key={i} className="flex items-center gap-2">
                  <select
                    className="input"
                    value={line.productId}
                    onChange={(e) => updateLine(i, { productId: e.target.value })}
                  >
                    <option value="">Select product…</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku}) — stock: {p.stock}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    className="input max-w-[100px]"
                    value={line.quantity}
                    onChange={(e) => updateLine(i, { quantity: e.target.value })}
                  />
                  {stock !== undefined && Number(line.quantity) > stock && (
                    <span className="whitespace-nowrap text-xs text-red-600">exceeds stock</span>
                  )}
                  <button
                    type="button"
                    className="btn-secondary btn-sm"
                    onClick={() => removeLine(i)}
                    disabled={lines.length === 1}
                  >
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
          <button type="button" className="btn-secondary btn-sm mt-2" onClick={addLine}>
            + Add Product
          </button>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? 'Saving…' : 'Save as Draft'}
          </button>
        </div>
      </form>
    </div>
  );
}
