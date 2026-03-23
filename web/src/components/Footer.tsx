import { Link } from 'react-router-dom';
import { BrandLogo } from './BrandLogo';

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-obsidian pb-[max(3rem,env(safe-area-inset-bottom))] pt-20 text-[#f5f0e8] sm:pt-32">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-12 px-4 font-body sm:gap-20 sm:px-8 md:grid-cols-4 md:px-12">
        <div className="space-y-8">
          <Link to="/" className="inline-flex items-center" aria-label="HORO — Home">
            <BrandLogo variant="light" />
          </Link>
          <p className="max-w-xs text-sm leading-relaxed text-secondary">
            A digital atelier curating the intersection of wearable art and Egyptian heritage. Vol 01: The Inner Dialogue.
          </p>
        </div>
        <div>
          <h4 className="font-headline mb-8 text-sm font-semibold uppercase tracking-[0.3em] text-primary">Shop</h4>
          <ul className="space-y-4">
            <li>
              <Link className="font-label text-xs uppercase tracking-widest text-secondary transition-colors hover:text-[#f5f0e8]" to="/vibes">
                All Products
              </Link>
            </li>
            <li>
              <Link className="font-label text-xs uppercase tracking-widest text-secondary transition-colors hover:text-[#f5f0e8]" to="/occasions">
                Limited Drops
              </Link>
            </li>
            <li>
              <Link className="font-label text-xs uppercase tracking-widest text-secondary transition-colors hover:text-[#f5f0e8]" to="/artists">
                Art Collaborations
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
                to="/about"
              >
                Our Story
              </Link>
            </li>
            <li>
              <Link className="font-label text-xs uppercase tracking-widest text-secondary transition-colors hover:text-[#f5f0e8]" to="/artists">
                The Artists
              </Link>
            </li>
            <li>
              <a className="font-label text-xs uppercase tracking-widest text-secondary transition-colors hover:text-[#f5f0e8]" href="#">
                Sustainability
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-headline mb-8 text-sm font-semibold uppercase tracking-[0.3em] text-primary">Contact</h4>
          <ul className="space-y-4">
            <li>
              <a className="font-label text-xs uppercase tracking-widest text-secondary transition-colors hover:text-[#f5f0e8]" href="https://instagram.com" target="_blank" rel="noreferrer">
                Instagram
              </a>
            </li>
            <li>
              <a className="font-label text-xs uppercase tracking-widest text-secondary transition-colors hover:text-[#f5f0e8]" href="#">
                Facebook
              </a>
            </li>
            <li>
              <Link className="font-label text-xs uppercase tracking-widest text-secondary transition-colors hover:text-[#f5f0e8]" to="/search">
                Support
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="mx-auto mt-24 flex max-w-[1400px] flex-col items-center justify-between gap-4 border-t border-secondary/20 px-4 pt-10 font-label text-[10px] uppercase tracking-[0.4em] text-secondary sm:mt-40 sm:px-8 md:flex-row md:px-12 md:pt-12">
        <div>© {year} HORO Egypt. Designed for the Introspective.</div>
        <div className="flex space-x-12">
          <a className="transition-colors hover:text-[#f5f0e8]" href="#">
            Privacy Policy
          </a>
          <a className="transition-colors hover:text-[#f5f0e8]" href="#">
            Terms of Service
          </a>
        </div>
      </div>
    </footer>
  );
}
