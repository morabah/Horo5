import { Link, useParams } from 'react-router-dom';
import { artists, getArtist, productsByArtist, getVibe } from '../data/site';
import { artistAvatars, getProductMedia } from '../data/images';
import { TeeImage, TeeImageFrame } from '../components/TeeImage';

export function ArtistProfile() {
  const { slug = '' } = useParams();
  const artist = getArtist(slug);
  const list = productsByArtist(slug);

  if (!artist) {
    return (
      <div className="container" style={{ padding: '3rem 0' }}>
        <p>Artist not found.</p>
        <Link to="/artists">Back to artists</Link>
      </div>
    );
  }

  const more = artists.filter((a) => a.slug !== slug);

  return (
    <div style={{ padding: '2rem 0 3rem' }}>
      <div className="container">
        <nav style={{ fontSize: '0.875rem', color: 'var(--clay-earth)', marginBottom: '1rem' }}>
          <Link to="/">Home</Link>
          {' / '}
          <Link to="/artists">Artists</Link>
          {' / '}
          <span style={{ color: 'var(--obsidian)' }}>{artist.name}</span>
        </nav>

        <header className="glass-morphism-violet mb-6 flex flex-wrap items-center gap-5 p-6">
          <div
            className="h-24 w-24 shrink-0 overflow-hidden rounded-full border-2 border-white/80 shadow-md ring-2 ring-white/40"
            aria-hidden
          >
            <TeeImage src={artistAvatars[artist.slug]} alt="" w={192} style={{ height: '96px' }} />
          </div>
          <div className="glass-text-inner min-w-0 max-w-2xl flex-1 px-5 py-4">
            <p className="label mb-1">Illustrated by</p>
            <h1 className="glass-text-heading font-headline text-obsidian mb-2 text-[clamp(1.5rem,3vw,2rem)] font-semibold">{artist.name}</h1>
            <p className="font-body text-warm-charcoal m-0 max-w-[40rem]">{artist.style}</p>
            <p className="font-body mt-3 text-sm text-clay">{artist.designCount} designs for HORO</p>
          </div>
        </header>

        <blockquote className="glass-morphism-violet mb-8 rounded-2xl border-none p-0 font-normal not-italic">
          <div className="glass-text-inner px-6 py-5">
            <p className="font-body text-warm-charcoal m-0 mb-3 leading-relaxed">
              &ldquo;What drives my work is the tension between what we show the world and what we hold inside. HORO lets me put that on a t-shirt — and someone else gets to decide if it&apos;s
              theirs.&rdquo;
            </p>
            <footer className="font-body text-sm text-clay">— {artist.name}</footer>
          </div>
        </blockquote>

        <p className="label" style={{ marginBottom: '1rem' }}>
          Designs by {artist.name}
        </p>
        <div style={{ display: 'grid', gap: '1.25rem', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
          {list.map((p) => {
            const vibe = getVibe(p.vibeSlug);
            const { main } = getProductMedia(p.slug);
            return (
              <Link key={p.slug} to={`/products/${p.slug}`} className="card-glass" style={{ padding: '1rem', textDecoration: 'none', color: 'inherit' }}>
                <TeeImageFrame src={main} alt={`HORO “${p.name}” graphic tee`} w={600} aspectRatio="1" borderRadius="12px" frameStyle={{ marginBottom: '0.75rem' }} />
                <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 500, margin: '0 0 0.35rem' }}>{p.name}</p>
                <p style={{ margin: '0 0 0.5rem', fontSize: '0.875rem', color: 'var(--clay-earth)' }}>&ldquo;{p.story.slice(0, 48)}…&rdquo;</p>
                {vibe && (
                  <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem' }}>
                    <span style={{ color: vibe.accent }}>●</span> {vibe.name}
                  </p>
                )}
                <p style={{ margin: 0, fontFamily: 'var(--font-heading)', fontWeight: 600 }}>{p.priceEgp} EGP</p>
              </Link>
            );
          })}
        </div>

        <section style={{ marginTop: '3rem' }}>
          <h2 style={{ fontSize: '1.0625rem', marginBottom: '1rem' }}>More artists</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            {more.map((a) => (
              <Link key={a.slug} to={`/artists/${a.slug}`} className="btn btn-ghost" style={{ fontSize: '0.875rem' }}>
                {a.name}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
