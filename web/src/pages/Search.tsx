import { Link, useSearchParams } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { products, vibes, artists, getArtist, getVibe } from '../data/site';
import { artistAvatars, getProductMedia, heroStreet, vibeCovers } from '../data/images';
import { TeeImage, TeeImageFrame } from '../components/TeeImage';

export function Search() {
  const [params] = useSearchParams();
  const initialQ = params.get('q') ?? '';
  const [q, setQ] = useState(initialQ);
  const [tab, setTab] = useState<'designs' | 'vibes' | 'artists'>('designs');

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return { designs: products, vibeMatches: vibes, artistMatches: artists };
    return {
      designs: products.filter((p) => p.name.toLowerCase().includes(needle) || p.story.toLowerCase().includes(needle)),
      vibeMatches: vibes.filter((v) => v.name.toLowerCase().includes(needle) || v.tagline.toLowerCase().includes(needle)),
      artistMatches: artists.filter((a) => a.name.toLowerCase().includes(needle) || a.style.toLowerCase().includes(needle)),
    };
  }, [q]);

  const { designs, vibeMatches, artistMatches } = filtered;
  const hasQuery = q.trim().length > 0;

  return (
    <div style={{ padding: '2rem 0 3rem' }}>
      <div className="container">
        <label htmlFor="search-page-input" className="sr-only">
          Search
        </label>
        <input
          id="search-page-input"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search designs, vibes, artists…"
          style={{
            width: '100%',
            maxWidth: '560px',
            minHeight: '48px',
            padding: '0 1rem',
            borderRadius: 'var(--radius-card)',
            border: '1px solid var(--stone)',
            fontSize: '1rem',
            marginBottom: '1rem',
          }}
        />
        <p style={{ color: 'var(--warm-charcoal)', marginBottom: '1.5rem' }}>
          {hasQuery ? (
            <>
              {designs.length + vibeMatches.length + artistMatches.length} results for &ldquo;{q.trim()}&rdquo;
            </>
          ) : (
            <>Browse everything — or type to filter.</>
          )}
        </p>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem', borderBottom: '1px solid var(--stone)', paddingBottom: '0.5rem' }}>
          {(
            [
              ['designs', `Designs (${designs.length})`],
              ['vibes', `Vibes (${vibeMatches.length})`],
              ['artists', `Artists (${artistMatches.length})`],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                fontSize: '0.9375rem',
                padding: '0.5rem 0.25rem',
                color: tab === id ? 'var(--obsidian)' : 'var(--clay-earth)',
                borderBottom: tab === id ? '2px solid var(--ember)' : '2px solid transparent',
                marginBottom: '-1px',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'designs' && (
          <div style={{ display: 'grid', gap: '1.25rem', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
            {designs.map((p) => {
              const artist = getArtist(p.artistSlug);
              const vibe = getVibe(p.vibeSlug);
              return (
                <Link key={p.slug} to={`/products/${p.slug}`} className="card-glass" style={{ padding: '1rem', textDecoration: 'none', color: 'inherit' }}>
                  <TeeImageFrame
                    src={getProductMedia(p.slug).main}
                    alt={`HORO “${p.name}” graphic tee`}
                    w={600}
                    aspectRatio="1"
                    borderRadius="12px"
                    frameStyle={{ marginBottom: '0.75rem' }}
                  />
                  <p style={{ fontSize: '0.875rem', color: 'var(--clay-earth)', margin: '0 0 0.25rem' }}>{artist?.name}</p>
                  <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 500, margin: '0 0 0.35rem' }}>{p.name}</p>
                  {vibe && (
                    <p style={{ fontSize: '0.75rem', margin: '0 0 0.5rem' }}>
                      <span style={{ color: vibe.accent }}>●</span> {vibe.name}
                    </p>
                  )}
                  <p style={{ margin: 0, fontWeight: 600 }}>{p.priceEgp} EGP</p>
                </Link>
              );
            })}
          </div>
        )}

        {tab === 'vibes' && (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '1rem' }}>
            {vibeMatches.map((v) => (
              <li key={v.slug}>
                <Link to={`/vibes/${v.slug}`} className="card-glass" style={{ display: 'flex', gap: '1rem', padding: '1rem', textDecoration: 'none', color: 'inherit', alignItems: 'center' }}>
                  <div style={{ width: '96px', flexShrink: 0 }}>
                    <TeeImageFrame
                      src={vibeCovers[v.slug] ?? heroStreet}
                      alt={`${v.name} — model in graphic tee`}
                      w={300}
                      aspectRatio="1"
                      borderRadius="12px"
                    />
                  </div>
                  <span>
                    <span style={{ color: v.accent }}>●</span> <strong>{v.name}</strong> — {v.tagline}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {tab === 'artists' && (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '1rem' }}>
            {artistMatches.map((a) => (
              <li key={a.slug}>
                <Link to={`/artists/${a.slug}`} className="card-glass" style={{ display: 'flex', gap: '1rem', padding: '1rem', textDecoration: 'none', color: 'inherit', alignItems: 'center' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '1px solid var(--stone)' }}>
                    <TeeImage src={artistAvatars[a.slug]} alt="" w={128} />
                  </div>
                  <span>
                    <strong>{a.name}</strong> — {a.style} ({a.designCount} designs)
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {hasQuery && designs.length === 0 && vibeMatches.length === 0 && artistMatches.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <h2 style={{ fontSize: '1.25rem' }}>No results for &ldquo;{q.trim()}&rdquo;</h2>
            <p style={{ color: 'var(--warm-charcoal)' }}>Try a different word, or explore by vibe.</p>
            <Link className="btn btn-primary" to="/vibes" style={{ marginTop: '1rem' }}>
              Shop by Vibe
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
