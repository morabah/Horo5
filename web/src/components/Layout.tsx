import { Outlet, useLocation } from 'react-router-dom';
import { AppErrorBoundary } from './AppErrorBoundary';
import { Nav } from './Nav';
import { Footer } from './Footer';
import { SeoHead } from './SeoHead';

export function Layout() {
  const { pathname } = useLocation();
  const isHome = pathname === '/';

  return (
    <>
      <SeoHead />
      <a
        href="#main-content"
        className="sr-only left-4 top-[max(0.75rem,env(safe-area-inset-top))] z-[300] rounded-sm border border-outline-variant/50 bg-papyrus px-4 py-3 font-label text-[11px] font-semibold uppercase tracking-widest text-obsidian shadow-md outline-none ring-deep-teal focus:not-sr-only focus:fixed focus:ring-2"
      >
        Skip to main content
      </a>
      <Nav />
      <main id="main-content" className={isHome ? '' : 'pt-32 md:pt-24'}>
        <AppErrorBoundary key={pathname}>
          <Outlet />
        </AppErrorBoundary>
      </main>
      <Footer />
    </>
  );
}
