import { Link, useParams } from 'react-router-dom';
import { useEffect, useId, useRef, useState } from 'react';
import { getProduct, getArtist, getVibe, productsByVibe } from '../data/site';
import { artistAvatars, getProductMedia } from '../data/images';
import { TeeImage, TeeImageFrame } from '../components/TeeImage';

const VIEW_LABELS = ['flat lay', 'on-body', 'lifestyle', 'print detail', 'size reference'] as const;

const SIZES: { key: string; disabled?: boolean }[] = [
  { key: 'S' },
  { key: 'M' },
  { key: 'L' },
  { key: 'XL' },
  { key: 'XXL', disabled: true },
];

function surfacePhraseForView(viewIndex: number): string {
  switch (viewIndex) {
    case 0:
      return 'warm textured surface';
    case 1:
      return 'on-body, natural light';
    case 2:
      return 'street lifestyle setting';
    case 3:
      return 'print texture close-up';
    case 4:
      return 'size reference with model';
    default:
      return 'neutral backdrop';
  }
}

function mainGalleryAlt(productName: string, viewIndex: number): string {
  const view = VIEW_LABELS[viewIndex] ?? 'view';
  const surface = surfacePhraseForView(viewIndex);
  return `HORO “${productName}” t-shirt, ${view} on ${surface}.`;
}

const SIZE_TABLE = [
  { size: 'S', chest: '96 cm', length: '70 cm', sleeve: '20 cm' },
  { size: 'M', chest: '102 cm', length: '72 cm', sleeve: '21 cm' },
  { size: 'L', chest: '108 cm', length: '74 cm', sleeve: '22 cm' },
  { size: 'XL', chest: '114 cm', length: '76 cm', sleeve: '23 cm' },
  { size: 'XXL', chest: '120 cm', length: '78 cm', sleeve: '24 cm' },
];

export function ProductDetail() {
  const { slug = '' } = useParams();
  const p = getProduct(slug);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState('M');
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const sizeGuideTriggerRef = useRef<HTMLButtonElement | null>(null);
  const sizeGuideDialogRef = useRef<HTMLDivElement | null>(null);
  const sizeGuideWasOpenRef = useRef(false);
  const sizeGuideTitleId = useId();

  useEffect(() => {
    if (!sizeGuideOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setSizeGuideOpen(false);
        return;
      }
      if (e.key !== 'Tab' || !sizeGuideDialogRef.current) return;

      const focusables = sizeGuideDialogRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    const t = window.setTimeout(() => {
      const closeBtn = sizeGuideDialogRef.current?.querySelector<HTMLElement>('[data-size-guide-close]');
      closeBtn?.focus();
    }, 0);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      window.clearTimeout(t);
    };
  }, [sizeGuideOpen]);

  useEffect(() => {
    if (sizeGuideOpen) {
      sizeGuideWasOpenRef.current = true;
      return;
    }
    if (sizeGuideWasOpenRef.current) {
      sizeGuideWasOpenRef.current = false;
      queueMicrotask(() => sizeGuideTriggerRef.current?.focus());
    }
  }, [sizeGuideOpen]);

  if (!p) {
    return (
      <div className="bg-papyrus px-4 py-16 text-center">
        <p className="font-body text-warm-charcoal">Product not found.</p>
        <Link to="/vibes" className="font-label mt-4 inline-block text-deep-teal underline">
          Browse vibes
        </Link>
      </div>
    );
  }

  const artist = getArtist(p.artistSlug);
  const vibe = getVibe(p.vibeSlug);
  const related = productsByVibe(p.vibeSlug).filter((x) => x.slug !== slug).slice(0, 4);
  const { gallery } = getProductMedia(p.slug);
  const mainSrc = gallery[photoIndex] ?? gallery[0];

  const trustLine = [
    '220 GSM',
    artist?.name ?? 'HORO Studio',
    'Free exchange 14d',
    'COD available',
  ].join(' · ');

  const closeSizeGuide = () => setSizeGuideOpen(false);

  return (
    <div className="product-page bg-papyrus text-obsidian">
      <nav
        className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b-2 border-obsidian bg-white/60 px-4 py-3 font-body text-[13px] leading-normal text-clay backdrop-blur-sm md:px-8 md:py-4 md:text-sm"
        aria-label="Breadcrumb"
      >
        <Link to="/" className="text-clay transition-colors hover:text-ember">
          Home
        </Link>
        <span className="text-clay/50" aria-hidden>
          /
        </span>
        {vibe ? (
          <>
            <Link to={`/vibes/${vibe.slug}`} className="text-clay transition-colors hover:text-ember">
              {vibe.name}
            </Link>
            <span className="text-clay/50" aria-hidden>
              /
            </span>
          </>
        ) : null}
        <span className="text-warm-charcoal">{p.name}</span>
      </nav>

      <div className="grid grid-cols-1 border-b-2 border-obsidian lg:grid-cols-12">
        {/* Gallery */}
        <div className="flex flex-col border-obsidian lg:col-span-7 lg:border-r-2">
          <div className="relative aspect-square w-full overflow-hidden border-b-2 border-obsidian bg-surface-container-high">
            <TeeImage
              src={mainSrc}
              alt={mainGalleryAlt(p.name, photoIndex)}
              w={1200}
              className="h-full w-full"
            />
          </div>
          <div className="grid grid-cols-5 border-obsidian">
            {gallery.map((src, i) => (
              <button
                key={`${p.slug}-g-${i}`}
                type="button"
                onClick={() => setPhotoIndex(i)}
                className={`relative aspect-square overflow-hidden border-obsidian p-0 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal ${
                  i < 4 ? 'border-r-2' : ''
                } ${photoIndex === i ? 'ring-2 ring-inset ring-ember' : 'hover:opacity-95'}`}
                aria-label={`View image ${i + 1} of 5 — ${VIEW_LABELS[i]}`}
                aria-pressed={photoIndex === i}
              >
                <TeeImage src={src} alt="" w={240} className="h-full w-full" />
              </button>
            ))}
          </div>
          <p className="font-body hidden px-4 py-3 text-[13px] leading-snug text-clay md:block md:px-6">
            Five views: flat lay, on-body, street, print close-up, size reference — model in graphic tee.
          </p>
        </div>

        {/* Buy box */}
        <div className="flex flex-col bg-white lg:col-span-5">
          <div className="border-b-2 border-obsidian bg-papyrus p-6 md:p-10 lg:p-12">
            {vibe ? (
              <p className="font-label mb-2 text-[11px] font-medium uppercase tracking-[0.28em] text-label">{vibe.name}</p>
            ) : null}
            <h1 className="font-headline text-[26px] font-semibold uppercase leading-[1.2] tracking-tight text-obsidian md:text-[32px]">
              {p.name}
            </h1>
            {artist ? (
              <Link
                to={`/artists/${artist.slug}`}
                className="mt-6 inline-flex items-center gap-3 text-left transition-opacity hover:opacity-90"
              >
                <span className="h-12 w-12 shrink-0 overflow-hidden border-2 border-obsidian bg-surface-container-high">
                  <TeeImage src={artistAvatars[artist.slug] ?? gallery[0]} alt="" w={96} className="h-full w-full" />
                </span>
                <span className="font-label text-[11px] font-medium uppercase tracking-[0.15em] text-clay">
                  Illustrated by <span className="text-obsidian">{artist.name}</span>
                </span>
              </Link>
            ) : null}
          </div>

          <div className="border-b-2 border-obsidian bg-white p-6 md:p-10 lg:p-12">
            <div className="glass-morphism-violet px-5 py-6 md:px-8 md:py-8">
              <p className="font-body text-base font-normal leading-[1.65] text-dusk-violet md:text-[17px]">
                &ldquo;{p.story}&rdquo;
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-obsidian bg-white p-6 md:p-10 lg:p-12">
            <p className="font-headline text-[19px] font-medium leading-[1.3] text-obsidian md:text-[22px]">
              {p.priceEgp.toLocaleString('en-EG')}{' '}
              <span className="text-[17px] font-medium md:text-[19px]">EGP</span>
            </p>
            <button
              ref={sizeGuideTriggerRef}
              type="button"
              onClick={() => setSizeGuideOpen(true)}
              className="font-label text-[11px] font-medium uppercase tracking-wide text-deep-teal underline decoration-deep-teal/40 underline-offset-4 hover:text-obsidian"
            >
              Size guide
            </button>
          </div>

          <div className="border-b-2 border-obsidian bg-white px-6 pt-6 md:px-10 md:pt-8 lg:px-12 lg:pt-10">
            <p className="font-label text-[12px] font-medium uppercase tracking-[0.28em] text-label">Size</p>
          </div>

          <div className="grid grid-cols-5 border-b-2 border-obsidian" role="group" aria-label="Size">
            {SIZES.map(({ key, disabled }, idx) => {
              const isSel = selectedSize === key && !disabled;
              return (
                <button
                  key={key}
                  type="button"
                  disabled={disabled}
                  onClick={() => !disabled && setSelectedSize(key)}
                  className={`relative min-h-[52px] border-stone py-4 font-headline text-sm font-semibold transition-colors focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal md:min-h-14 md:py-6 md:text-base ${
                    idx < 4 ? 'border-r-2' : ''
                  } ${
                    disabled
                      ? 'cursor-not-allowed border-stone bg-papyrus/50 text-clay line-through decoration-obsidian/30'
                      : isSel
                        ? 'border-stone bg-primary text-obsidian'
                        : 'border-stone bg-white text-obsidian hover:bg-obsidian hover:text-white'
                  }`}
                >
                  {disabled ? <span aria-disabled="true">{key}</span> : key}
                </button>
              );
            })}
          </div>

          <div className="border-b-2 border-obsidian p-4 md:p-6">
            <Link className="btn btn-primary flex w-full justify-center py-6 text-base uppercase tracking-[0.12em] md:py-8 md:text-lg" to="/cart">
              Add to cart
            </Link>
          </div>

          <div className="border-b-2 border-obsidian bg-white px-6 py-5 font-body text-sm leading-normal text-clay md:px-10 md:py-6 lg:px-12">
            <p className="text-center">{trustLine}</p>
          </div>
        </div>
      </div>

      {/* Technical + story */}
      <section className="grid grid-cols-1 border-b-2 border-obsidian md:grid-cols-2">
        <div className="border-b-2 border-obsidian p-8 md:border-b-0 md:border-r-2 md:p-12 lg:p-16">
          <h2 className="font-headline mb-10 text-xl font-semibold uppercase tracking-tight text-obsidian md:text-2xl">Technical specifications</h2>
          <ul className="space-y-8">
            {[
              { k: 'Fabric', v: '220 GSM premium heavyweight cotton' },
              { k: 'Print', v: 'High-fidelity direct-to-film (DTF) art print' },
              { k: 'Fit', v: 'Relaxed unisex silhouette' },
              { k: 'Care', v: 'Machine wash cold; hang dry for longevity' },
            ].map((row) => (
              <li key={row.k} className="border-l-2 border-obsidian pl-6">
                <p className="font-label mb-1 text-[10px] font-medium uppercase tracking-[0.2em] text-clay">{row.k}</p>
                <p className="font-body text-base leading-relaxed text-warm-charcoal md:text-lg">{row.v}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-papyrus p-8 md:p-12 lg:p-16">
          <h2 className="font-headline mb-10 text-xl font-semibold uppercase tracking-tight text-obsidian md:text-2xl">Design story</h2>
          <div className="space-y-6">
            <p className="font-body text-xl font-medium leading-tight text-warm-charcoal md:text-2xl">&ldquo;{p.story}&rdquo;</p>
            <p className="font-body text-sm leading-relaxed text-warm-charcoal/90 md:text-[15px]">
              Part of the{' '}
              {vibe ? (
                <Link to={`/vibes/${vibe.slug}`} className="border-b-2 border-primary font-medium text-obsidian transition-colors hover:text-primary">
                  {vibe.name}
                </Link>
              ) : (
                'collection'
              )}{' '}
              line — original illustration, meaning-led themes, and print quality you can see before you wear it.
              {artist ? ` Illustrated by ${artist.name}.` : ''}
            </p>
          </div>
        </div>
      </section>

      {/* Related */}
      <section className="border-b-2 border-obsidian">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-obsidian bg-white px-6 py-6 md:px-10 md:py-8">
          <div>
            <span className="font-label text-[10px] font-medium uppercase tracking-[0.25em] text-clay">Discovery</span>
            <h2 className="font-headline mt-1 text-2xl font-semibold uppercase tracking-tight text-obsidian md:text-3xl">
              More from {vibe?.name ?? 'this vibe'}
            </h2>
          </div>
          {vibe ? (
            <Link
              to={`/vibes/${vibe.slug}`}
              className="font-label border-2 border-obsidian px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-obsidian transition-colors hover:bg-obsidian hover:text-white"
            >
              View all
            </Link>
          ) : null}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4">
          {related.map((r, i) => {
            const relatedArtist = getArtist(r.artistSlug);
            return (
              <Link
                key={r.slug}
                to={`/products/${r.slug}`}
                className={`group block border-obsidian bg-white transition-colors hover:bg-papyrus/50 ${
                  i < related.length - 1 ? 'border-r-2' : ''
                } ${i < 2 ? 'border-b-2 lg:border-b-0' : ''}`}
              >
                <div className="border-b-2 border-obsidian overflow-hidden">
                  <TeeImageFrame
                    src={getProductMedia(r.slug).main}
                    alt={`HORO “${r.name}” tee`}
                    w={500}
                    aspectRatio="3/4"
                    borderRadius="0"
                    frameStyle={{ marginBottom: 0 }}
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-headline text-[11px] font-semibold uppercase tracking-wide text-obsidian group-hover:text-deep-teal md:text-xs">{r.name}</h3>
                  {relatedArtist ? (
                    <p className="font-body mt-0.5 text-[11px] text-clay md:text-xs">{relatedArtist.name}</p>
                  ) : null}
                  <p className="font-body mt-1 text-xs text-clay">{r.priceEgp.toLocaleString('en-EG')} EGP</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <div className="product-mobile-bar" role="region" aria-label="Add to cart">
        <Link className="btn btn-primary w-full justify-center uppercase tracking-[0.12em]" to="/cart">
          Add to cart — {p.priceEgp.toLocaleString('en-EG')} EGP
        </Link>
      </div>

      {sizeGuideOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="presentation">
          <div className="absolute inset-0 bg-obsidian/40" aria-hidden onClick={closeSizeGuide} />
          <div
            ref={sizeGuideDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={sizeGuideTitleId}
            className="relative z-10 m-0 w-full max-h-[90vh] overflow-y-auto rounded-t-2xl border border-white/60 bg-frost-blue/25 px-5 py-6 shadow-[0_4px_24px_rgba(26,26,26,0.12)] backdrop-blur-lg sm:m-4 sm:max-w-lg sm:rounded-2xl sm:border-white/65"
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <h2 id={sizeGuideTitleId} className="font-headline text-[17px] font-medium leading-[1.4] text-obsidian">
                Size guide
              </h2>
              <button
                type="button"
                data-size-guide-close
                className="font-label shrink-0 border-2 border-obsidian px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-obsidian transition-colors hover:bg-obsidian hover:text-white"
                onClick={closeSizeGuide}
              >
                Close
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[280px] border-collapse font-body text-sm text-warm-charcoal">
                <thead>
                  <tr className="border-b-2 border-obsidian text-left">
                    <th className="py-2 pr-2 font-label text-[10px] font-medium uppercase tracking-wider text-label">Size</th>
                    <th className="py-2 pr-2 font-label text-[10px] font-medium uppercase tracking-wider text-label">Chest</th>
                    <th className="py-2 pr-2 font-label text-[10px] font-medium uppercase tracking-wider text-label">Length</th>
                    <th className="py-2 font-label text-[10px] font-medium uppercase tracking-wider text-label">Sleeve</th>
                  </tr>
                </thead>
                <tbody>
                  {SIZE_TABLE.map((row) => (
                    <tr key={row.size} className="border-b border-stone">
                      <td className="py-2.5 pr-2 font-medium text-obsidian">{row.size}</td>
                      <td className="py-2.5 pr-2">{row.chest}</td>
                      <td className="py-2.5 pr-2">{row.length}</td>
                      <td className="py-2.5">{row.sleeve}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 font-body text-[13px] leading-normal text-clay">Model is 178 cm, wearing size M.</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
