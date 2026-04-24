import { useEffect, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { trackHomeScrollMilestone, trackHomeView } from '../analytics/funnel';
import { HomeArtistSpotlight } from '../components/HomeArtistSpotlight';
import { HomeFeelingCards } from '../components/HomeFeelingCards';
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

export function Home({
  initialCatalog,
  initialProducts,
}: { initialCatalog?: RuntimeCatalog | null; initialProducts?: Product[] } = {}) {
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

  return (
    <div className="home-grain">
      <HomeHeroWearMean />
      <HomeTrustRibbon />
      <HomePrimaryRoutes />
      <HomeStartHere products={initialProducts} />
      <HomeFeelingCards />
      <HomeOccasionCards />
      <HomeWhyHoro />
      <HomeGiftBlock />
      {(HOME_FEATURED_ARTIST || getArtists().length > 0) && <HomeArtistSpotlight />}
      {HOME_SEEN_ON_YOU.length >= 4 && <HomeSeenOnYou />}
    </div>
  );
}
