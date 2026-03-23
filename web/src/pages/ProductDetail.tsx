import { Link, useParams } from 'react-router-dom';
import { useState } from 'react';
import { getProduct, getArtist, getVibe, productsByVibe } from '../data/site';
import { artistAvatars, getProductMedia } from '../data/images';
import { TeeImage, TeeImageFrame } from '../components/TeeImage';

export function ProductDetail() {
  const { slug = '' } = useParams();
  const p = getProduct(slug);
  const [photoIndex, setPhotoIndex] = useState(0);

  if (!p) {
    return (
      <div className="container" style={{ padding: '3rem 0' }}>
        <p>Product not found.</p>
        <Link to="/vibes">Browse vibes</Link>
      </div>
    );
  }

  const artist = getArtist(p.artistSlug);
  const vibe = getVibe(p.vibeSlug);
  const related = productsByVibe(p.vibeSlug).filter((x) => x.slug !== slug).slice(0, 4);
  const { gallery } = getProductMedia(p.slug);
  const mainSrc = gallery[photoIndex] ?? gallery[0];

  return (
    <div className="product-page" style={{ padding: '1.5rem 0 3rem' }}>
      <div className="container">
        <nav style={{ fontSize: '0.875rem', color: 'var(--clay-earth)', marginBottom: '1rem' }}>
          <Link to="/">Home</Link>
          {vibe && (
            <>
              {' / '}
              <Link to={`/vibes/${vibe.slug}`}>{vibe.name}</Link>
            </>
          )}
          {' / '}
          <span style={{ color: 'var(--obsidian)' }}>{p.name}</span>
        </nav>

        <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', alignItems: 'start' }}>
          <div>
            <div style={{ aspectRatio: '1', borderRadius: 'var(--radius-card)', overflow: 'hidden', marginBottom: '0.75rem', background: 'var(--stone)' }}>
              <TeeImage src={mainSrc} alt={`HORO “${p.name}” t-shirt, ${['flat lay', 'on-body', 'lifestyle', 'print detail', 'size reference'][photoIndex] ?? 'view'}`} w={1000} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
              {gallery.map((src, i) => (
                <button
                  key={`${src}-${i}`}
                  type="button"
                  onClick={() => setPhotoIndex(i)}
                  style={{
                    aspectRatio: '1',
                    border: photoIndex === i ? '2px solid var(--obsidian)' : '1px solid var(--stone)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    padding: 0,
                    overflow: 'hidden',
                  }}
                  aria-label={`View image ${i + 1} of 5`}
                  aria-pressed={photoIndex === i}
                >
                  <TeeImage src={src} alt="" w={200} />
                </button>
              ))}
            </div>
            <p style={{ marginTop: '0.75rem', fontSize: '0.8125rem', color: 'var(--clay-earth)' }}>
              Five views: flat lay, on-body, street, print close-up, size reference — model in graphic tee.
            </p>
          </div>

          <div>
            {vibe && <p className="label">{vibe.name}</p>}
            <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', margin: '0.5rem 0 1rem' }}>{p.name}</h1>
            {artist && (
              <Link to={`/artists/${artist.slug}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--clay-earth)' }}>
                <span style={{ width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '1px solid var(--stone)' }} aria-hidden>
                  <TeeImage src={artistAvatars[artist.slug] ?? gallery[0]} alt="" w={64} style={{ height: '32px' }} />
                </span>
                <span>
                  Illustrated by <strong style={{ color: 'var(--obsidian)' }}>{artist.name}</strong>
                </span>
              </Link>
            )}

            <div className="card-glass" style={{ padding: '1.25rem', marginBottom: '1.5rem', background: 'var(--soft-violet)', borderColor: 'rgba(107,76,138,0.2)' }}>
              <p style={{ margin: 0, color: 'var(--dusk-violet)', fontWeight: 500 }}>For the one who…</p>
              <p style={{ margin: '0.5rem 0 0' }}>{p.story}</p>
            </div>

            <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '1.375rem', marginBottom: '1rem' }}>
              {p.priceEgp} EGP
            </p>

            <fieldset style={{ border: 'none', padding: 0, margin: '0 0 1.25rem' }}>
              <legend className="label" style={{ marginBottom: '0.5rem' }}>
                Size
              </legend>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {['S', 'M', 'L', 'XL', 'XXL'].map((s, i) => (
                  <button
                    key={s}
                    type="button"
                    className="btn"
                    style={{
                      minHeight: '44px',
                      minWidth: '44px',
                      padding: '0 0.75rem',
                      background: i === 1 ? 'var(--ember)' : 'var(--white)',
                      color: 'var(--obsidian)',
                      border: i === 1 ? '2px solid var(--obsidian)' : '1px solid var(--stone)',
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </fieldset>

            <Link className="btn btn-primary" to="/cart" style={{ width: '100%', marginBottom: '0.75rem' }}>
              Add to Cart
            </Link>
            <p style={{ fontSize: '0.875rem', color: 'var(--clay-earth)', margin: 0 }}>
              220 GSM · {artist?.name} · Free exchange 14d · COD available
            </p>
          </div>
        </div>

        <section style={{ marginTop: '3rem' }}>
          <h2 style={{ fontSize: '1.0625rem', marginBottom: '1rem' }}>More from {vibe?.name}</h2>
          <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
            {related.map((r) => (
              <Link key={r.slug} to={`/products/${r.slug}`} className="card-glass" style={{ padding: '0.75rem', textDecoration: 'none', color: 'inherit' }}>
                <TeeImageFrame src={getProductMedia(r.slug).main} alt={`HORO “${r.name}” tee`} w={400} aspectRatio="1" borderRadius="8px" frameStyle={{ marginBottom: '0.5rem' }} />
                <p style={{ fontSize: '0.875rem', fontWeight: 500, margin: 0 }}>{r.name}</p>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem' }}>{r.priceEgp} EGP</p>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <div className="product-mobile-bar" role="region" aria-label="Add to cart">
        <Link className="btn btn-primary" to="/cart" style={{ width: '100%' }}>
          Add to Cart — {p.priceEgp} EGP
        </Link>
      </div>
    </div>
  );
}
