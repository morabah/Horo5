import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { FormEvent, TransitionEvent, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useCart } from '../cart/CartContext';
import { SEARCH_SCHEMA } from '../data/domain-config';
import { NAV_DRAWER_LINKS, NAV_PRIMARY_SHORTCUTS } from '../lib/navLinks';
import { BrandLogo } from './BrandLogo';

function drawerNavLinkClass(isActive: boolean) {
  return `font-label box-border flex min-h-14 w-full items-center rounded-sm py-4 pl-4 pr-4 text-sm font-semibold uppercase tracking-widest transition-colors ${
    isActive
      ? 'border-l-[3px] border-primary bg-primary/8 text-primary'
      : 'border-l-[3px] border-transparent text-obsidian/90 active:bg-surface-container-high'
  }`;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter((el) => {
    if (el.hasAttribute('disabled')) return false;
    if (el.getAttribute('aria-hidden') === 'true') return false;
    if (el.tabIndex < 0 && el.tagName !== 'A' && el.tagName !== 'BUTTON') return false;
    return true;
  });
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

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
  const mobileSearchLayerRef = useRef<HTMLDivElement>(null);
  const prevMenuVisibleRef = useRef(false);
  const menuVisibleRef = useRef(menuVisible);
  const menuTriggerFocusRef = useRef<HTMLElement | null>(null);
  const searchTriggerFocusRef = useRef<HTMLElement | null>(null);
  const drawerPanelRef = useRef<HTMLDivElement>(null);
  const drawerCloseBtnRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();
  menuVisibleRef.current = menuVisible;
  const location = useLocation();
  const { pathname, search } = location;
  const prefersReducedMotion = usePrefersReducedMotion();

  const motionClass = prefersReducedMotion ? 'transition-none duration-0 ease-linear' : 'transition-opacity duration-300 ease-out';
  const drawerMotionClass = prefersReducedMotion
    ? 'transition-none duration-0 ease-linear'
    : 'transition-transform duration-300 ease-out';
  const searchWidthMotionClass = prefersReducedMotion ? '' : 'transition-[max-width] duration-300 ease-out';

  const closeMenu = useCallback(() => {
    setMenuPanelOpen(false);
    if (prefersReducedMotion) {
      setMenuVisible(false);
    }
  }, [prefersReducedMotion]);

  const openMenu = useCallback(() => {
    menuTriggerFocusRef.current = document.activeElement as HTMLElement | null;
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

  const openSearch = useCallback(() => {
    searchTriggerFocusRef.current = document.activeElement as HTMLElement | null;
    setSearchOpen(true);
  }, []);

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
  }, []);

  useEffect(() => {
    if (!menuVisible) {
      setMenuPanelOpen(false);
      prevMenuVisibleRef.current = false;
      return;
    }
    if (!prevMenuVisibleRef.current) {
      prevMenuVisibleRef.current = true;
      if (prefersReducedMotion) {
        setMenuPanelOpen(true);
        return;
      }
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (menuVisibleRef.current) setMenuPanelOpen(true);
        });
      });
      return () => cancelAnimationFrame(id);
    }
  }, [menuVisible, prefersReducedMotion]);

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
    if (!menuVisible) {
      const el = menuTriggerFocusRef.current;
      menuTriggerFocusRef.current = null;
      el?.focus();
      return;
    }
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
    if (!menuVisible || !menuPanelOpen) return;
    const id = requestAnimationFrame(() => {
      drawerCloseBtnRef.current?.focus();
    });
    return () => cancelAnimationFrame(id);
  }, [menuVisible, menuPanelOpen]);

  useEffect(() => {
    if (!menuVisible || !menuPanelOpen) return;
    const panel = drawerPanelRef.current;
    if (!panel) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const nodes = getFocusableElements(panel);
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey) {
        if (active === first) {
          e.preventDefault();
          last.focus();
        }
      } else if (active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    panel.addEventListener('keydown', onKeyDown);
    return () => panel.removeEventListener('keydown', onKeyDown);
  }, [menuVisible, menuPanelOpen]);

  useEffect(() => {
    if (!searchOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSearch();
    };
    window.addEventListener('keydown', onKey);
    const t = window.setTimeout(() => mobileSearchInputRef.current?.focus(), 0);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
      window.clearTimeout(t);
    };
  }, [searchOpen, closeSearch]);

  useEffect(() => {
    if (searchOpen) return;
    const el = searchTriggerFocusRef.current;
    searchTriggerFocusRef.current = null;
    el?.focus();
  }, [searchOpen]);

  useEffect(() => {
    if (!searchOpen) return;
    const panel = mobileSearchLayerRef.current;
    if (!panel) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const nodes = getFocusableElements(panel);
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey) {
        if (active === first) {
          e.preventDefault();
          last.focus();
        }
      } else if (active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    panel.addEventListener('keydown', onKeyDown);
    return () => panel.removeEventListener('keydown', onKeyDown);
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

  useEffect(() => {
    const currentQuery = pathname === '/search' ? new URLSearchParams(search).get('q') ?? '' : '';
    setQ((prev) => (prev === currentQuery ? prev : currentQuery));
    setMobileSearchQ((prev) => (prev === currentQuery ? prev : currentQuery));
  }, [pathname, search]);

  function buildSearchDestination(rawQuery: string) {
    const trimmed = rawQuery.trim();
    const next = new URLSearchParams();
    if (trimmed) next.set('q', trimmed);

    if (pathname === '/search') {
      const current = new URLSearchParams(search);
      const scopedOccasion = current.get('occasion');
      const scopedVibe = current.get('vibe');
      if (scopedOccasion) next.set('occasion', scopedOccasion);
      if (scopedVibe) next.set('vibe', scopedVibe);
    }

    const queryString = next.toString();
    return queryString ? `/search?${queryString}` : '/search';
  }

  function clearDesktopSearch() {
    const hasValue = q.trim().length > 0;
    if (hasValue) {
      setQ('');
      if (pathname === '/search') navigate(buildSearchDestination(''));
      return;
    }
    setDesktopSearchExpanded(false);
  }

  function clearMobileSearch() {
    setMobileSearchQ('');
    if (pathname === '/search') navigate(buildSearchDestination(''));
  }

  function onSearch(e: FormEvent) {
    e.preventDefault();
    navigate(buildSearchDestination(q));
    setDesktopSearchExpanded(false);
  }

  const isHome = pathname === '/';
  const [homeHeroSolidNav, setHomeHeroSolidNav] = useState(pathname !== '/');

  useEffect(() => {
    if (pathname !== '/') {
      setHomeHeroSolidNav(true);
      return;
    }
    setHomeHeroSolidNav(false);
    let observer: IntersectionObserver | null = null;
    const t = window.setTimeout(() => {
      const el = document.getElementById('home-hero');
      if (!el) return;
      observer = new IntersectionObserver(
        ([entry]) => {
          setHomeHeroSolidNav(!entry.isIntersecting);
        },
        { root: null, rootMargin: '0px', threshold: 0 },
      );
      observer.observe(el);
    }, 0);
    return () => {
      window.clearTimeout(t);
      observer?.disconnect();
    };
  }, [pathname]);

  const navOnHeroTransparent = isHome && !homeHeroSolidNav;
  const logoVariant = navOnHeroTransparent ? 'light' : 'dark';

  return (
    <header
      className={`glass-nav fixed top-0 z-100 w-full ${navOnHeroTransparent ? 'glass-nav--hero-transparent' : ''}`}
      role="banner"
    >
      {/* Mobile: Menu | Logo | Search | Bag — single search entry (icon only) */}
      <div className="mx-auto flex max-w-[1920px] items-center justify-between gap-2 py-3 pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] md:hidden">
        <button
          type="button"
          className={`material-symbols-outlined inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-sm ${navOnHeroTransparent ? 'text-white/84' : 'text-obsidian/90'}`}
          aria-expanded={menuVisible && menuPanelOpen}
          aria-controls="primary-nav-drawer"
          aria-label={menuVisible && menuPanelOpen ? 'Close menu' : 'Open menu'}
          onClick={toggleMenu}
        >
          {menuVisible && menuPanelOpen ? 'close' : 'menu'}
        </button>
        <Link to="/" className="flex min-w-0 flex-1 justify-center drop-shadow-sm" aria-label="HORO Egypt — Home">
          <BrandLogo variant={logoVariant} />
        </Link>
        <button
          type="button"
          className={`material-symbols-outlined inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-sm ${navOnHeroTransparent ? 'text-white/82' : 'text-obsidian/85'}`}
          aria-label="Search"
          aria-expanded={searchOpen}
          aria-controls="mobile-search-layer"
          onClick={openSearch}
        >
          search
        </button>
        <Link
          to="/cart"
          className={`material-symbols-outlined relative inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center ${navOnHeroTransparent ? 'text-white/82' : 'text-obsidian/85'}`}
          aria-label={totalQty > 0 ? `Cart, ${totalQty} items` : 'Cart'}
        >
          shopping_bag
          {totalQty > 0 ? (
            <span className="pointer-events-none absolute right-0 top-0 flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 font-label text-[10px] font-semibold leading-none text-obsidian">
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
            className={`material-symbols-outlined inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-sm transition-colors hover:bg-black/5 ${navOnHeroTransparent ? 'text-white/84 hover:bg-white/6' : 'text-obsidian/85'}`}
            aria-expanded={menuVisible && menuPanelOpen}
            aria-controls="primary-nav-drawer"
            aria-label={menuVisible && menuPanelOpen ? 'Close menu' : 'Open menu'}
            onClick={toggleMenu}
          >
            {menuVisible && menuPanelOpen ? 'close' : 'menu'}
          </button>
          <Link to="/" className="flex shrink-0 items-center drop-shadow-sm" aria-label="HORO Egypt — Home">
            <BrandLogo variant={logoVariant} />
          </Link>
        </div>
        <nav className="hidden shrink-0 items-center gap-1 md:flex" aria-label="Primary shortcuts">
          {NAV_PRIMARY_SHORTCUTS.map(({ path, label }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `font-label rounded-sm px-2.5 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] transition-colors lg:px-3 ${
                  isActive
                    ? 'text-primary'
                    : navOnHeroTransparent
                      ? 'text-white/80 hover:text-white'
                      : 'text-obsidian/90 hover:text-obsidian'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="flex min-w-0 flex-1 justify-center px-2 md:px-4">
          <div
            className={`flex items-center justify-center ${searchWidthMotionClass} ${desktopSearchExpanded ? 'w-full max-w-md' : 'max-w-12'}`}
          >
            {!desktopSearchExpanded ? (
              <button
                type="button"
                className={`material-symbols-outlined inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-sm border shadow-sm backdrop-blur-md transition-colors ${
                  navOnHeroTransparent
                    ? 'border-white/18 bg-white/[0.08] text-white/82 shadow-none hover:bg-white/[0.12]'
                    : 'border-outline-variant/40 bg-white/70 text-obsidian/85 hover:bg-white/90'
                }`}
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
                  placeholder={SEARCH_SCHEMA.copy.placeholder}
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
                  className="material-symbols-outlined absolute right-1 top-1/2 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-sm text-obsidian/70 hover:bg-black/5"
                  aria-label={q.trim() ? 'Clear search field' : 'Close search field'}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    clearDesktopSearch();
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
            className={`material-symbols-outlined relative inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-sm transition-colors ${
              navOnHeroTransparent ? 'text-white/82 hover:bg-white/[0.08]' : 'text-obsidian/85 hover:bg-black/4'
            }`}
            aria-label={totalQty > 0 ? `Cart, ${totalQty} items` : 'Cart'}
          >
            shopping_bag
            {totalQty > 0 ? (
              <span className="pointer-events-none absolute right-0.5 top-0.5 flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 font-label text-[10px] font-semibold leading-none text-obsidian">
                {totalQty > 99 ? '99+' : totalQty}
              </span>
            ) : null}
          </Link>
        </div>
      </div>

      {searchOpen ? (
        <div
          id="mobile-search-layer"
          ref={mobileSearchLayerRef}
          className="fixed inset-0 z-190 flex flex-col bg-papyrus/98 backdrop-blur-md md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Search"
        >
          <div className="flex items-center justify-between border-b border-outline-variant/30 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top,0px))]">
            <span className="font-label text-xs font-semibold uppercase tracking-widest text-obsidian">Search</span>
            <button
              type="button"
              className="font-label min-h-11 min-w-11 rounded-sm border border-outline-variant/40 px-2 text-xs uppercase tracking-wider text-obsidian"
              onClick={closeSearch}
            >
              Close
            </button>
          </div>
          <form
            className="flex flex-1 flex-col gap-3 p-4"
            onSubmit={(e) => {
              e.preventDefault();
              closeSearch();
              navigate(buildSearchDestination(mobileSearchQ));
            }}
          >
            <label htmlFor="nav-search-mobile-overlay" className="sr-only">
              {SEARCH_SCHEMA.copy.placeholder}
            </label>
            <div className="relative">
              <input
                ref={mobileSearchInputRef}
                id="nav-search-mobile-overlay"
                type="search"
                value={mobileSearchQ}
                onChange={(e) => setMobileSearchQ(e.target.value)}
                placeholder={SEARCH_SCHEMA.copy.placeholder}
                className="font-body min-h-14 w-full rounded-sm border border-outline-variant/50 bg-white px-4 py-3 pr-14 text-base text-obsidian shadow-sm placeholder:text-clay/70"
                autoComplete="off"
              />
              {mobileSearchQ.trim() ? (
                <button
                  type="button"
                  onClick={clearMobileSearch}
                  className="material-symbols-outlined absolute right-2 top-1/2 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full text-obsidian/72 transition-colors hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                  aria-label="Clear search"
                >
                  close
                </button>
              ) : null}
            </div>
            <button type="submit" className="btn btn-primary min-h-12 w-full">
              Search
            </button>
          </form>
        </div>
      ) : null}

      {menuVisible
        ? createPortal(
            <div className="fixed inset-0 z-200">
              <button
                type="button"
                tabIndex={-1}
                className={`absolute inset-0 bg-obsidian/45 backdrop-blur-[2px] ${motionClass} ${
                  menuPanelOpen ? 'opacity-100' : 'opacity-0'
                }`}
                aria-label="Close menu"
                onClick={closeMenu}
              />
              <div
                id="primary-nav-drawer"
                ref={drawerPanelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="primary-nav-drawer-title"
                className={`absolute left-0 top-0 isolate z-10 flex h-full min-h-0 w-full max-w-sm flex-col border-r border-stone/30 bg-papyrus shadow-[8px_0_40px_rgba(26,26,26,0.18)] ${drawerMotionClass} pl-[env(safe-area-inset-left,0px)] pr-[env(safe-area-inset-right,0px)] pt-[max(1rem,env(safe-area-inset-top,0px))] ${
                  menuPanelOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
                onTransitionEnd={handlePanelTransitionEnd}
              >
                <h2 id="primary-nav-drawer-title" className="sr-only">
                  Menu
                </h2>
                <div className="relative z-20 flex shrink-0 items-center justify-between border-b border-stone/25 bg-papyrus px-4 py-3 shadow-[0_1px_0_rgba(26,26,26,0.06)]">
                  <Link to="/" className="flex items-center" onClick={closeMenu} aria-label="HORO Egypt — Home">
                    <BrandLogo variant="dark" />
                  </Link>
                  <button
                    ref={drawerCloseBtnRef}
                    type="button"
                    className="material-symbols-outlined relative z-30 inline-flex min-h-11 min-w-11 items-center justify-center rounded-sm text-obsidian/90"
                    aria-label="Close menu"
                    onClick={closeMenu}
                  >
                    close
                  </button>
                </div>
                <nav
                  className="relative z-0 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overscroll-y-contain bg-papyrus px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))]"
                  aria-label="Primary"
                >
                  {NAV_DRAWER_LINKS.map(({ path, label, end }) => (
                    <NavLink
                      key={path}
                      to={path}
                      end={!!end}
                      className={({ isActive }) => drawerNavLinkClass(isActive)}
                      onClick={closeMenu}
                    >
                      {label}
                    </NavLink>
                  ))}
                  <NavLink
                    to="/cart"
                    className={({ isActive }) => drawerNavLinkClass(isActive)}
                    onClick={closeMenu}
                    aria-label={totalQty > 0 ? `Cart, ${totalQty} items` : 'Cart'}
                  >
                    Cart{totalQty > 0 ? ` (${totalQty})` : ''}
                  </NavLink>
                </nav>
              </div>
            </div>,
            document.body,
          )
        : null}
    </header>
  );
}
