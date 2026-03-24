import { Link } from 'react-router-dom';
import { glassInteractive } from '../lib/glassInteractive';
import { formatEgp } from '../utils/formatPrice';
import { occasions } from '../data/site';
import { tee, imgUrl } from '../data/images';
import { TeeImageFrame } from '../components/TeeImage';

/**
 * Occasion → representative image mapping.
 * Each secondary occasion gets a themed product/lifestyle thumbnail (F2).
 */
const occasionImages: Record<string, string> = {
  'gift-something-real': tee.womanSmile,
  'graduation-season': tee.relaxedFit,
  'eid-and-ramadan': tee.friendsTees,
  'birthday-pick': tee.flatLayStyle,
  'just-because': tee.outdoorTee,
};

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
            className={['card-glass group grid gap-5 no-underline', glassInteractive.surfaceCard].join(' ')}
            style={{
              padding: '1.25rem',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              alignItems: 'center',
              background: 'var(--warm-glow)',
            }}
          >
            <TeeImageFrame src={tee.womanSmile} alt="Model wearing graphic tee — gift collection" w={700} aspectRatio="4/3" borderRadius="12px" />
            <div>
              <h2 className={['text-xl font-semibold', glassInteractive.title].join(' ')} style={{ margin: '0 0 0.5rem' }}>
                {occasions[0].name}
              </h2>
              <p className={glassInteractive.body} style={{ margin: 0 }}>
                {occasions[0].blurb}
              </p>
              <p className={['mt-3 text-sm', glassInteractive.body].join(' ')}>from {formatEgp(999)} (bundle)</p>
              <span className={['btn btn-ghost mt-4 inline-flex', glassInteractive.cta].join(' ')}>Explore gifts →</span>
            </div>
          </Link>

          {/* F2 — Secondary occasion cards now include images */}
          <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
            {occasions.slice(1).map((o) => {
              const img = occasionImages[o.slug] ?? tee.walkingStreet;
              return (
                <Link
                  key={o.slug}
                  to={`/occasions/${o.slug}`}
                  className={['card-glass group flex min-h-[176px] items-stretch gap-4 no-underline p-5', glassInteractive.surfaceCard].join(' ')}
                >
                  <div
                    style={{
                      width: '104px',
                      minHeight: '104px',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      flexShrink: 0,
                      background: 'var(--stone)',
                      alignSelf: 'stretch',
                    }}
                  >
                    <img
                      src={imgUrl(img, 300)}
                      alt={`${o.name} — occasion collection`}
                      style={{ width: '100%', height: '100%', minHeight: '104px', objectFit: 'cover' }}
                      loading="lazy"
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <h2 className={['text-lg font-semibold', glassInteractive.title].join(' ')} style={{ margin: '0 0 0.5rem' }}>
                      {o.name}
                    </h2>
                    <p className={['flex-1 text-[0.9375rem]', glassInteractive.body].join(' ')} style={{ margin: 0 }}>
                      {o.blurb}
                    </p>
                    <span className={['mt-3 inline-block font-medium', glassInteractive.cta].join(' ')}>Explore →</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <p style={{ marginTop: '2.5rem', fontSize: '0.9375rem', color: 'var(--clay-earth)' }}>Or explore by feeling:</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.75rem' }}>
          <Link className="btn btn-ghost" to="/vibes">
            Shop by Vibe
          </Link>
        </div>
      </div>
    </div>
  );
}
