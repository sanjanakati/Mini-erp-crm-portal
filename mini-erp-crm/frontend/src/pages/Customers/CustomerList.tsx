import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listCustomers } from '../../api/customers';
import { Customer } from '../../api/types';
import { StatusBadge } from '../../components/StatusBadge';
import { Pagination } from '../../components/Pagination';
import { useAuth } from '../../context/AuthContext';

export default function CustomerList() {
  const { user } = useAuth();
  const canManage = user && ['ADMIN', 'SALES'].includes(user.role);

  const [data, setData] = useState<Customer[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    listCustomers({ page, limit: 10, search: search || undefined, status: status || undefined }).then(
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
  }, [page, search, status]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">Customers</h1>
        {canManage && (
          <Link to="/customers/new" className="btn-primary">
            + Add Customer
          </Link>
        )}
      </div>

      <div className="flex gap-3">
        <input
          className="input max-w-xs"
          placeholder="Search name, mobile, email…"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
        />
        <select
          className="input max-w-[160px]"
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
        >
          <option value="">All statuses</option>
          <option value="LEAD">Lead</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        <table className="ledger w-full text-left text-sm">
          <thead>
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Mobile</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Follow-up</th>
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
                  No customers found.
                </td>
              </tr>
            ) : (
              data.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link to={`/customers/${c.id}`} className="font-medium text-brand-700 hover:underline">
                      {c.name}
                    </Link>
                    {c.businessName && <p className="text-xs text-slate-400">{c.businessName}</p>}
                  </td>
                  <td className="px-4 py-3">{c.mobile}</td>
                  <td className="px-4 py-3">
                    <StatusBadge value={c.customerType} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge value={c.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {c.followUpDate ? new Date(c.followUpDate).toLocaleDateString() : '—'}
                  </td>
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
