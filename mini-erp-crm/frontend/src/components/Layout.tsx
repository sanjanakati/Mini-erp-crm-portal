import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', tag: '00' },
  { to: '/customers', label: 'Customers', tag: '01' },
  { to: '/products', label: 'Inventory', tag: '02' },
  { to: '/challans', label: 'Challans', tag: '03' },
];

export function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar -- styled like a warehouse rack directory / ledger spine */}
      <aside className="flex w-60 shrink-0 flex-col bg-brand-600 text-paper">
        <div className="border-b border-white/10 px-5 py-5">
          <p className="font-display text-lg font-semibold leading-tight">Mini ERP</p>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-amber">CRM Portal</p>
        </div>

        <nav className="flex-1 px-3 py-4">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `mb-1 flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm transition-colors ${
                  isActive
                    ? 'bg-white/10 text-white font-medium'
                    : 'text-brand-100/70 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <span className="font-mono text-[10px] text-amber">{item.tag}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 px-5 py-4">
          <p className="truncate text-sm font-medium text-white">{user?.name}</p>
          <p className="font-mono text-[10px] uppercase tracking-widest text-brand-100/60">{user?.role}</p>
          <button
            onClick={logout}
            className="mt-3 w-full rounded-sm border border-white/15 py-1.5 text-xs text-brand-100/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 bg-paper px-8 py-7">
        <Outlet />
      </main>
    </div>
  );
}
