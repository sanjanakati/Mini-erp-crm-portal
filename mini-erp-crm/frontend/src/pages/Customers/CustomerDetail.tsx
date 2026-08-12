import { FormEvent, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { addCustomerNote, getCustomer } from '../../api/customers';
import { Customer } from '../../api/types';
import { StatusBadge } from '../../components/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage } from '../../api/client';

export default function CustomerDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const canManage = user && ['ADMIN', 'SALES'].includes(user.role);

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [followUpAt, setFollowUpAt] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function reload() {
    if (!id) return;
    const c = await getCustomer(id);
    setCustomer(c);
    setLoading(false);
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleAddNote(e: FormEvent) {
    e.preventDefault();
    if (!id || !note.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      await addCustomerNote(id, note, followUpAt || undefined);
      setNote('');
      setFollowUpAt('');
      await reload();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !customer) return <p className="text-slate-500">Loading…</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">{customer.name}</h1>
          {customer.businessName && <p className="text-sm text-slate-500">{customer.businessName}</p>}
        </div>
        {canManage && (
          <Link to={`/customers/${customer.id}/edit`} className="btn-secondary">
            Edit
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card space-y-3 p-4 lg:col-span-1">
          <h2 className="font-semibold text-slate-800">Details</h2>
          <Detail label="Mobile" value={customer.mobile} />
          <Detail label="Email" value={customer.email ?? '—'} />
          <Detail label="GST Number" value={customer.gstNumber ?? '—'} />
          <Detail label="Address" value={customer.address ?? '—'} />
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Type</span>
            <StatusBadge value={customer.customerType} />
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Status</span>
            <StatusBadge value={customer.status} />
          </div>
          <Detail
            label="Follow-up"
            value={customer.followUpDate ? new Date(customer.followUpDate).toLocaleDateString() : '—'}
          />
          {customer.owner && <Detail label="Owner" value={customer.owner.name} />}
        </div>

        <div className="card space-y-4 p-4 lg:col-span-2">
          <h2 className="font-semibold text-slate-800">Follow-up Notes</h2>

          {canManage && (
            <form onSubmit={handleAddNote} className="space-y-2 rounded-md bg-slate-50 p-3">
              {error && <div className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}
              <textarea
                className="input"
                rows={2}
                placeholder="Add a follow-up note…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <div className="flex items-center gap-3">
                <input
                  type="date"
                  className="input max-w-[180px]"
                  value={followUpAt}
                  onChange={(e) => setFollowUpAt(e.target.value)}
                />
                <button type="submit" disabled={submitting} className="btn-primary btn-sm">
                  {submitting ? 'Adding…' : 'Add Note'}
                </button>
              </div>
            </form>
          )}

          <ul className="space-y-3">
            {customer.followUps && customer.followUps.length > 0 ? (
              customer.followUps.map((n) => (
                <li key={n.id} className="border-b border-slate-100 pb-2 text-sm">
                  <p className="text-slate-700">{n.note}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {n.createdBy?.name} · {new Date(n.createdAt).toLocaleString()}
                    {n.followUpAt && ` · Follow-up: ${new Date(n.followUpAt).toLocaleDateString()}`}
                  </p>
                </li>
              ))
            ) : (
              <p className="text-sm text-slate-400">No notes yet.</p>
            )}
          </ul>
        </div>
      </div>

      <div className="card p-4">
        <h2 className="mb-3 font-semibold text-slate-800">Recent Challans</h2>
        {customer.challans && customer.challans.length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {customer.challans.map((ch) => (
              <li key={ch.id} className="flex items-center justify-between py-2 text-sm">
                <Link to={`/challans/${ch.id}`} className="text-brand-700 hover:underline">
                  {ch.challanNumber}
                </Link>
                <StatusBadge value={ch.status} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-400">No challans yet.</p>
        )}
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-right text-slate-800">{value}</span>
    </div>
  );
}
