import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { FormEvent, TransitionEvent, useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { useCart } from '../cart/CartContext';
import { useUiLocale } from '../i18n/ui-locale';
import { NAV_DRAWER_LINKS, NAV_PRIMARY_SHORTCUTS } from '../lib/navLinks';
import { getSearchSuggestions, type SearchSuggestion } from '../search/view';
import { AppIcon } from './AppIcon';
import { BrandLogo } from './BrandLogo';
import { SearchSuggestionPanel } from './SearchSuggestionPanel';

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

function flattenSuggestions(groups: ReturnType<typeof getSearchSuggestions>) {
  return groups.flatMap((group) => group.suggestions);
}

const HOME_HERO_BOTTOM_SENTINEL_ID = 'home-hero-bottom-sentinel';

export function Nav() {
  const { totalQty } = useCart();
  const { copy } = useUiLocale();
  const [q, setQ] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPanelOpen, setMenuPanelOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const headerRef = useRef<HTMLElement>(null);
  const desktopSearchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  const prevMenuVisibleRef = useRef(false);
  const menuVisibleRef = useRef(menuVisible);
  const menuTriggerFocusRef = useRef<HTMLElement | null>(null);
  const drawerPanelRef = useRef<HTMLDivElement>(null);
  const drawerCloseBtnRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { pathname, search } = location;
  const prefersReducedMotion = usePrefersReducedMotion();

  menuVisibleRef.current = menuVisible;

  const motionClass = prefersReducedMotion ? 'transition-none duration-0 ease-linear' : 'transition-opacity duration-300 ease-out';
  const drawerMotionClass = prefersReducedMotion
    ? 'transition-none duration-0 ease-linear'
    : 'transition-transform duration-300 ease-out';

  const scopeParams = useMemo(() => {
    if (pathname !== '/search') return { occasion: null as string | null, vibe: null as string | null };
    const current = new URLSearchParams(search);
    return {
      occasion: current.get('occasion'),
      vibe: current.get('vibe'),
    };
  }, [pathname, search]);

  const suggestionGroups = useMemo(
    () =>
      getSearchSuggestions({
        query: q,
        scopeOccasionSlug: scopeParams.occasion,
        scopeVibeSlug: scopeParams.vibe,
        limitPerGroup: 3,
      }),
    [q, scopeParams.occasion, scopeParams.vibe],
  );
  const flatSuggestions = useMemo(() => flattenSuggestions(suggestionGroups), [suggestionGroups]);
  const suggestionsOpen = searchFocused && (suggestionGroups.length > 0 || q.trim().length > 0);
  const activeSuggestion = activeSuggestionIndex >= 0 ? flatSuggestions[activeSuggestionIndex] : null;
  const activeSuggestionId = activeSuggestion ? `nav-search-suggestions-${activeSuggestionIndex}` : undefined;

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
    const currentQuery = pathname === '/search' ? new URLSearchParams(search).get('q') ?? '' : '';
    setQ((prev) => (prev === currentQuery ? prev : currentQuery));
    setSearchFocused(false);
    setActiveSuggestionIndex(-1);
  }, [pathname, search]);

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
    if (!suggestionsOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (target && headerRef.current?.contains(target)) return;
      setSearchFocused(false);
      setActiveSuggestionIndex(-1);
    };
    window.addEventListener('pointerdown', handlePointerDown);
    return () => window.removeEventListener('pointerdown', handlePointerDown);
  }, [suggestionsOpen]);

  useEffect(() => {
    setActiveSuggestionIndex(-1);
  }, [q, suggestionGroups.length]);

  function buildSearchDestination(rawQuery: string) {
    const trimmed = rawQuery.trim();
    const next = new URLSearchParams();
    if (trimmed) next.set('q', trimmed);

    if (pathname === '/search') {
      if (scopeParams.occasion) next.set('occasion', scopeParams.occasion);
      if (scopeParams.vibe) next.set('vibe', scopeParams.vibe);
    }

    const queryString = next.toString();
    return queryString ? `/search?${queryString}` : '/search';
  }

  function submitSearch(rawQuery: string) {
    navigate(buildSearchDestination(rawQuery));
    setSearchFocused(false);
    setActiveSuggestionIndex(-1);
  }

  function handleSuggestionSelect(suggestion: SearchSuggestion) {
    navigate(suggestion.href);
    setSearchFocused(false);
    setActiveSuggestionIndex(-1);
  }

  function clearSearch() {
    setQ('');
    setActiveSuggestionIndex(-1);
    if (pathname === '/search') {
      navigate(buildSearchDestination(''));
    }
  }

  function handleSearchSubmit(event: FormEvent) {
    event.preventDefault();
    if (activeSuggestion) {
      handleSuggestionSelect(activeSuggestion);
      return;
    }
    submitSearch(q);
  }

  function handleSearchKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!flatSuggestions.length) return;
      setActiveSuggestionIndex((current) => (current + 1 >= flatSuggestions.length ? 0 : current + 1));
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!flatSuggestions.length) return;
      setActiveSuggestionIndex((current) => (current <= 0 ? flatSuggestions.length - 1 : current - 1));
      return;
    }
    if (event.key === 'Escape') {
      setSearchFocused(false);
      setActiveSuggestionIndex(-1);
      event.currentTarget.blur();
    }
  }

  const isHome = pathname === '/';
  const [homeHeroSolidNav, setHomeHeroSolidNav] = useState(pathname !== '/');
  const [headerHeight, setHeaderHeight] = useState(0);

  const [isHeaderHidden, setIsHeaderHidden] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current && currentScrollY > headerHeight && currentScrollY > 200) {
        setIsHeaderHidden(true);
      } else {
        setIsHeaderHidden(false);
      }
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [headerHeight]);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const updateHeaderHeight = () => {
      setHeaderHeight(Math.round(header.getBoundingClientRect().height));
    };

    updateHeaderHeight();

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(() => updateHeaderHeight());
      observer.observe(header);
      return () => observer.disconnect();
    }

    window.addEventListener('resize', updateHeaderHeight);
    return () => window.removeEventListener('resize', updateHeaderHeight);
  }, []);

  useEffect(() => {
    if (pathname !== '/') {
      setHomeHeroSolidNav(true);
      return;
    }

    setHomeHeroSolidNav(false);
    let observer: IntersectionObserver | null = null;
    const t = window.setTimeout(() => {
      const sentinel = document.getElementById(HOME_HERO_BOTTOM_SENTINEL_ID);
      if (!sentinel) return;

      const effectiveHeaderHeight = Math.max(headerHeight, 1);
      observer = new IntersectionObserver(
        ([entry]) => {
          setHomeHeroSolidNav(!entry.isIntersecting);
        },
        {
          root: null,
          rootMargin: `-${effectiveHeaderHeight}px 0px 0px 0px`,
          threshold: 0,
        },
      );
      observer.observe(sentinel);
    }, 0);

    return () => {
      window.clearTimeout(t);
      observer?.disconnect();
    };
  }, [headerHeight, pathname]);

  const navOnHeroTransparent = isHome && !homeHeroSolidNav;
  const logoVariant = navOnHeroTransparent ? 'light' : 'dark';

  return (
    <header
      ref={headerRef}
      className={`glass-nav fixed top-0 z-100 w-full transition-transform duration-300 ease-in-out ${navOnHeroTransparent ? 'glass-nav--hero-transparent' : ''} ${isHeaderHidden ? '-translate-y-full' : 'translate-y-0'}`}
      role="banner"
    >
      <div className="mx-auto max-w-[1920px] md:hidden">
        <div className="flex items-center justify-between gap-2 py-3 pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))]">
          <button
            type="button"
            className={`inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-sm ${navOnHeroTransparent ? 'text-white/84' : 'text-obsidian/90'}`}
            aria-expanded={menuVisible && menuPanelOpen}
            aria-controls="primary-nav-drawer"
            aria-label={menuVisible && menuPanelOpen ? 'Close menu' : 'Open menu'}
            onClick={toggleMenu}
          >
            <AppIcon name={menuVisible && menuPanelOpen ? 'close' : 'menu'} className="h-6 w-6" />
          </button>
          <Link to="/" className="flex min-w-0 flex-1 justify-center" aria-label="HORO Egypt — Home">
            <BrandLogo variant={logoVariant} />
          </Link>
          <Link
            to="/cart"
            className={`relative inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center ${navOnHeroTransparent ? 'text-white/82' : 'text-obsidian/85'}`}
            aria-label={totalQty > 0 ? `Cart, ${totalQty} items` : 'Cart'}
          >
            <AppIcon name="shopping_bag" className="h-6 w-6" />
            {totalQty > 0 ? (
              <span className="pointer-events-none absolute right-0 top-0 flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 font-label text-[10px] font-semibold leading-none text-obsidian">
                {totalQty > 99 ? '99+' : totalQty}
              </span>
            ) : null}
          </Link>
        </div>

        <div className="relative border-t border-white/8 px-[max(1rem,env(safe-area-inset-left,0px))] pb-3 pr-[max(1rem,env(safe-area-inset-right,0px))]">
          <form onSubmit={handleSearchSubmit} className="relative pt-3">
            <label htmlFor="nav-search-mobile" className="sr-only">
              {copy.nav.searchPlaceholder}
            </label>
            <input
              ref={mobileSearchInputRef}
              id="nav-search-mobile"
              type="search"
              value={q}
              onChange={(event) => setQ(event.target.value)}
              onFocus={() => setSearchFocused(true)}
              onKeyDown={handleSearchKeyDown}
              placeholder={copy.nav.searchPlaceholder}
              className={`font-body min-h-12 w-full border-b px-2 py-3 pr-24 text-sm placeholder:text-clay/70 transition-colors focus:border-obsidian focus-visible:outline-none bg-transparent ${
                navOnHeroTransparent
                  ? 'border-white/20 text-white placeholder:text-white/60 focus:border-white'
                  : 'border-stone/30 text-obsidian focus:border-obsidian'
              }`}
              autoComplete="off"
              aria-expanded={suggestionsOpen}
              aria-controls="nav-search-suggestions"
              aria-activedescendant={activeSuggestionId}
              role="combobox"
            />
            <div className="absolute right-2 top-[calc(0.75rem+50%)] flex -translate-y-1/2 items-center gap-1">
              {q.trim() ? (
                <button
                  type="button"
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${
                    navOnHeroTransparent ? 'text-white/82 hover:bg-white/10' : 'text-obsidian/72 hover:bg-black/5'
                  }`}
                  aria-label={copy.nav.searchClear}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    clearSearch();
                  }}
                >
                  <AppIcon name="close" className="h-5 w-5" />
                </button>
              ) : null}
              <button
                type="submit"
                className={`inline-flex h-10 min-w-10 items-center justify-center rounded-full px-3 transition-colors ${navOnHeroTransparent ? 'text-white hover:bg-white/10' : 'text-obsidian hover:bg-black/5'}`}
                aria-label={copy.nav.searchSubmit}
              >
                <AppIcon name="search" className="h-5 w-5" />
              </button>
            </div>
          </form>

          {suggestionsOpen ? (
            <div className="absolute inset-x-[max(1rem,env(safe-area-inset-left,0px))] top-[calc(100%-0.15rem)] z-120">
              <SearchSuggestionPanel
                groups={suggestionGroups}
                activeIndex={activeSuggestionIndex}
                listboxId="nav-search-suggestions"
                onHover={setActiveSuggestionIndex}
                onSelect={handleSuggestionSelect}
              />
            </div>
          ) : null}
        </div>
      </div>

      <div className="mx-auto hidden max-w-[1920px] items-center gap-6 py-3 pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] md:flex md:gap-8 md:py-4 md:pl-6 md:pr-6 lg:pl-8 lg:pr-8">
        <div className="flex shrink-0 items-center gap-4">
          <Link to="/" className="flex shrink-0 items-center" aria-label="HORO Egypt — Home">
            <BrandLogo variant={logoVariant} />
          </Link>
        </div>

        <nav className="hidden shrink-0 items-center gap-1 md:flex" aria-label="Primary shortcuts">
          {NAV_PRIMARY_SHORTCUTS.map(({ path, label }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `nav-link-underline font-label rounded-sm px-2.5 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] transition-colors lg:px-3 ${
                  isActive
                    ? 'text-primary nav-link-underline--active'
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

        <div className="relative flex min-w-0 flex-1 justify-end px-2 md:px-4">
          <form onSubmit={handleSearchSubmit} className={`relative transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${searchFocused || q.trim() ? 'w-full max-w-xl min-w-[18rem]' : 'w-10'}`}>
            <label htmlFor="nav-search-desktop" className="sr-only">
              {copy.nav.searchPlaceholder}
            </label>
            <input
              ref={desktopSearchInputRef}
              id="nav-search-desktop"
              type="search"
              placeholder={copy.nav.searchPlaceholder}
              value={q}
              onChange={(event) => setQ(event.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => {
                // Short timeout to allow suggestion clicks
                setTimeout(() => {
                  setSearchFocused(false);
                }, 200);
              }}
              onKeyDown={handleSearchKeyDown}
              className={`font-body box-border h-10 w-full border-b text-[13px] leading-normal transition-all duration-500 bg-transparent outline-none ${
                searchFocused || q.trim()
                  ? `px-4 pl-10 pr-20 ${navOnHeroTransparent ? 'border-white/30 text-white placeholder:text-white/60 focus:border-white' : 'border-stone/30 text-obsidian focus:border-obsidian placeholder:text-clay/70'}`
                  : `px-0 pl-10 border-transparent text-transparent placeholder:text-transparent cursor-pointer`
              }`}
              autoComplete="off"
              aria-expanded={suggestionsOpen}
              aria-controls="nav-search-suggestions"
              aria-activedescendant={activeSuggestionId}
              role="combobox"
            />
            <span
              className={`pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 transition-colors ${navOnHeroTransparent ? 'text-white/70' : 'text-obsidian/62'}`}
              aria-hidden
            >
              <AppIcon name="search" className="h-[18px] w-[18px]" />
            </span>
            <div className={`absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1 transition-opacity duration-300 ${searchFocused || q.trim() ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              {q.trim() ? (
                <button
                  type="button"
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${
                    navOnHeroTransparent ? 'text-white/78 hover:bg-white/10' : 'text-obsidian/70 hover:bg-black/5'
                  }`}
                  aria-label={copy.nav.searchClear}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    clearSearch();
                  }}
                >
                  <AppIcon name="close" className="h-5 w-5" />
                </button>
              ) : null}
              <button type="submit" className={`inline-flex h-8 items-center justify-center rounded-full px-3 transition-colors ${navOnHeroTransparent ? 'text-white/90 hover:text-white' : 'text-obsidian/80 hover:text-obsidian'}`}>
                <span className="font-label text-[10px] font-semibold uppercase tracking-[0.18em]">{copy.nav.searchSubmit}</span>
              </button>
            </div>
          </form>

          {suggestionsOpen ? (
            <div className="absolute left-1/2 top-[calc(100%+0.75rem)] z-120 w-full max-w-xl -translate-x-1/2 px-2 md:px-4">
              <SearchSuggestionPanel
                groups={suggestionGroups}
                activeIndex={activeSuggestionIndex}
                listboxId="nav-search-suggestions"
                onHover={setActiveSuggestionIndex}
                onSelect={handleSuggestionSelect}
              />
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-1 md:gap-2 lg:gap-3">
          <Link
            to="/cart"
            className={`relative inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-sm transition-colors ${
              navOnHeroTransparent ? 'text-white/82 hover:bg-white/[0.08]' : 'text-obsidian/85 hover:bg-black/4'
            }`}
            aria-label={totalQty > 0 ? `Cart, ${totalQty} items` : 'Cart'}
          >
            <AppIcon name="shopping_bag" className="h-6 w-6" />
            {totalQty > 0 ? (
              <span className="pointer-events-none absolute right-0.5 top-0.5 flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 font-label text-[10px] font-semibold leading-none text-obsidian">
                {totalQty > 99 ? '99+' : totalQty}
              </span>
            ) : null}
          </Link>
        </div>
      </div>

      {menuVisible
        ? createPortal(
          <div className="fixed inset-0 z-200">
            <button
              type="button"
              tabIndex={-1}
              className={`absolute inset-0 bg-obsidian/45 backdrop-blur-[2px] ${motionClass} ${menuPanelOpen ? 'opacity-100' : 'opacity-0'}`}
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
                  className="relative z-30 inline-flex min-h-11 min-w-11 items-center justify-center rounded-sm text-obsidian/90"
                  aria-label="Close menu"
                  onClick={closeMenu}
                >
                  <AppIcon name="close" className="h-6 w-6" />
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
