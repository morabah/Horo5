'use client';

import { usePathname } from 'next/navigation';
import { useAppSearchParams } from '@/storefront/hooks/useAppSearchParams';
import { useEffect, useMemo, useState, type ReactNode } from 'react';

import { trackHomeScrollMilestone, trackHomeView } from '../analytics/funnel';
import { HomeArtistSpotlight } from '../components/HomeArtistSpotlight';
import { HomeBehindThePiece } from '../components/HomeBehindThePiece';
import { HomeEditorialFeature } from '../components/HomeEditorialFeature';
import { HomeServiceTrust } from '../components/home/HomeServiceTrust';
import { HomeFeelingCards } from '../components/HomeFeelingCards';
import { HomeFeelingQuiz } from '../components/HomeFeelingQuiz';
import { HomeFeaturedPiece } from '../components/HomeFeaturedPiece';
import { HomeFirstDropCircle } from '../components/HomeFirstDropCircle';
import { HomeHeroWearMean } from '../components/HomeHeroWearMean';
import { HomeGiftBlock } from '../components/HomeGiftBlock';
import { HomeLatestDrop } from '../components/HomeLatestDrop';
import { HomeOccasionCards } from '../components/HomeOccasionCards';
import { PillarSurfaceMap } from '../components/PillarSurfaceMap';
import { HomePrimaryRoutes } from '../components/HomePrimaryRoutes';
import { HomeSeenOnYou } from '../components/HomeSeenOnYou';
import { HomeStartHere } from '../components/HomeStartHere';
import { HomeTrustRibbon } from '../components/HomeTrustRibbon';
import { HomeOurStory } from '../components/home/HomeOurStory';
import { useScrollReveal } from '../hooks/useScrollReveal';
import type { RuntimeCatalog, StorefrontHomepageSection } from '../data/catalog-types';
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
 * hero · trust ribbon · founding drop · feeling grid · editorial · gift block · our story.
 *
 * Operators can override the order or re-enable additional sections from the
 * homepage_section module. `store.metadata.homepage.sectionsEnabled` remains a
 * backward-compatible lightweight fallback. Unknown keys are ignored at render time.
 */
const HOME_DEFAULT_SECTIONS: readonly string[] = [
  'hero',
  'trust_ribbon',
  'founding_drop',
  'feeling_grid',
  'editorial_feature',
  'gift_block',
  'proof_strip',
  'our_story',
];

type HomeSectionRenderer = (ctx: { initialProducts?: Product[]; section?: StorefrontHomepageSection }) => ReactNode;

const HOME_SECTION_COMPONENTS: Record<string, HomeSectionRenderer> = {
  hero: ({ section }) => <HomeHeroWearMean section={section} />,
  trust_ribbon: ({ section }) => <HomeTrustRibbon section={section} />,
  primary_routes: () => <HomePrimaryRoutes />,
  founding_drop: ({ initialProducts, section }) => <HomeStartHere products={initialProducts} section={section} />,
  featured_piece: () => <HomeFeaturedPiece />,
  behind_the_piece: () => <HomeBehindThePiece artists={getArtists()} />,
  feeling_grid: ({ section }) => <HomeFeelingCards section={section} />,
  editorial_feature: ({ section }) => <HomeEditorialFeature section={section} />,
  proof_strip: () => <HomeServiceTrust />,
  feeling_quiz: () => <HomeFeelingQuiz />,
  occasion_grid: () => <HomeOccasionCards />,
  why_horo: ({ section }) => <HomeOurStory section={section} />,
  our_story: ({ section }) => <HomeOurStory section={section} />,
  gift_block: ({ section }) => <HomeGiftBlock section={section} />,
  latest_drop: () => <HomeLatestDrop />,
  pillar_surface_map: () => <PillarSurfaceMap />,
  first_drop_circle: () => <HomeFirstDropCircle />,
  artist_spotlight: () =>
    HOME_FEATURED_ARTIST || getArtists().length > 0 ? <HomeArtistSpotlight /> : null,
  seen_on_you: () => (HOME_SEEN_ON_YOU.length >= 4 ? <HomeSeenOnYou /> : null),
};

export function Home({
  homepageSections,
  initialCatalog,
  initialProducts,
  sectionsEnabled,
}: {
  homepageSections?: StorefrontHomepageSection[] | null;
  initialCatalog?: RuntimeCatalog | null;
  initialProducts?: Product[];
  /** Backward-compatible section list from Medusa `store.metadata.homepage.sectionsEnabled`. */
  sectionsEnabled?: string[] | null;
} = {}) {
  if (initialCatalog) {
    setRuntimeCatalog(initialCatalog);
  } else if (initialProducts?.length) {
    setRuntimeCatalog({ products: initialProducts });
  }

  useScrollReveal();
  const pathname = usePathname();
  const [searchParams, setSearchParams] = useAppSearchParams();
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
    if (pathname !== '/') return;
    if (sessionStorage.getItem(HOME_VIEW_SESSION_KEY)) return;
    sessionStorage.setItem(HOME_VIEW_SESSION_KEY, '1');
    trackHomeView({ compact_home: compactHome });
  }, [pathname, compactHome]);

  useEffect(() => {
    if (pathname !== '/') return;
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
  }, [pathname, compactHome]);

  const orderedSections = useMemo(() => {
    const fromHomepage = (homepageSections ?? [])
      .filter((section) => section.active !== false)
      .map((section) => ({
        key: section.key in HOME_SECTION_COMPONENTS ? section.key : section.type,
        section,
      }))
      .filter((entry) => entry.key in HOME_SECTION_COMPONENTS);
    if (fromHomepage.length > 0) {
      return fromHomepage;
    }

    const fromOps = (sectionsEnabled ?? []).filter((key) => key in HOME_SECTION_COMPONENTS);
    return (fromOps.length > 0 ? fromOps : HOME_DEFAULT_SECTIONS).map((key) => ({ key, section: undefined }));
  }, [homepageSections, sectionsEnabled]);

  return (
    <div className="home-grain">
      {orderedSections.map(({ key, section }) => {
        const renderer = HOME_SECTION_COMPONENTS[key];
        if (!renderer) return null;
        const node = renderer({ initialProducts, section });
        if (!node) return null;
        return <div key={section?.id ?? key}>{node}</div>;
      })}
    </div>
  );
}
