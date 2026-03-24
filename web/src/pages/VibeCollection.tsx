import { Link, useParams } from 'react-router-dom';
import { getArtist, getVibe, productsByVibe, vibes } from '../data/site';
import { getProductMedia, heroStreet, imgUrl, vibeCovers } from '../data/images';
import { TeeImageFrame } from '../components/TeeImage';

export function VibeCollection() {
  const { slug = '' } = useParams();
  const vibe = getVibe(slug);
  const list = productsByVibe(slug);

  if (!vibe) {
    return (
      <div className="container" style={{ padding: '3rem 0' }}>
        <p>Vibe not found.</p>
        <Link to="/vibes">Back to vibes</Link>
      </div>
    );
  }

  const others = vibes.filter((v) => v.slug !== slug).slice(0, 4);

  return (
    <div style={{ padding: '2rem 0 3rem' }}>
      <div className="container">
        <nav style={{ fontSize: '0.875rem', color: 'var(--clay-earth)', marginBottom: '1rem' }}>
          <Link to={`/?vibe=${encodeURIComponent(slug)}`}>Home</Link>
          {' / '}
          <Link to="/vibes">Vibes</Link>
          {' / '}
          <span style={{ color: 'var(--obsidian)' }}>{vibe.name}</span>
        </nav>

        <div className="relative mb-6 min-h-[200px] overflow-hidden rounded-2xl bg-papyrus shadow-[0_8px_30px_rgba(26,26,26,0.08)] ring-1 ring-black/5">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-90"
            style={{
              backgroundImage: `linear-gradient(105deg, ${vibe.accent}44, transparent 50%), url(${imgUrl(vibeCovers[vibe.slug] ?? heroStreet, 1200)})`,
            }}
            aria-hidden
          />
          <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/25 to-transparent" aria-hidden />
          <div className="glass-vibe-card-footer relative z-10 m-4 max-w-2xl rounded-xl px-3 py-3 sm:m-6">
            <div className="glass-text-inner px-5 py-4">
              <span
                className="mb-2 inline-block h-3 w-3 rounded-full shadow-sm ring-2 ring-white/80"
                style={{ background: vibe.accent }}
                aria-hidden
              />
              <h1 className="glass-text-heading font-headline text-obsidian mb-2 text-[clamp(1.5rem,3vw,2rem)] font-semibold">
                {vibe.name}
              </h1>
              <p className="font-body text-warm-charcoal mb-2">{vibe.tagline}</p>
              <p className="font-body text-sm text-clay">{list.length} designs</p>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gap: '1.25rem', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
          {list.map((p) => {
            const artist = getArtist(p.artistSlug);
            const { main } = getProductMedia(p.slug);
            return (
              <Link key={p.slug} to={`/products/${p.slug}`} className="card-glass" style={{ padding: '1rem', textDecoration: 'none', color: 'inherit' }}>
                <TeeImageFrame
                  src={main}
                  alt={`HORO “${p.name}” graphic tee, model`}
                  w={600}
                  aspectRatio="1"
                  borderRadius="12px"
                  frameStyle={{ marginBottom: '0.75rem' }}
                />
                <p style={{ fontSize: '0.875rem', color: 'var(--clay-earth)', margin: '0 0 0.25rem' }}>{artist?.name}</p>
                <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 500, margin: '0 0 0.5rem', color: 'var(--obsidian)' }}>{p.name}</p>
                <p style={{ margin: 0, fontFamily: 'var(--font-heading)', fontWeight: 600 }}>{p.priceEgp} EGP</p>
              </Link>
            );
          })}
        </div>

        {list.length === 0 && <p style={{ marginTop: '1rem' }}>No designs in this vibe yet.</p>}

        <section style={{ marginTop: '3rem' }}>
          <h2 style={{ fontSize: '1.0625rem', fontWeight: 500, marginBottom: '1rem' }}>Explore other vibes</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            {others.map((v) => (
              <Link key={v.slug} to={`/vibes/${v.slug}`} className="btn btn-ghost" style={{ fontSize: '0.875rem' }}>
                {v.name}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
