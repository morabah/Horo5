import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { NAV_ROUTE } from '../lib/navLinks';
import { BrandLogo } from './BrandLogo';

function ComingSoonControl({
  className,
  children,
  label,
}: {
  className: string;
  children: ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      disabled
      className={`${className} cursor-not-allowed opacity-60`}
      title="Coming soon"
      aria-label={`${label} (coming soon)`}
    >
      <span>{children}</span>
      <span className="text-stone/70 normal-case tracking-normal"> (coming soon)</span>
    </button>
  );
}

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-obsidian pb-[max(3rem,env(safe-area-inset-bottom))] pt-20 text-[#f5f0e8] sm:pt-32">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-12 pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] font-body sm:gap-20 sm:px-8 md:grid-cols-4 md:px-12">
        <div className="space-y-8">
          <Link to="/" className="inline-flex items-center" aria-label="HORO — Home">
            <BrandLogo variant="light" />
          </Link>
          <p className="max-w-xs text-sm leading-relaxed text-stone">
            A digital atelier curating the intersection of wearable art and Egyptian heritage. Vol 01: The Inner Dialogue.
          </p>
        </div>
        <div>
          <h4 className="font-headline mb-8 text-sm font-semibold uppercase tracking-[0.3em] text-primary">Shop</h4>
          <ul className="space-y-4">
            <li>
              <Link
                className="font-label text-xs uppercase tracking-widest text-stone transition-colors hover:text-papyrus"
                to={NAV_ROUTE.collection.path}
              >
                {NAV_ROUTE.collection.label}
              </Link>
            </li>
            <li>
              <Link
                className="font-label text-xs uppercase tracking-widest text-stone transition-colors hover:text-papyrus"
                to={NAV_ROUTE.occasions.path}
              >
                {NAV_ROUTE.occasions.label}
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-headline mb-8 text-sm font-semibold uppercase tracking-[0.3em] text-primary">About</h4>
          <ul className="space-y-4">
            <li>
              <Link
                className="font-label text-xs uppercase tracking-widest text-[#f5f0e8] underline decoration-primary underline-offset-8 transition-colors"
                to={NAV_ROUTE.about.path}
              >
                {NAV_ROUTE.about.label}
              </Link>
            </li>
            <li>
              <ComingSoonControl
                label="Sustainability"
                className="font-label cursor-default border-0 bg-transparent p-0 text-left text-xs uppercase tracking-widest text-stone/80"
              >
                Sustainability
              </ComingSoonControl>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-headline mb-8 text-sm font-semibold uppercase tracking-[0.3em] text-primary">Contact</h4>
          <ul className="space-y-4">
            <li>
              <a className="font-label text-xs uppercase tracking-widest text-stone transition-colors hover:text-papyrus" href="https://instagram.com" target="_blank" rel="noreferrer">
                Instagram
              </a>
            </li>
            <li>
              <ComingSoonControl
                label="Facebook"
                className="font-label cursor-default border-0 bg-transparent p-0 text-left text-xs uppercase tracking-widest text-stone/80"
              >
                Facebook
              </ComingSoonControl>
            </li>
            <li>
              <Link className="font-label text-xs uppercase tracking-widest text-stone transition-colors hover:text-papyrus" to="/search">
                Search
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="mx-auto mt-24 flex max-w-[1400px] flex-col items-center justify-between gap-4 border-t border-stone/25 pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] pt-10 font-label text-[10px] uppercase tracking-[0.4em] text-stone sm:mt-40 sm:px-8 md:flex-row md:px-12 md:pt-12">
        <div>© {year} HORO Egypt. Designed for the Introspective.</div>
        <div className="flex flex-wrap justify-center gap-x-12 gap-y-2">
          <ComingSoonControl
            label="Privacy Policy"
            className="cursor-default border-0 bg-transparent p-0 text-[10px] uppercase tracking-[0.4em] text-stone/80"
          >
            Privacy Policy
          </ComingSoonControl>
          <ComingSoonControl
            label="Terms of Service"
            className="cursor-default border-0 bg-transparent p-0 text-[10px] uppercase tracking-[0.4em] text-stone/80"
          >
            Terms of Service
          </ComingSoonControl>
        </div>
      </div>
    </footer>
  );
}
