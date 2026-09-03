import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  title: string;
  links: { to: string; label: string }[];
}

export default function Layout({ title, links }: LayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#f6f3ee]">
      <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/90 backdrop-blur md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-lg font-semibold text-ink">{title}</h1>
            {user && (
              <p className="text-sm text-stone-500">
                {user.name} · {user.role}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg bg-ink px-3 py-2 text-sm font-medium text-white"
          >
            Logout
          </button>
        </div>
        <nav className="flex gap-2 overflow-x-auto px-4 pb-3">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="shrink-0 rounded-full bg-white px-3 py-1.5 text-sm ring-1 ring-stone-200"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </header>

      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-6">
        <aside className="hidden w-56 shrink-0 md:block">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-ink">{title}</h1>
            {user && (
              <p className="text-sm text-stone-500">
                {user.name} · {user.role}
              </p>
            )}
          </div>
          <nav className="space-y-2">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="block rounded-lg px-3 py-2 text-sm font-medium text-stone-700 hover:bg-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-6 w-full rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white"
          >
            Logout
          </button>
        </aside>

        <main className="min-w-0 flex-1 rounded-xl border border-stone-200 bg-white p-4 shadow-sm md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
