import { Link } from 'react-router-dom';
import { vibes } from '../data/site';
import { heroStreet, imgUrl, vibeCovers } from '../data/images';

export function ShopByVibe() {
  return (
    <div className="bg-papyrus px-4 py-10 md:px-8 md:py-12">
      <div className="container mx-auto max-w-[1200px]">
        <p className="label mb-2">Shop by vibe</p>
        <h1 className="font-headline text-obsidian mb-3 text-[clamp(1.5rem,3vw,2rem)] font-medium leading-snug">Which vibe is yours?</h1>
        <p className="mb-8 max-w-xl text-warm-charcoal">Every design starts with a feeling. Start with yours.</p>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {vibes.map((v) => {
            const cover = vibeCovers[v.slug] ?? heroStreet;
            return (
              <Link
                key={v.slug}
                to={`/vibes/${v.slug}`}
                className="group flex h-[min(420px,58vh)] flex-col overflow-hidden rounded-2xl shadow-[0_8px_30px_rgba(26,26,26,0.12)] ring-1 ring-black/5 transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(26,26,26,0.18)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal md:h-[440px]"
              >
                {/* Photo — takes all space above the glass strip (~78% of card) */}
                <div className="relative min-h-0 flex-1">
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                    style={{ backgroundImage: `url(${imgUrl(cover, 960)})` }}
                    aria-hidden
                  />
                  {/* Scrim only in lower third so the hero of the image stays bright */}
                  <div
                    className="pointer-events-none absolute inset-x-0 bottom-0 top-[38%] bg-linear-to-t from-black/45 via-black/10 to-transparent"
                    aria-hidden
                  />
                  <div
                    className="pointer-events-none absolute inset-0 bg-linear-to-tr opacity-25"
                    style={{
                      background: `linear-gradient(to top right, ${v.accent}55, transparent 50%)`,
                    }}
                    aria-hidden
                  />
                </div>

                {/* Compact glass strip — ~22% max; content-sized, not flex-grow */}
                <div className="glass-vibe-card-footer vibe-card-text-strip shrink-0 overflow-hidden border-t border-white/80 px-3 py-2.5 sm:px-3.5">
                  <div className="glass-text-inner flex items-start gap-2.5 px-3 py-2.5">
                    <span
                      className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full shadow-sm ring-2 ring-white/90"
                      style={{ backgroundColor: v.accent }}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <h2 className="glass-text-heading font-headline text-obsidian mb-0.5 text-base font-semibold leading-tight tracking-tight">
                        {v.name}
                      </h2>
                      <p className="font-body text-warm-charcoal line-clamp-2 text-[13px] leading-snug">{v.tagline}</p>
                      <span className="font-label text-deep-teal mt-1.5 block text-[10px] font-semibold uppercase tracking-[0.22em] drop-shadow-sm">
                        Explore →
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <p className="mt-10 text-sm text-clay">Or explore another way:</p>
        <div className="mt-3 flex flex-wrap gap-3">
          <Link className="btn btn-ghost" to="/occasions">
            Shop by Occasion
          </Link>
          <Link className="btn btn-ghost" to="/artists">
            Browse by Artist
          </Link>
        </div>
      </div>
    </div>
  );
}
