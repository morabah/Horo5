import { useEffect } from 'react';
import { Outlet, useLocation, matchPath } from 'react-router-dom';
import { getProduct, getVibe } from '../data/site';
import { Nav } from './Nav';
import { Footer } from './Footer';

const DEFAULT_DOCUMENT_TITLE = 'HORO Egypt | Passion Wear';

export function Layout() {
  const { pathname } = useLocation();
  const isHome = pathname === '/';

  useEffect(() => {
    const vibeMatch = matchPath({ path: '/vibes/:slug', end: true }, pathname);
    const productMatch = matchPath({ path: '/products/:slug', end: true }, pathname);
    const occasionMatch = matchPath({ path: '/occasions/:slug', end: true }, pathname);

    if (pathname === '/') {
      document.title = DEFAULT_DOCUMENT_TITLE;
    } else if (pathname === '/vibes') {
      document.title = 'Shop by Vibe | HORO Egypt';
    } else if (vibeMatch?.params.slug) {
      const v = getVibe(vibeMatch.params.slug);
      document.title = v ? `${v.name} | HORO Egypt` : DEFAULT_DOCUMENT_TITLE;
    } else if (pathname === '/occasions') {
      document.title = 'Shop by Occasion | HORO Egypt';
    } else if (occasionMatch?.params.slug) {
      document.title = 'Occasion | HORO Egypt';
    } else if (productMatch?.params.slug) {
      const p = getProduct(productMatch.params.slug);
      document.title = p ? `${p.name} | HORO Egypt` : DEFAULT_DOCUMENT_TITLE;
    } else if (pathname === '/cart') {
      document.title = 'Your Cart | HORO Egypt';
    } else if (pathname === '/checkout') {
      document.title = 'Checkout | HORO Egypt';
    } else if (pathname === '/checkout/success') {
      document.title = 'Order Confirmed | HORO Egypt';
    } else if (pathname === '/search') {
      document.title = 'Search | HORO Egypt';
    } else if (pathname === '/about') {
      document.title = 'About | HORO Egypt';
    } else {
      document.title = 'Page not found | HORO Egypt';
    }
  }, [pathname]);

  return (
    <>
      <Nav />
      <main className={isHome ? '' : 'pt-32 md:pt-24'}>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
