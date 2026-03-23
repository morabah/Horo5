import { Link } from 'react-router-dom';
import { artists } from '../data/site';
import { artistAvatars } from '../data/images';
import { TeeImage } from '../components/TeeImage';

export function BrowseByArtist() {
  return (
    <div style={{ padding: '2rem 0 3rem' }}>
      <div className="container">
        <p className="label" style={{ marginBottom: '0.5rem' }}>
          Browse by artist
        </p>
        <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', marginBottom: '0.75rem' }}>The people behind the designs</h1>
        <p style={{ color: 'var(--warm-charcoal)', maxWidth: '36rem', marginBottom: '2rem' }}>
          Every HORO design starts with an illustrator&apos;s craft. Explore by the artist whose style speaks to you.
        </p>

        <div style={{ display: 'grid', gap: '1.25rem', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {artists.map((a) => (
            <Link
              key={a.slug}
              to={`/artists/${a.slug}`}
              className="glass-morphism-violet block rounded-2xl p-3 text-inherit no-underline transition-shadow hover:shadow-lg"
            >
              <div className="glass-text-inner flex gap-4 px-4 py-4">
                <div
                  className="h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-white/80 shadow-sm ring-1 ring-white/50"
                  aria-hidden
                >
                  <TeeImage src={artistAvatars[a.slug]} alt="" w={128} style={{ height: '64px' }} />
                </div>
                <div className="min-w-0">
                  <p className="label mb-1">Illustrated by</p>
                  <h2 className="glass-text-heading font-headline text-obsidian mb-1 text-[1.0625rem] font-semibold">{a.name}</h2>
                  <p className="font-body text-warm-charcoal m-0 mb-2 text-[0.9375rem]">{a.style}</p>
                  <p className="font-body m-0 text-sm text-clay">{a.designCount} designs</p>
                  <span className="font-label mt-3 inline-block text-xs font-semibold uppercase tracking-wider text-deep-teal">View portfolio →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <p style={{ marginTop: '2.5rem', fontSize: '0.9375rem', color: 'var(--clay-earth)' }}>Or explore another way:</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.75rem' }}>
          <Link className="btn btn-ghost" to="/vibes">
            Shop by Vibe
          </Link>
          <Link className="btn btn-ghost" to="/occasions">
            Shop by Occasion
          </Link>
        </div>
      </div>
    </div>
  );
}
