import { useState, type ReactNode } from 'react';
import { Link, NavLink, Outlet, useMatch, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

type NavItem = {
  to: string;
  label: string;
  end?: boolean;
  icon: (active: boolean) => ReactNode;
};

const navItems: NavItem[] = [
  {
    to: '/learner',
    label: 'Home',
    end: true,
    icon: (active) =>
      active ? (
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
          <path d="M12 3.2 3.5 10.2V21h5.5v-6.2h6V21H20.5V10.2L12 3.2z" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7">
          <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5z" />
        </svg>
      ),
  },
  {
    to: '/learner/learn',
    label: 'Learning',
    icon: (active) =>
      active ? (
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
          <path d="M3 5.5A2.5 2.5 0 0 1 5.5 3h13A2.5 2.5 0 0 1 21 5.5v13a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 18.5v-13z" />
          <path d="M10 9.2v5.6l4.8-2.8L10 9.2z" fill="#fff" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7">
          <rect x="3.5" y="5" width="17" height="14" rx="2" />
          <path d="m10 9.5 5 2.5-5 2.5v-5z" fill="currentColor" stroke="none" />
        </svg>
      ),
  },
];

export default function LearnerLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(true);
  const watchMatch = useMatch('/learner/learn/:assignmentId');
  const isWatchPage = Boolean(watchMatch);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-white text-ink">
      <header className="sticky top-0 z-40 border-b border-stone-200 bg-white">
        <div className="flex h-14 items-center gap-2 px-2 sm:gap-3 sm:px-4">
          {!isWatchPage && (
            <button
              type="button"
              className="hidden rounded-full p-2 text-stone-700 hover:bg-stone-100 md:inline-flex"
              aria-label={expanded ? 'Collapse menu' : 'Expand menu'}
              onClick={() => setExpanded((value) => !value)}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
          )}

          <Link to="/learner" className="flex items-center gap-2 px-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 text-xs font-bold text-white">
              LP
            </div>
            <span className="text-[18px] font-semibold tracking-tight text-ink">
              LearnPulse
            </span>
          </Link>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium leading-tight text-ink">{user?.name}</p>
              <p className="text-xs text-stone-500">Learner</p>
            </div>
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-600 text-sm font-semibold text-white"
              title={user?.name}
            >
              {(user?.name || 'L').slice(0, 1).toUpperCase()}
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full px-2.5 py-1.5 text-sm font-medium text-stone-600 hover:bg-stone-100 sm:px-3"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="flex w-full">
        {!isWatchPage && (
          <aside
            className={`sticky top-14 hidden h-[calc(100vh-3.5rem)] shrink-0 overflow-y-auto bg-white py-3 md:block ${
              expanded ? 'w-[240px] px-3' : 'w-[72px] px-1'
            }`}
          >
            <nav className={expanded ? 'space-y-0.5' : 'space-y-1'}>
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  title={item.label}
                  className={({ isActive }) =>
                    expanded
                      ? `flex items-center gap-6 rounded-xl px-3 py-2.5 text-sm transition ${
                          isActive
                            ? 'bg-stone-100 font-medium text-ink'
                            : 'font-normal text-stone-700 hover:bg-stone-100'
                        }`
                      : `flex flex-col items-center gap-1 rounded-xl px-1 py-3 text-[10px] transition ${
                          isActive
                            ? 'bg-stone-100 font-medium text-ink'
                            : 'font-normal text-stone-700 hover:bg-stone-100'
                        }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {item.icon(isActive)}
                      <span className={expanded ? 'text-sm' : 'leading-none'}>
                        {item.label}
                      </span>
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </aside>
        )}

        <main
          className={
            isWatchPage
              ? 'min-w-0 flex-1'
              : 'min-w-0 flex-1 px-3 pb-24 pt-4 sm:px-5 sm:pt-5 md:pb-8 lg:px-6'
          }
        >
          <Outlet />
        </main>
      </div>

      {!isWatchPage && (
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white/95 backdrop-blur md:hidden">
          <div className="mx-auto grid h-16 max-w-lg grid-cols-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center gap-0.5 text-[10px] ${
                    isActive ? 'font-semibold text-ink' : 'font-medium text-stone-500'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {item.icon(isActive)}
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}
