import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

import { FormEvent, TransitionEvent, useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { useCart } from '../cart/CartContext';
import { useWishlist } from '../hooks/useWishlist';
import { clearPlacedOrderMedusaIdHint, readPlacedOrderMedusaIdHint } from '../cart/placedOrderHint';
import { useUiLocale, useDictionary } from '../i18n/ui-locale';
import { HORO_SUPPORT_CHANNELS } from '../data/support-channels';
import { getProducts, productHasRealImage } from '../data/site';
import { imgUrl, preferHomeCardDisplaySrc } from '../data/images';
import { NAV_DRAWER_ROUTE_KEYS, NAV_PRIMARY_ROUTE_KEYS, NAV_ROUTE, type NavRouteKey } from '../lib/navLinks';
import { resolveLaunchNav } from '../lib/sanitizeLaunchNav';
import { getSearchSuggestions, type SearchSuggestion } from '../search/view';
import { AppIcon } from './AppIcon';
import { BrandLogo } from './BrandLogo';
import { SearchSuggestionPanel } from './SearchSuggestionPanel';

type LocalizedNavText = string | { en?: string; ar?: string };
type SettingsNavItem = {
  key: string;
  label: LocalizedNavText;
  href: string;
  badge?: LocalizedNavText;
  active: boolean;
  sortOrder: number;
};

type NavSettings = {
  primary: SettingsNavItem[];
  drawer: SettingsNavItem[];
} | null;

type RenderedNavItem = {
  key: string;
  label: string;
  href: string;
  badge?: string;
  end?: boolean;
};

type ShopPreviewItem = {
  href: string;
  label: string;
  imageAlt: string;
  imageSrc: string | null;
};

function drawerNavLinkClass(isActive: boolean) {
  return `font-body box-border flex min-h-14 w-full items-center rounded-sm py-4 pl-4 pr-4 text-[0.98rem] font-medium transition-colors ${
    isActive
      ? 'border-l-[3px] border-obsidian bg-obsidian/5 text-obsidian'
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

function fallbackNavItem(routeKey: NavRouteKey, label: string): RenderedNavItem {
  return {
    key: routeKey,
    label,
    href: NAV_ROUTE[routeKey].path,
    end: Boolean(NAV_ROUTE[routeKey].end),
  };
}

function ShopPreviewImage({ item, placeholderLabel }: { item: ShopPreviewItem; placeholderLabel: string }) {
  if (item.imageSrc) {
    return (
      <img
        src={item.imageSrc}
        alt={item.imageAlt}
        width={220}
        height={275}
        className="h-full w-full object-cover transition-transform duration-300 group-hover/shop-card:scale-[1.03]"
        loading="lazy"
      />
    );
  }

  return (
    <span className="flex h-full w-full items-center justify-center bg-stone/35 px-3 text-center font-label text-[9px] font-semibold uppercase tracking-[0.16em] text-clay">
      {placeholderLabel}
    </span>
  );
}

function ShopPreviewTile({
  item,
  placeholderLabel,
  onClick,
}: {
  item: ShopPreviewItem;
  placeholderLabel: string;
  onClick?: () => void;
}) {
  return (
    <Link
      href={item.href}
      className="group/shop-card min-w-0 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-obsidian/55 focus-visible:ring-offset-2 focus-visible:ring-offset-papyrus"
      onClick={onClick}
    >
      <span className="block aspect-[4/5] overflow-hidden rounded-sm border border-stone/30 bg-stone/25">
        <ShopPreviewImage item={item} placeholderLabel={placeholderLabel} />
      </span>
      <span className="mt-2 block truncate font-body text-[0.78rem] font-medium text-obsidian group-hover/shop-card:underline">
        {item.label}
      </span>
    </Link>
  );
}

function LocaleToggle({
  locale,
  setLocale,
  tone,
  label,
}: {
  locale: 'en' | 'ar';
  setLocale: (locale: 'en' | 'ar') => void;
  tone: 'light' | 'dark';
  label: string;
}) {
  const wrapperClass =
    tone === 'light'
      ? 'border-white/18 bg-white/6 text-white'
      : 'border-stone/70 bg-white/90 text-obsidian';
  const activeClass =
    tone === 'light'
      ? 'bg-white text-obsidian'
      : 'bg-obsidian text-white';
  const inactiveClass =
    tone === 'light'
      ? 'text-white/78 hover:text-white'
      : 'text-clay hover:text-obsidian';

  return (
    <div className={`inline-flex items-center gap-1 rounded-full border px-1 py-1 ${wrapperClass}`} aria-label={label}>
      {(['en', 'ar'] as const).map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => setLocale(value)}
          className={`min-h-9 rounded-full px-3 font-body text-[0.82rem] font-medium transition-colors ${
            locale === value ? activeClass : inactiveClass
          }`}
          aria-pressed={locale === value}
        >
          {value.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

export function Nav({
  navigation = null,
  overlayOnHero = false,
}: {
  navigation?: NavSettings;
  /** When true (homepage), nav is transparent over the hero until scroll. */
  overlayOnHero?: boolean;
}) {
  const { totalQty, setMiniCartOpen } = useCart();
  const { count: wishlistCount } = useWishlist();
  const { locale, setLocale } = useUiLocale();
  const copy = useDictionary();
  const [mounted, setMounted] = useState(false);
  const [q, setQ] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPanelOpen, setMenuPanelOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const headerRef = useRef<HTMLElement>(null);
  const desktopSearchInputRef = useRef<HTMLInputElement>(null);
  const prevMenuVisibleRef = useRef(false);
  const menuVisibleRef = useRef(menuVisible);
  const menuTriggerFocusRef = useRef<HTMLElement | null>(null);
  const drawerPanelRef = useRef<HTMLDivElement>(null);
  const drawerCloseBtnRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams?.toString() ? `?${searchParams.toString()}` : "";
  const prefersReducedMotion = usePrefersReducedMotion();
  const [placedOrderMedusaId, setPlacedOrderMedusaId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    if (pathname.startsWith('/checkout/success')) {
      clearPlacedOrderMedusaIdHint();
      setPlacedOrderMedusaId(null);
      return;
    }
    setPlacedOrderMedusaId(readPlacedOrderMedusaIdHint());
  }, [pathname]);

  menuVisibleRef.current = menuVisible;

  const motionClass = prefersReducedMotion ? 'transition-none duration-0 ease-linear' : 'transition-opacity duration-300 ease-out';
  const drawerMotionClass = prefersReducedMotion
    ? 'transition-none duration-0 ease-linear'
    : 'transition-transform duration-300 ease-out';

  const scopeParams = useMemo(() => {
    if (pathname !== '/search') return { occasion: null as string | null, feeling: null as string | null };
    const current = new URLSearchParams(search);
    return {
      occasion: current.get('occasion'),
      feeling: current.get('feeling') ?? current.get('vibe'),
    };
  }, [pathname, search]);

  const suggestionGroups = useMemo(
    () =>
      getSearchSuggestions({
        query: q,
        scopeOccasionSlug: scopeParams.occasion,
        scopeFeelingSlug: scopeParams.feeling,
        limitPerGroup: 3,
      }),
    [q, scopeParams.occasion, scopeParams.feeling],
  );
  const flatSuggestions = useMemo(() => flattenSuggestions(suggestionGroups), [suggestionGroups]);
  const suggestionsOpen = searchFocused && (suggestionGroups.length > 0 || q.trim().length > 0);
  const activeSuggestion = activeSuggestionIndex >= 0 ? flatSuggestions[activeSuggestionIndex] : null;
  const activeSuggestionId = activeSuggestion ? `nav-search-suggestions-${activeSuggestionIndex}` : undefined;
  const routeLabelByKey = useMemo<Record<NavRouteKey, string>>(() => ({
    home: copy.shell.home,
    products: copy.shell.shopAll,
    shopByMeaning: copy.home.feelingsTitle,
    gifts: locale === 'ar' ? 'الهدايا' : 'Gifts',
    zodiac: locale === 'ar' ? 'كبسولة الأبراج' : 'Zodiac',
    career: locale === 'ar' ? 'المهنة والشغل' : 'Career & Work',
    about: copy.shell.about,
    sizeGuide: copy.shell.sizeGuide,
    faq: locale === 'ar' ? 'الأسئلة الشائعة' : 'FAQ',
    exchange: copy.shell.exchangePolicy,
    search: copy.shell.search,
    cart: copy.shell.cart,
  }), [
    copy.home.feelingsTitle,
    copy.shell.about,
    copy.shell.cart,
    copy.shell.exchangePolicy,
    copy.shell.home,
    copy.shell.search,
    copy.shell.shopAll,
    copy.shell.sizeGuide,
    locale,
  ]);
  const drawerWhatsAppUrl = HORO_SUPPORT_CHANNELS.whatsappSupportUrl;
  const primaryNavItems = useMemo(() => {
    return resolveLaunchNav(
      navigation?.primary,
      locale,
      NAV_PRIMARY_ROUTE_KEYS,
      (key) => fallbackNavItem(key as NavRouteKey, routeLabelByKey[key as NavRouteKey]),
    );
  }, [locale, navigation?.primary, routeLabelByKey]);

  const drawerNavItems = useMemo(() => {
    return resolveLaunchNav(
      navigation?.drawer,
      locale,
      NAV_DRAWER_ROUTE_KEYS,
      (key) => fallbackNavItem(key as NavRouteKey, routeLabelByKey[key as NavRouteKey]),
    );
  }, [locale, navigation?.drawer, routeLabelByKey]);

  const shopPreviewItems = useMemo<ShopPreviewItem[]>(() => {
    const fallbackItems: ShopPreviewItem[] = [
      {
        href: NAV_ROUTE.products.path,
        label: routeLabelByKey.products,
        imageAlt: copy.nav.shopPreviewPlaceholder,
        imageSrc: null,
      },
      {
        href: NAV_ROUTE.shopByMeaning.path,
        label: routeLabelByKey.shopByMeaning,
        imageAlt: copy.nav.shopPreviewPlaceholder,
        imageSrc: null,
      },
      {
        href: NAV_ROUTE.gifts.path,
        label: routeLabelByKey.gifts,
        imageAlt: copy.nav.shopPreviewPlaceholder,
        imageSrc: null,
      },
    ];

    if (!mounted) return fallbackItems;

    const launchProducts = getProducts().filter(productHasRealImage).slice(0, 3);
    if (launchProducts.length > 0) {
      return launchProducts.map((product) => ({
        href: `/products/${product.slug}`,
        label: product.name,
        imageAlt: product.name,
        imageSrc: imgUrl(preferHomeCardDisplaySrc(product), 360),
      }));
    }

    return fallbackItems;
  }, [
    copy.nav.shopPreviewPlaceholder,
    mounted,
    routeLabelByKey.gifts,
    routeLabelByKey.products,
    routeLabelByKey.shopByMeaning,
  ]);

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
      if (scopeParams.feeling) next.set('feeling', scopeParams.feeling);
    }

    const queryString = next.toString();
    return queryString ? `/search?${queryString}` : '/search';
  }

  function submitSearch(rawQuery: string) {
    router.push(buildSearchDestination(rawQuery));
    setSearchFocused(false);
    setActiveSuggestionIndex(-1);
  }

  function handleSuggestionSelect(suggestion: SearchSuggestion) {
    router.push(suggestion.href);
    setSearchFocused(false);
    setActiveSuggestionIndex(-1);
  }

  function clearSearch() {
    setQ('');
    setActiveSuggestionIndex(-1);
    if (pathname === '/search') {
      router.push(buildSearchDestination(''));
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

  const [isHeaderHidden, setIsHeaderHidden] = useState(false);
  const [heroScrolledPast, setHeroScrolledPast] = useState(!overlayOnHero);
  const lastScrollY = useRef(0);
  const headerHeightRef = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const headerHeight = headerHeightRef.current;
      if (currentScrollY > lastScrollY.current && currentScrollY > headerHeight && currentScrollY > 200) {
        setIsHeaderHidden(true);
      } else {
        setIsHeaderHidden(false);
      }
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const updateHeaderHeight = () => {
      headerHeightRef.current = Math.round(header.getBoundingClientRect().height);
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
    if (!overlayOnHero) {
      setHeroScrolledPast(true);
      return;
    }

    setHeroScrolledPast(false);
    const sentinel = document.getElementById('home-hero-bottom-sentinel');
    if (!sentinel) {
      setHeroScrolledPast(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setHeroScrolledPast(!entry?.isIntersecting);
      },
      { root: null, rootMargin: '0px', threshold: 0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [overlayOnHero, pathname]);

  const isOverHero = overlayOnHero && !heroScrolledPast;
  const logoVariant = isOverHero ? 'light' : 'dark';
  const navToneClass = isOverHero ? 'text-white/90 hover:text-white' : 'text-obsidian/90 hover:text-obsidian';
  const navActiveClass = isOverHero
    ? 'nav-link-underline--active rounded-full bg-white/18 text-white shadow-sm ring-1 ring-white/22'
    : 'nav-link-underline--active rounded-full bg-obsidian text-white shadow-sm';
  const iconToneClass = isOverHero ? 'text-white/88 hover:bg-white/10' : 'text-obsidian/85 hover:bg-black/4';
  const searchChipClass = isOverHero
    ? 'border-white/28 bg-white/10 text-white hover:bg-white/16'
    : 'border-stone/40 bg-white/70 text-obsidian hover:bg-white';
  const handleCartNavigation = useCallback(() => {
    setMiniCartOpen(false);
    router.push('/cart');
  }, [router, setMiniCartOpen]);

  function isPathActive(href: string, end?: boolean) {
    if (href === '/') return pathname === '/';
    if (end) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <header
      ref={headerRef}
      className={`glass-nav fixed top-0 z-100 w-full transition-transform duration-300 ease-in-out ${overlayOnHero ? 'glass-nav--over-hero' : ''} ${heroScrolledPast ? 'glass-nav--scrolled' : ''} ${isHeaderHidden ? 'md:-translate-y-full' : 'translate-y-0'}`}
      role="banner"
    >
      {placedOrderMedusaId ? (
        <div
          className="border-b border-stone/35 bg-(--mint-frost) px-[max(1rem,env(safe-area-inset-left,0px))] py-2.5 pr-[max(1rem,env(safe-area-inset-right,0px))] font-body text-sm text-obsidian"
          role="status"
        >
          <div className="mx-auto flex max-w-[1920px] flex-wrap items-center justify-between gap-3">
            <p className="min-w-0 flex-1 leading-snug">{copy.shell.orderPlacedHint}</p>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <Link
                href={`/checkout/success?order_id=${encodeURIComponent(placedOrderMedusaId)}`}
                className="font-label inline-flex min-h-10 items-center rounded-sm border border-obsidian/25 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-obsidian hover:bg-white/80"
              >
                {copy.shell.orderPlacedViewReceipt}
              </Link>
              <button
                type="button"
                className="font-label inline-flex min-h-10 items-center rounded-sm px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-clay underline-offset-4 hover:text-obsidian hover:underline"
                onClick={() => {
                  clearPlacedOrderMedusaIdHint();
                  setPlacedOrderMedusaId(null);
                }}
              >
                {copy.shell.orderPlacedDismiss}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <div className="mx-auto max-w-[1920px] md:hidden">
        <div className="flex items-center justify-between gap-2 py-3 pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))]">
          <button
            type="button"
            className={`inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-sm ${iconToneClass}`}
            aria-expanded={menuVisible && menuPanelOpen}
            aria-controls="primary-nav-drawer"
            aria-label={menuVisible && menuPanelOpen ? copy.shell.closeMenu : copy.shell.openMenu}
            onClick={toggleMenu}
          >
            <AppIcon name={menuVisible && menuPanelOpen ? 'close' : 'menu'} className="h-6 w-6" />
          </button>
          <Link href="/" className="flex min-w-0 flex-1 justify-center overflow-visible px-1" aria-label={copy.shell.home}>
            <BrandLogo variant={logoVariant} showArabic={false} size="drawer" />
          </Link>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-sm ${iconToneClass}`}
              aria-label={copy.nav.searchOpen}
              onClick={() => router.push('/search?focus=1')}
            >
              <AppIcon name="search" className="h-6 w-6" />
            </button>
            <button
              type="button"
              className={`relative inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-sm ${iconToneClass}`}
              aria-label={mounted && wishlistCount > 0 ? `Wishlist (${wishlistCount})` : 'Wishlist'}
              onClick={() => router.push('/wishlist')}
            >
              <AppIcon name="favorite" className="h-6 w-6" />
              {mounted && wishlistCount > 0 ? (
                <span className={`pointer-events-none absolute right-0 top-0 flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 font-label text-[10px] font-semibold leading-none ${isOverHero ? 'bg-white text-obsidian' : 'bg-obsidian text-white'}`}>
                  {wishlistCount > 99 ? '99+' : wishlistCount}
                </span>
              ) : null}
            </button>
            <button
              type="button"
              className={`relative inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-sm ${iconToneClass}`}
              aria-label={mounted && totalQty > 0 ? `${copy.shell.cart} (${totalQty})` : copy.shell.cart}
              onClick={handleCartNavigation}
            >
              <AppIcon name="shopping_bag" className="h-6 w-6" />
              {mounted && totalQty > 0 ? (
                <span className={`pointer-events-none absolute right-0 top-0 flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 font-label text-[10px] font-semibold leading-none ${isOverHero ? 'bg-white text-obsidian' : 'bg-obsidian text-white'}`}>
                  {totalQty > 99 ? '99+' : totalQty}
                </span>
              ) : null}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto hidden max-w-[1920px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 py-2.5 pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] md:grid md:gap-6 md:py-2.5 md:pl-6 md:pr-6 lg:pl-8 lg:pr-8">
        <div className="flex shrink-0 items-center gap-4">
          <Link href="/" className="flex shrink-0 items-center" aria-label={copy.shell.home}>
            <BrandLogo variant={logoVariant} showArabic={false} />
          </Link>
        </div>

        <nav className="hidden min-w-0 items-center justify-center gap-1 md:flex" aria-label="Primary shortcuts">
          {primaryNavItems.map((item) => {
            const navLink = (
              <Link
                key={item.key}
                href={item.href}
                className={`nav-link-underline font-body px-2.5 py-2 text-[0.95rem] font-medium transition-colors lg:px-3 ${
                    isPathActive(item.href, item.end)
                      ? navActiveClass
                      : `rounded-sm ${navToneClass}`
                  }`}
              >
                {item.label}
                {item.badge ? (
                  <span className="ml-1 rounded-full bg-ember/10 px-1.5 py-0.5 text-[9px] text-ember">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );

            if (item.key !== 'products') return navLink;

            return (
              <div key={item.key} className="group/shop-nav relative">
                {navLink}
                <div className="invisible absolute left-0 top-[calc(100%+0.65rem)] z-120 w-[min(34rem,calc(100vw-2rem))] opacity-0 transition duration-200 group-hover/shop-nav:visible group-hover/shop-nav:opacity-100 group-focus-within/shop-nav:visible group-focus-within/shop-nav:opacity-100">
                  <div className="rounded-md border border-stone/35 bg-papyrus p-3 shadow-[0_22px_54px_rgba(26,26,26,0.16)]">
                    <div className="mb-3 flex items-center justify-between gap-4">
                      <p className="font-label text-[10px] font-semibold uppercase tracking-[0.18em] text-label">
                        {copy.nav.shopPreviewTitle}
                      </p>
                      <Link
                        href={NAV_ROUTE.products.path}
                        className="font-label text-[10px] font-semibold uppercase tracking-[0.14em] text-obsidian underline-offset-4 hover:underline"
                      >
                        {copy.nav.shopPreviewBrowseAll}
                      </Link>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {shopPreviewItems.map((previewItem) => (
                        <ShopPreviewTile
                          key={`${previewItem.href}-${previewItem.label}`}
                          item={previewItem}
                          placeholderLabel={copy.nav.shopPreviewPlaceholder}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </nav>

        <div className="relative flex shrink-0 items-center justify-end gap-2 md:gap-2 lg:gap-3">
          <form
            onSubmit={handleSearchSubmit}
            className={`relative transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${searchFocused || q.trim() ? 'w-full max-w-md min-w-[16rem]' : 'w-auto'}`}
          >
            <label htmlFor="nav-search-desktop" className="sr-only">
              {copy.nav.searchPlaceholder}
            </label>
            {!(searchFocused || q.trim()) ? (
              <button
                type="button"
                className={`font-body inline-flex min-h-11 items-center gap-2 rounded-full border px-3.5 text-[13px] font-medium transition-colors ${searchChipClass}`}
                onClick={() => {
                  setSearchFocused(true);
                  window.requestAnimationFrame(() => desktopSearchInputRef.current?.focus());
                }}
              >
                <AppIcon name="search" className="h-[18px] w-[18px]" />
                <span>{copy.nav.searchOpen}</span>
              </button>
            ) : null}
            <input
              ref={desktopSearchInputRef}
              id="nav-search-desktop"
              type="search"
              placeholder={copy.nav.searchPlaceholder}
              value={q}
              onChange={(event) => setQ(event.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => {
                setTimeout(() => {
                  setSearchFocused(false);
                }, 200);
              }}
              onKeyDown={handleSearchKeyDown}
              className={`font-body box-border h-10 w-full border-b text-[13px] leading-normal transition-all duration-500 bg-transparent outline-none ${
                searchFocused || q.trim()
                  ? `px-4 pl-10 pr-20 border-stone/30 focus:border-obsidian placeholder:text-clay/70 ${isOverHero ? 'text-white border-white/30 focus:border-white placeholder:text-white/55' : 'text-obsidian focus:border-obsidian placeholder:text-clay/70'}`
                  : 'pointer-events-none absolute h-px w-px overflow-hidden opacity-0'
              }`}
              autoComplete="off"
              aria-expanded={suggestionsOpen}
              aria-controls="nav-search-suggestions"
              aria-activedescendant={activeSuggestionId}
              role="combobox"
            />
            {searchFocused || q.trim() ? (
              <span
                className={`pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 ${isOverHero ? 'text-white/70' : 'text-obsidian/62'}`}
                aria-hidden
              >
                <AppIcon name="search" className="h-[18px] w-[18px]" />
              </span>
            ) : null}
            <div className={`absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1 transition-opacity duration-300 ${searchFocused || q.trim() ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              {q.trim() ? (
                <button
                  type="button"
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${isOverHero ? 'text-white/75 hover:bg-white/10' : 'text-obsidian/70 hover:bg-black/5'}`}
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
                className={`inline-flex h-8 items-center justify-center rounded-full px-3 transition-colors ${isOverHero ? 'text-white/85 hover:text-white' : 'text-obsidian/80 hover:text-obsidian'}`}
              >
                <span className="font-label text-[10px] font-semibold uppercase tracking-[0.18em]">{copy.nav.searchSubmit}</span>
              </button>
            </div>
          </form>

          {suggestionsOpen ? (
            <div className="absolute right-0 top-[calc(100%+0.75rem)] z-120 w-full min-w-[18rem] max-w-md">
              <SearchSuggestionPanel
                groups={suggestionGroups}
                activeIndex={activeSuggestionIndex}
                listboxId="nav-search-suggestions"
                onHover={setActiveSuggestionIndex}
                onSelect={handleSuggestionSelect}
              />
            </div>
          ) : null}

          <button
            type="button"
            className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-sm transition-colors ${iconToneClass}`}
            aria-label={
              mounted && wishlistCount > 0
                ? locale === 'ar'
                  ? `المفضلة (${wishlistCount})`
                  : `Wishlist (${wishlistCount})`
                : locale === 'ar'
                  ? 'المفضلة'
                  : 'Wishlist'
            }
            onClick={() => router.push('/wishlist')}
          >
            <AppIcon name="favorite" className="h-6 w-6" />
          </button>
          <button
            type="button"
            className={`relative inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-sm transition-colors ${iconToneClass}`}
            aria-label={mounted && totalQty > 0 ? `${copy.shell.cart} (${totalQty})` : copy.shell.cart}
            onClick={handleCartNavigation}
          >
            <AppIcon name="shopping_bag" className="h-6 w-6" />
            {mounted && totalQty > 0 ? (
              <span className={`pointer-events-none absolute right-0.5 top-0.5 flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 font-label text-[10px] font-semibold leading-none ${isOverHero ? 'bg-white text-obsidian' : 'bg-obsidian text-white'}`}>
                {totalQty > 99 ? '99+' : totalQty}
              </span>
            ) : null}
          </button>
        </div>
      </div>

      {menuVisible
        ? createPortal(
          <div className="fixed inset-0 z-200">
            <button
              type="button"
              tabIndex={-1}
              className={`absolute inset-0 bg-obsidian/45 backdrop-blur-[2px] ${motionClass} ${menuPanelOpen ? 'opacity-100' : 'opacity-0'}`}
              aria-label={copy.shell.closeMenu}
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
                {copy.shell.menu}
              </h2>
              <div className="relative z-20 flex shrink-0 items-center justify-between border-b border-stone/25 bg-papyrus px-4 py-3 shadow-[0_1px_0_rgba(26,26,26,0.06)]">
                <Link href="/" className="flex items-center" onClick={closeMenu} aria-label={copy.shell.home}>
                  <BrandLogo variant="dark" />
                </Link>
                <button
                  ref={drawerCloseBtnRef}
                  type="button"
                  className="relative z-30 inline-flex min-h-11 min-w-11 items-center justify-center rounded-sm text-obsidian/90"
                  aria-label={copy.shell.closeMenu}
                  onClick={closeMenu}
                >
                  <AppIcon name="close" className="h-6 w-6" />
                </button>
              </div>
              <nav
                className="relative z-0 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overscroll-y-contain bg-papyrus px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))]"
                aria-label={copy.shell.menu}
              >
                <div className="mb-6 border-b border-stone/20 pb-5">
                  <p className="mb-3 font-body text-sm font-medium text-warm-charcoal">{copy.shell.language}</p>
                  <LocaleToggle locale={locale} setLocale={setLocale} tone="dark" label={copy.shell.language} />
                </div>
                <div className="mb-5 border-b border-stone/20 pb-5">
                  <div className="mb-3 flex items-center justify-between gap-4">
                    <p className="font-label text-[10px] font-semibold uppercase tracking-[0.18em] text-label">
                      {copy.nav.shopPreviewTitle}
                    </p>
                    <Link
                      href={NAV_ROUTE.products.path}
                      className="font-label text-[10px] font-semibold uppercase tracking-[0.14em] text-obsidian underline-offset-4"
                      onClick={closeMenu}
                    >
                      {copy.nav.shopPreviewBrowseAll}
                    </Link>
                  </div>
                  <div className="grid grid-cols-3 gap-2.5">
                    {shopPreviewItems.map((previewItem) => (
                      <ShopPreviewTile
                        key={`${previewItem.href}-${previewItem.label}`}
                        item={previewItem}
                        placeholderLabel={copy.nav.shopPreviewPlaceholder}
                        onClick={closeMenu}
                      />
                    ))}
                  </div>
                </div>
                {drawerNavItems.map((item) => (
                  <Link
                    key={item.key}
                    href={item.href}
                    className={drawerNavLinkClass(isPathActive(item.href, item.end))}
                    onClick={closeMenu}
                  >
                    <span className="min-w-0 flex-1">{item.label}</span>
                    {item.badge ? (
                      <span className="ml-3 rounded-full bg-ember/10 px-2 py-1 font-label text-[9px] font-semibold uppercase tracking-[0.12em] text-ember">
                        {item.badge}
                      </span>
                    ) : null}
                  </Link>
                ))}
                <Link
                  href="/cart"
                  className={drawerNavLinkClass(pathname === '/cart')}
                  onClick={() => {
                    setMiniCartOpen(false);
                    closeMenu();
                  }}
                  aria-label={mounted && totalQty > 0 ? `${copy.shell.cart} (${totalQty})` : copy.shell.cart}
                >
                  {copy.shell.cart}
                  {mounted && totalQty > 0 ? ` (${totalQty})` : ''}
                </Link>
                {drawerWhatsAppUrl ? (
                  <a
                    href={drawerWhatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={drawerNavLinkClass(false)}
                    onClick={closeMenu}
                  >
                    {locale === 'ar' ? 'واتساب — مساعدة المقاس' : 'WhatsApp size help'}
                  </a>
                ) : null}
              </nav>
            </div>
          </div>,
          document.body,
        )
        : null}
    </header>
  );
}
