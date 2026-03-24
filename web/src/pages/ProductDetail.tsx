import { Link, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { getArtist, getProduct, getVibe, productsByVibe, type ProductSizeKey } from '../data/site';
import { getProductMedia, imgUrl } from '../data/images';
import { TeeImage, TeeImageFrame } from '../components/TeeImage';
import { ProductQuickView } from '../components/ProductQuickView';
import { formatEgp } from '../utils/formatPrice';
import { notifyRestockSignup } from '../utils/pdpNotifyRestock';
import { PDP_SCHEMA } from '../data/domain-config';
import { PDP_FEATURE_ICONS, PDP_TRUST_ICONS } from '../data/pdpIconRegistry';

const { viewLabels, surfacePhrases, sizes, sizeTable, copy } = PDP_SCHEMA;

const featureStripItems = PDP_SCHEMA.features.map((f) => ({
  label: f.label,
  Icon: PDP_FEATURE_ICONS[f.icon],
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

function surfacePhraseForView(viewIndex: number): string {
  return surfacePhrases[viewIndex] ?? surfacePhrases[surfacePhrases.length - 1];
}

function mainGalleryAlt(productName: string, viewIndex: number): string {
  const view = viewLabels[viewIndex] ?? 'view';
  const surface = surfacePhraseForView(viewIndex);
  return `HORO “${productName}” t-shirt, ${view} on ${surface}.`;
}

function IconStar({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'h-4 w-4 text-obsidian'} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
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

export function ProductDetail() {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const p = getProduct(slug);
  const { gallery } = p ? getProductMedia(p.slug) : { gallery: [] as string[] };
  const [photoIndex, setPhotoIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [relatedQuickViewSlug, setRelatedQuickViewSlug] = useState<string | null>(null);
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifyError, setNotifyError] = useState(false);
  const [notifySuccess, setNotifySuccess] = useState(false);
  const [mobilePurchaseOpen, setMobilePurchaseOpen] = useState(false);

  const sizeGuideTriggerRef = useRef<HTMLButtonElement | null>(null);
  const sizeGuideDialogRef = useRef<HTMLDivElement | null>(null);
  const sizeSectionRef = useRef<HTMLDivElement | null>(null);
  const notifyFormRef = useRef<HTMLFormElement | null>(null);
  const notifyInputRef = useRef<HTMLInputElement | null>(null);

  const sizeGuideWasOpenRef = useRef(false);
  const sizeGuideTitleId = useId();
  const notifyFieldId = useId();
  const mobilePurchaseTitleId = useId();
  const lightboxCloseRef = useRef<HTMLButtonElement | null>(null);
  const mobileDrawerCloseRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    setPhotoIndex(0);
    setLightboxOpen(false);
    setRelatedQuickViewSlug(null);
    setMobilePurchaseOpen(false);
  }, [slug]);

  useEffect(() => {
    if (gallery.length === 0) return;
    setPhotoIndex((i) => (i >= gallery.length ? 0 : i));
  }, [gallery.length]);

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

  useEffect(() => {
    if (!p) return;
    const g = getProductMedia(p.slug).gallery;
    if (g.length === 0) return;
    const links: HTMLLinkElement[] = [];
    g.forEach((src) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = imgUrl(src, 1200);
      document.head.appendChild(link);
      links.push(link);
    });
    return () => links.forEach((l) => l.remove());
  }, [p?.slug]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false);
    };
    window.addEventListener('keydown', onKey);
    const t = window.setTimeout(() => lightboxCloseRef.current?.focus(), 0);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
      window.clearTimeout(t);
    };
  }, [lightboxOpen]);

  useEffect(() => {
    if (!mobilePurchaseOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobilePurchaseOpen(false);
    };
    window.addEventListener('keydown', onKey);
    const t = window.setTimeout(() => mobileDrawerCloseRef.current?.focus(), 0);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
      window.clearTimeout(t);
    };
  }, [mobilePurchaseOpen]);

  useEffect(() => {
    setNotifyEmail('');
    setNotifyError(false);
  }, [slug, selectedSize]);

  useEffect(() => {
    if (!p || !selectedSize) {
      setNotifySuccess(false);
      return;
    }
    const def = sizes.find((s) => s.key === selectedSize);
    if (!def?.disabled) {
      setNotifySuccess(false);
      return;
    }
    setNotifySuccess(Boolean(localStorage.getItem(`horo-pdp-notify-${p.slug}-${selectedSize}`)));
  }, [p, selectedSize]);

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

  const product = p;
  const vibe = getVibe(product.vibeSlug);
  const artist = getArtist(product.artistSlug);
  const related = productsByVibe(product.vibeSlug).filter((x) => x.slug !== slug).slice(0, 4);
  const mainSrc = gallery[photoIndex] ?? gallery[0];
  const designStoryImageSrc =
    gallery.length >= 5
      ? gallery[4]
      : gallery.length > 3
        ? gallery[3]
        : gallery.length > 0
          ? gallery[gallery.length - 1]
          : gallery[0];

  const sizeDef = selectedSize ? sizes.find((s) => s.key === selectedSize) : undefined;
  const oosSelected = Boolean(sizeDef?.disabled);
  const sizeReady = Boolean(selectedSize && sizeDef && !sizeDef.disabled);

  const inventoryHint =
    selectedSize && product.inventoryHintBySize
      ? product.inventoryHintBySize[selectedSize as ProductSizeKey]
      : undefined;

  const modelLine = copy.modelLineTemplate.replace(
    '{fit}',
    product.fitLabel ? ` — ${product.fitLabel.toLowerCase()} fit` : ''
  );

  const closeSizeGuide = () => setSizeGuideOpen(false);

  function handleMissingSize() {
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 767.98px)').matches) {
      setMobilePurchaseOpen(true);
      return;
    }
    if (sizeSectionRef.current) {
      sizeSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      sizeSectionRef.current.classList.add(
        'ring-2',
        'ring-ember',
        'ring-offset-4',
        'rounded-md',
        'transition-all',
        'duration-300',
        'pdp-size-nudge'
      );
      window.setTimeout(() => {
        sizeSectionRef.current?.classList.remove(
          'ring-2',
          'ring-ember',
          'ring-offset-4',
          'rounded-md',
          'pdp-size-nudge'
        );
      }, 1200);
    }
  }

  function handleNotifySubmit(e: FormEvent) {
    e.preventDefault();
    if (!selectedSize || !sizeDef?.disabled) return;
    const email = notifyEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setNotifyError(true);
      return;
    }
    setNotifyError(false);
    notifyRestockSignup({ productSlug: product.slug, size: selectedSize, email });
    setNotifySuccess(true);
  }

  function handleBuyOrScroll() {
    if (oosSelected) {
      if (notifySuccess) return;
      notifyFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      window.setTimeout(() => notifyInputRef.current?.focus(), 450);
      return;
    }
    if (!sizeReady) {
      handleMissingSize();
      return;
    }
    setMobilePurchaseOpen(false);
    navigate('/cart');
  }

  function openLightbox() {
    setLightboxOpen(true);
  }

  function primaryCtaLine(): string {
    if (oosSelected) return copy.notifyMeCTA;
    if (sizeReady) return copy.addBtnCTA;
    return copy.selectSizePrompt;
  }

  function showBrandTagUnderCta(): boolean {
    return !oosSelected;
  }

  const ctaClass = `flex w-full min-h-12 flex-col items-center justify-center gap-1 rounded-sm py-4 text-sm font-semibold uppercase tracking-wider md:min-h-14 md:py-5 md:text-base transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal ${
    oosSelected
      ? 'bg-amber-100 text-obsidian hover:bg-amber-200'
      : sizeReady
        ? 'bg-obsidian text-white shadow-sm hover:bg-obsidian/90'
        : 'border-2 border-stone bg-papyrus/80 text-clay opacity-90'
  }`;

  const wornIndices = [...PDP_SCHEMA.wornByGalleryIndices];

  return (
    <div className="product-page bg-papyrus text-obsidian">
      <span id="pdp-size-hint" className="sr-only">
        {copy.sizeRequiredPrompt}
      </span>

      <nav
        className="flex min-h-[52px] flex-wrap items-center gap-x-2 gap-y-1 border-b border-stone/40 bg-papyrus px-4 py-2.5 font-body text-[13px] leading-normal text-clay md:min-h-0 md:px-8 md:py-4 md:text-sm"
        aria-label="Breadcrumb"
      >
        <Link
          to="/"
          className="-my-1 inline-flex min-h-11 min-w-[44px] items-center rounded-sm px-1.5 text-clay transition-colors hover:text-ember"
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
              className="-my-1 inline-flex min-h-11 min-w-[44px] max-w-[min(100%,12rem)] items-center truncate rounded-sm px-1.5 text-clay transition-colors hover:text-ember"
            >
              {vibe.name}
            </Link>
            <span className="text-clay/50" aria-hidden>
              /
            </span>
          </>
        ) : null}
        <span className="min-h-11 max-w-[min(100%,100vw-8rem)] truncate py-1.5 text-warm-charcoal">{product.name}</span>
      </nav>

      <div className="flex min-h-0 flex-col bg-papyrus md:flex-row md:items-start">
        <div className="relative w-full shrink-0 md:w-[60%] md:border-r md:border-stone/40">
          <Link
            to="/"
            className="font-pdp-serif absolute left-8 top-6 z-10 hidden text-3xl font-semibold tracking-wide text-obsidian md:block"
          >
            HORO
          </Link>
          <div className="px-0 md:px-0 lg:px-4">
            <div className="flex flex-col w-full">
              {/* Desktop Scrollable Stack */}
              <div className="hidden md:flex flex-col w-full gap-4 pb-12">
                {gallery.map((src, i) => (
                  <button
                    key={`${product.slug}-full-${i}`}
                    type="button"
                    className="relative block w-full overflow-hidden border-0 bg-transparent p-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                    onClick={() => { setPhotoIndex(i); openLightbox(); }}
                    aria-label="Enlarge product image"
                  >
                    <div className="w-full bg-surface-container-high editorial-shadow">
                      <TeeImage
                        src={src}
                        alt={mainGalleryAlt(product.name, i)}
                        w={1600}
                        eager={i === 0}
                        className="h-auto w-full"
                      />
                    </div>
                  </button>
                ))}
              </div>
              
              {/* Mobile Carousel / Thumbnails */}
              <div className="flex flex-col gap-3 md:hidden w-full px-0 pt-2">
                <div
                  className="order-2 flex flex-row gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                role="tablist"
                aria-label="Product views"
              >
                {gallery.slice(0, 5).map((src, i) => (
                  <button
                    key={`${product.slug}-th-${i}`}
                    type="button"
                    role="tab"
                    aria-selected={photoIndex === i}
                    aria-label={`Show image ${i + 1} — ${viewLabels[i] ?? 'view'}`}
                    onClick={() => setPhotoIndex(i)}
                    className={`relative h-[5rem] w-[4.5rem] shrink-0 overflow-hidden rounded-sm bg-surface-container-high md:aspect-[3/4] md:h-auto md:w-full ${
                      photoIndex === i
                        ? 'ring-2 ring-obsidian ring-offset-2 ring-offset-papyrus'
                        : 'opacity-88 ring-1 ring-stone/70 hover:opacity-100'
                    }`}
                  >
                    <TeeImage src={src} alt="" w={320} eager className="h-full w-full" />
                  </button>
                ))}
              </div>
              <div className="order-1 min-w-0 flex-1 md:order-2">
                <button
                  type="button"
                  className="relative block w-full overflow-hidden border-0 bg-transparent p-0 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                  onClick={openLightbox}
                  aria-label="Enlarge product image"
                >
                  <div className="relative aspect-3/4 w-full bg-surface-container-high editorial-shadow">
                    {mainSrc ? (
                      <TeeImage
                        src={mainSrc}
                        alt={mainGalleryAlt(product.name, photoIndex)}
                        w={1600}
                        eager
                        className="h-full w-full"
                      />
                    ) : null}
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pdp-product-rail flex w-full flex-col border-stone/40 bg-papyrus md:w-[40%] md:border-l md:sticky md:top-0 md:h-[100dvh] md:overflow-y-auto">
        <nav
            className="flex items-center justify-between gap-4 border-b border-transparent px-6 py-6 backdrop-blur-sm md:sticky md:top-0 md:z-20 md:border-b-0 md:bg-papyrus/95"
            aria-label="Product page shortcuts"
          >
            <Link to="/" className="font-pdp-serif text-2xl font-semibold text-obsidian md:hidden">
              HORO
            </Link>
            <div className="hidden gap-8 font-label text-xs font-medium uppercase tracking-wider text-obsidian md:flex">
              <Link to="/vibes" className="transition-colors hover:text-clay">
                Collections
              </Link>
              <Link to="/about" className="transition-colors hover:text-clay">
                Story
              </Link>
              <Link to="/search" className="transition-colors hover:text-clay">
                Search
              </Link>
            </div>
            <Link
              to="/cart"
              className="relative p-2 text-obsidian transition-colors hover:text-clay"
              aria-label="Bag / shopping cart"
            >
              <IconCart />
            </Link>
          </nav>

          <div className="flex flex-col px-6 pb-8 pt-2 md:px-8 md:pb-24 lg:px-10 lg:pb-16 lg:pt-4">
            <header className="mb-6 space-y-5" data-purpose="product-header">
              <h1 className="font-pdp-serif text-4xl font-semibold uppercase leading-tight tracking-tight text-obsidian md:text-5xl lg:text-6xl">
                {formatTitleLines(product.name)}
              </h1>

              <div
                className="flex flex-wrap items-center gap-2"
                aria-label={`Rated ${copy.ratingValue} out of 5, ${copy.reviewCount} reviews`}
              >
                <span className="flex gap-0.5" aria-hidden>
                  {Array.from({ length: 5 }, (_, i) => (
                    <IconStar
                      key={i}
                      className={`h-3.5 w-3.5 md:h-4 md:w-4 ${
                        i < Math.round(copy.ratingValue) ? 'text-amber-600' : 'text-stone/35'
                      }`}
                    />
                  ))}
                </span>
                <span className="font-body text-sm text-warm-charcoal">
                  <span className="font-medium text-obsidian">{copy.ratingValue.toFixed(1)}</span>
                  <span className="text-clay"> ({copy.reviewCount} reviews)</span>
                </span>
              </div>

              <div className="rounded-sm bg-obsidian p-5 text-white" role="region" aria-labelledby="pdp-story-short-heading">
                <p
                  id="pdp-story-short-heading"
                  className="font-label mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/65"
                >
                  {copy.storyCardHeading}
                </p>
                <p className="font-pdp-serif text-base font-normal leading-relaxed md:text-[17px]">{product.story}</p>
              </div>

              {artist ? (
                <div className="border-t border-stone/50 pt-5">
                  <p className="font-body text-sm text-warm-charcoal">
                    Illustrated by{' '}
                    <Link
                      to={`/search?q=${encodeURIComponent(artist.name)}`}
                      className="font-medium text-obsidian underline decoration-obsidian/25 underline-offset-2 transition-colors hover:text-deep-teal"
                    >
                      {artist.name}
                    </Link>
                  </p>
                </div>
              ) : null}
            </header>

            <div className="mb-10 flex flex-col gap-7 border-t border-stone/25 pt-8 md:gap-8">
              <h2 className="font-pdp-serif text-2xl font-semibold leading-[1.3] text-obsidian md:text-[26px]">
                {formatEgp(product.priceEgp)}
              </h2>

              <div ref={sizeSectionRef}>
                <p className="mb-3 font-body text-sm leading-snug text-clay md:hidden">{copy.selectSizePrompt} — open the bar below.</p>
                <div className="hidden space-y-3 md:block">
                  <div className="flex items-center justify-between gap-3" aria-label="Size and size guide">
                    <p className="font-label text-[12px] font-medium uppercase tracking-[0.28em] text-label">Size</p>
                    <button
                      ref={sizeGuideTriggerRef}
                      type="button"
                      onClick={() => setSizeGuideOpen(true)}
                      className="font-label text-[11px] font-medium uppercase tracking-wide text-deep-teal underline decoration-deep-teal/40 underline-offset-4 hover:text-obsidian"
                    >
                      {copy.sizeGuideLabel}
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2.5" role="group" aria-label="Size">
                    {sizes.map(({ key, disabled }) => {
                      const isSel = selectedSize === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setSelectedSize(key)}
                          aria-pressed={isSel}
                          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-sm border-2 font-headline text-lg font-semibold transition-colors focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal ${
                            disabled
                              ? isSel
                                ? 'border-amber-500 bg-amber-50 text-amber-900 shadow-sm ring-2 ring-amber-500/25 line-through decoration-obsidian/30'
                                : 'border-stone bg-papyrus/50 text-clay line-through decoration-obsidian/30 hover:border-amber-300 hover:text-amber-700'
                              : isSel
                                ? 'border-obsidian bg-white text-obsidian shadow-sm ring-2 ring-obsidian/25'
                                : 'border-stone/80 bg-white text-obsidian hover:border-obsidian'
                          }`}
                        >
                          <span aria-disabled={disabled}>{key}</span>
                        </button>
                      );
                    })}
                  </div>

                  {inventoryHint ? (
                    <p className="font-label text-[11px] font-medium uppercase tracking-wide text-ember animate-fade-in">
                      {inventoryHint}
                    </p>
                  ) : null}

                  {oosSelected ? (
                    <p className="font-label text-[11px] font-medium text-amber-800 uppercase tracking-wide animate-fade-in">
                      {copy.lowStockLabel} — out of stock
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="space-y-2">
                <p className="font-body text-[13px] leading-relaxed text-clay md:text-sm">{modelLine}</p>
                {product.stockNote ? (
                  <p className="font-label text-[11px] font-medium uppercase tracking-wide text-ember">{product.stockNote}</p>
                ) : null}
              </div>

              <div className="space-y-4">
                {oosSelected ? (
                  <form ref={notifyFormRef} onSubmit={handleNotifySubmit} className="space-y-3">
                    {notifySuccess ? (
                      <p className="rounded-sm border border-deep-teal/30 bg-frost-blue/20 px-4 py-3 font-body text-sm text-obsidian">
                        {copy.notifySuccess}
                      </p>
                    ) : (
                      <>
                        <label htmlFor={notifyFieldId} className="font-label text-[11px] font-medium uppercase tracking-wide text-label">
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
                          onChange={(e) => {
                            setNotifyEmail(e.target.value);
                            setNotifyError(false);
                          }}
                          className="w-full rounded-sm border border-stone bg-white px-3 py-3 font-body text-sm text-obsidian shadow-sm placeholder:text-clay/80 focus:border-deep-teal focus:outline-none focus:ring-2 focus:ring-deep-teal/25"
                          aria-invalid={notifyError}
                          aria-describedby={notifyError ? `${notifyFieldId}-err` : undefined}
                        />
                        {notifyError ? (
                          <p id={`${notifyFieldId}-err`} className="font-body text-xs text-ember">
                            {copy.notifyInvalidEmail}
                          </p>
                        ) : null}
                        <button type="submit" className={ctaClass}>
                          <span className="flex items-center justify-center gap-2">
                            <IconCart />
                            <span>{copy.notifyMeCTA}</span>
                          </span>
                        </button>
                      </>
                    )}
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={handleBuyOrScroll}
                    className={`${ctaClass} hidden md:flex`}
                    aria-describedby={sizeReady ? undefined : 'pdp-size-hint'}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <IconCart />
                      <span>{primaryCtaLine()}</span>
                    </span>
                    {showBrandTagUnderCta() ? (
                      <span
                        className={`max-w-[95%] text-center text-[11px] font-medium normal-case tracking-normal md:text-xs ${
                          sizeReady ? 'text-white/80' : 'text-clay/90'
                        }`}
                      >
                        {copy.addBtnTag}
                      </span>
                    ) : null}
                  </button>
                )}

                <div className="space-y-3 border-t border-b border-stone/30 py-4">
                  <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-[11px] font-medium uppercase tracking-wide text-clay">
                    {PDP_SCHEMA.trustSignals.map(({ label, icon }) => {
                      const TrustIcon = PDP_TRUST_ICONS[icon];
                      return (
                        <div key={label} className="flex items-center gap-1.5 opacity-90 transition-opacity hover:opacity-100">
                          <TrustIcon />
                          <span>{label}</span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-center font-body text-[11px] leading-snug text-warm-charcoal md:text-xs">{copy.trustReturnsLine}</p>
                </div>
              </div>

              <div className="mt-4 border-t border-stone/30">
                <details className="group">
                  <summary className="font-headline flex cursor-pointer list-none items-center justify-between py-5 text-sm font-medium uppercase tracking-wide text-obsidian focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal [&::-webkit-details-marker]:hidden">
                    {copy.accordionProductDetails}
                    <IconChevronDown />
                  </summary>
                  <div className="animate-fade-in pb-5 pt-1">
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
                  </div>
                </details>

                <details className="group border-t border-stone/30">
                  <summary className="font-headline flex cursor-pointer list-none items-center justify-between py-5 text-sm font-medium uppercase tracking-wide text-obsidian focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal [&::-webkit-details-marker]:hidden">
                    {copy.accordionDesignStory}
                    <IconChevronDown />
                  </summary>
                  <div className="animate-fade-in pb-5 pt-1">
                    <figure className="pdp-design-story-figure relative mb-4 overflow-hidden rounded-lg bg-surface-container-high editorial-shadow">
                      <div className="pdp-design-story-media relative h-[min(400px,70vh)] min-h-[240px] w-full md:h-[400px]">
                        {designStoryImageSrc ? (
                          <TeeImage
                            src={designStoryImageSrc}
                            alt={`${product.name} — print detail`}
                            w={1200}
                            eager
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>
                    </figure>
                    <p className="font-body text-sm font-medium leading-relaxed text-warm-charcoal md:text-[15px]">
                      Part of the{' '}
                      {vibe ? (
                        <Link
                          to={`/vibes/${vibe.slug}`}
                          className="border-b border-primary font-medium text-obsidian transition-colors hover:text-primary"
                        >
                          {vibe.name}
                        </Link>
                      ) : (
                        'collection'
                      )}{' '}
                      line — original illustration by{' '}
                      {artist ? (
                        <Link
                          to={`/search?q=${encodeURIComponent(artist.name)}`}
                          className="font-medium text-deep-teal underline decoration-deep-teal/35 underline-offset-2 transition-colors hover:text-obsidian"
                        >
                          {artist.name}
                        </Link>
                      ) : (
                        'the artist'
                      )}
                      , meaning-led themes, and print quality you can see in the gallery before you wear it.
                    </p>
                  </div>
                </details>

                <details className="group border-t border-stone/30">
                  <summary className="font-headline flex cursor-pointer list-none items-center justify-between py-5 text-sm font-medium uppercase tracking-wide text-obsidian focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal [&::-webkit-details-marker]:hidden">
                    {copy.accordionShipping}
                    <IconChevronDown />
                  </summary>
                  <div className="animate-fade-in space-y-3 pb-5 pt-1 font-body text-sm text-warm-charcoal">
                    {copy.shippingSections.map((section) => (
                      <p key={section.title}>
                        <strong>{section.title}:</strong> {section.body}
                      </p>
                    ))}
                  </div>
                </details>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="border-t border-stone/25 bg-papyrus px-6 py-10 md:px-10 lg:px-12">
        <div className="mb-6 flex flex-col gap-2">
          <span className="font-label text-[10px] font-medium uppercase tracking-[0.25em] text-clay">{copy.wornByEyebrow}</span>
          <h2 className="font-headline text-2xl font-semibold uppercase tracking-tight text-obsidian md:text-3xl">{copy.wornByTitle}</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
          {wornIndices.map((idx, i) => {
            const src = gallery[idx];
            const cap = copy.wornByCaptions[i] ?? '';
            if (!src) return null;
            return (
              <figure key={`${product.slug}-worn-${idx}`} className="overflow-hidden rounded-lg bg-surface-container-high ring-1 ring-stone/40">
                <div className="aspect-[3/4] w-full">
                  <TeeImage src={src} alt={`${product.name} — ${cap}`} w={600} className="h-full w-full object-cover" />
                </div>
                <figcaption className="font-label px-2 py-2 text-[10px] font-medium uppercase tracking-wider text-clay">{cap}</figcaption>
              </figure>
            );
          })}
        </div>
      </section>

      <section className="border-t border-stone/25 bg-papyrus">
        <div className="flex flex-wrap items-end justify-between gap-4 px-6 pb-2 pt-8 md:px-10 md:pb-3 md:pt-10 lg:px-12">
          <div>
            <span className="font-label text-[10px] font-medium uppercase tracking-[0.25em] text-clay">Discovery</span>
            <h2 className="font-headline mt-1 text-2xl font-semibold uppercase tracking-tight text-obsidian md:text-3xl">
              More from {vibe?.name ?? 'this vibe'}
            </h2>
          </div>
          {vibe ? (
            <Link
              to={`/vibes/${vibe.slug}`}
              className="font-label rounded-sm border border-obsidian/80 px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-obsidian transition-colors hover:bg-obsidian hover:text-white"
            >
              View all
            </Link>
          ) : null}
        </div>
        <div className="mx-0 flex snap-x snap-mandatory gap-4 overflow-x-auto overflow-y-hidden px-6 pb-10 pt-4 [-ms-overflow-style:none] [scrollbar-width:none] md:grid md:grid-cols-4 md:gap-6 md:overflow-visible md:px-10 md:pb-12 md:pt-2 md:snap-none [&::-webkit-scrollbar]:hidden lg:px-12">
          {related.map((r) => (
            <article
              key={r.slug}
              className="group relative w-[min(260px,78vw)] shrink-0 snap-center overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-black/5 transition-shadow hover:shadow-md md:w-auto md:min-w-0 md:shrink md:snap-none"
            >
              <Link
                to={`/products/${r.slug}`}
                className="absolute inset-0 z-[1] rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
              >
                <span className="sr-only">
                  View {r.name}, {formatEgp(r.priceEgp)}
                </span>
              </Link>
              <div className="pointer-events-none relative z-[2]">
                <div className="relative overflow-hidden rounded-t-lg">
                  <div className="transition-transform duration-700 ease-out group-hover:scale-[1.04]">
                    <TeeImageFrame
                      src={getProductMedia(r.slug).main}
                      alt={`HORO “${r.name}” tee`}
                      w={500}
                      aspectRatio="3/4"
                      borderRadius="0.5rem 0.5rem 0 0"
                      frameStyle={{ marginBottom: 0 }}
                    />
                  </div>
                  <button
                    type="button"
                    className="quick-view-pill font-label pointer-events-auto absolute bottom-3 left-3 right-3 z-10 min-h-12 rounded-full px-4 py-3 text-center text-xs font-medium uppercase tracking-[0.2em] text-obsidian transition-shadow hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setRelatedQuickViewSlug(r.slug);
                    }}
                    aria-label={`Quick view: ${r.name}`}
                  >
                    Quick view
                  </button>
                </div>
                <div className="p-4">
                  <h3 className="font-headline text-[11px] font-semibold uppercase tracking-wide text-obsidian group-hover:text-deep-teal md:text-xs">
                    {r.name}
                  </h3>
                  <p className="font-body mt-1 text-xs text-clay">{formatEgp(r.priceEgp)}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <div
        className="pdp-mobile-cta z-40 md:hidden fixed bottom-[max(1.5rem,env(safe-area-inset-bottom,0px))] left-6 right-6 overflow-hidden rounded-2xl border border-white/60 bg-white/45 backdrop-blur-2xl shadow-2xl"
        role="region"
        aria-label="Add to cart"
      >
        <button
          type="button"
          onClick={() => {
            if (oosSelected) {
              handleBuyOrScroll();
              return;
            }
            if (sizeReady) {
              setMobilePurchaseOpen(false);
              navigate('/cart');
              return;
            }
            setMobilePurchaseOpen(true);
          }}
          className={`flex w-full min-h-12 flex-col items-center justify-center gap-0.5 px-2 py-3 text-sm font-semibold uppercase tracking-wider transition-colors focus-visible:outline-none text-obsidian hover:bg-white/30`}
        >
          {oosSelected ? (
            notifySuccess ? (
              <span className="font-body text-xs font-medium normal-case leading-snug">{copy.notifySuccess}</span>
            ) : (
              <>
                <span className="flex items-center gap-2">
                  <IconCart />
                  <span>{copy.notifyMeCTA}</span>
                </span>
                <span className="text-[10px] font-medium normal-case tracking-normal opacity-80">{copy.notifyEmailPlaceholder}</span>
              </>
            )
          ) : (
            <>
              <span className="flex items-center gap-2">
                <IconCart />
                <span>
                  {sizeReady ? copy.addBtnCTA : copy.selectSizePrompt}
                </span>
              </span>
              <span className="text-[10px] font-medium normal-case tracking-normal text-white/80">
                {formatEgp(product.priceEgp)} · {copy.addBtnTag}
              </span>
            </>
          )}
        </button>
      </div>

      {mobilePurchaseOpen ? (
        <div className="fixed inset-0 z-45 md:hidden" role="dialog" aria-modal="true" aria-labelledby={mobilePurchaseTitleId}>
          <button
            type="button"
            className="absolute inset-0 bg-obsidian/50 backdrop-blur-sm"
            aria-label="Close purchase panel"
            onClick={() => setMobilePurchaseOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[90dvh] overflow-y-auto rounded-t-3xl border border-white/40 bg-white/60 shadow-[0_-24px_80px_rgba(0,0,0,0.25)] backdrop-blur-2xl">
            <div className="mx-auto max-w-lg px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3">
              <div className="mx-auto mb-4 h-1 w-11 rounded-full bg-stone/45" aria-hidden />
              <div className="mb-4 flex items-start justify-between gap-3">
                <h2 id={mobilePurchaseTitleId} className="font-headline text-[13px] font-semibold uppercase tracking-[0.2em] text-obsidian">
                  Size & add to bag
                </h2>
                <button
                  ref={mobileDrawerCloseRef}
                  type="button"
                  className="font-label shrink-0 rounded-sm border border-stone px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-obsidian transition-colors hover:bg-obsidian hover:text-white"
                  onClick={() => setMobilePurchaseOpen(false)}
                >
                  Close
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMobilePurchaseOpen(false);
                  setSizeGuideOpen(true);
                }}
                className="link-underline-reveal font-label mb-4 block text-left text-[11px] font-medium uppercase tracking-wide text-deep-teal"
              >
                {copy.sizeGuideLabel}
              </button>
              <div className="flex flex-wrap gap-2.5 pb-4" role="group" aria-label="Size">
                {sizes.map(({ key, disabled }) => {
                  const isSel = selectedSize === key;
                  return (
                    <button
                      key={`drawer-${key}`}
                      type="button"
                      onClick={() => setSelectedSize(key)}
                      aria-pressed={isSel}
                      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-sm border-2 font-headline text-lg font-semibold transition-colors focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal ${
                        disabled
                          ? isSel
                            ? 'border-amber-500 bg-amber-50 text-amber-900 shadow-sm ring-2 ring-amber-500/25 line-through decoration-obsidian/30'
                            : 'border-stone bg-papyrus/50 text-clay line-through decoration-obsidian/30 hover:border-amber-300 hover:text-amber-700'
                          : isSel
                            ? 'border-obsidian bg-white text-obsidian shadow-sm ring-2 ring-obsidian/25'
                            : 'border-stone/80 bg-white text-obsidian hover:border-obsidian'
                      }`}
                    >
                      <span aria-disabled={disabled}>{key}</span>
                    </button>
                  );
                })}
              </div>
              {inventoryHint ? (
                <p className="font-label mb-4 text-[11px] font-medium uppercase tracking-wide text-ember">{inventoryHint}</p>
              ) : null}
              <div className="mb-5 rounded-xl border border-stone/50 bg-white/50 p-3 backdrop-blur-md">
                <ul className="space-y-2.5">
                  {featureStripItems.slice(0, 2).map(({ label, Icon }) => {
                    const FeatureIcon = Icon;
                    return (
                      <li key={label} className="flex gap-2.5 text-[12px] leading-snug text-warm-charcoal">
                        <span className="pdp-feature-icon flex shrink-0 items-center justify-center" aria-hidden>
                          <FeatureIcon />
                        </span>
                        <span>{label}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
              <button
                type="button"
                onClick={() => {
                  handleBuyOrScroll();
                }}
                className={ctaClass}
                aria-describedby={sizeReady ? undefined : 'pdp-size-hint'}
              >
                <span className="flex items-center justify-center gap-2">
                  <IconCart />
                  <span>{primaryCtaLine()}</span>
                </span>
                {showBrandTagUnderCta() ? (
                  <span
                    className={`max-w-[95%] text-center text-[11px] font-medium normal-case tracking-normal ${
                      sizeReady ? 'text-white/80' : 'text-clay/90'
                    }`}
                  >
                    {copy.addBtnTag}
                  </span>
                ) : null}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {lightboxOpen ? (
        <div className="pdp-lightbox fixed inset-0 z-60 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Enlarged product image">
          <button
            type="button"
            className="absolute inset-0 bg-obsidian/85"
            aria-label="Close enlarged image"
            onClick={() => setLightboxOpen(false)}
          />
          <div className="relative z-10 flex max-h-[min(92vh,100%)] max-w-[min(96vw,1200px)] flex-col items-center">
            <button
              ref={lightboxCloseRef}
              type="button"
              className="font-label mb-3 shrink-0 rounded-sm border border-white/40 bg-white/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-white backdrop-blur-sm hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              onClick={() => setLightboxOpen(false)}
            >
              Close
            </button>
            <img
              src={imgUrl(mainSrc, 2000)}
              alt={mainGalleryAlt(product.name, photoIndex)}
              className="max-h-[min(85vh,88vw)] w-auto max-w-full object-contain shadow-2xl"
              width={1200}
              height={1600}
            />
          </div>
        </div>
      ) : null}

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
                {copy.sizeGuideLabel}
              </h2>
              <button
                type="button"
                data-size-guide-close
                className="font-label shrink-0 rounded-sm border border-obsidian px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-obsidian transition-colors hover:bg-obsidian hover:text-white"
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
