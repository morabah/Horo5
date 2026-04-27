import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { trackHomeScrollMilestone, trackHomeView } from '../analytics/funnel';
import { HomeArtistSpotlight } from '../components/HomeArtistSpotlight';
import { HomeBehindThePiece } from '../components/HomeBehindThePiece';
import { HomeFeelingCards } from '../components/HomeFeelingCards';
import { HomeFeaturedPiece } from '../components/HomeFeaturedPiece';
import { HomeFirstDropCircle } from '../components/HomeFirstDropCircle';
import { HomeHeroWearMean } from '../components/HomeHeroWearMean';
import { HomeGiftBlock } from '../components/HomeGiftBlock';
import { HomeOccasionCards } from '../components/HomeOccasionCards';
import { HomePrimaryRoutes } from '../components/HomePrimaryRoutes';
import { HomeSeenOnYou } from '../components/HomeSeenOnYou';
import { HomeStartHere } from '../components/HomeStartHere';
import { HomeTrustRibbon } from '../components/HomeTrustRibbon';
import { HomeWhyHoro } from '../components/HomeWhyHoro';
import { useScrollReveal } from '../hooks/useScrollReveal';
import type { RuntimeCatalog } from '../data/catalog-types';
import {
  getArtists,
  getFeeling,
  setRuntimeCatalog,
  type Product,
} from '../data/site';
import { HOME_FEATURED_ARTIST, HOME_SEEN_ON_YOU } from '../data/homeContent';

const COMPACT_HOME_STORAGE = 'horo_home_compact';
const HOME_VIEW_SESSION_KEY = 'horo_home_view_session_v1';

/**
 * Default homepage section list.
 *
 * Keep the launch-mode storefront short and shop-led (audit P1):
 * hero · trust ribbon · founding drop grid · feeling grid · gift block.
 *
 * Operators can override the order or re-enable additional sections from Medusa
 * Admin via `store.metadata.homepage.sectionsEnabled`. The storefront only renders
 * keys present in this map; unknown keys are ignored at render time.
 */
const HOME_DEFAULT_SECTIONS: readonly string[] = [
  'hero',
  'trust_ribbon',
  'founding_drop',
  'feeling_grid',
  'gift_block',
];

type HomeSectionRenderer = (ctx: { initialProducts?: Product[] }) => ReactNode;

const HOME_SECTION_COMPONENTS: Record<string, HomeSectionRenderer> = {
  hero: () => <HomeHeroWearMean />,
  trust_ribbon: () => <HomeTrustRibbon />,
  primary_routes: () => <HomePrimaryRoutes />,
  founding_drop: ({ initialProducts }) => <HomeStartHere products={initialProducts} />,
  featured_piece: () => <HomeFeaturedPiece />,
  behind_the_piece: () => <HomeBehindThePiece />,
  feeling_grid: () => <HomeFeelingCards />,
  occasion_grid: () => <HomeOccasionCards />,
  why_horo: () => <HomeWhyHoro />,
  gift_block: () => <HomeGiftBlock />,
  first_drop_circle: () => <HomeFirstDropCircle />,
  artist_spotlight: () =>
    HOME_FEATURED_ARTIST || getArtists().length > 0 ? <HomeArtistSpotlight /> : null,
  seen_on_you: () => (HOME_SEEN_ON_YOU.length >= 4 ? <HomeSeenOnYou /> : null),
};

export function Home({
  initialCatalog,
  initialProducts,
  sectionsEnabled,
}: {
  initialCatalog?: RuntimeCatalog | null;
  initialProducts?: Product[];
  /** Operator-controlled section list from Medusa `store.metadata.homepage.sectionsEnabled`. Falls back to the default 5-section list. */
  sectionsEnabled?: string[] | null;
} = {}) {
  if (initialCatalog) {
    setRuntimeCatalog(initialCatalog);
  } else if (initialProducts?.length) {
    setRuntimeCatalog({ products: initialProducts });
  }

  useScrollReveal();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [compactHome, setCompactHome] = useState(false);

  useEffect(() => {
    const q = searchParams.get('compact');
    if (q === '1') sessionStorage.setItem(COMPACT_HOME_STORAGE, '1');
    setCompactHome(q === '1' || sessionStorage.getItem(COMPACT_HOME_STORAGE) === '1');
  }, [searchParams]);

  useEffect(() => {
    const feelingParam = searchParams.get('feeling') ?? searchParams.get('vibe');
    if (!feelingParam || !getFeeling(feelingParam)) return;

    const id = `feeling-${feelingParam}`;
    const t = window.setTimeout(() => {
      const el = document.getElementById(id);
      if (!el) return;
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete('feeling');
          next.delete('vibe');
          return next;
        },
        { replace: true },
      );
    }, 120);

    return () => window.clearTimeout(t);
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (location.pathname !== '/') return;
    if (sessionStorage.getItem(HOME_VIEW_SESSION_KEY)) return;
    sessionStorage.setItem(HOME_VIEW_SESSION_KEY, '1');
    trackHomeView({ compact_home: compactHome });
  }, [location.pathname, compactHome]);

  useEffect(() => {
    if (location.pathname !== '/') return;
    function onScroll() {
      const el = document.documentElement;
      const max = el.scrollHeight - el.clientHeight;
      if (max <= 0) return;
      const p = Math.round((el.scrollTop / max) * 100);
      for (const b of [25, 50, 75, 90] as const) {
        if (p >= b) trackHomeScrollMilestone(b, compactHome);
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [location.pathname, compactHome]);

  const orderedSectionKeys = useMemo(() => {
    const fromOps = (sectionsEnabled ?? []).filter((key) => key in HOME_SECTION_COMPONENTS);
    return fromOps.length > 0 ? fromOps : HOME_DEFAULT_SECTIONS;
  }, [sectionsEnabled]);

  return (
    <div className="home-grain">
      {orderedSectionKeys.map((key) => {
        const renderer = HOME_SECTION_COMPONENTS[key];
        if (!renderer) return null;
        const node = renderer({ initialProducts });
        if (!node) return null;
        return <div key={key}>{node}</div>;
      })}
    </div>
  );
}
