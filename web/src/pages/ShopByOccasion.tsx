import { Link } from 'react-router-dom';
import { occasions } from '../data/site';
import { tee } from '../data/images';
import { TeeImageFrame } from '../components/TeeImage';

export function ShopByOccasion() {
  return (
    <div style={{ padding: '2rem 0 3rem' }}>
      <div className="container">
        <p className="label" style={{ marginBottom: '0.5rem' }}>
          Shop by occasion
        </p>
        <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', marginBottom: '0.75rem' }}>Give something that means something</h1>
        <p style={{ color: 'var(--warm-charcoal)', maxWidth: '36rem', marginBottom: '2rem' }}>Find the design that fits the moment.</p>

        <div style={{ display: 'grid', gap: '1.25rem' }}>
          <Link
            to={`/occasions/${occasions[0].slug}`}
            className="card-glass"
            style={{
              padding: '1.25rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1.25rem',
              alignItems: 'center',
              textDecoration: 'none',
              color: 'inherit',
              background: 'var(--warm-glow)',
            }}
          >
            <TeeImageFrame src={tee.womanSmile} alt="Model wearing graphic tee — gift collection" w={700} aspectRatio="4/3" borderRadius="12px" />
            <div>
              <h2 style={{ fontSize: '1.25rem', margin: '0 0 0.5rem' }}>{occasions[0].name}</h2>
              <p style={{ margin: 0 }}>{occasions[0].blurb}</p>
              <p style={{ margin: '0.75rem 0 0', fontSize: '0.875rem', color: 'var(--clay-earth)' }}>from 999 EGP (bundle)</p>
              <span className="btn btn-ghost" style={{ marginTop: '1rem', display: 'inline-flex' }}>
                Explore gifts →
              </span>
            </div>
          </Link>

          <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
            {occasions.slice(1).map((o) => (
              <Link key={o.slug} to={`/occasions/${o.slug}`} className="card-glass" style={{ padding: '1.5rem', textDecoration: 'none', color: 'inherit' }}>
                <h2 style={{ fontSize: '1.125rem', margin: '0 0 0.5rem' }}>{o.name}</h2>
                <p style={{ margin: 0, fontSize: '0.9375rem' }}>{o.blurb}</p>
                <span style={{ display: 'inline-block', marginTop: '1rem', color: 'var(--deep-teal)', fontWeight: 500 }}>Explore →</span>
              </Link>
            ))}
          </div>
        </div>

        <p style={{ marginTop: '2.5rem', fontSize: '0.9375rem', color: 'var(--clay-earth)' }}>Or explore by feeling:</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.75rem' }}>
          <Link className="btn btn-ghost" to="/vibes">
            Shop by Vibe
          </Link>
          <Link className="btn btn-ghost" to="/artists">
            Browse by Artist
          </Link>
        </div>
      </div>
    </div>
  );
}
