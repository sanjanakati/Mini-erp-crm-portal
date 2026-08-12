import { FormEvent, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../api/client';

const DEMO_LOGINS = [
  { role: 'Admin', email: 'admin@example.com' },
  { role: 'Sales', email: 'sales@example.com' },
  { role: 'Warehouse', email: 'warehouse@example.com' },
  { role: 'Accounts', email: 'accounts@example.com' },
];

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-600 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-amber">Internal Use Only</p>
          <h1 className="mt-1 font-display text-2xl font-bold text-white">Mini ERP · CRM Portal</h1>
        </div>

        {/* Card styled like the top sheet of a carbon-copy challan pad:
            dashed perforation edge + a form-number corner tag. */}
        <div className="relative">
          <span className="absolute -top-3 right-4 z-10 rounded-sm bg-amber px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-widest text-white shadow-sm">
            Form · Login
          </span>
          <div
            className="rounded-t-md border-2 border-b-0 border-dashed border-white/25"
            style={{ height: '10px' }}
          />
          <form onSubmit={handleSubmit} className="space-y-4 rounded-b-md bg-paper-card p-6 shadow-lg">
            {error && (
              <div className="rounded-sm border border-stamp-red/30 bg-stamp-red/5 px-3 py-2 font-mono text-xs text-stamp-red">
                {error}
              </div>
            )}
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                required
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                required
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <div className="mt-4 rounded-md border border-white/10 bg-white/5 p-4">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-amber">
            Demo Logins · Password@123
          </p>
          {DEMO_LOGINS.map((d) => (
            <button
              key={d.email}
              type="button"
              className="block w-full py-1 text-left font-mono text-xs text-brand-100/80 hover:text-white"
              onClick={() => {
                setEmail(d.email);
                setPassword('Password@123');
              }}
            >
              {d.role.padEnd(10, ' ')} → {d.email}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
