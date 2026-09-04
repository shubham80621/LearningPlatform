import { useState, type ReactNode } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  AdminHeaderProvider,
  useAdminHeader,
} from '../contexts/AdminHeaderContext';

type NavItem = {
  to: string;
  label: string;
  end?: boolean;
  icon: ReactNode;
};

const generalLinks: NavItem[] = [
  {
    to: '/admin',
    label: 'Dashboard',
    end: true,
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5z" />
      </svg>
    ),
  },
  {
    to: '/admin/videos',
    label: 'Videos',
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="5" width="14" height="14" rx="2" />
        <path d="m17 10 4-2v8l-4-2" />
      </svg>
    ),
  },
  {
    to: '/admin/learners',
    label: 'Learners',
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="9" cy="8" r="3" />
        <path d="M3 19a6 6 0 0 1 12 0" />
        <circle cx="17" cy="9" r="2.5" />
        <path d="M16 19a4.5 4.5 0 0 1 5 0" />
      </svg>
    ),
  },
];

function SidebarNav({
  collapsed,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-full flex-col">
      <div className={`flex items-center gap-3 px-4 py-5 ${collapsed ? 'justify-center' : ''}`}>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500 text-sm font-bold text-white">
          LP
        </div>
        {!collapsed && (
          <div>
            <Link to="/admin" className="text-base font-semibold text-white" onClick={onNavigate}>
              LearnPulse
            </Link>
            <p className="text-xs text-stone-400">Admin</p>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-4">
        {!collapsed && (
          <p className="mb-2 px-3 text-[11px] font-semibold tracking-[0.14em] text-stone-500">
            GENERAL
          </p>
        )}
        <nav className="space-y-1">
          {generalLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              onClick={onNavigate}
              title={link.label}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  collapsed ? 'justify-center' : ''
                } ${
                  isActive
                    ? 'bg-[#2a2623] text-white'
                    : 'text-stone-400 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <span className="shrink-0">{link.icon}</span>
              {!collapsed && <span>{link.label}</span>}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="border-t border-white/10 p-3">
        <button
          type="button"
          onClick={handleLogout}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-stone-400 hover:bg-white/5 hover:text-white ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M10 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4" />
            <path d="M14 16l4-4-4-4" />
            <path d="M18 12H9" />
          </svg>
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
}

function AdminTopBar({
  collapsed,
  onToggleCollapsed,
  onOpenMobile,
}: {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onOpenMobile: () => void;
}) {
  const { user } = useAuth();
  const { header } = useAdminHeader();

  return (
    <header className="sticky top-0 z-30 border-b border-stone-200 bg-white">
      <div className="flex items-center gap-3 px-4 py-3 md:px-6 md:py-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-xl border border-stone-200 p-2 text-stone-600 hover:bg-stone-50 lg:hidden"
            onClick={onOpenMobile}
            aria-label="Open menu"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>

          <button
            type="button"
            className="hidden rounded-xl border border-stone-200 p-2 text-stone-600 hover:bg-stone-50 lg:inline-flex"
            onClick={onToggleCollapsed}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-semibold text-ink md:text-2xl">
            {header.title}
          </h1>
          {header.subtitle && (
            <p className="mt-0.5 truncate text-sm text-stone-500">{header.subtitle}</p>
          )}
        </div>

        <div className="hidden items-center gap-2 sm:flex">
          <div className="text-right">
            <p className="text-sm font-medium text-ink">{user?.name}</p>
            <p className="text-xs text-stone-500">Administrator</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-600 text-sm font-semibold text-white">
            {(user?.name || 'A').slice(0, 1).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
}

function AdminShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#f3f4f6] lg:flex">
      <aside
        className={`sticky top-0 hidden h-screen shrink-0 bg-[#171412] transition-[width] lg:block ${
          collapsed ? 'w-[84px]' : 'w-[260px]'
        }`}
      >
        <SidebarNav collapsed={collapsed} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-[280px] bg-[#171412] shadow-2xl">
            <SidebarNav onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopBar
          collapsed={collapsed}
          onToggleCollapsed={() => setCollapsed((value) => !value)}
          onOpenMobile={() => setMobileOpen(true)}
        />
        <main className="w-full flex-1 px-4 py-5 md:px-6 md:py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  return (
    <AdminHeaderProvider>
      <AdminShell />
    </AdminHeaderProvider>
  );
}
