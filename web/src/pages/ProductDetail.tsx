import {
  Link,
  useNavigate,
  useParams,
} from 'react-router-dom';
import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react';
import {
  getArtist,
  getProduct,
  getVibe,
  productsByVibe,
  type ProductSizeKey,
} from '../data/site';
import { useCart } from '../cart/CartContext';
import {
  artistAvatars,
  getProductMedia,
  getProductPdpGallery,
  imgUrl,
} from '../data/images';
import { TeeImage, TeeImageFrame } from '../components/TeeImage';
import { ProductQuickView } from '../components/ProductQuickView';
import { QuickViewTrigger } from '../components/QuickViewTrigger';
import { formatEgp } from '../utils/formatPrice';
import { notifyRestockSignup } from '../utils/pdpNotifyRestock';
import { HORO_SUPPORT_CHANNELS, PDP_SCHEMA, isConfiguredExternalUrl } from '../data/domain-config';
import { PDP_FEATURE_ICONS } from '../data/pdpIconRegistry';

const { sizes, sizeTable, copy } = PDP_SCHEMA;

const featureStripItems = PDP_SCHEMA.features.map((feature) => ({
  label: feature.label,
  Icon: PDP_FEATURE_ICONS[feature.icon],
}));

function formatTitleLines(name: string) {
  const words = name.trim().split(/\s+/);
  if (words.length <= 1) return name;
  const mid = Math.ceil(words.length / 2);
  return (
    <>
      {words.slice(0, mid).join(' ')}
      <br />
      {words.slice(mid).join(' ')}
    </>
  );
}

function IconCart() {
  return (
    <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
      />
    </svg>
  );
}

function IconChevronDown() {
  return (
    <svg
      className="h-5 w-5 shrink-0 transition-transform duration-200 group-open:rotate-180"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function AccordionSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="group border-t border-stone/30">
      <summary className="font-headline flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 text-sm font-medium uppercase tracking-wide text-obsidian focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal [&::-webkit-details-marker]:hidden">
        {title}
        <IconChevronDown />
      </summary>
      <div className="animate-fade-in pb-6 pt-1">{children}</div>
    </details>
  );
}

export function ProductDetail() {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const product = getProduct(slug);

  const [photoIndex, setPhotoIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [relatedQuickViewSlug, setRelatedQuickViewSlug] = useState<string | null>(null);
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifyError, setNotifyError] = useState(false);
  const [notifySuccess, setNotifySuccess] = useState(false);

  const sizeGuideTriggerRef = useRef<HTMLButtonElement | null>(null);
  const sizeGuideDialogRef = useRef<HTMLDivElement | null>(null);
  const sizeSectionRef = useRef<HTMLDivElement | null>(null);
  const notifyFormRef = useRef<HTMLDivElement | null>(null);
  const notifyInputRef = useRef<HTMLInputElement | null>(null);
  const lightboxCloseRef = useRef<HTMLButtonElement | null>(null);

  const sizeGuideWasOpenRef = useRef(false);
  const sizeGuideTitleId = useId();
  const notifyFieldId = useId();

  useEffect(() => {
    setPhotoIndex(0);
    setSelectedSize(null);
    setLightboxOpen(false);
    setRelatedQuickViewSlug(null);
  }, [slug]);

  const media = product ? getProductMedia(product.slug) : getProductMedia('');
  const gallery = product ? getProductPdpGallery(product.name, product.slug) : [];
  const vibe = product ? getVibe(product.vibeSlug) : undefined;
  const artist = product ? getArtist(product.artistSlug) : undefined;
  const related = product
    ? productsByVibe(product.vibeSlug)
        .filter((item) => item.slug !== slug)
        .slice(0, 4)
    : [];

  const heroView =
    gallery[photoIndex] ??
    gallery[0] ?? {
      key: 'onBody' as const,
      src: media.main,
      label: 'image',
      alt: `HORO “${product?.name ?? 'product'}” t-shirt.`,
    };

  const detailView = gallery.find((view) => view.key === 'detail') ?? null;
  const hasGalleryRail = gallery.length > 1;
  const primaryGallerySrc = gallery[0]?.src ?? media.main;

  const sizeDef = selectedSize ? sizes.find((size) => size.key === selectedSize) : undefined;
  const oosSelected = Boolean(sizeDef?.disabled);
  const sizeReady = Boolean(selectedSize && sizeDef && !sizeDef.disabled);
  const inventoryHint =
    selectedSize && product?.inventoryHintBySize
      ? product.inventoryHintBySize[selectedSize as ProductSizeKey]
      : undefined;

  const trustItems = [
    '220 GSM cotton',
    artist ? `Illustrated by ${artist.name}` : 'Illustrated artwork',
    'Free exchange 14d',
    'COD available',
  ];

  const modelLine = copy.modelLineTemplate.replace(
    '{fit}',
    product?.fitLabel ? ` — ${product.fitLabel.toLowerCase()} fit` : ''
  );
  const whatsappSupportUrl = isConfiguredExternalUrl(HORO_SUPPORT_CHANNELS.whatsappSupportUrl)
    ? HORO_SUPPORT_CHANNELS.whatsappSupportUrl
    : null;

  useEffect(() => {
    if (gallery.length === 0) return;
    setPhotoIndex((index) => (index >= gallery.length ? 0 : index));
  }, [gallery.length]);

  useEffect(() => {
    if (!primaryGallerySrc) return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = imgUrl(primaryGallerySrc, 1200);
    document.head.appendChild(link);

    return () => link.remove();
  }, [primaryGallerySrc]);

  useEffect(() => {
    if (!sizeGuideOpen) return;

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setSizeGuideOpen(false);
        return;
      }

      if (event.key !== 'Tab' || !sizeGuideDialogRef.current) return;

      const focusables = sizeGuideDialogRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (event.shiftKey) {
        if (document.activeElement === first) {
          event.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    const timeout = window.setTimeout(() => {
      const closeButton = sizeGuideDialogRef.current?.querySelector<HTMLElement>('[data-size-guide-close]');
      closeButton?.focus();
    }, 0);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      window.clearTimeout(timeout);
    };
  }, [sizeGuideOpen]);

  useEffect(() => {
    if (sizeGuideOpen) {
      sizeGuideWasOpenRef.current = true;
      return;
    }

    if (sizeGuideWasOpenRef.current) {
      sizeGuideWasOpenRef.current = false;
      queueMicrotask(() => {
        sizeGuideTriggerRef.current?.focus();
      });
    }
  }, [sizeGuideOpen]);

  useEffect(() => {
    if (!lightboxOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        setLightboxOpen(false);
      }

      if (gallery.length < 2) return;

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setPhotoIndex((index) => (index <= 0 ? gallery.length - 1 : index - 1));
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        setPhotoIndex((index) => (index >= gallery.length - 1 ? 0 : index + 1));
      }
    };

    window.addEventListener('keydown', onKeyDown);

    const timeout = window.setTimeout(() => {
      lightboxCloseRef.current?.focus();
    }, 0);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
      window.clearTimeout(timeout);
    };
  }, [gallery.length, lightboxOpen]);

  useEffect(() => {
    setNotifyEmail('');
    setNotifyError(false);
  }, [selectedSize, slug]);

  useEffect(() => {
    if (!product || !selectedSize || !sizeDef?.disabled) {
      setNotifySuccess(false);
      return;
    }

    setNotifySuccess(Boolean(localStorage.getItem(`horo-pdp-notify-${product.slug}-${selectedSize}`)));
  }, [product, selectedSize, sizeDef?.disabled]);

  function closeSizeGuide() {
    setSizeGuideOpen(false);
  }

  function nudgeSizeSection() {
    const element = sizeSectionRef.current;
    if (!element) return;

    element.classList.add(
      'ring-2',
      'ring-ember',
      'ring-offset-4',
      'rounded-md',
      'transition-all',
      'duration-300',
      'pdp-size-nudge'
    );

    window.setTimeout(() => {
      element.classList.remove(
        'ring-2',
        'ring-ember',
        'ring-offset-4',
        'rounded-md',
        'transition-all',
        'duration-300',
        'pdp-size-nudge'
      );
    }, 1200);
  }

  function handleMissingSize() {
    if (!sizeSectionRef.current) return;
    sizeSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    nudgeSizeSection();
  }

  function handleNotifySubmit(event: FormEvent) {
    event.preventDefault();
    if (!product || !selectedSize || !sizeDef?.disabled) return;

    const email = notifyEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setNotifyError(true);
      return;
    }

    setNotifyError(false);
    notifyRestockSignup({ productSlug: product.slug, size: selectedSize, email });
    setNotifySuccess(true);
  }

  function handlePrimaryAction() {
    if (!product) return;

    if (oosSelected) {
      notifyFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      window.setTimeout(() => notifyInputRef.current?.focus(), 320);
      return;
    }

    if (!sizeReady) {
      handleMissingSize();
      return;
    }

    if (!selectedSize) return;
    addItem(product.slug, selectedSize as ProductSizeKey, 1);
    navigate('/cart');
  }

  function handleGalleryKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (lightboxOpen || gallery.length < 2) return;

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      setPhotoIndex((index) => (index <= 0 ? gallery.length - 1 : index - 1));
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      setPhotoIndex((index) => (index >= gallery.length - 1 ? 0 : index + 1));
    }
  }

  function primaryCtaLabel() {
    if (oosSelected) return copy.notifyMeCTA;
    if (sizeReady) return `${copy.addBtnCTA} — ${formatEgp(product.priceEgp)}`;
    return copy.selectSizePrompt;
  }

  const desktopCtaClass = `flex min-h-14 w-full items-center justify-center gap-2 rounded-xl px-4 py-4 text-sm font-semibold uppercase tracking-[0.18em] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal ${
    oosSelected
      ? 'bg-obsidian text-white hover:bg-obsidian/92'
      : 'bg-ember text-obsidian hover:bg-ember/90'
  }`;

  const mobileCtaClass = `flex min-h-14 w-full items-center justify-center gap-2 rounded-[16px] px-4 py-4 text-sm font-semibold uppercase tracking-[0.18em] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal ${
    oosSelected
      ? 'bg-obsidian text-white hover:bg-obsidian/92'
      : 'bg-ember text-obsidian hover:bg-ember/90'
  }`;

  if (!product) {
    return (
      <div className="bg-papyrus px-4 py-16 text-center">
        <p className="font-body text-warm-charcoal">Product not found.</p>
        <Link to="/vibes" className="font-label mt-4 inline-block text-deep-teal underline">
          Shop by Vibe
        </Link>
      </div>
    );
  }

  return (
    <div className="product-page bg-papyrus text-obsidian">
      <span id="pdp-size-hint" className="sr-only">
        {copy.sizeRequiredPrompt}
      </span>

      <nav
        className="border-b border-stone/30 bg-papyrus/92 px-4 py-3 font-body text-[12px] text-clay backdrop-blur-sm md:px-8 md:py-3.5"
        aria-label="Breadcrumb"
      >
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-x-2 gap-y-1">
          <Link
            to="/"
            className="inline-flex min-h-11 items-center rounded-sm px-1 text-clay transition-colors hover:text-obsidian"
          >
            Home
          </Link>
          <span className="text-clay/50" aria-hidden>
            /
          </span>
          {vibe ? (
            <>
              <Link
                to={`/vibes/${vibe.slug}`}
                className="inline-flex min-h-11 max-w-[12rem] items-center truncate rounded-sm px-1 text-clay transition-colors hover:text-obsidian"
              >
                {vibe.name}
              </Link>
              <span className="text-clay/50" aria-hidden>
                /
              </span>
            </>
          ) : null}
          <span className="min-h-11 max-w-[min(100%,100vw-8rem)] truncate py-2 text-warm-charcoal">{product.name}</span>
        </div>
      </nav>

      <section className="mx-auto grid max-w-[1600px] gap-6 px-4 pb-12 pt-4 md:grid-cols-[minmax(0,1.45fr)_minmax(22rem,30rem)] md:gap-8 md:px-8 md:pb-16 md:pt-6 lg:px-12">
        <div className="space-y-4 md:space-y-5">
          <div
            className="outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
            onKeyDown={handleGalleryKeyDown}
            tabIndex={0}
            role="region"
            aria-label="Product images"
          >
            <button
              type="button"
              className="block w-full overflow-hidden rounded-[20px] border border-stone/25 bg-surface-container-high focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
              onClick={() => setLightboxOpen(true)}
              aria-label={`Open full screen — ${heroView.label}`}
            >
              <div className="aspect-[4/5] w-full overflow-hidden bg-surface-container-high">
                <TeeImage
                  src={heroView.src}
                  alt={heroView.alt}
                  w={1600}
                  eager
                  className="h-full w-full"
                />
              </div>
            </button>
          </div>

          {hasGalleryRail ? (
            <div className="grid grid-cols-5 gap-2 md:gap-3" aria-label="Product image thumbnails">
              {gallery.map((view, index) => (
                <button
                  key={`${product.slug}-${view.key}`}
                  type="button"
                  onClick={() => setPhotoIndex(index)}
                  className={`min-h-12 overflow-hidden rounded-xl border bg-surface-container-high transition-shadow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal ${
                    photoIndex === index
                      ? 'border-obsidian shadow-[0_0_0_2px_rgba(26,26,26,0.08)]'
                      : 'border-stone/45 hover:border-obsidian/55'
                  }`}
                  aria-pressed={photoIndex === index}
                  aria-label={`Show ${view.label}`}
                >
                  <div className="aspect-[4/5] w-full">
                    <TeeImage src={view.src} alt="" w={320} className="h-full w-full" />
                  </div>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <aside className="md:sticky md:top-24 md:self-start">
          <div className="space-y-6 md:rounded-[24px] md:border md:border-stone/35 md:bg-white/55 md:p-6 md:shadow-[0_24px_70px_-52px_rgba(26,26,26,0.4)] md:backdrop-blur-md lg:p-8">
            <header className="space-y-4">
              {vibe ? (
                <Link
                  to={`/vibes/${vibe.slug}`}
                  className="font-label inline-flex min-h-11 items-center rounded-full border border-dusk-violet/35 bg-dusk-violet/8 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-dusk-violet transition-colors hover:border-dusk-violet/60 hover:bg-dusk-violet/14"
                >
                  {vibe.name}
                </Link>
              ) : null}

              <h1 className="font-pdp-serif text-[clamp(2rem,5vw,3.4rem)] font-semibold uppercase leading-[0.95] tracking-tight text-obsidian">
                {formatTitleLines(product.name)}
              </h1>
            </header>

            <section
              className="glass-morphism-violet rounded-[20px] p-5 text-obsidian md:p-6"
              aria-labelledby="pdp-story-card-heading"
            >
              <p
                id="pdp-story-card-heading"
                className="font-label mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-obsidian"
              >
                {copy.storyCardHeading}
              </p>
              <p className="font-pdp-serif text-[1.05rem] leading-relaxed md:text-[1.15rem]">{product.story}</p>
            </section>

            <div className="space-y-5">
              <p className="font-pdp-serif text-[1.8rem] font-semibold leading-none text-obsidian md:text-[2rem]">
                {formatEgp(product.priceEgp)}
              </p>

              <div ref={sizeSectionRef} className="space-y-3 border-t border-stone/30 pt-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-label text-[11px] font-medium uppercase tracking-[0.24em] text-label">Size</p>
                  <button
                    ref={sizeGuideTriggerRef}
                    type="button"
                    onClick={() => setSizeGuideOpen(true)}
                    className="font-label inline-flex min-h-11 items-center text-[11px] font-medium uppercase tracking-[0.18em] text-deep-teal underline decoration-deep-teal/35 underline-offset-4 transition-colors hover:text-obsidian"
                  >
                    {copy.sizeGuideLabel}
                  </button>
                </div>

                <div className="flex flex-wrap gap-2.5" role="group" aria-label="Size">
                  {sizes.map(({ key, disabled }) => {
                    const isSelected = selectedSize === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSelectedSize(isSelected ? null : key)}
                        aria-pressed={isSelected}
                        className={`flex h-12 min-w-12 items-center justify-center rounded-xl border-2 px-3 font-headline text-base font-semibold transition-colors focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal ${
                          disabled
                            ? isSelected
                              ? 'border-obsidian bg-obsidian text-white line-through decoration-white/70'
                              : 'border-stone bg-papyrus/50 text-clay line-through decoration-obsidian/30 hover:border-obsidian/45'
                            : isSelected
                              ? 'border-obsidian bg-white text-obsidian shadow-sm'
                              : 'border-stone/80 bg-white text-obsidian hover:border-obsidian'
                        }`}
                      >
                        <span aria-disabled={disabled}>{key}</span>
                      </button>
                    );
                  })}
                </div>

                {inventoryHint ? (
                  <p className="font-label text-[11px] font-medium uppercase tracking-[0.18em] text-warm-charcoal">
                    {inventoryHint}
                  </p>
                ) : null}

                {oosSelected ? (
                  <p className="font-label text-[11px] font-medium uppercase tracking-[0.18em] text-warm-charcoal">
                    Out of stock for this size
                  </p>
                ) : null}
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handlePrimaryAction}
                  className={desktopCtaClass}
                  aria-describedby={sizeReady || oosSelected ? undefined : 'pdp-size-hint'}
                >
                  <IconCart />
                  <span>{primaryCtaLabel()}</span>
                </button>

                {oosSelected ? (
                  <div ref={notifyFormRef} className="space-y-3">
                    {notifySuccess ? (
                      <p
                        className="rounded-xl border border-deep-teal/25 bg-frost-blue/40 px-4 py-3 font-body text-sm text-obsidian"
                        role="status"
                      >
                        {copy.notifySuccess}
                      </p>
                    ) : (
                      <form onSubmit={handleNotifySubmit} className="space-y-3">
                        <label
                          htmlFor={notifyFieldId}
                          className="font-label block text-[11px] font-medium uppercase tracking-[0.18em] text-label"
                        >
                          {copy.notifyFieldLabel}
                        </label>
                        <input
                          ref={notifyInputRef}
                          id={notifyFieldId}
                          type="email"
                          name="notify-email"
                          autoComplete="email"
                          placeholder={copy.notifyEmailPlaceholder}
                          value={notifyEmail}
                          onChange={(event) => {
                            setNotifyEmail(event.target.value);
                            setNotifyError(false);
                          }}
                          className="min-h-12 w-full rounded-xl border border-stone bg-white px-4 py-3 font-body text-sm text-obsidian shadow-sm placeholder:text-clay/80 focus:border-deep-teal focus:outline-none focus:ring-2 focus:ring-deep-teal/25"
                          aria-invalid={notifyError}
                          aria-describedby={notifyError ? `${notifyFieldId}-error` : undefined}
                        />
                        {notifyError ? (
                          <p id={`${notifyFieldId}-error`} className="font-body text-xs text-obsidian">
                            {copy.notifyInvalidEmail}
                          </p>
                        ) : null}
                        <button type="submit" className={desktopCtaClass}>
                          <IconCart />
                          <span>{copy.notifyMeCTA}</span>
                        </button>
                      </form>
                    )}
                  </div>
                ) : null}

                {whatsappSupportUrl ? (
                  <a
                    href={whatsappSupportUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-label inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-stone bg-white px-4 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-obsidian shadow-sm transition-colors hover:border-desert-sand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                  >
                    {copy.whatsappHelpLabel}
                  </a>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2 border-t border-stone/30 pt-5" aria-label="Trust and service highlights">
                {trustItems.map((item) => (
                  <span
                    key={item}
                    className="font-label rounded-full border border-stone/50 bg-white/70 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-warm-charcoal"
                  >
                    {item}
                  </span>
                ))}
              </div>

              {artist ? (
                <div className="flex items-center gap-3 border-t border-stone/30 pt-5">
                  {artistAvatars[artist.slug] ? (
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-surface-container-high ring-1 ring-stone/45">
                      <TeeImage
                        src={artistAvatars[artist.slug]}
                        alt={artist.name}
                        w={160}
                        eager
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : null}
                  <p className="font-body text-sm leading-snug text-warm-charcoal">
                    <span className="text-clay">{copy.illustratedByLabel}</span>{' '}
                    <span className="font-medium text-obsidian">
                      {artist.name}
                    </span>
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </aside>
      </section>

      <section className="border-t border-stone/25 bg-papyrus">
        <div className="mx-auto max-w-[1600px] px-4 py-10 md:px-8 md:py-12 lg:px-12">
          <div className="max-w-[980px]">
            <AccordionSection title={copy.accordionProductDetails}>
              <p className="mb-5 font-body text-sm leading-relaxed text-warm-charcoal md:text-[15px]">
                {modelLine}
              </p>
              <div className="pdp-feature-strip" role="list">
                {featureStripItems.map(({ label, Icon }) => (
                  <div key={label} className="pdp-feature-item" role="listitem">
                    <div className="pdp-feature-icon" aria-hidden>
                      <Icon />
                    </div>
                    <p className="font-body text-center text-[11px] font-medium leading-snug text-warm-charcoal md:text-left md:text-xs">
                      {label}
                    </p>
                  </div>
                ))}
              </div>
            </AccordionSection>

            <AccordionSection title={copy.accordionDesignStory}>
              {detailView && detailView.src !== primaryGallerySrc ? (
                <figure className="mb-4 overflow-hidden rounded-[18px] border border-stone/30 bg-surface-container-high">
                  <div className="aspect-[4/5] w-full md:aspect-[16/10]">
                    <TeeImage
                      src={detailView.src}
                      alt={detailView.alt}
                      w={1200}
                      className="h-full w-full"
                    />
                  </div>
                </figure>
              ) : null}
              <p className="font-body text-sm font-medium leading-relaxed text-warm-charcoal md:text-[15px]">
                {copy.designStoryAccordionBody}{' '}
                <span className="block pt-2 text-warm-charcoal/95">
                  Part of the{' '}
                  {vibe ? (
                    <Link
                      to={`/vibes/${vibe.slug}`}
                      className="border-b border-obsidian/25 font-medium text-obsidian transition-colors hover:text-deep-teal"
                    >
                      {vibe.name}
                    </Link>
                  ) : (
                    'collection'
                  )}{' '}
                  line — artwork by{' '}
                  {artist ? (
                    <span className="font-medium text-deep-teal">
                      {artist.name}
                    </span>
                  ) : (
                    'the artist'
                  )}
                  .
                </span>
              </p>
            </AccordionSection>

            <AccordionSection title={copy.accordionShipping}>
              <div className="space-y-3 font-body text-sm text-warm-charcoal">
                {copy.shippingSections.map((section) => (
                  <p key={section.title}>
                    <strong>{section.title}:</strong> {section.body}
                  </p>
                ))}
              </div>
            </AccordionSection>
          </div>
        </div>
      </section>

      <section className="border-t border-stone/25 bg-papyrus">
        <div className="mx-auto max-w-[1600px] px-4 pb-10 pt-8 md:px-8 md:pb-12 md:pt-10 lg:px-12">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="font-label text-[10px] font-medium uppercase tracking-[0.25em] text-clay">Discovery</span>
              <h2 className="font-headline mt-1 text-2xl font-semibold uppercase tracking-tight text-obsidian md:text-3xl">
                More from {vibe?.name ?? 'this vibe'}
              </h2>
              <p className="mt-1.5 max-w-[40rem] font-body text-sm text-clay">{copy.relatedMoreFromSubtitle}</p>
            </div>
            {vibe ? (
              <Link
                to={`/vibes/${vibe.slug}`}
                className="font-label inline-flex min-h-12 items-center rounded-xl border border-obsidian/80 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-obsidian transition-colors hover:bg-obsidian hover:text-white"
              >
                Shop by Vibe
              </Link>
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-4 md:gap-6">
            {related.map((item) => (
              <article
                key={item.slug}
                className="group relative overflow-hidden rounded-[18px] bg-white shadow-sm ring-1 ring-black/5 transition-shadow hover:shadow-md"
              >
                <Link
                  to={`/products/${item.slug}`}
                  className="absolute inset-0 z-[1] rounded-[18px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                >
                  <span className="sr-only">
                    View {item.name}, {formatEgp(item.priceEgp)}
                  </span>
                </Link>

                <div className="pointer-events-none relative z-[2]">
                  <div className="relative overflow-hidden rounded-t-[18px]">
                    <div className="transition-transform duration-700 ease-out group-hover:scale-[1.03]">
                      <TeeImageFrame
                        src={getProductMedia(item.slug).main}
                        alt={`HORO “${item.name}” tee`}
                        w={500}
                        aspectRatio="4/5"
                        borderRadius="1.125rem 1.125rem 0 0"
                        frameStyle={{ marginBottom: 0 }}
                      />
                    </div>
                    <QuickViewTrigger
                      productName={item.name}
                      className="pointer-events-auto bottom-3 left-3 right-3"
                      onClick={() => setRelatedQuickViewSlug(item.slug)}
                    />
                  </div>

                  <div className="p-4">
                    <h3 className="font-headline text-[11px] font-semibold uppercase tracking-wide text-obsidian group-hover:text-deep-teal md:text-xs">
                      {item.name}
                    </h3>
                    <p className="font-body mt-1 text-xs text-clay">{formatEgp(item.priceEgp)}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-90 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] md:hidden">
        <div className="pointer-events-auto rounded-[20px] border border-obsidian/10 bg-papyrus/92 p-2 shadow-[0_24px_60px_-28px_rgba(26,26,26,0.55)] backdrop-blur-xl">
          <button
            type="button"
            onClick={handlePrimaryAction}
            className={mobileCtaClass}
            aria-describedby={sizeReady || oosSelected ? undefined : 'pdp-size-hint'}
          >
            <IconCart />
            <span>{primaryCtaLabel()}</span>
          </button>
        </div>
      </div>

      {lightboxOpen ? (
        <div
          className="pdp-lightbox fixed inset-0 z-130 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Lightbox — ${heroView.label}`}
        >
          <button
            type="button"
            className="absolute inset-0 z-0 bg-obsidian/88"
            aria-label="Close enlarged image"
            onClick={() => setLightboxOpen(false)}
          />
          <div className="pointer-events-none relative z-10 flex max-h-[min(92vh,100%)] max-w-[min(96vw,1200px)] flex-col items-center">
            <button
              ref={lightboxCloseRef}
              type="button"
              className="pointer-events-auto font-label relative z-20 mb-3 min-h-12 rounded-sm border border-white/35 bg-white/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-white backdrop-blur-sm hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              onClick={() => setLightboxOpen(false)}
            >
              Close
            </button>
            <img
              src={imgUrl(heroView.src, 2000)}
              alt={heroView.alt}
              className="pointer-events-none max-h-[min(85vh,88vw)] w-auto max-w-full object-contain shadow-2xl"
              width={1200}
              height={1600}
            />
          </div>
        </div>
      ) : null}

      {sizeGuideOpen ? (
        <div className="fixed inset-0 z-125 flex items-end justify-center sm:items-center" role="presentation">
          <div className="absolute inset-0 bg-obsidian/40" aria-hidden onClick={closeSizeGuide} />
          <div
            ref={sizeGuideDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={sizeGuideTitleId}
            className="relative z-10 m-0 max-h-[90vh] w-full overflow-y-auto rounded-t-2xl border border-white/60 bg-frost-blue/25 px-5 py-6 shadow-[0_4px_24px_rgba(26,26,26,0.12)] backdrop-blur-lg sm:m-4 sm:max-w-lg sm:rounded-2xl sm:border-white/65"
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <h2 id={sizeGuideTitleId} className="font-headline text-[17px] font-medium leading-[1.4] text-obsidian">
                {copy.sizeGuideLabel}
              </h2>
              <button
                type="button"
                data-size-guide-close
                className="font-label min-h-11 shrink-0 rounded-sm border border-obsidian px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-obsidian transition-colors hover:bg-obsidian hover:text-white"
                onClick={closeSizeGuide}
              >
                Close
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[280px] border-collapse font-body text-sm text-warm-charcoal">
                <thead>
                  <tr className="border-b border-stone text-left">
                    <th className="py-2 pr-2 font-label text-[10px] font-medium uppercase tracking-wider text-label">Size</th>
                    <th className="py-2 pr-2 font-label text-[10px] font-medium uppercase tracking-wider text-label">Chest</th>
                    <th className="py-2 pr-2 font-label text-[10px] font-medium uppercase tracking-wider text-label">Length</th>
                    <th className="py-2 font-label text-[10px] font-medium uppercase tracking-wider text-label">Sleeve</th>
                  </tr>
                </thead>
                <tbody>
                  {sizeTable.map((row) => (
                    <tr key={row.size} className="border-b border-stone/70">
                      <td className="py-2.5 pr-2 font-medium text-obsidian">{row.size}</td>
                      <td className="py-2.5 pr-2">{row.chest}</td>
                      <td className="py-2.5 pr-2">{row.length}</td>
                      <td className="py-2.5">{row.sleeve}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-4 font-body text-[13px] leading-normal text-clay">{copy.sizeGuideModelNote}</p>
          </div>
        </div>
      ) : null}

      <ProductQuickView
        open={relatedQuickViewSlug !== null}
        productSlug={relatedQuickViewSlug}
        onClose={() => setRelatedQuickViewSlug(null)}
      />
    </div>
  );
}
