import { Link, useSearchParams } from 'react-router-dom';
import { useEffect, useMemo, useRef, useState } from 'react';
import { products, vibes, getVibe } from '../data/site';
import { getProductMedia, heroStreet, vibeCovers } from '../data/images';
import { TeeImageFrame } from '../components/TeeImage';
import { ProductQuickView } from '../components/ProductQuickView';
import { formatEgp } from '../utils/formatPrice';

const SEARCH_DEBOUNCE_MS = 300;

/** Normalize for matching (case, combining marks). */
function normalizeForSearch(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

/** Every whitespace-separated token must appear somewhere in the haystack (simple “fuzzy” token match). */
function haystackMatches(haystack: string, needleRaw: string): boolean {
  const needle = normalizeForSearch(needleRaw);
  if (!needle) return true;
  const hay = normalizeForSearch(haystack);
  const tokens = needle.split(/\s+/).filter(Boolean);
  return tokens.every((t) => hay.includes(t));
}

const POPULAR_SEARCHES = ['Emotions', 'Zodiac', 'street', 'gift', 'coffee', 'Horo'] as const;

export function Search() {
  const [params] = useSearchParams();
  const initialQ = params.get('q') ?? '';
  const [q, setQ] = useState(initialQ);
  const [debouncedQ, setDebouncedQ] = useState(initialQ);
  const [tab, setTab] = useState<'designs' | 'vibes'>('designs');
  const [quickViewSlug, setQuickViewSlug] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setQ(initialQ);
    setDebouncedQ(initialQ);
  }, [initialQ]);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(q), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [q]);

  useEffect(() => {
    if (params.get('focus') === '1') {
      inputRef.current?.focus();
    }
  }, [params]);

  const vibeParam = params.get('vibe') ?? '';
  const scopeVibe = useMemo(() => {
    if (!vibeParam.trim()) return null;
    return getVibe(vibeParam) ?? null;
  }, [vibeParam]);

  const filtered = useMemo(() => {
    const baseProducts = scopeVibe ? products.filter((p) => p.vibeSlug === scopeVibe.slug) : products;
    const baseVibes = scopeVibe ? vibes.filter((v) => v.slug === scopeVibe.slug) : vibes;
    const needle = debouncedQ.trim();
    if (!needle) return { designs: baseProducts, vibeMatches: baseVibes };
    return {
      designs: baseProducts.filter((p) => haystackMatches(`${p.name} ${p.story}`, needle)),
      vibeMatches: baseVibes.filter((v) => haystackMatches(`${v.name} ${v.tagline}`, needle)),
    };
  }, [debouncedQ, scopeVibe]);

  const { designs, vibeMatches } = filtered;
  /** Debounced — drives result lists so typing doesn’t thrash filters. */
  const hasDebouncedQuery = debouncedQ.trim().length > 0;
  /** Immediate — hides “Popular” as soon as the user types. */
  const inputEmpty = q.trim().length === 0;

  return (
    <div style={{ padding: '2rem 0 3rem' }}>
      <div className="container">
        <label htmlFor="search-page-input" className="sr-only">
          Search
        </label>
        <input
          ref={inputRef}
          id="search-page-input"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search designs, vibes…"
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
        {scopeVibe ? (
          <p style={{ marginBottom: '0.75rem', fontSize: '0.875rem', color: 'var(--clay-earth)' }}>
            Searching in <span style={{ color: 'var(--obsidian)', fontWeight: 600 }}>{scopeVibe.name}</span>
            {' · '}
            <Link to="/search" style={{ color: 'var(--deep-teal)', textDecoration: 'underline', textUnderlineOffset: '3px' }}>
              Search all designs
            </Link>
          </p>
        ) : null}

        <p style={{ color: 'var(--warm-charcoal)', marginBottom: '1rem' }}>
          {hasDebouncedQuery ? (
            <>
              {designs.length + vibeMatches.length} results for &ldquo;{debouncedQ.trim()}&rdquo;
            </>
          ) : (
            <>
              {scopeVibe
                ? `Browse designs in ${scopeVibe.name} — or try a popular search below.`
                : 'Browse everything — or try a popular search below.'}
            </>
          )}
        </p>

        {inputEmpty ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--clay-earth)', width: '100%' }}>Popular</span>
            {POPULAR_SEARCHES.map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => {
                  setQ(label);
                  setDebouncedQ(label);
                }}
                style={{
                  minHeight: '40px',
                  padding: '0.35rem 0.85rem',
                  borderRadius: '999px',
                  border: '1px solid var(--stone)',
                  background: 'var(--white)',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  color: 'var(--obsidian)',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        ) : null}

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem', borderBottom: '1px solid var(--stone)', paddingBottom: '0.5rem' }}>
          {(
            [
              ['designs', `Designs (${designs.length})`],
              ['vibes', `Vibes (${vibeMatches.length})`],
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
              const vibe = getVibe(p.vibeSlug);
              return (
                <article key={p.slug} className="card-glass relative" style={{ padding: '1rem' }}>
                  <Link
                    to={`/products/${p.slug}`}
                    className="absolute inset-0 z-[1] rounded-[inherit]"
                    aria-label={`View ${p.name}`}
                  >
                    <span className="sr-only">
                      {p.name}
                      {vibe ? `, ${vibe.name}` : ''}, {formatEgp(p.priceEgp)}
                    </span>
                  </Link>
                  <div className="relative z-[2] pointer-events-none">
                    <div className="relative mb-3">
                      <TeeImageFrame
                        src={getProductMedia(p.slug).main}
                        alt={`HORO “${p.name}” graphic tee`}
                        w={600}
                        aspectRatio="1"
                        borderRadius="12px"
                        frameStyle={{ marginBottom: 0 }}
                      />
                      <button
                        type="button"
                        className="quick-view-pill font-label pointer-events-auto absolute bottom-2 left-2 right-2 z-10 min-h-12 rounded-full px-4 py-3 text-center text-xs font-medium uppercase tracking-[0.2em] text-obsidian transition-shadow hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setQuickViewSlug(p.slug);
                        }}
                        aria-label={`Quick view: ${p.name}`}
                      >
                        Quick view
                      </button>
                    </div>
                    <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 500, margin: '0 0 0.35rem' }}>{p.name}</p>
                    {vibe && (
                      <p style={{ fontSize: '0.75rem', margin: '0 0 0.5rem' }}>
                        <span style={{ color: vibe.accent }}>●</span> {vibe.name}
                      </p>
                    )}
                    <p style={{ margin: 0, fontWeight: 600 }}>{formatEgp(p.priceEgp)}</p>
                  </div>
                </article>
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

        {hasDebouncedQuery && designs.length === 0 && vibeMatches.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <h2 style={{ fontSize: '1.25rem' }}>No results for &ldquo;{debouncedQ.trim()}&rdquo;</h2>
            <p style={{ color: 'var(--warm-charcoal)' }}>Try a different word, or explore by vibe.</p>
            <Link className="btn btn-primary" to="/vibes" style={{ marginTop: '1rem' }}>
              Shop by Vibe
            </Link>
          </div>
        )}
      </div>
      <ProductQuickView open={quickViewSlug !== null} productSlug={quickViewSlug} onClose={() => setQuickViewSlug(null)} />
    </div>
  );
}
