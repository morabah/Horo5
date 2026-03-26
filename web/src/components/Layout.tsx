import { Outlet, useLocation } from 'react-router-dom';
import { Nav } from './Nav';
import { Footer } from './Footer';
import { SeoHead } from './SeoHead';

export function Layout() {
  const { pathname } = useLocation();
  const isHome = pathname === '/';

  return (
    <>
      <SeoHead />
      <Nav />
      <main className={isHome ? '' : 'pt-32 md:pt-24'}>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
