import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { FormEvent, useEffect, useState } from 'react';
import { BrandLogo } from './BrandLogo';
import { useHomeVibeScrollSpy } from '../hooks/useHomeVibeScrollSpy';
import { vibes } from '../data/site';

export function Nav() {
  const [q, setQ] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);
  const activeVibeSlug = useHomeVibeScrollSpy();
  const activeVibe = vibes.find((v) => v.slug === activeVibeSlug);

  function onSearch(e: FormEvent) {
    e.preventDefault();
    const trimmed = q.trim();
    navigate(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : '/search');
  }

  return (
    <nav className="glass-nav fixed top-0 z-50 w-full">
      <div className="mx-auto flex max-w-[1920px] items-center justify-between gap-2 py-3 pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] sm:gap-3 sm:py-4 sm:pl-6 sm:pr-6 md:pl-8 md:pr-8">
        <div className="flex min-w-0 shrink-0 items-center gap-3 md:gap-5">
          <Link to="/" className="flex shrink-0 items-center drop-shadow-sm" aria-label="HORO Egypt — Home">
            <BrandLogo variant="dark" />
          </Link>
          {activeVibe ? (
            <div
              className="hidden min-w-0 md:block md:max-w-[11rem] lg:max-w-[14rem]"
              aria-live="polite"
              aria-atomic="true"
            >
              <p className="font-label mb-0.5 truncate text-[9px] font-medium uppercase tracking-[0.28em] text-label">
                Reading
              </p>
              <p className="font-headline flex items-center gap-2 truncate text-sm font-semibold tracking-tight text-obsidian">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-black/15"
                  style={{ backgroundColor: activeVibe.accent }}
                  aria-hidden
                />
                <span className="truncate">{activeVibe.name}</span>
              </p>
            </div>
          ) : null}
        </div>

        <div className="hidden items-center space-x-10 md:flex lg:space-x-12">
          <NavLink
            to="/vibes"
            className={({ isActive }) =>
              `font-label min-h-12 text-xs font-semibold uppercase tracking-widest transition-colors duration-300 ${
                isActive
                  ? 'border-b-2 border-primary pb-1 text-primary'
                  : 'text-obsidian/90 hover:text-primary'
              }`
            }
          >
            Collection
          </NavLink>
          <NavLink
            to="/artists"
            className={({ isActive }) =>
              `font-label min-h-12 text-xs font-semibold uppercase tracking-widest transition-colors duration-300 ${
                isActive
                  ? 'border-b-2 border-primary pb-1 text-primary'
                  : 'text-obsidian/90 hover:text-primary'
              }`
            }
          >
            Artists
          </NavLink>
          <NavLink
            to="/about"
            className={({ isActive }) =>
              `font-label min-h-12 text-xs font-semibold uppercase tracking-widest transition-colors duration-300 ${
                isActive
                  ? 'border-b-2 border-primary pb-1 text-primary'
                  : 'text-obsidian/90 hover:text-primary'
              }`
            }
          >
            About
          </NavLink>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2 md:gap-4 lg:gap-6">
          <button
            type="button"
            className="material-symbols-outlined inline-flex min-h-11 min-w-11 items-center justify-center rounded-sm text-obsidian/90 md:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-primary-nav"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen((o) => !o)}
          >
            {menuOpen ? 'close' : 'menu'}
          </button>
          <form onSubmit={onSearch} className="hidden max-w-[200px] sm:block">
            <label htmlFor="nav-search" className="sr-only">
              Search
            </label>
            <input
              id="nav-search"
              type="search"
              placeholder="Search…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="font-body min-h-11 w-full rounded-sm border border-outline-variant/50 bg-white/95 px-3 py-2 text-xs text-obsidian shadow-sm placeholder:text-clay/70"
            />
          </form>
          <button
            type="button"
            className="material-symbols-outlined inline-flex min-h-11 min-w-11 items-center justify-center rounded-sm text-obsidian/85 sm:hidden"
            aria-label="Search"
            onClick={() => navigate('/search')}
          >
            search
          </button>
          <span
            className="material-symbols-outlined hidden min-h-11 min-w-11 cursor-pointer items-center justify-center text-obsidian/85 md:inline-flex"
            aria-hidden
          >
            language
          </span>
          <span
            className="material-symbols-outlined inline-flex min-h-11 min-w-11 items-center justify-center text-obsidian/85"
            aria-hidden
          >
            favorite
          </span>
          <Link
            to="/cart"
            className="material-symbols-outlined inline-flex min-h-11 min-w-11 items-center justify-center text-obsidian/85"
            aria-label="Cart"
          >
            shopping_bag
          </Link>
        </div>
      </div>

      {/* Mobile primary nav — desktop links are in the bar above */}
      {menuOpen ? (
        <div
          id="mobile-primary-nav"
          className="fixed inset-0 z-[60] flex flex-col bg-papyrus pt-[max(1rem,env(safe-area-inset-top,0px))] pb-[max(1rem,env(safe-area-inset-bottom,0px))] pl-[env(safe-area-inset-left,0px)] pr-[env(safe-area-inset-right,0px)] md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Main navigation"
        >
          <div className="flex items-center justify-between border-b border-outline-variant/30 px-4 py-3">
            <Link to="/" className="flex items-center" onClick={() => setMenuOpen(false)} aria-label="HORO Egypt — Home">
              <BrandLogo variant="dark" />
            </Link>
            <button
              type="button"
              className="material-symbols-outlined inline-flex min-h-11 min-w-11 items-center justify-center rounded-sm text-obsidian/90"
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
            >
              close
            </button>
          </div>
          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 py-6" aria-label="Primary">
            <NavLink
              to="/vibes"
              className={({ isActive }) =>
                `font-label min-h-14 rounded-sm px-4 py-4 text-sm font-semibold uppercase tracking-widest transition-colors ${
                  isActive ? 'bg-primary/15 text-primary' : 'text-obsidian/90 active:bg-surface-container-high'
                }`
              }
              onClick={() => setMenuOpen(false)}
            >
              Collection
            </NavLink>
            <NavLink
              to="/artists"
              className={({ isActive }) =>
                `font-label min-h-14 rounded-sm px-4 py-4 text-sm font-semibold uppercase tracking-widest transition-colors ${
                  isActive ? 'bg-primary/15 text-primary' : 'text-obsidian/90 active:bg-surface-container-high'
                }`
              }
              onClick={() => setMenuOpen(false)}
            >
              Artists
            </NavLink>
            <NavLink
              to="/about"
              className={({ isActive }) =>
                `font-label min-h-14 rounded-sm px-4 py-4 text-sm font-semibold uppercase tracking-widest transition-colors ${
                  isActive ? 'bg-primary/15 text-primary' : 'text-obsidian/90 active:bg-surface-container-high'
                }`
              }
              onClick={() => setMenuOpen(false)}
            >
              About
            </NavLink>
            <Link
              to="/occasions"
              className="font-label min-h-14 rounded-sm px-4 py-4 text-sm font-semibold uppercase tracking-widest text-obsidian/90 active:bg-surface-container-high"
              onClick={() => setMenuOpen(false)}
            >
              Occasions
            </Link>
            <Link
              to="/search"
              className="font-label min-h-14 rounded-sm px-4 py-4 text-sm font-semibold uppercase tracking-widest text-obsidian/90 active:bg-surface-container-high"
              onClick={() => setMenuOpen(false)}
            >
              Search
            </Link>
          </nav>
        </div>
      ) : null}
    </nav>
  );
}
