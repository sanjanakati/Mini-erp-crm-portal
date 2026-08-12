import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listChallans } from '../../api/challans';
import { Challan } from '../../api/types';
import { StatusBadge } from '../../components/StatusBadge';
import { Pagination } from '../../components/Pagination';
import { useAuth } from '../../context/AuthContext';

export default function ChallanList() {
  const { user } = useAuth();
  const canCreate = user && ['ADMIN', 'SALES'].includes(user.role);

  const [data, setData] = useState<Challan[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    listChallans({ page, limit: 10, status: status || undefined }).then((res) => {
      if (!active) return;
      setData(res.data);
      setTotalPages(res.meta.totalPages);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [page, status]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">Sales Challans</h1>
        {canCreate && (
          <Link to="/challans/new" className="btn-primary">
            + New Challan
          </Link>
        )}
      </div>

      <select
        className="input max-w-[180px]"
        value={status}
        onChange={(e) => {
          setPage(1);
          setStatus(e.target.value);
        }}
      >
        <option value="">All statuses</option>
        <option value="DRAFT">Draft</option>
        <option value="CONFIRMED">Confirmed</option>
        <option value="CANCELLED">Cancelled</option>
      </select>

      <div className="card overflow-hidden">
        <table className="ledger w-full text-left text-sm">
          <thead>
            <tr>
              <th className="px-4 py-3">Challan #</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Total Qty</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  Loading…
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  No challans found.
                </td>
              </tr>
            ) : (
              data.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link to={`/challans/${c.id}`} className="font-mono font-medium text-brand-700 hover:underline">
                      {c.challanNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{c.customer?.name}</td>
                  <td className="px-4 py-3">{c.totalQuantity}</td>
                  <td className="px-4 py-3">
                    <StatusBadge value={c.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-500">{new Date(c.createdAt).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </div>
    </div>
  );
}
