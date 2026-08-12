import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Role } from '../api/types';

export function ProtectedRoute({ allowedRoles }: { allowedRoles?: Role[] }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex h-screen items-center justify-center text-slate-500">Loading…</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-2 text-slate-600">
        <p className="text-lg font-semibold">Access denied</p>
        <p className="text-sm">Your role ({user.role}) cannot access this page.</p>
      </div>
    );
  }

  return <Outlet />;
}
