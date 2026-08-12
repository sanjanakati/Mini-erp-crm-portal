import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createProduct, getProduct, updateProduct } from '../../api/products';
import { getErrorMessage } from '../../api/client';

const emptyForm = {
  name: '',
  sku: '',
  category: '',
  unitPrice: '',
  stock: '0',
  minStock: '0',
  location: '',
};

export default function ProductForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    getProduct(id).then((p) => {
      setForm({
        name: p.name,
        sku: p.sku,
        category: p.category ?? '',
        unitPrice: String(p.unitPrice),
        stock: String(p.stock),
        minStock: String(p.minStock),
        location: p.location ?? '',
      });
      setLoading(false);
    });
  }, [id]);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        name: form.name,
        sku: form.sku,
        category: form.category || undefined,
        unitPrice: Number(form.unitPrice),
        stock: Number(form.stock),
        minStock: Number(form.minStock),
        location: form.location || undefined,
      };
      if (isEdit && id) {
        await updateProduct(id, payload as any);
        navigate(`/products/${id}`);
      } else {
        const created = await createProduct(payload as any);
        navigate(`/products/${created.id}`);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="text-slate-500">Loading…</p>;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-4 text-xl font-bold text-slate-800">{isEdit ? 'Edit Product' : 'Add Product'}</h1>
      <form onSubmit={handleSubmit} className="card space-y-4 p-6">
        {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Product Name *</label>
            <input required className="input" value={form.name} onChange={(e) => update('name', e.target.value)} />
          </div>
          <div>
            <label className="label">SKU / Code *</label>
            <input required className="input" value={form.sku} onChange={(e) => update('sku', e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Category</label>
            <input className="input" value={form.category} onChange={(e) => update('category', e.target.value)} />
          </div>
          <div>
            <label className="label">Unit Price (₹) *</label>
            <input
              required
              type="number"
              step="0.01"
              min="0"
              className="input"
              value={form.unitPrice}
              onChange={(e) => update('unitPrice', e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">
              Current Stock {isEdit && <span className="text-xs text-slate-400">(use Stock Movement to adjust)</span>}
            </label>
            <input
              type="number"
              min="0"
              className="input"
              value={form.stock}
              disabled={isEdit}
              onChange={(e) => update('stock', e.target.value)}
            />
          </div>
          <div>
            <label className="label">Minimum Stock Alert</label>
            <input
              type="number"
              min="0"
              className="input"
              value={form.minStock}
              onChange={(e) => update('minStock', e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="label">Location / Warehouse</label>
          <input className="input" value={form.location} onChange={(e) => update('location', e.target.value)} />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  );
}
