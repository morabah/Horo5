import { Outlet, useLocation } from 'react-router-dom';
import { Nav } from './Nav';
import { Footer } from './Footer';

export function Layout() {
  const { pathname } = useLocation();
  const isHome = pathname === '/';

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
