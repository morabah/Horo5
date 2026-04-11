import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import {
  useEffect,
  useId,
  useMemo,
  useCallback,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react';
import {
  getArtist,
  getFeeling,
  getOccasion,
  getProduct,
  productsByFeeling,
  type Product,
  type ProductSizeKey,
  type RuntimeCatalog,
} from '../data/site';
import { trackViewItem } from '../analytics/events';
import { useCart } from '../cart/CartContext';
import {
  buildProductPdpGallery,
  getProductMedia,
  imgUrl,
} from '../data/images';
import { CrossSellWidget } from '../components/CrossSellWidget';
import { PdpShareStrip } from '../components/PdpShareStrip';
import { RecentlyViewedStrip } from '../components/RecentlyViewedStrip';
import { ProductJsonLd } from '../components/ProductJsonLd';
import { TeeImage, TeeImageFrame } from '../components/TeeImage';
import { ProductQuickView } from '../components/ProductQuickView';
import { QuickViewTrigger } from '../components/QuickViewTrigger';
import { useUiLocale } from '../i18n/ui-locale';
import { formatEgp } from '../utils/formatPrice';
import { notifyRestockSignup } from '../utils/pdpNotifyRestock';
import { HORO_SUPPORT_CHANNELS, PDP_SCHEMA, isConfiguredExternalUrl } from '../data/domain-config';
import { PDP_FEATURE_ICONS } from '../data/pdpIconRegistry';
import { useRecentlyViewed } from '../hooks/useRecentlyViewed';
import { useStableNow } from '../runtime/render-time';
import { defaultPdpModelParagraph, formatPdpFitModelLine, formatPdpFitModelLines } from '../utils/pdpFitModels';
import { compareAtPrice, getDisplayPriceSelection, productHasVariablePricing } from '../utils/productPricing';
import { productAvailableSizes } from '../utils/productSizes';
import { buildPdpDeliveryLines, formatDeliveryWindow } from '../utils/deliveryEstimate';

const { sizeTable, copy } = PDP_SCHEMA;

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

function IconChevronLeft({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function IconChevronRight({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 18l6-6-6-6" />
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

type ProductDetailProps = {
  catalogSnapshot?: Partial<Pick<RuntimeCatalog, 'artists' | 'feelings' | 'occasions' | 'products'>> | null;
  catalogProducts?: Product[];
  initialProduct?: Product | null;
  initialSlug?: string;
  renderJsonLd?: boolean;
};

export function ProductDetail({
  catalogSnapshot,
  catalogProducts,
  initialProduct,
  initialSlug,
  renderJsonLd = true,
}: ProductDetailProps = {}) {
  const { slug: routeSlug = '' } = useParams();
  const slug = initialSlug ?? routeSlug;
  const { copy: shellCopy } = useUiLocale();
  const now = useStableNow();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { recordView } = useRecentlyViewed();
  const preferBackendCatalog = Boolean(initialProduct || catalogSnapshot);
  const catalogProductsSnapshot = catalogProducts ?? catalogSnapshot?.products ?? [];
  const catalogFeelings = catalogSnapshot?.feelings ?? [];
  const catalogArtists = catalogSnapshot?.artists ?? [];
  const catalogOccasions = catalogSnapshot?.occasions ?? [];

  const productLookup = useMemo(() => {
    return new Map(catalogProductsSnapshot.map((entry) => [entry.slug, entry]));
  }, [catalogProductsSnapshot]);

  const feelingLookup = useMemo(() => {
    return new Map(catalogFeelings.map((entry) => [entry.slug, entry]));
  }, [catalogFeelings]);

  const artistLookup = useMemo(() => {
    return new Map(catalogArtists.map((entry) => [entry.slug, entry]));
  }, [catalogArtists]);

  const occasionLookup = useMemo(() => {
    return new Map(catalogOccasions.map((entry) => [entry.slug, entry]));
  }, [catalogOccasions]);

  const lookupProduct = useCallback((productSlug: string) => {
    return productLookup.get(productSlug) ?? (!preferBackendCatalog ? getProduct(productSlug) : undefined);
  }, [preferBackendCatalog, productLookup]);

  const product = initialProduct ?? lookupProduct(slug);

  const [photoIndex, setPhotoIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [relatedQuickViewSlug, setRelatedQuickViewSlug] = useState<string | null>(null);
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifyError, setNotifyError] = useState(false);
  const [notifySuccess, setNotifySuccess] = useState(false);
  const [spaceViewMockOpen, setSpaceViewMockOpen] = useState(false);
  const [galleryLiveText, setGalleryLiveText] = useState('');

  const sizeGuideTriggerRef = useRef<HTMLButtonElement | null>(null);
  const sizeGuideDialogRef = useRef<HTMLDivElement | null>(null);
  const sizeSectionRef = useRef<HTMLDivElement | null>(null);
  const notifyFormRef = useRef<HTMLDivElement | null>(null);
  const notifyInputRef = useRef<HTMLInputElement | null>(null);
  const lightboxCloseRef = useRef<HTMLButtonElement | null>(null);
  const lightboxPanelRef = useRef<HTMLDivElement | null>(null);

  const sizeGuideWasOpenRef = useRef(false);
  const sizeGuideTitleId = useId();
  const notifyFieldId = useId();
  const galleryLiveRegionId = useId();
  const galleryAnnouncementRef = useRef<{ slug: string; index: number } | null>(null);
  const lightboxTitleId = useId();
  const lightboxLiveRegionId = useId();
  const [lightboxAnnounce, setLightboxAnnounce] = useState('');
  const lightboxPhotoPrevRef = useRef<number | null>(null);

  useEffect(() => {
    setPhotoIndex(0);
    setSelectedSize(null);
    setLightboxOpen(false);
    setRelatedQuickViewSlug(null);
    setSpaceViewMockOpen(false);
  }, [slug]);

  useEffect(() => {
    if (!product) return;
    trackViewItem(product);
  }, [product]);

  useEffect(() => {
    if (!product) return;
    recordView(product.slug);
  }, [product, recordView]);

  const media = useMemo(() => {
    if (!product) {
      return getProductMedia('');
    }

    const backendGallery = Array.from(
      new Set([
        product.media?.main ?? undefined,
        ...(product.media?.gallery ?? []),
        product.thumbnail ?? undefined,
      ].filter((value): value is string => Boolean(value))),
    );

    if (backendGallery.length === 0) {
      if (preferBackendCatalog) {
        return {
          gallery: product.thumbnail ? [product.thumbnail] : [],
          main: product.thumbnail ?? '',
        };
      }

      return getProductMedia(product.slug);
    }

    return {
      gallery: backendGallery,
      main: product.media?.main ?? backendGallery[0] ?? product.thumbnail ?? '',
    };
  }, [preferBackendCatalog, product]);
  const gallery = product ? buildProductPdpGallery(product.name, media) : [];
  const feelingSlug = product?.primaryFeelingSlug ?? product?.feelingSlug;
  const feeling = feelingSlug
    ? feelingLookup.get(feelingSlug) ?? (!preferBackendCatalog ? getFeeling(feelingSlug) : undefined)
    : undefined;
  const artist = product
    ? artistLookup.get(product.artistSlug) ?? (!preferBackendCatalog ? getArtist(product.artistSlug) : undefined)
    : undefined;
  const related = product
    ? (((catalogProductsSnapshot.length > 0
        ? catalogProductsSnapshot
        : preferBackendCatalog
          ? []
          : productsByFeeling(product.primaryFeelingSlug ?? product.feelingSlug))))
        .filter((item) => item.slug !== slug)
        .slice(0, 4)
    : [];

  const [compactPdp, setCompactPdp] = useState(false);

  useEffect(() => {
    const q = searchParams.get('compact');
    if (q === '1') sessionStorage.setItem('horo_home_compact', '1');
    setCompactPdp(q === '1' || sessionStorage.getItem('horo_home_compact') === '1');
  }, [searchParams]);

  const styleWithProducts = useMemo(() => {
    if (!product?.complementarySlugs?.length) return [];
    return product.complementarySlugs
      .map((s) => lookupProduct(s))
      .filter((p): p is NonNullable<ReturnType<typeof getProduct>> => Boolean(p))
      .slice(0, 4);
  }, [lookupProduct, product]);

  const frequentlyBoughtWithProducts = useMemo(() => {
    if (!product?.frequentlyBoughtWithSlugs?.length) return [];
    return product.frequentlyBoughtWithSlugs
      .map((s) => lookupProduct(s))
      .filter((p): p is NonNullable<ReturnType<typeof getProduct>> => Boolean(p))
      .slice(0, 2);
  }, [lookupProduct, product]);

  const customersAlsoBoughtProducts = useMemo(() => {
    if (!product?.customersAlsoBoughtSlugs?.length) return [];
    const fbtSlugs = new Set(product.frequentlyBoughtWithSlugs ?? []);
    return product.customersAlsoBoughtSlugs
      .filter((s) => !fbtSlugs.has(s))
      .map((s) => lookupProduct(s))
      .filter((p): p is NonNullable<ReturnType<typeof getProduct>> => Boolean(p))
      .slice(0, 2);
  }, [lookupProduct, product]);

  const heroView =
    gallery[photoIndex] ??
    gallery[0] ?? {
      key: 'hero' as const,
      src: media.main,
      label: 'image',
      alt: `HORO “${product?.name ?? 'product'}” t-shirt.`,
    };

  const detailView = gallery[1] ?? null;
  const hasGalleryRail = gallery.length > 1;
  const primaryGallerySrc = gallery[0]?.src ?? media.main;
  const displayPriceSelection = product
    ? getDisplayPriceSelection(product, selectedSize as ProductSizeKey | null)
    : { isSelected: false, size: null, variant: null };
  const displayPriceEgp = displayPriceSelection.variant?.priceEgp ?? product?.priceEgp ?? 0;
  const displayOriginalPriceEgp = displayPriceSelection.variant
    ? compareAtPrice(displayPriceSelection.variant.priceEgp, displayPriceSelection.variant.originalPriceEgp)
    : compareAtPrice(product?.priceEgp ?? 0, product?.originalPriceEgp);
  const pricingVariesBySize = product ? productHasVariablePricing(product) : false;
  const priceSizeLabel = displayPriceSelection.size
    ? displayPriceSelection.isSelected
      ? `Selected size ${displayPriceSelection.size}`
      : pricingVariesBySize
        ? `Price shown for size ${displayPriceSelection.size}`
        : null
    : null;
  const productDescription = product?.description ?? product?.story ?? '';

  const sizeButtons = useMemo(() => {
    if (!product) return PDP_SCHEMA.sizes;
    const avail = new Set(productAvailableSizes(product));
    const definedSizes = new Set<ProductSizeKey>(
      product.availableSizes?.length
        ? product.availableSizes
        : (Object.keys(product.variantsBySize || {}) as ProductSizeKey[]),
    );
    const hasDefinedSizes = definedSizes.size > 0;

    return PDP_SCHEMA.sizes.map(({ key, disabled }) => ({
      key,
      disabled:
        Boolean(disabled) ||
        (hasDefinedSizes && !definedSizes.has(key as ProductSizeKey)) ||
        !avail.has(key as ProductSizeKey),
    }));
  }, [product]);

  const sizeDef = selectedSize ? sizeButtons.find((s) => s.key === selectedSize) : undefined;
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

  const customFitLines = product ? formatPdpFitModelLines(product) : [];
  const fallbackModelParagraph = product ? defaultPdpModelParagraph(product) : '';
  const whatsappSupportUrl = isConfiguredExternalUrl(HORO_SUPPORT_CHANNELS.whatsappSupportUrl)
    ? HORO_SUPPORT_CHANNELS.whatsappSupportUrl
    : null;
  const instagramUrl = isConfiguredExternalUrl(HORO_SUPPORT_CHANNELS.instagramUrl)
    ? HORO_SUPPORT_CHANNELS.instagramUrl
    : null;

  useEffect(() => {
    if (gallery.length === 0) return;
    setPhotoIndex((index) => (index >= gallery.length ? 0 : index));
  }, [gallery.length]);

  useEffect(() => {
    if (gallery.length < 2 || !product) return;
    if (typeof window === 'undefined') return;
    if (!window.matchMedia('(min-width: 768px)').matches) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document
      .getElementById(`pdp-gallery-thumb-v-${product.slug}-${photoIndex}`)
      ?.scrollIntoView({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
  }, [photoIndex, gallery.length, product?.slug]);

  useEffect(() => {
    if (gallery.length < 2 || !product) {
      setGalleryLiveText('');
      galleryAnnouncementRef.current = null;
      return;
    }
    const prev = galleryAnnouncementRef.current;
    if (prev === null) {
      galleryAnnouncementRef.current = { slug: product.slug, index: photoIndex };
      return;
    }
    if (prev.slug === product.slug && prev.index === photoIndex) return;
    galleryAnnouncementRef.current = { slug: product.slug, index: photoIndex };
    setGalleryLiveText(`Image ${photoIndex + 1} of ${gallery.length}: ${heroView.label}`);
  }, [product, gallery.length, photoIndex, heroView.label]);

  useEffect(() => {
    if (!lightboxOpen) {
      lightboxPhotoPrevRef.current = null;
      setLightboxAnnounce('');
      return;
    }
    if (lightboxPhotoPrevRef.current === null) {
      lightboxPhotoPrevRef.current = photoIndex;
      return;
    }
    if (lightboxPhotoPrevRef.current !== photoIndex) {
      lightboxPhotoPrevRef.current = photoIndex;
      if (gallery.length < 2) return;
      setLightboxAnnounce(`Image ${photoIndex + 1} of ${gallery.length}: ${heroView.label}`);
    }
  }, [lightboxOpen, photoIndex, gallery.length, heroView.label]);

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
        event.preventDefault();
        setLightboxOpen(false);
        return;
      }

      if (event.key === 'Tab' && lightboxPanelRef.current) {
        const focusables = lightboxPanelRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
        );
        const list = Array.from(focusables).filter(
          (el) => el.getAttribute('aria-hidden') !== 'true' && !el.closest('[aria-hidden="true"]')
        );
        if (list.length > 0) {
          const first = list[0];
          const last = list[list.length - 1];

          if (event.shiftKey) {
            if (document.activeElement === first) {
              event.preventDefault();
              last.focus();
            }
          } else if (document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }
        return;
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

  function handleBuyNow() {
    if (!product) return;
    if (oosSelected) {
      handlePrimaryAction();
      return;
    }
    if (!sizeReady) {
      handleMissingSize();
      return;
    }
    if (!selectedSize) return;
    addItem(product.slug, selectedSize as ProductSizeKey, 1);
    navigate('/checkout');
  }

  function handleLightboxPrimary() {
    setLightboxOpen(false);
    queueMicrotask(() => handlePrimaryAction());
  }

  function handleLightboxBuyNow() {
    setLightboxOpen(false);
    queueMicrotask(() => handleBuyNow());
  }

  function handleCrossSellBundle(companions: Product[]) {
    if (!product) return;
    if (!sizeReady || oosSelected || !selectedSize) {
      handleMissingSize();
      return;
    }
    const sz = selectedSize as ProductSizeKey;
    addItem(product.slug, sz, 1);
    for (const p of companions) {
      const avail = productAvailableSizes(p);
      const u = avail.includes(sz) ? sz : avail[0];
      if (u) addItem(p.slug, u, 1);
    }
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
    if (sizeReady && product) return `${copy.addBtnCTA} — ${formatEgp(displayPriceEgp)}`;
    return copy.selectSizePrompt;
  }

  function buyNowCtaLabel() {
    if (oosSelected) return copy.notifyMeCTA;
    if (sizeReady && product) return `${copy.buyNowCta} — ${formatEgp(displayPriceEgp)}`;
    return copy.selectSizePrompt;
  }

  const desktopCtaClass = `cta-clay flex min-h-14 w-full items-center justify-center gap-2 border px-4 py-4 text-[13px] font-semibold uppercase tracking-[0.2em] transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal ${
    oosSelected
      ? 'border-[#b77a67] bg-[#b77a67] text-white hover:bg-[#b77a67]/90 opacity-90'
      : 'border-[#b77a67] bg-[#b77a67] text-white hover:bg-[#b77a67]/90'
  }`;

  const mobileCtaClass = `cta-clay flex min-h-14 w-full items-center justify-center gap-2 border px-4 py-4 text-[13px] font-semibold uppercase tracking-[0.2em] transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal ${
    oosSelected
      ? 'border-[#b77a67] bg-[#b77a67] text-white hover:bg-[#b77a67]/90 opacity-90'
      : 'border-[#b77a67] bg-[#b77a67] text-white hover:bg-[#b77a67]/90'
  }`;

  const desktopBuyNowClass =
    'flex min-h-14 w-full items-center justify-center gap-2 border-2 border-obsidian bg-white px-4 py-4 text-[13px] font-semibold uppercase tracking-[0.2em] text-obsidian transition-all duration-300 hover:bg-obsidian hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal';

  const mobileBuyNowClass =
    'flex min-h-12 w-full items-center justify-center border-2 border-obsidian bg-white px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-obsidian transition-colors hover:bg-obsidian hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal';

  const deliveryDynamic = product
    ? buildPdpDeliveryLines(now, PDP_SCHEMA.deliveryRules, {
        beforeCutoffHours: copy.deliveryUrgencyBeforeCutoff,
        tightWindowHours: copy.deliveryUrgencyTight,
        afterCutoff: copy.deliveryAfterCutoff,
        weekendHold: copy.deliveryWeekendHold,
        arrivesByStandard: copy.deliveryArrivesByStandard,
      })
    : null;

  if (!product) {
    return (
      <div className="bg-papyrus px-4 py-16 text-center">
        <p className="font-body text-warm-charcoal">Product not found.</p>
        <Link to="/feelings" className="font-label mt-4 inline-block text-deep-teal underline">
          {shellCopy.shell.shopByFeeling}
        </Link>
      </div>
    );
  }

  return (
    <div className="product-page bg-papyrus text-obsidian">
      {renderJsonLd ? <ProductJsonLd slug={product.slug} /> : null}
      <span id="pdp-size-hint" className="sr-only">
        {copy.sizeRequiredPrompt}
      </span>

      <nav
        className="bg-papyrus px-4 pb-2 pt-6 font-body text-[11px] uppercase tracking-wider text-clay md:px-8 md:pb-4 md:pt-8"
        aria-label={shellCopy.shell.breadcrumb}
      >
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-x-2 gap-y-1">
          <Link
            to="/"
            className="inline-flex min-h-11 items-center rounded-sm px-1 text-clay transition-colors hover:text-obsidian"
          >
            {shellCopy.shell.home}
          </Link>
          <span className="text-clay/50" aria-hidden>
            /
          </span>
          {feeling ? (
            <>
              <Link
                to={`/feelings/${feeling.slug}`}
                className="inline-flex min-h-11 max-w-[12rem] items-center truncate rounded-sm px-1 text-clay transition-colors hover:text-obsidian"
              >
                {feeling.name}
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
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-4">
            {hasGalleryRail ? (
              <div
                className="scrollbar-thin hidden max-h-[min(75vh,42rem)] w-[4.5rem] shrink-0 flex-col gap-2 overflow-y-auto overflow-x-hidden py-0.5 pr-1 [scrollbar-width:thin] md:flex lg:w-[5.25rem]"
                aria-label="Product image thumbnails"
              >
                {gallery.map((view, index) => (
                  <button
                    key={`${product.slug}-v-${view.key}`}
                    id={`pdp-gallery-thumb-v-${product.slug}-${index}`}
                    type="button"
                    onClick={() => setPhotoIndex(index)}
                    className={`w-full shrink-0 overflow-hidden border transition-all focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal ${
                      photoIndex === index
                        ? 'border-obsidian opacity-100'
                        : 'border-transparent opacity-60 hover:opacity-100'
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

            <div
              className="relative min-w-0 flex-1 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
              onKeyDown={handleGalleryKeyDown}
              tabIndex={0}
              role="region"
              aria-label="Product images"
            >
              {hasGalleryRail ? (
                <span id={galleryLiveRegionId} className="sr-only" aria-live="polite" aria-atomic="true">
                  {galleryLiveText}
                </span>
              ) : null}
              <button
                type="button"
                className="block w-full overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                onClick={() => setLightboxOpen(true)}
                aria-label={`Open full screen — ${heroView.label}`}
              >
                <div className="aspect-[4/5] w-full overflow-hidden">
                  <TeeImage
                    src={heroView.src}
                    alt={heroView.alt}
                    w={1600}
                    eager
                    className="h-full w-full"
                  />
                </div>
              </button>

              {gallery.length > 1 ? (
                <>
                  <button
                    type="button"
                    className="absolute left-2 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-stone/55 bg-white/92 text-obsidian shadow-md backdrop-blur-sm transition-colors hover:border-obsidian hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal md:left-3 md:h-12 md:w-12"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setPhotoIndex((i) => (i <= 0 ? gallery.length - 1 : i - 1));
                    }}
                    aria-label="Previous product image"
                  >
                    <IconChevronLeft />
                  </button>
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-stone/55 bg-white/92 text-obsidian shadow-md backdrop-blur-sm transition-colors hover:border-obsidian hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal md:right-3 md:h-12 md:w-12"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setPhotoIndex((i) => (i >= gallery.length - 1 ? 0 : i + 1));
                    }}
                    aria-label="Next product image"
                  >
                    <IconChevronRight />
                  </button>
                </>
              ) : null}

              <button
                type="button"
                className="absolute bottom-4 right-4 z-30 flex items-center gap-2 rounded-full border border-stone/50 bg-white/80 px-4 py-2 font-label text-[10px] font-semibold uppercase tracking-[0.2em] text-obsidian shadow-sm backdrop-blur-sm transition-colors hover:bg-white hover:text-deep-teal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                onClick={() => setSpaceViewMockOpen(true)}
                aria-expanded={spaceViewMockOpen}
                aria-controls={spaceViewMockOpen ? 'pdp-space-view-mock-notice' : undefined}
                aria-label="View in 3D"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" />
                </svg>
                View in space
              </button>
            </div>
          </div>

          {spaceViewMockOpen ? (
            <div
              id="pdp-space-view-mock-notice"
              className="rounded-xl border border-stone/50 bg-white/85 px-4 py-3 shadow-sm"
              role="status"
            >
              <p className="font-body text-sm leading-relaxed text-warm-charcoal">
                3D / AR “View in space” is a demo preview — not a live viewer yet.
              </p>
              <button
                type="button"
                className="font-label mt-3 min-h-11 text-[11px] font-semibold uppercase tracking-wider text-deep-teal underline decoration-deep-teal/35 underline-offset-4 hover:text-obsidian focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                onClick={() => setSpaceViewMockOpen(false)}
              >
                Dismiss
              </button>
            </div>
          ) : null}

          {hasGalleryRail ? (
            <div
              className="-mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain px-4 pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] touch-pan-x md:hidden"
              aria-label="Product image thumbnails"
            >
              {gallery.map((view, index) => (
                <button
                  key={`${product.slug}-h-${view.key}`}
                  type="button"
                  onClick={() => setPhotoIndex(index)}
                  className={`w-[4.25rem] shrink-0 snap-start overflow-hidden border transition-all focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal sm:w-[4.75rem] ${
                    photoIndex === index
                      ? 'border-obsidian opacity-100'
                      : 'border-transparent opacity-60 hover:opacity-100'
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

          <section
            className="rounded-xl border border-stone/45 bg-white/55 p-4 shadow-sm md:p-5"
            aria-labelledby="pdp-video-heading"
          >
            <p className="font-label text-[10px] font-medium uppercase tracking-[0.22em] text-label">{copy.videoEyebrow}</p>
            <h2 id="pdp-video-heading" className="font-headline mt-2 text-lg font-semibold tracking-tight text-obsidian md:text-xl">
              {copy.videoTitle}
            </h2>
            <div className="relative mt-4 aspect-video w-full overflow-hidden rounded-lg border border-stone/50 bg-obsidian/[0.04]">
              <video
                className="h-full w-full object-cover"
                poster={imgUrl(primaryGallerySrc, 1400)}
                muted
                playsInline
                preload="metadata"
                aria-label={copy.videoAriaLabel}
              />
              <div className="pointer-events-none absolute inset-0 flex items-end justify-center bg-gradient-to-t from-obsidian/35 via-transparent to-transparent pb-4 md:pb-5">
                <p className="max-w-md px-4 text-center font-body text-sm font-medium text-white drop-shadow-sm md:text-[0.9375rem]">
                  {copy.videoPlaceholderBody}
                </p>
              </div>
            </div>
          </section>

          {!compactPdp && (frequentlyBoughtWithProducts.length > 0 || styleWithProducts.length > 0) ? (
            <CrossSellWidget
              frequentlyBoughtWith={frequentlyBoughtWithProducts}
              styleWith={styleWithProducts}
              copy={{
                fbtEyebrow: copy.frequentlyBoughtTogetherEyebrow,
                fbtTitle: copy.frequentlyBoughtTogetherTitle,
                fbtSubtitle: copy.frequentlyBoughtTogetherSubtitle,
                styleEyebrow: 'Pairing',
                styleTitle: copy.styleItWithTitle,
                styleSubtitle: copy.styleItWithSubtitle,
                bundleFbtCta: copy.crossSellBundleFbtCta,
                bundleStyleCta: copy.crossSellBundleStyleCta,
                needSize: copy.crossSellNeedSize,
              }}
              sizeReady={sizeReady}
              oosSelected={oosSelected}
              selectedSize={selectedSize as ProductSizeKey | null}
              currentSlug={product.slug}
              onQuickView={setRelatedQuickViewSlug}
              onMissingSize={handleMissingSize}
              onAddBundle={handleCrossSellBundle}
            />
          ) : null}
        </div>

        <aside className="md:sticky md:top-24 md:self-start">
          <div className="space-y-6 md:p-4 lg:p-6">
            <header className="space-y-4">
              {feeling ? (
                <Link
                  to={`/feelings/${feeling.slug}`}
                  className="font-label inline-flex min-h-11 items-center rounded-full border border-dusk-violet/35 bg-dusk-violet/8 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-dusk-violet transition-colors hover:border-dusk-violet/60 hover:bg-dusk-violet/14"
                >
                  {feeling.name}
                </Link>
              ) : null}

              <h1 className="font-headline text-[clamp(2rem,5vw,3.2rem)] font-semibold leading-[1.02] tracking-tight text-obsidian">
                {formatTitleLines(product.name)}
              </h1>

              {feeling || product.occasionSlugs.length ? (
                <div className="space-y-3 rounded-xl border border-stone/40 bg-papyrus/90 px-4 py-3">
                  {feeling ? (
                    <div>
                      <p className="font-label text-[10px] uppercase tracking-wider text-label">Feels like</p>
                      <p className="mt-1 font-body text-sm leading-relaxed text-warm-charcoal">{feeling.tagline}</p>
                    </div>
                  ) : null}
                  {product.occasionSlugs.length ? (
                    <div>
                      <p className="font-label text-[10px] uppercase tracking-wider text-label">Works for</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {product.occasionSlugs.map((slug) => {
                          const o = occasionLookup.get(slug) ?? (!preferBackendCatalog ? getOccasion(slug) : undefined);
                          return (
                            <span
                              key={slug}
                              className="font-label rounded-full border border-stone/55 bg-white/90 px-3 py-1.5 text-[10px] uppercase tracking-wider text-obsidian"
                            >
                              {o?.name ?? slug}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                  {product.capsuleSlugs?.includes('zodiac') ? (
                    <p className="font-label text-[10px] uppercase tracking-wider text-moon-gold">Zodiac capsule</p>
                  ) : null}
                </div>
              ) : null}
            </header>

            <section
              className="mt-2 border-l-2 border-dusk-violet/40 pl-5 text-obsidian md:pl-6"
              aria-labelledby="pdp-story-card-heading"
            >
              <p
                id="pdp-story-card-heading"
                className="font-label mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-obsidian"
              >
                {copy.storyCardHeading}
              </p>
              <p className="font-body text-[1rem] leading-relaxed text-warm-charcoal md:text-[1.08rem]">{productDescription}</p>
            </section>

            <div className="space-y-5">
              <div className="space-y-2">
                <div className="flex flex-wrap items-end gap-3">
                  {displayOriginalPriceEgp ? (
                    <p className="font-headline text-[1.05rem] font-medium text-clay line-through md:text-[1.15rem]">
                      {formatEgp(displayOriginalPriceEgp)}
                    </p>
                  ) : null}
                  <p className="font-headline text-[1.8rem] font-semibold leading-none text-obsidian md:text-[2rem]">
                    {formatEgp(displayPriceEgp)}
                  </p>
                </div>
                {priceSizeLabel ? (
                  <p className="font-label text-[11px] font-medium uppercase tracking-[0.18em] text-label">
                    {priceSizeLabel}
                  </p>
                ) : null}
              </div>

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
                  {sizeButtons.map(({ key, disabled }) => {
                    const isSelected = selectedSize === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSelectedSize(isSelected ? null : key)}
                        aria-pressed={isSelected}
                        className={`flex h-12 min-w-12 items-center justify-center border px-3 font-headline text-sm font-medium transition-colors focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal ${
                          disabled
                            ? isSelected
                              ? 'border-obsidian bg-obsidian text-white line-through decoration-white/70'
                              : 'border-stone/40 text-clay line-through decoration-obsidian/30 hover:border-obsidian/45'
                            : isSelected
                              ? 'border-obsidian bg-obsidian text-white shadow-sm'
                              : 'border-stone/60 hover:border-obsidian'
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

                {!oosSelected ? (
                  <button
                    type="button"
                    onClick={handleBuyNow}
                    className={desktopBuyNowClass}
                    aria-describedby={sizeReady ? undefined : 'pdp-size-hint'}
                  >
                    <span>{buyNowCtaLabel()}</span>
                  </button>
                ) : null}

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

              <div
                className="space-y-2 rounded-xl border border-stone/40 bg-white/50 px-4 py-3"
                aria-labelledby="pdp-delivery-est-heading"
              >
                {deliveryDynamic ? (
                  <div className="rounded-lg border border-deep-teal/15 bg-frost-blue/30 px-3 py-2.5">
                    <p className="font-body text-sm font-medium leading-snug text-obsidian">{deliveryDynamic.urgencyLine}</p>
                    <p className="mt-1 font-body text-sm leading-snug text-warm-charcoal">{deliveryDynamic.arrivesLine}</p>
                  </div>
                ) : null}
                <p
                  id="pdp-delivery-est-heading"
                  className="font-label text-[10px] font-medium uppercase tracking-[0.22em] text-label"
                >
                  {copy.deliveryEyebrow}
                </p>
                <p className="font-headline text-sm font-semibold text-obsidian">{copy.deliveryEstimateTitle}</p>
                <p className="font-body text-sm leading-relaxed text-warm-charcoal">
                  <span className="block">
                    <span className="font-medium text-obsidian">{copy.deliveryStandardBadge}</span>{' '}
                    <span className="text-obsidian">{formatDeliveryWindow(3, 5, now)}</span>
                  </span>
                  <span className="mt-1.5 block">
                    <span className="font-medium text-obsidian">{copy.deliveryExpressBadge}</span>{' '}
                    <span className="text-obsidian">{formatDeliveryWindow(1, 2, now)}</span>
                  </span>
                </p>
                <p className="font-body text-xs leading-snug text-clay">{copy.deliveryEstimateNote}</p>
              </div>

              {!compactPdp ? <PdpShareStrip productName={product.name} productSlug={product.slug} /> : null}

              {artist ? (
                <div className="flex items-center gap-3 border-t border-stone/30 pt-5">
                  {artist.avatarSrc ? (
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-surface-container-high ring-1 ring-stone/45">
                      <TeeImage
                        src={artist.avatarSrc}
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

      {product.wearerStories && product.wearerStories.length > 0 ? (
        <section className="border-t border-stone/25 bg-papyrus" aria-labelledby="wearer-stories-heading">
          <div className="mx-auto max-w-[1600px] px-4 py-10 md:px-8 md:py-12 lg:px-12">
            <div className="max-w-[980px]">
              <p className="font-label text-[10px] font-medium uppercase tracking-[0.25em] text-clay">
                {copy.wearerStoriesEyebrow}
              </p>
              <h2
                id="wearer-stories-heading"
                className="font-headline mt-2 text-2xl font-semibold uppercase tracking-tight text-obsidian md:text-3xl"
              >
                {copy.wearerStoriesTitle}
              </h2>
              <p className="mt-2 font-body text-sm text-clay">{copy.wearerStoriesNote}</p>
              <ul className="mt-8 list-none space-y-6 p-0">
                {product.wearerStories.map((story, idx) => (
                  <li
                    key={`${story.author}-${idx}`}
                    className="rounded-2xl border border-stone/40 bg-white/60 p-5 shadow-sm backdrop-blur-sm"
                  >
                    <blockquote className="font-body text-base leading-relaxed text-warm-charcoal md:text-[17px]">
                      “{story.quote}”
                    </blockquote>
                    <footer className="mt-4 font-label text-[11px] uppercase tracking-wider text-clay">
                      <cite className="not-italic text-obsidian/80">— {story.author}</cite>
                    </footer>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      ) : null}

      <section className="border-t border-stone/25 bg-papyrus">
        <div className="mx-auto max-w-[1600px] px-4 py-10 md:px-8 md:py-12 lg:px-12">
          <div className="max-w-[980px]">
            <AccordionSection title={copy.accordionProductDetails}>
              {customFitLines.length > 0 ? (
                <div className="mb-5 space-y-3">
                  {customFitLines.map((line, idx) => (
                    <p key={`fit-line-${idx}`} className="font-body text-sm leading-relaxed text-warm-charcoal md:text-[15px]">
                      {line}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="mb-5 font-body text-sm leading-relaxed text-warm-charcoal md:text-[15px]">
                  {fallbackModelParagraph}
                </p>
              )}
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
                  {feeling ? (
                    <Link
                      to={`/feelings/${feeling.slug}`}
                      className="border-b border-obsidian/25 font-medium text-obsidian transition-colors hover:text-deep-teal"
                    >
                      {feeling.name}
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
                <div className="rounded-lg border border-stone/35 bg-white/40 px-3 py-2.5">
                  <p className="font-label text-[10px] font-medium uppercase tracking-[0.2em] text-label">
                    {copy.deliveryEstimateTitle}
                  </p>
                  <p className="mt-1.5 leading-relaxed">
                    <span className="font-medium text-obsidian">{copy.deliveryStandardBadge}:</span>{' '}
                    {formatDeliveryWindow(3, 5, now)}
                  </p>
                  <p className="mt-1 leading-relaxed">
                    <span className="font-medium text-obsidian">{copy.deliveryExpressBadge}:</span>{' '}
                    {formatDeliveryWindow(1, 2, now)}
                  </p>
                  <p className="mt-2 text-xs text-clay">{copy.deliveryEstimateNote}</p>
                </div>
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

      {customersAlsoBoughtProducts.length > 0 ? (
        <section className="border-t border-stone/25 bg-papyrus" aria-labelledby="cab-heading">
          <div className="mx-auto max-w-[1600px] px-4 pb-10 pt-8 md:px-8 md:pb-12 md:pt-10 lg:px-12">
            <div className="mb-6">
              <span className="font-label text-[10px] font-medium uppercase tracking-[0.25em] text-clay">
                {copy.customersAlsoBoughtEyebrow}
              </span>
              <h2
                id="cab-heading"
                className="font-headline mt-1 text-2xl font-semibold uppercase tracking-tight text-obsidian md:text-3xl"
              >
                {copy.customersAlsoBoughtTitle}
              </h2>
              <p className="mt-1.5 max-w-[40rem] font-body text-sm text-clay">{copy.customersAlsoBoughtSubtitle}</p>
            </div>
            <div className="grid max-w-3xl gap-4 sm:grid-cols-2 md:gap-6">
              {customersAlsoBoughtProducts.map((item) => (
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
                          src={item.media?.main ?? item.thumbnail ?? getProductMedia(item.slug).main}
                          alt={`HORO “${item.name}” tee`}
                          w={400}
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
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <p className="font-body text-xs text-clay">{formatEgp(item.priceEgp)}</p>
                        {compareAtPrice(item.priceEgp, item.originalPriceEgp) ? (
                          <p className="font-body text-[11px] text-clay/80 line-through">
                            {formatEgp(compareAtPrice(item.priceEgp, item.originalPriceEgp) ?? 0)}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="border-t border-stone/25 bg-papyrus" aria-labelledby="pdp-reviews-soon-heading">
        <div className="mx-auto max-w-[1600px] px-4 py-10 md:px-8 md:py-10 lg:px-12">
          <div className="mx-auto max-w-[42rem] rounded-2xl border border-stone/40 bg-white/55 px-5 py-6 md:px-8 md:py-7">
            <p className="font-label text-[10px] font-medium uppercase tracking-[0.25em] text-clay">{copy.reviewsSoonEyebrow}</p>
            <h2
              id="pdp-reviews-soon-heading"
              className="font-headline mt-2 text-xl font-semibold uppercase tracking-tight text-obsidian md:text-2xl"
            >
              {copy.reviewsSoonTitle}
            </h2>
            <p className="mt-3 font-body text-sm leading-relaxed text-warm-charcoal">{copy.reviewsSoonBody}</p>
            {whatsappSupportUrl || instagramUrl ? (
              <div className="mt-5 flex flex-wrap gap-3">
                {whatsappSupportUrl ? (
                  <a
                    href={whatsappSupportUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-label inline-flex min-h-12 items-center justify-center rounded-xl border border-obsidian bg-obsidian px-5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-obsidian/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                  >
                    {copy.reviewsSoonWhatsappCta}
                  </a>
                ) : null}
                {instagramUrl ? (
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-label inline-flex min-h-12 items-center justify-center rounded-xl border border-stone bg-white px-5 text-[10px] font-semibold uppercase tracking-[0.18em] text-obsidian transition-colors hover:border-desert-sand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                  >
                    {copy.reviewsSoonInstagramCta}
                  </a>
                ) : null}
              </div>
            ) : (
              <p className="mt-4 font-body text-xs text-clay">{copy.reviewsSoonNoLinks}</p>
            )}
          </div>
        </div>
      </section>

      <section className="border-t border-stone/25 bg-papyrus">
        <div className="mx-auto max-w-[1600px] px-4 pb-10 pt-8 md:px-8 md:pb-12 md:pt-10 lg:px-12">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="font-label text-[10px] font-medium uppercase tracking-[0.25em] text-clay">Discovery</span>
              <h2 className="font-headline mt-1 text-2xl font-semibold uppercase tracking-tight text-obsidian md:text-3xl">
                More from {feeling?.name ?? 'this feeling'}
              </h2>
              <p className="mt-1.5 max-w-[40rem] font-body text-sm text-clay">{copy.relatedMoreFromSubtitle}</p>
            </div>
            {feeling ? (
              <Link
                to={`/feelings/${feeling.slug}`}
                className="font-label inline-flex min-h-12 items-center rounded-xl border border-obsidian/80 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-obsidian transition-colors hover:bg-obsidian hover:text-white"
              >
                {shellCopy.shell.shopByFeeling}
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
                        src={item.media?.main ?? item.thumbnail ?? getProductMedia(item.slug).main}
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
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <p className="font-body text-xs text-clay">{formatEgp(item.priceEgp)}</p>
                        {compareAtPrice(item.priceEgp, item.originalPriceEgp) ? (
                          <p className="font-body text-[11px] text-clay/80 line-through">
                            {formatEgp(compareAtPrice(item.priceEgp, item.originalPriceEgp) ?? 0)}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
          </div>
        </div>
      </section>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-90 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] md:hidden">
        <div className="pointer-events-auto space-y-2 rounded-[20px] border border-obsidian/10 bg-papyrus/92 p-2 shadow-[0_24px_60px_-28px_rgba(26,26,26,0.55)] backdrop-blur-xl">
          <button
            type="button"
            onClick={handlePrimaryAction}
            className={mobileCtaClass}
            aria-describedby={sizeReady || oosSelected ? undefined : 'pdp-size-hint'}
          >
            <IconCart />
            <span>{primaryCtaLabel()}</span>
          </button>
          {!oosSelected ? (
            <button
              type="button"
              onClick={handleBuyNow}
              className={mobileBuyNowClass}
              aria-describedby={sizeReady ? undefined : 'pdp-size-hint'}
            >
              {buyNowCtaLabel()}
            </button>
          ) : null}
        </div>
      </div>

      {lightboxOpen ? (
        <div
          className="pdp-lightbox fixed inset-0 z-200 flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-labelledby={lightboxTitleId}
        >
          <button
            type="button"
            tabIndex={-1}
            className="absolute inset-0 z-0 bg-obsidian/88"
            aria-hidden="true"
            onClick={() => setLightboxOpen(false)}
          />
          <div
            ref={lightboxPanelRef}
            className="relative z-10 mx-auto flex min-h-0 w-full max-w-[1200px] flex-1 flex-col px-4 pt-[max(0.75rem,env(safe-area-inset-top,0px))] pb-0"
          >
            <p id={lightboxLiveRegionId} className="sr-only" aria-live="polite" aria-atomic="true">
              {lightboxAnnounce}
            </p>
            <div className="flex shrink-0 items-start justify-between gap-3 pb-2">
              <p id={lightboxTitleId} className="font-headline min-w-0 flex-1 pt-2 text-sm leading-snug text-white">
                <span className="font-semibold tracking-wide">
                  {copy.lightboxCounterTemplate
                    .replace('{current}', String(photoIndex + 1))
                    .replace('{total}', String(Math.max(gallery.length, 1)))}
                </span>
                {heroView.label ? (
                  <span className="text-white/75"> · {heroView.label}</span>
                ) : null}
                <span className="sr-only"> — {copy.lightboxDialogLabel}</span>
              </p>
              <button
                ref={lightboxCloseRef}
                type="button"
                className="font-label shrink-0 rounded-sm border border-white/35 bg-white/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-white backdrop-blur-sm hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                onClick={() => setLightboxOpen(false)}
              >
                {copy.lightboxClose}
              </button>
            </div>

            <div className="flex min-h-0 min-w-0 flex-1 items-center justify-center gap-1 sm:gap-2">
              {gallery.length > 1 ? (
                <button
                  type="button"
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-white/35 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  aria-label={copy.lightboxPrev}
                  onClick={() =>
                    setPhotoIndex((index) => (index <= 0 ? gallery.length - 1 : index - 1))
                  }
                >
                  <IconChevronLeft className="h-8 w-8" />
                </button>
              ) : (
                <div className="h-14 w-14 shrink-0" aria-hidden />
              )}
              <img
                src={imgUrl(heroView.src, 2000)}
                alt={heroView.alt}
                className="pointer-events-none max-h-[min(52vh,calc(100dvh-14rem))] w-auto min-w-0 max-w-full flex-1 object-contain shadow-2xl sm:max-h-[min(58vh,calc(100dvh-13rem))]"
                width={1200}
                height={1600}
              />
              {gallery.length > 1 ? (
                <button
                  type="button"
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-white/35 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  aria-label={copy.lightboxNext}
                  onClick={() =>
                    setPhotoIndex((index) => (index >= gallery.length - 1 ? 0 : index + 1))
                  }
                >
                  <IconChevronRight className="h-8 w-8" />
                </button>
              ) : (
                <div className="h-14 w-14 shrink-0" aria-hidden />
              )}
            </div>

            <div className="mt-3 shrink-0 space-y-2 rounded-t-[20px] border border-white/15 border-b-0 bg-obsidian/80 px-2 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] shadow-[0_-12px_40px_-16px_rgba(0,0,0,0.45)] backdrop-blur-xl">
              <button
                type="button"
                onClick={handleLightboxPrimary}
                className={mobileCtaClass}
                aria-describedby={sizeReady || oosSelected ? undefined : 'pdp-size-hint'}
              >
                <IconCart />
                <span>{primaryCtaLabel()}</span>
              </button>
              {!oosSelected ? (
                <button
                  type="button"
                  onClick={handleLightboxBuyNow}
                  className={mobileBuyNowClass}
                  aria-describedby={sizeReady ? undefined : 'pdp-size-hint'}
                >
                  {buyNowCtaLabel()}
                </button>
              ) : null}
            </div>
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
                    <th className="py-2 pr-2 font-label text-[10px] font-medium uppercase tracking-wider text-label">Shoulder</th>
                    <th className="py-2 pr-2 font-label text-[10px] font-medium uppercase tracking-wider text-label">Length</th>
                    <th className="py-2 font-label text-[10px] font-medium uppercase tracking-wider text-label">Sleeve</th>
                  </tr>
                </thead>
                <tbody>
                  {sizeTable.map((row) => (
                    <tr key={row.size} className="border-b border-stone/70">
                      <td className="py-2.5 pr-2 font-medium text-obsidian">{row.size}</td>
                      <td className="py-2.5 pr-2">{row.chest}</td>
                      <td className="py-2.5 pr-2">{row.shoulder}</td>
                      <td className="py-2.5 pr-2">{row.length}</td>
                      <td className="py-2.5">{row.sleeve}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {product?.pdpFitModels?.length ? (
              <div className="mt-4 space-y-2 font-body text-[13px] leading-normal text-clay">
                {product.pdpFitModels.map((m) => (
                  <p key={`${m.heightCm}-${m.sizeWorn}`}>{formatPdpFitModelLine(m)}</p>
                ))}
              </div>
            ) : (
              <p className="mt-4 font-body text-[13px] leading-normal text-clay">{copy.sizeGuideModelNote}</p>
            )}
          </div>
        </div>
      ) : null}

      {!compactPdp ? <RecentlyViewedStrip excludeSlug={slug} /> : null}

      <ProductQuickView
        open={relatedQuickViewSlug !== null}
        productSlug={relatedQuickViewSlug}
        onClose={() => setRelatedQuickViewSlug(null)}
      />
    </div>
  );
}
