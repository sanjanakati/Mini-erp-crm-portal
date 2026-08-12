import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { cancelChallan, confirmChallan, getChallan } from '../../api/challans';
import { Challan } from '../../api/types';
import { StatusBadge } from '../../components/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage } from '../../api/client';

export default function ChallanDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [challan, setChallan] = useState<Challan | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  async function reload() {
    if (!id) return;
    const c = await getChallan(id);
    setChallan(c);
    setLoading(false);
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const canConfirm = user && ['ADMIN', 'WAREHOUSE'].includes(user.role);
  const canCancel = user && ['ADMIN', 'SALES', 'WAREHOUSE'].includes(user.role);

  async function handleConfirm() {
    if (!id) return;
    setActionLoading(true);
    setError('');
    try {
      await confirmChallan(id);
      await reload();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCancel() {
    if (!id) return;
    if (!window.confirm('Are you sure you want to cancel this challan?')) return;
    setActionLoading(true);
    setError('');
    try {
      await cancelChallan(id);
      await reload();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  }

  if (loading || !challan) return <p className="text-slate-500">Loading…</p>;

  const totalValue = challan.items.reduce(
    (sum, item) => sum + Number(item.unitPriceSnapshot) * item.quantity,
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-mono text-xl font-bold text-brand-600">{challan.challanNumber}</h1>
          <p className="text-sm text-slate-500">
            Customer:{' '}
            <Link to={`/customers/${challan.customerId}`} className="text-brand-700 hover:underline">
              {challan.customer?.name}
            </Link>
          </p>
        </div>
        <StatusBadge value={challan.status} />
      </div>

      {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      {challan.status === 'DRAFT' && (
        <div className="flex gap-3">
          {canConfirm && (
            <button onClick={handleConfirm} disabled={actionLoading} className="btn-primary">
              {actionLoading ? 'Confirming…' : 'Confirm Challan (deduct stock)'}
            </button>
          )}
          {canCancel && (
            <button onClick={handleCancel} disabled={actionLoading} className="btn-danger">
              Cancel Challan
            </button>
          )}
        </div>
      )}
      {challan.status === 'CONFIRMED' && canCancel && (
        <button onClick={handleCancel} disabled={actionLoading} className="btn-danger">
          {actionLoading ? 'Cancelling…' : 'Cancel Challan (restore stock)'}
        </button>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Unit Price</th>
              <th className="px-4 py-3">Qty</th>
              <th className="px-4 py-3">Line Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {challan.items.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3">{item.productNameSnapshot}</td>
                <td className="px-4 py-3 text-slate-500">{item.productSkuSnapshot}</td>
                <td className="px-4 py-3">₹{Number(item.unitPriceSnapshot).toFixed(2)}</td>
                <td className="px-4 py-3">{item.quantity}</td>
                <td className="px-4 py-3 font-medium">
                  ₹{(Number(item.unitPriceSnapshot) * item.quantity).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-50 font-semibold">
            <tr>
              <td colSpan={3} />
              <td className="px-4 py-3">{challan.totalQuantity}</td>
              <td className="px-4 py-3">₹{totalValue.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="card space-y-2 p-4 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-500">Created by</span>
          <span>{challan.createdBy?.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Created at</span>
          <span>{new Date(challan.createdAt).toLocaleString()}</span>
        </div>
        {challan.confirmedAt && (
          <div className="flex justify-between">
            <span className="text-slate-500">Confirmed at</span>
            <span>{new Date(challan.confirmedAt).toLocaleString()}</span>
          </div>
        )}
        {challan.cancelledAt && (
          <div className="flex justify-between">
            <span className="text-slate-500">Cancelled at</span>
            <span>{new Date(challan.cancelledAt).toLocaleString()}</span>
          </div>
        )}
      </div>
    </div>
  );
}
