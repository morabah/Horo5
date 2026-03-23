import { Link, useParams } from 'react-router-dom';
import { getOccasion, products, getArtist } from '../data/site';
import { getProductMedia, imgUrl, tee } from '../data/images';
import { TeeImageFrame } from '../components/TeeImage';

export function OccasionCollection() {
  const { slug = '' } = useParams();
  const occasion = getOccasion(slug);
  const list = products;

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
              opacity: 0.25,
              backgroundImage: `url(${imgUrl(tee.walkingStreet, 1400)})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
            aria-hidden
          />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', margin: '0 0 0.5rem' }}>{occasion.name}</h1>
            <p style={{ margin: 0 }}>{occasion.blurb}</p>
            <p style={{ margin: '0.75rem 0 0', fontSize: '0.875rem', color: 'var(--clay-earth)' }}>{list.length} designs</p>
          </div>
        </div>

        {isGift && (
          <div className="card-glass" style={{ padding: '1.25rem', marginBottom: '1.5rem', background: 'var(--warm-glow)', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ width: '120px', flexShrink: 0 }}>
              <TeeImageFrame src={tee.relaxedFit} alt="Gift wrap with graphic tee" w={400} aspectRatio="1" borderRadius="12px" />
            </div>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <h2 style={{ fontSize: '1.0625rem', margin: '0 0 0.5rem' }}>Make it a gift</h2>
              <p style={{ margin: '0 0 1rem', fontSize: '0.9375rem' }}>Add a story card + gift wrap for +200 EGP at checkout.</p>
              <button type="button" className="btn btn-ghost" disabled style={{ opacity: 0.7 }}>
                Bundle option at cart
              </button>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gap: '1.25rem', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
          {list.map((p) => {
            const artist = getArtist(p.artistSlug);
            const { main } = getProductMedia(p.slug);
            return (
              <Link key={p.slug} to={`/products/${p.slug}`} className="card-glass" style={{ padding: '1rem', textDecoration: 'none', color: 'inherit' }}>
                <TeeImageFrame src={main} alt={`HORO “${p.name}” graphic tee`} w={600} aspectRatio="1" borderRadius="12px" frameStyle={{ marginBottom: '0.75rem' }} />
                <p style={{ fontSize: '0.875rem', color: 'var(--clay-earth)', margin: '0 0 0.25rem' }}>{artist?.name}</p>
                <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 500, margin: '0 0 0.5rem' }}>{p.name}</p>
                <p style={{ margin: 0, fontFamily: 'var(--font-heading)', fontWeight: 600 }}>{p.priceEgp} EGP</p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
