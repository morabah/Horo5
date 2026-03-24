import { Link, useParams } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { getOccasion, products } from '../data/site';
import { getProductMedia, imgUrl, tee } from '../data/images';
import { TeeImageFrame } from '../components/TeeImage';
import { ProductQuickView } from '../components/ProductQuickView';
import { formatEgp } from '../utils/formatPrice';
import { sortProductList, type ProductSortKey } from '../utils/productSort';

const SORT_OPTIONS: { value: ProductSortKey; label: string }[] = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
];

export function OccasionCollection() {
  const { slug = '' } = useParams();
  const occasion = getOccasion(slug);
  const baseList = products;
  const [sortKey, setSortKey] = useState<ProductSortKey>('featured');
  const [quickViewSlug, setQuickViewSlug] = useState<string | null>(null);

  const list = useMemo(() => sortProductList(baseList, sortKey), [baseList, sortKey]);

  if (!occasion) {
    return (
      <div className="container" style={{ padding: '3rem 0' }}>
        <p>Occasion not found.</p>
        <Link to="/occasions">Back to occasions</Link>
      </div>
    );
  }

  const isGift = ['gift-something-real', 'eid-and-ramadan', 'birthday-pick'].includes(slug);

  return (
    <div style={{ padding: '2rem 0 3rem' }}>
      <div className="container">
        <nav style={{ fontSize: '0.875rem', color: 'var(--clay-earth)', marginBottom: '1rem' }}>
          <Link to="/">Home</Link>
          {' / '}
          <Link to="/occasions">Occasions</Link>
          {' / '}
          <span style={{ color: 'var(--obsidian)' }}>{occasion.name}</span>
        </nav>

        <div
          style={{
            padding: '1.5rem',
            borderRadius: 'var(--radius-card)',
            marginBottom: '1.5rem',
            position: 'relative',
            overflow: 'hidden',
            backgroundColor: 'var(--papyrus)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              opacity: 0.65,
              backgroundImage: `url(${imgUrl(tee.walkingStreet, 1400)})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
            aria-hidden
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.45), transparent 60%)',
            }}
            aria-hidden
          />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', margin: '0 0 0.5rem', color: 'white', textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>{occasion.name}</h1>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.9)', textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>{occasion.blurb}</p>
            <p style={{ margin: '0.75rem 0 0', fontSize: '0.875rem', color: 'rgba(255,255,255,0.75)' }}>{list.length} designs</p>
          </div>
        </div>

        {isGift && (
          <div className="card-glass" style={{ padding: '1.25rem', marginBottom: '1.5rem', background: 'var(--warm-glow)', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ width: '120px', flexShrink: 0 }}>
              <TeeImageFrame src={tee.relaxedFit} alt="Gift wrap with graphic tee" w={400} aspectRatio="1" borderRadius="12px" />
            </div>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <h2 style={{ fontSize: '1.0625rem', margin: '0 0 0.5rem' }}>Make it a gift</h2>
              <p style={{ margin: '0 0 1rem', fontSize: '0.9375rem' }}>Add a story card + gift wrap ({formatEgp(200)}) at checkout.</p>
              <button type="button" className="btn btn-ghost" disabled style={{ opacity: 0.7 }}>
                Bundle option at cart
              </button>
            </div>
          </div>
        )}

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            marginBottom: '1.25rem',
          }}
        >
          <label htmlFor="occasion-sort" style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--label-brown)' }}>
            Sort by
          </label>
          <select
            id="occasion-sort"
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as ProductSortKey)}
            style={{
              minHeight: '48px',
              padding: '0 0.75rem',
              borderRadius: '8px',
              border: '1px solid var(--stone)',
              background: 'var(--white)',
              fontSize: '0.9375rem',
              maxWidth: '100%',
            }}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'grid', gap: '1.25rem', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
          {list.map((p) => {
            const { main } = getProductMedia(p.slug);
            return (
              <article key={p.slug} className="card-glass relative" style={{ padding: '1rem' }}>
                <Link
                  to={`/products/${p.slug}`}
                  className="absolute inset-0 z-[1] rounded-[inherit]"
                  aria-label={`View ${p.name}`}
                >
                  <span className="sr-only">
                    {p.name}, {formatEgp(p.priceEgp)}
                  </span>
                </Link>
                <div className="relative z-[2] pointer-events-none">
                  <div className="relative mb-3">
                    <TeeImageFrame
                      src={main}
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
                  <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 500, margin: '0 0 0.5rem' }}>{p.name}</p>
                  <p style={{ margin: 0, fontFamily: 'var(--font-heading)', fontWeight: 600 }}>{formatEgp(p.priceEgp)}</p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
      <ProductQuickView open={quickViewSlug !== null} productSlug={quickViewSlug} onClose={() => setQuickViewSlug(null)} />
    </div>
  );
}
