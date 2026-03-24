import { useEffect } from 'react';
import { Outlet, useLocation, matchPath } from 'react-router-dom';
import { getVibe } from '../data/site';
import { Nav } from './Nav';
import { Footer } from './Footer';

const DEFAULT_DOCUMENT_TITLE = 'HORO Egypt | Digital Fashion Lookbook';

export function Layout() {
  const { pathname } = useLocation();
  const isHome = pathname === '/';

  useEffect(() => {
    const vibeMatch = matchPath({ path: '/vibes/:slug', end: true }, pathname);
    if (pathname === '/vibes') {
      document.title = 'Shop by Vibe | HORO Egypt';
    } else if (vibeMatch?.params.slug) {
      const v = getVibe(vibeMatch.params.slug);
      document.title = v ? `${v.name} | HORO Egypt` : DEFAULT_DOCUMENT_TITLE;
    } else {
      document.title = DEFAULT_DOCUMENT_TITLE;
    }
  }, [pathname]);

  return (
    <>
      <Nav />
      <main className={isHome ? '' : 'pt-20 md:pt-24'}>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
