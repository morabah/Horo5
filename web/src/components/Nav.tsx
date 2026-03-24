import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { FormEvent, TransitionEvent, useCallback, useEffect, useRef, useState } from 'react';
import { useCart } from '../cart/CartContext';
import { BrandLogo } from './BrandLogo';

export function Nav() {
  const { totalQty } = useCart();
  const [q, setQ] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPanelOpen, setMenuPanelOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileSearchQ, setMobileSearchQ] = useState('');
  const [desktopSearchExpanded, setDesktopSearchExpanded] = useState(false);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  const desktopSearchInputRef = useRef<HTMLInputElement>(null);
  const prevMenuVisibleRef = useRef(false);
  const menuVisibleRef = useRef(menuVisible);
  const navigate = useNavigate();
  menuVisibleRef.current = menuVisible;
  const { pathname } = useLocation();

  const closeMenu = useCallback(() => {
    setMenuPanelOpen(false);
  }, []);

  const openMenu = useCallback(() => {
    setMenuVisible(true);
  }, []);

  const toggleMenu = useCallback(() => {
    if (!menuVisible) {
      openMenu();
      return;
    }
    if (menuPanelOpen) {
      closeMenu();
    } else {
      setMenuPanelOpen(true);
    }
  }, [menuVisible, menuPanelOpen, openMenu, closeMenu]);

  useEffect(() => {
    if (!menuVisible) {
      setMenuPanelOpen(false);
      prevMenuVisibleRef.current = false;
      return;
    }
    if (!prevMenuVisibleRef.current) {
      prevMenuVisibleRef.current = true;
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (menuVisibleRef.current) setMenuPanelOpen(true);
        });
      });
      return () => cancelAnimationFrame(id);
    }
  }, [menuVisible]);

  function handlePanelTransitionEnd(e: TransitionEvent<HTMLDivElement>) {
    if (e.target !== e.currentTarget) return;
    if (e.propertyName !== 'transform') return;
    if (!menuPanelOpen) {
      setMenuVisible(false);
    }
  }

  useEffect(() => {
    setMenuPanelOpen(false);
    setMenuVisible(false);
    setSearchOpen(false);
    setDesktopSearchExpanded(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuVisible) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [menuVisible, closeMenu]);

  useEffect(() => {
    if (!searchOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSearchOpen(false);
    };
    window.addEventListener('keydown', onKey);
    const t = window.setTimeout(() => mobileSearchInputRef.current?.focus(), 0);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
      window.clearTimeout(t);
    };
  }, [searchOpen]);

  useEffect(() => {
    if (!desktopSearchExpanded) return;
    const t = window.setTimeout(() => desktopSearchInputRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [desktopSearchExpanded]);

  useEffect(() => {
    if (!desktopSearchExpanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDesktopSearchExpanded(false);
        setQ('');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [desktopSearchExpanded]);

  function onSearch(e: FormEvent) {
    e.preventDefault();
    const trimmed = q.trim();
    navigate(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : '/search');
    setDesktopSearchExpanded(false);
  }

  const isDarkHero = pathname === '/';

  return (
    <nav
      className={`glass-nav fixed top-0 z-100 w-full ${isDarkHero ? 'glass-nav--on-dark' : ''}`}
    >
      {/* Mobile: Menu | Logo | Search | Bag — single search entry (icon only) */}
      <div className="mx-auto flex max-w-[1920px] items-center justify-between gap-2 py-3 pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] md:hidden">
        <button
          type="button"
          className="material-symbols-outlined inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-sm text-obsidian/90"
          aria-expanded={menuVisible && menuPanelOpen}
          aria-controls="primary-nav-drawer"
          aria-label={menuVisible && menuPanelOpen ? 'Close menu' : 'Open menu'}
          onClick={toggleMenu}
        >
          {menuVisible && menuPanelOpen ? 'close' : 'menu'}
        </button>
        <Link to="/" className="flex min-w-0 flex-1 justify-center drop-shadow-sm" aria-label="HORO Egypt — Home">
          <BrandLogo variant="dark" />
        </Link>
        <button
          type="button"
          className="material-symbols-outlined inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-sm text-obsidian/85"
          aria-label="Search"
          aria-expanded={searchOpen}
          aria-controls="mobile-search-layer"
          onClick={() => setSearchOpen(true)}
        >
          search
        </button>
        <Link
          to="/cart"
          className="material-symbols-outlined relative inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center text-obsidian/85"
          aria-label={totalQty > 0 ? `Cart, ${totalQty} items` : 'Cart'}
        >
          shopping_bag
          {totalQty > 0 ? (
            <span className="pointer-events-none absolute right-0 top-0 flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 font-label text-[10px] font-semibold leading-none text-white">
              {totalQty > 99 ? '99+' : totalQty}
            </span>
          ) : null}
        </Link>
      </div>

      {/* Desktop: Menu + logo | shortcuts | expandable glass search | cart */}
      <div className="mx-auto hidden max-w-[1920px] items-center gap-6 py-3 pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] md:flex md:gap-8 md:py-4 md:pl-6 md:pr-6 lg:pl-8 lg:pr-8">
        <div className="flex shrink-0 items-center gap-4">
          <button
            type="button"
            className="material-symbols-outlined inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-sm text-obsidian/85 transition-colors hover:bg-black/5"
            aria-expanded={menuVisible && menuPanelOpen}
            aria-controls="primary-nav-drawer"
            aria-label={menuVisible && menuPanelOpen ? 'Close menu' : 'Open menu'}
            onClick={toggleMenu}
          >
            {menuVisible && menuPanelOpen ? 'close' : 'menu'}
          </button>
          <Link to="/" className="flex shrink-0 items-center drop-shadow-sm" aria-label="HORO Egypt — Home">
            <BrandLogo variant="dark" />
          </Link>
        </div>
        <nav
          className="hidden shrink-0 items-center gap-1 lg:flex"
          aria-label="Primary shortcuts"
        >
          <NavLink
            to="/vibes"
            className={({ isActive }) =>
              `font-label rounded-sm px-2.5 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] transition-colors lg:px-3 ${
                isActive ? 'text-primary' : 'text-obsidian/90 hover:text-obsidian'
              }`
            }
          >
            Collection
          </NavLink>
          <NavLink
            to="/occasions"
            className={({ isActive }) =>
              `font-label rounded-sm px-2.5 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] transition-colors lg:px-3 ${
                isActive ? 'text-primary' : 'text-obsidian/90 hover:text-obsidian'
              }`
            }
          >
            Occasions
          </NavLink>
          <NavLink
            to="/about"
            className={({ isActive }) =>
              `font-label rounded-sm px-2.5 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] transition-colors lg:px-3 ${
                isActive ? 'text-primary' : 'text-obsidian/90 hover:text-obsidian'
              }`
            }
          >
            About
          </NavLink>
        </nav>
        <div className="flex min-w-0 flex-1 justify-center px-2 md:px-4">
          <div
            className={`flex items-center justify-center transition-[max-width] duration-300 ease-out ${desktopSearchExpanded ? 'w-full max-w-md' : 'max-w-12'}`}
          >
            {!desktopSearchExpanded ? (
              <button
                type="button"
                className="material-symbols-outlined inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-sm border border-outline-variant/40 bg-white/70 text-obsidian/85 shadow-sm backdrop-blur-md transition-colors hover:bg-white/90"
                aria-expanded={desktopSearchExpanded}
                aria-label="Open search"
                onClick={() => setDesktopSearchExpanded(true)}
              >
                search
              </button>
            ) : (
              <form onSubmit={onSearch} className="relative w-full min-w-0">
                <label htmlFor="nav-search-desktop" className="sr-only">
                  Search
                </label>
                <input
                  ref={desktopSearchInputRef}
                  id="nav-search-desktop"
                  type="search"
                  placeholder="Search designs, vibes…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onBlur={(e) => {
                    const next = e.relatedTarget as Node | null;
                    if (!next || !e.currentTarget.parentElement?.contains(next)) {
                      if (!q.trim()) setDesktopSearchExpanded(false);
                    }
                  }}
                  className="font-body box-border h-12 w-full rounded-sm border border-outline-variant/45 bg-white/85 px-4 pr-12 text-sm leading-normal text-obsidian shadow-sm backdrop-blur-xl placeholder:text-clay/70"
                />
                <button
                  type="button"
                  className="material-symbols-outlined absolute right-1 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-sm text-obsidian/70 hover:bg-black/5"
                  aria-label="Close search field"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setQ('');
                    setDesktopSearchExpanded(false);
                  }}
                >
                  close
                </button>
              </form>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1 md:gap-2 lg:gap-3">
          <Link
            to="/cart"
            className="material-symbols-outlined relative inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-sm text-obsidian/85 transition-colors hover:bg-black/4"
            aria-label={totalQty > 0 ? `Cart, ${totalQty} items` : 'Cart'}
          >
            shopping_bag
            {totalQty > 0 ? (
              <span className="pointer-events-none absolute right-0.5 top-0.5 flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 font-label text-[10px] font-semibold leading-none text-white">
                {totalQty > 99 ? '99+' : totalQty}
              </span>
            ) : null}
          </Link>
        </div>
      </div>

      {searchOpen ? (
        <div
          id="mobile-search-layer"
          className="fixed inset-0 z-120 flex flex-col bg-papyrus/98 backdrop-blur-md md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Search"
        >
          <div className="flex items-center justify-between border-b border-outline-variant/30 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top,0px))]">
            <span className="font-label text-xs font-semibold uppercase tracking-widest text-obsidian">Search</span>
            <button
              type="button"
              className="font-label min-h-11 min-w-11 rounded-sm border border-outline-variant/40 px-2 text-xs uppercase tracking-wider text-obsidian"
              onClick={() => setSearchOpen(false)}
            >
              Close
            </button>
          </div>
          <form
            className="flex flex-1 flex-col gap-3 p-4"
            onSubmit={(e) => {
              e.preventDefault();
              const trimmed = mobileSearchQ.trim();
              setSearchOpen(false);
              navigate(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : '/search');
            }}
          >
            <label htmlFor="nav-search-mobile-overlay" className="sr-only">
              Search designs, vibes
            </label>
            <input
              ref={mobileSearchInputRef}
              id="nav-search-mobile-overlay"
              type="search"
              value={mobileSearchQ}
              onChange={(e) => setMobileSearchQ(e.target.value)}
              placeholder="Search designs, vibes…"
              className="font-body min-h-14 w-full rounded-sm border border-outline-variant/50 bg-white px-4 py-3 text-base text-obsidian shadow-sm placeholder:text-clay/70"
              autoComplete="off"
            />
            <button type="submit" className="btn btn-primary min-h-12 w-full">
              Search
            </button>
          </form>
        </div>
      ) : null}

      {menuVisible ? (
        <div className="fixed inset-0 z-110">
          <button
            type="button"
            tabIndex={-1}
            className={`absolute inset-0 bg-black/15 backdrop-blur-sm transition-opacity duration-300 ease-out ${
              menuPanelOpen ? 'opacity-100' : 'opacity-0'
            }`}
            aria-label="Close menu"
            onClick={closeMenu}
          />
          <div
            id="primary-nav-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Main navigation"
            className={`absolute left-0 top-0 flex h-full min-h-0 w-full max-w-sm flex-col border-r border-white/25 bg-papyrus/90 shadow-[8px_0_40px_rgba(26,26,26,0.12)] backdrop-blur-xl transition-transform duration-300 ease-out pl-[env(safe-area-inset-left,0px)] pr-[env(safe-area-inset-right,0px)] pt-[max(1rem,env(safe-area-inset-top,0px))] ${
              menuPanelOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
            onTransitionEnd={handlePanelTransitionEnd}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-white/20 px-4 py-3">
              <Link to="/" className="flex items-center" onClick={closeMenu} aria-label="HORO Egypt — Home">
                <BrandLogo variant="dark" />
              </Link>
              <button
                type="button"
                className="material-symbols-outlined inline-flex min-h-11 min-w-11 items-center justify-center rounded-sm text-obsidian/90"
                aria-label="Close menu"
                onClick={closeMenu}
              >
                close
              </button>
            </div>
            <nav
              className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overscroll-y-contain px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))]"
              aria-label="Primary"
            >
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `font-label min-h-14 rounded-sm px-4 py-4 text-sm font-semibold uppercase tracking-widest transition-colors ${
                    isActive ? 'bg-primary/15 text-primary' : 'text-obsidian/90 active:bg-surface-container-high'
                  }`
                }
                onClick={closeMenu}
              >
                Home
              </NavLink>
              <NavLink
                to="/vibes"
                className={({ isActive }) =>
                  `font-label min-h-14 rounded-sm px-4 py-4 text-sm font-semibold uppercase tracking-widest transition-colors ${
                    isActive ? 'bg-primary/15 text-primary' : 'text-obsidian/90 active:bg-surface-container-high'
                  }`
                }
                onClick={closeMenu}
              >
                Collection
              </NavLink>
              <NavLink
                to="/occasions"
                className={({ isActive }) =>
                  `font-label min-h-14 rounded-sm px-4 py-4 text-sm font-semibold uppercase tracking-widest transition-colors ${
                    isActive ? 'bg-primary/15 text-primary' : 'text-obsidian/90 active:bg-surface-container-high'
                  }`
                }
                onClick={closeMenu}
              >
                Occasions
              </NavLink>
              <NavLink
                to="/about"
                className={({ isActive }) =>
                  `font-label min-h-14 rounded-sm px-4 py-4 text-sm font-semibold uppercase tracking-widest transition-colors ${
                    isActive ? 'bg-primary/15 text-primary' : 'text-obsidian/90 active:bg-surface-container-high'
                  }`
                }
                onClick={closeMenu}
              >
                About
              </NavLink>
              <NavLink
                to="/search"
                className={({ isActive }) =>
                  `font-label min-h-14 rounded-sm px-4 py-4 text-sm font-semibold uppercase tracking-widest transition-colors ${
                    isActive ? 'bg-primary/15 text-primary' : 'text-obsidian/90 active:bg-surface-container-high'
                  }`
                }
                onClick={closeMenu}
              >
                Search
              </NavLink>
              <NavLink
                to="/cart"
                className={({ isActive }) =>
                  `font-label min-h-14 rounded-sm px-4 py-4 text-sm font-semibold uppercase tracking-widest transition-colors ${
                    isActive ? 'bg-primary/15 text-primary' : 'text-obsidian/90 active:bg-surface-container-high'
                  }`
                }
                onClick={closeMenu}
                aria-label={totalQty > 0 ? `Cart, ${totalQty} items` : 'Cart'}
              >
                Cart{totalQty > 0 ? ` (${totalQty})` : ''}
              </NavLink>
            </nav>
          </div>
        </div>
      ) : null}
    </nav>
  );
}
