import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function PublicNavbar({ variant = 'full' }: { variant?: 'full' | 'logo' }) {
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const onSearch = (event: FormEvent) => {
    event.preventDefault();
    setMenuOpen(false);
    navigate(`/?q=${encodeURIComponent(query.trim())}`);
  };

  if (variant === 'logo') {
    return (
      <header className="px-4 pt-8 md:px-6 md:pt-10">
        <Link
          to="/"
          className="mx-auto block w-fit text-xl font-semibold tracking-tight text-ink md:text-2xl"
        >
          LearnPulse
        </Link>
      </header>
    );
  }

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 md:px-6 md:pt-5">
        <div className="mx-auto max-w-6xl rounded-2xl border border-white/70 bg-white/85 shadow-lg shadow-stone-900/10 backdrop-blur-md">
          <div className="flex items-center gap-3 px-4 py-3 md:px-5">
            <Link
              to="/"
              className="shrink-0 text-lg font-semibold tracking-tight text-ink md:text-xl"
              onClick={() => setMenuOpen(false)}
            >
              LearnPulse
            </Link>

            <form onSubmit={onSearch} className="hidden min-w-0 flex-1 md:block">
              <label className="sr-only" htmlFor="header-search">
                Search lessons
              </label>
              <input
                id="header-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search assigned lessons"
                className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm"
              />
            </form>

            <nav className="ml-auto hidden items-center gap-2 text-sm sm:flex">
              <Link
                to="/login"
                className="rounded-xl bg-ink px-4 py-2 font-medium text-white hover:bg-stone-800"
              >
                Log in
              </Link>
            </nav>

            <button
              type="button"
              className="ml-auto rounded-xl border border-stone-200 px-3 py-2 text-sm font-medium sm:hidden"
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? 'Close' : 'Menu'}
            </button>
          </div>

          {menuOpen && (
            <div id="mobile-nav" className="border-t border-stone-200 px-4 py-3 sm:hidden">
              <form onSubmit={onSearch} className="mb-3">
                <label className="sr-only" htmlFor="mobile-search">
                  Search lessons
                </label>
                <input
                  id="mobile-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search assigned lessons"
                  className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm"
                />
              </form>
              <div className="flex flex-col gap-2">
                <Link
                  to="/login"
                  className="rounded-xl bg-ink px-3 py-2 text-center text-sm font-medium text-white"
                  onClick={() => setMenuOpen(false)}
                >
                  Log in
                </Link>
              </div>
            </div>
          )}
        </div>
      </header>
      <div className="h-24 md:h-28" aria-hidden="true" />
    </>
  );
}
