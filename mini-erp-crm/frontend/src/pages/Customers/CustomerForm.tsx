import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createCustomer, getCustomer, updateCustomer } from '../../api/customers';
import { getErrorMessage } from '../../api/client';

const emptyForm = {
  name: '',
  mobile: '',
  email: '',
  businessName: '',
  gstNumber: '',
  customerType: 'RETAIL' as const,
  address: '',
  status: 'LEAD' as const,
  followUpDate: '',
  notes: '',
};

export default function CustomerForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    getCustomer(id).then((c) => {
      setForm({
        name: c.name,
        mobile: c.mobile,
        email: c.email ?? '',
        businessName: c.businessName ?? '',
        gstNumber: c.gstNumber ?? '',
        customerType: c.customerType as any,
        address: c.address ?? '',
        status: c.status as any,
        followUpDate: c.followUpDate ? c.followUpDate.slice(0, 10) : '',
        notes: c.notes ?? '',
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
        ...form,
        followUpDate: form.followUpDate ? form.followUpDate : undefined,
      };
      if (isEdit && id) {
        await updateCustomer(id, payload as any);
        navigate(`/customers/${id}`);
      } else {
        const created = await createCustomer(payload as any);
        navigate(`/customers/${created.id}`);
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
      <h1 className="mb-4 text-xl font-bold text-slate-800">
        {isEdit ? 'Edit Customer' : 'Add Customer'}
      </h1>
      <form onSubmit={handleSubmit} className="card space-y-4 p-6">
        {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Name *</label>
            <input required className="input" value={form.name} onChange={(e) => update('name', e.target.value)} />
          </div>
          <div>
            <label className="label">Mobile *</label>
            <input required className="input" value={form.mobile} onChange={(e) => update('mobile', e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" value={form.email} onChange={(e) => update('email', e.target.value)} />
          </div>
          <div>
            <label className="label">Business Name</label>
            <input className="input" value={form.businessName} onChange={(e) => update('businessName', e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">GST Number</label>
            <input className="input" value={form.gstNumber} onChange={(e) => update('gstNumber', e.target.value)} />
          </div>
          <div>
            <label className="label">Customer Type</label>
            <select className="input" value={form.customerType} onChange={(e) => update('customerType', e.target.value as any)}>
              <option value="RETAIL">Retail</option>
              <option value="WHOLESALE">Wholesale</option>
              <option value="DISTRIBUTOR">Distributor</option>
            </select>
          </div>
        </div>

        <div>
          <label className="label">Address</label>
          <textarea className="input" rows={2} value={form.address} onChange={(e) => update('address', e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Status</label>
            <select className="input" value={form.status} onChange={(e) => update('status', e.target.value as any)}>
              <option value="LEAD">Lead</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
          <div>
            <label className="label">Follow-up Date</label>
            <input type="date" className="input" value={form.followUpDate} onChange={(e) => update('followUpDate', e.target.value)} />
          </div>
        </div>

        <div>
          <label className="label">Notes</label>
          <textarea className="input" rows={3} value={form.notes} onChange={(e) => update('notes', e.target.value)} />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Customer'}
          </button>
        </div>
      </form>
    </div>
  );
}
