import {
  Link,
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
  productHasRealImage,
  productsByFeeling,
  type Artist,
  type Feeling,
  type Occasion,
  type Product,
  type ProductSizeKey,
  type RuntimeCatalog,
} from '../data/site';
import { trackViewItem } from '../analytics/events';
import { useCart } from '../cart/CartContext';
import { StickyAddToCart } from '../components/StickyAddToCart';
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
import { PdpSizeFlatDiagram } from '../components/PdpSizeFlatDiagram';
import { ProductQuickView } from '../components/ProductQuickView';
import { QuickViewTrigger } from '../components/QuickViewTrigger';
import { useUiLocale } from '../i18n/ui-locale';
import { formatEgp } from '../utils/formatPrice';
import { humanizeArtistSlugForDisplay } from '../utils/humanizeArtistSlug';
import { notifyRestockSignup } from '../utils/pdpNotifyRestock';
import {
  HORO_SUPPORT_CHANNELS,
  PDP_SCHEMA,
  fillPdpCopyTemplate,
  mergePdpDeliveryRules,
  mergePdpSizeTableConfig,
  resolvePdpDisplayFitModels,
  isConfiguredExternalUrl,
  type PdpSizeTableConfig,
} from '../data/domain-config';
import { PDP_FEATURE_ICONS } from '../data/pdpIconRegistry';
import { useRecentlyViewed } from '../hooks/useRecentlyViewed';
import { useStableNow } from '../runtime/render-time';
import type { PdpDeliveryRules } from '../utils/deliveryEstimate';
import {
  defaultPdpModelParagraph,
  formatPdpFitModelLine,
  formatPdpFitModelLineForSizeSelection,
} from '../utils/pdpFitModels';
import { compareAtPrice, getDisplayPriceSelection, productHasVariablePricing } from '../utils/productPricing';
import { productAvailableSizes } from '../utils/productSizes';
import {
  buildPdpDeliveryLines,
  formatDeliveryWindow,
  formatPdpExpressBadgeLabel,
  formatPdpStandardBadgeLabel,
} from '../utils/deliveryEstimate';

const { copy } = PDP_SCHEMA;

const EMPTY_PRODUCT_LIST: Product[] = [];
const EMPTY_FEELING_LIST: Feeling[] = [];
const EMPTY_ARTIST_LIST: Artist[] = [];
const EMPTY_OCCASION_LIST: Occasion[] = [];

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

function getPreferredDefaultSize(product?: Product | null): ProductSizeKey | null {
  if (!product) return null;

  const availableSizes = productAvailableSizes(product).filter((size) =>
    PDP_SCHEMA.sizes.some((definition) => definition.key === size && !definition.disabled),
  );

  if (availableSizes.length === 0) {
    return null;
  }

  return availableSizes.includes('M') ? 'M' : availableSizes[0];
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

function formatSizeTablePresetLabel(presetKey: string): string {
  const t = presetKey.trim();
  if (!t) return presetKey;
  return t.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function AccordionSection({ title, children, defaultOpen }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  return (
    <details className="group border-t border-stone/30" open={defaultOpen}>
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
  /** Merged delivery windows from RSC (Medusa store metadata + defaults). */
  deliveryRules?: PdpDeliveryRules;
  /** Size chart + model lines from RSC; when omitted, merged from built-in defaults + product.sizeTableKey. */
  sizeTableConfig?: PdpSizeTableConfig;
  /**
   * When false (default), omit Helmet JSON-LD — Next injects the same schema in the RSC page
   * from `buildProductJsonLd` to avoid duplicate/conflicting Product schema.
   */
  renderJsonLd?: boolean;
};

export function ProductDetail({
  catalogSnapshot,
  catalogProducts,
  initialProduct,
  initialSlug,
  deliveryRules: deliveryRulesProp,
  sizeTableConfig: sizeTableConfigProp,
  renderJsonLd = false,
}: ProductDetailProps = {}) {
  const { slug: routeSlug = '' } = useParams();
  const slug = initialSlug ?? routeSlug;
  const { copy: shellCopy } = useUiLocale();
  const now = useStableNow();
  const [searchParams] = useSearchParams();
  const { addItem, setMiniCartOpen } = useCart();
  const { recordView } = useRecentlyViewed();
  const preferBackendCatalog = Boolean(initialProduct || catalogSnapshot);
  const catalogProductsSnapshot = useMemo(
    () => catalogProducts ?? catalogSnapshot?.products ?? EMPTY_PRODUCT_LIST,
    [catalogProducts, catalogSnapshot?.products],
  );
  const catalogFeelings = useMemo(
    () => catalogSnapshot?.feelings ?? EMPTY_FEELING_LIST,
    [catalogSnapshot?.feelings],
  );
  const catalogArtists = useMemo(
    () => catalogSnapshot?.artists ?? EMPTY_ARTIST_LIST,
    [catalogSnapshot?.artists],
  );
  const catalogOccasions = useMemo(
    () => catalogSnapshot?.occasions ?? EMPTY_OCCASION_LIST,
    [catalogSnapshot?.occasions],
  );

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
  const preferredDefaultSize = useMemo(() => getPreferredDefaultSize(product), [product]);

  const [photoIndex, setPhotoIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(preferredDefaultSize);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [relatedQuickViewSlug, setRelatedQuickViewSlug] = useState<string | null>(null);
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifyError, setNotifyError] = useState(false);
  const [notifySuccess, setNotifySuccess] = useState(false);
  const [galleryLiveText, setGalleryLiveText] = useState('');
  const [stickyCtaVisible, setStickyCtaVisible] = useState(false);
  const [addedFeedback, setAddedFeedback] = useState(false);
  const mainCtaRef = useRef<HTMLDivElement | null>(null);

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
    setSelectedSize(preferredDefaultSize);
    setLightboxOpen(false);
    setRelatedQuickViewSlug(null);
    setAddedFeedback(false);
    setStickyCtaVisible(false);
  }, [preferredDefaultSize, slug]);

  /* Sticky CTA: show when main CTA buttons scroll out of viewport */
  useEffect(() => {
    const target = mainCtaRef.current;
    if (!target) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setStickyCtaVisible(!entry.isIntersecting);
      },
      { root: null, threshold: 0 },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [product]);

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

  /** Prefer Medusa `metadata.artist` (API `artistDisplay`); fallback to catalog/fixture artist by slug. */
  const pdpArtist = useMemo(() => {
    const fromMeta = product?.artistDisplay;
    if (fromMeta?.name?.trim()) {
      return {
        name: fromMeta.name.trim(),
        avatarSrc: fromMeta.avatarUrl?.trim(),
      };
    }
    if (artist) {
      return { name: artist.name, avatarSrc: artist.avatarSrc };
    }
    const slug = product?.artistSlug?.trim();
    if (slug) {
      const label = humanizeArtistSlugForDisplay(slug);
      if (label) return { name: label, avatarSrc: undefined };
    }
    return null;
  }, [product?.artistDisplay, product?.artistSlug, artist]);

  /** Same-pillar suggestions: Medusa catalog list only when `preferBackendCatalog` (no fixture `productsByFeeling`). */
  const related = product
    ? (((catalogProductsSnapshot.length > 0
        ? catalogProductsSnapshot
        : preferBackendCatalog
          ? []
          : productsByFeeling(product.primaryFeelingSlug ?? product.feelingSlug))))
        .filter((item) => item.slug !== slug && productHasRealImage(item))
        .slice(0, 3)
    : [];

  const [compactPdp, setCompactPdp] = useState(false);

  useEffect(() => {
    const q = searchParams.get('compact');
    if (q === '1') sessionStorage.setItem('horo_home_compact', '1');
    setCompactPdp(q === '1' || sessionStorage.getItem('horo_home_compact') === '1');
  }, [searchParams]);

  /** “Style with” / FBT: resolve slugs from `catalogProducts` / `catalogSnapshot` only — no fixture `getProduct` when using Medusa-backed PDP. */
  const styleWithProducts = useMemo(() => {
    if (!product?.complementarySlugs?.length) return [];
    return product.complementarySlugs
      .map((s) => lookupProduct(s))
      .filter((p): p is NonNullable<ReturnType<typeof getProduct>> => Boolean(p))
      .filter((p) => productHasRealImage(p))
      .slice(0, 3);
  }, [lookupProduct, product]);

  const frequentlyBoughtWithProducts = useMemo(() => {
    if (!product?.frequentlyBoughtWithSlugs?.length) return [];
    return product.frequentlyBoughtWithSlugs
      .map((s) => lookupProduct(s))
      .filter((p): p is NonNullable<ReturnType<typeof getProduct>> => Boolean(p))
      .filter((p) => productHasRealImage(p))
      .slice(0, 2);
  }, [lookupProduct, product]);

  const heroView =
    gallery[photoIndex] ??
    gallery[0] ?? {
      key: 'hero' as const,
      src: media.main,
      label: 'image',
      alt: fillPdpCopyTemplate(copy.pdpHeroImageAltTemplate, {
        name: product?.name?.trim() || copy.pdpHeroImageNameFallback,
      }),
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
  const priceSizeLabel = useMemo(() => {
    if (!displayPriceSelection.size) return null;
    const sz = displayPriceSelection.size;
    if (displayPriceSelection.isSelected) {
      return copy.pdpPriceSelectedSizeTemplate.replace('{size}', sz);
    }
    if (pricingVariesBySize) {
      return copy.pdpPriceForSizeTemplate.replace('{size}', sz);
    }
    return null;
  }, [displayPriceSelection.size, displayPriceSelection.isSelected, pricingVariesBySize]);
  const productDescription = product?.description ?? product?.story ?? '';

  /** Hero chip: prefer Medusa product description; fallback to pillar tagline (see PDP / Medusa README). */
  const HERO_SUBTITLE_MAX_LEN = 280;
  const heroSubtitle = useMemo(() => {
    const fromDesc = product?.description?.trim();
    if (fromDesc) {
      return fromDesc.length <= HERO_SUBTITLE_MAX_LEN
        ? fromDesc
        : `${fromDesc.slice(0, HERO_SUBTITLE_MAX_LEN).trimEnd()}…`;
    }
    if (preferBackendCatalog) {
      const fromStory = product?.story?.trim();
      if (fromStory) {
        return fromStory.length <= HERO_SUBTITLE_MAX_LEN
          ? fromStory
          : `${fromStory.slice(0, HERO_SUBTITLE_MAX_LEN).trimEnd()}…`;
      }
      return '';
    }
    return feeling?.tagline?.trim() ?? '';
  }, [preferBackendCatalog, product?.description, product?.story, feeling?.tagline]);

  /** Medusa-backed PDP: category chips only (`pdpTagLabels`). Fixture catalog still maps `occasionSlugs`. */
  const heroCategoryTagItems = useMemo(() => {
    if (!product) return [];
    if (product.pdpTagLabels && product.pdpTagLabels.length > 0) {
      return product.pdpTagLabels.map((label) => ({ key: label, label }));
    }
    if (!preferBackendCatalog) {
      return product.occasionSlugs.map((slug) => {
        const occasion = occasionLookup.get(slug) ?? getOccasion(slug);
        return { key: slug, label: occasion?.name ?? slug };
      });
    }
    return [];
  }, [product, preferBackendCatalog, occasionLookup]);

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

  const trustItems = product?.trustBadges?.filter(Boolean) ?? [];

  const sizeTableResolved = useMemo(
    () =>
      sizeTableConfigProp ??
      mergePdpSizeTableConfig(undefined, product?.sizeTableKey),
    [sizeTableConfigProp, product?.sizeTableKey],
  );

  const displayFitModelsResolved = useMemo(
    () => resolvePdpDisplayFitModels(sizeTableResolved),
    [sizeTableResolved],
  );
  const displayFitLines = useMemo(
    () => displayFitModelsResolved.map(formatPdpFitModelLine),
    [displayFitModelsResolved],
  );

  const fallbackModelParagraph =
    displayFitModelsResolved.length > 0
      ? formatPdpFitModelLine(displayFitModelsResolved[0]!)
      : product
        ? defaultPdpModelParagraph(product)
        : '';

  const inlineFitModelPart =
    formatPdpFitModelLineForSizeSelection(displayFitModelsResolved, selectedSize) ??
    (displayFitModelsResolved[0] ? formatPdpFitModelLine(displayFitModelsResolved[0]) : undefined);

  const inlineFitMeasurementsPart = useMemo(() => {
    if (!selectedSize || !sizeTableResolved.measurements.length) return '';
    const row = sizeTableResolved.measurements.find((r) => r.size === selectedSize);
    if (!row) return '';
    return copy.sizeGuideFlatMeasurementsTemplate
      .replace('{size}', row.size)
      .replace('{chest}', row.chest)
      .replace('{shoulder}', row.shoulder)
      .replace('{length}', row.length)
      .replace('{sleeve}', row.sleeve);
  }, [selectedSize, sizeTableResolved.measurements]);

  const physicalFitDisplayLines = useMemo(() => {
    const p = product?.physicalAttributes;
    if (!p) return [] as string[];
    const lines: string[] = [];
    if (p.weight) lines.push(copy.sizeGuidePhysicalWeight.replace('{value}', p.weight));
    if (p.length || p.width || p.height) {
      const L = p.length ?? '—';
      const W = p.width ?? '—';
      const H = p.height ?? '—';
      lines.push(
        copy.sizeGuidePhysicalDimensions.replace('{length}', L).replace('{width}', W).replace('{height}', H),
      );
    }
    if (p.material) lines.push(copy.sizeGuidePhysicalMaterial.replace('{value}', p.material));
    if (p.originCountry) lines.push(copy.sizeGuidePhysicalOrigin.replace('{value}', p.originCountry));
    if (p.hsCode) lines.push(copy.sizeGuidePhysicalHs.replace('{value}', p.hsCode));
    if (p.midCode) lines.push(copy.sizeGuidePhysicalMid.replace('{value}', p.midCode));
    return lines;
  }, [product?.physicalAttributes]);
  const inlineFitModelDisplay =
    inlineFitModelPart ??
    physicalFitDisplayLines[0] ??
    (displayFitModelsResolved[0] ? formatPdpFitModelLine(displayFitModelsResolved[0]) : copy.sizeGuideModelNote);
  const whatsappSupportUrl = isConfiguredExternalUrl(HORO_SUPPORT_CHANNELS.whatsappSupportUrl)
    ? HORO_SUPPORT_CHANNELS.whatsappSupportUrl
    : null;
  const primaryCrossSellProducts = frequentlyBoughtWithProducts;
  const fallbackCrossSellProducts =
    primaryCrossSellProducts.length === 0 ? styleWithProducts : [];
  const deliveryRules: PdpDeliveryRules = useMemo(
    () => deliveryRulesProp ?? mergePdpDeliveryRules(undefined),
    [deliveryRulesProp],
  );
  const deliveryStandardBadgeLabel = useMemo(() => formatPdpStandardBadgeLabel(deliveryRules), [deliveryRules]);
  const deliveryExpressBadgeLabel = useMemo(() => formatPdpExpressBadgeLabel(deliveryRules), [deliveryRules]);
  const standardDeliveryWindow = formatDeliveryWindow(
    deliveryRules.standardMinDays,
    deliveryRules.standardMaxDays,
    now,
  );
  const expressDeliveryWindow = formatDeliveryWindow(
    deliveryRules.expressMinDays,
    deliveryRules.expressMaxDays,
    now,
  );

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
  }, [photoIndex, gallery.length, product]);

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
    setGalleryLiveText(
      fillPdpCopyTemplate(copy.pdpGalleryLiveTemplate, {
        current: photoIndex + 1,
        total: gallery.length,
        label: heroView.label,
      }),
    );
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
      setLightboxAnnounce(
        fillPdpCopyTemplate(copy.pdpGalleryLiveTemplate, {
          current: photoIndex + 1,
          total: gallery.length,
          label: heroView.label,
        }),
      );
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
    setAddedFeedback(true);
    setMiniCartOpen(true);
    window.setTimeout(() => setAddedFeedback(false), 2200);
  }

  function handleLightboxPrimary() {
    setLightboxOpen(false);
    queueMicrotask(() => handlePrimaryAction());
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
    setAddedFeedback(true);
    setMiniCartOpen(true);
    window.setTimeout(() => setAddedFeedback(false), 2200);
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

  const deliveryDynamic = product
    ? buildPdpDeliveryLines(now, deliveryRules, {
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
        <p className="font-body text-warm-charcoal">{copy.pdpProductNotFound}</p>
        <Link to="/feelings" className="font-label mt-4 inline-block text-deep-teal underline">
          {shellCopy.shell.shopByFeeling}
        </Link>
      </div>
    );
  }

  return (
    <div className="product-page bg-papyrus text-obsidian">
      {renderJsonLd ? (
        <ProductJsonLd
          product={product}
          catalog={
            catalogSnapshot
              ? {
                  feelings: catalogSnapshot.feelings ?? [],
                  occasions: catalogSnapshot.occasions ?? [],
                }
              : undefined
          }
        />
      ) : null}
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
                aria-label={copy.pdpGalleryThumbnailsAria}
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
                    aria-label={fillPdpCopyTemplate(copy.pdpGalleryShowImageTemplate, { label: view.label })}
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
              aria-label={copy.pdpGalleryRegionAria}
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
                aria-label={fillPdpCopyTemplate(copy.pdpGalleryOpenFullScreenTemplate, { label: heroView.label })}
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
                    aria-label={copy.pdpGalleryPrev}
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
                    aria-label={copy.pdpGalleryNext}
                  >
                    <IconChevronRight />
                  </button>
                </>
              ) : null}

            </div>
          </div>

          {hasGalleryRail ? (
            <div
              className="-mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain px-4 pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] touch-pan-x md:hidden"
              aria-label={copy.pdpGalleryThumbnailsAria}
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
                  aria-label={fillPdpCopyTemplate(copy.pdpGalleryShowImageTemplate, { label: view.label })}
                >
                  <div className="aspect-[4/5] w-full">
                    <TeeImage src={view.src} alt="" w={320} className="h-full w-full" />
                  </div>
                </button>
              ))}
            </div>
          ) : null}

          {!compactPdp && (primaryCrossSellProducts.length > 0 || fallbackCrossSellProducts.length > 0) ? (
            <CrossSellWidget
              frequentlyBoughtWith={primaryCrossSellProducts}
              styleWith={fallbackCrossSellProducts}
              copy={{
                fbtEyebrow: copy.frequentlyBoughtTogetherEyebrow,
                fbtTitle: copy.frequentlyBoughtTogetherTitle,
                fbtSubtitle: copy.frequentlyBoughtTogetherSubtitle,
                styleEyebrow: copy.styleItWithEyebrow,
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

              {heroSubtitle || heroCategoryTagItems.length > 0 || product.capsuleSlugs?.includes('zodiac') ? (
                <div className="flex flex-wrap gap-2">
                  {heroSubtitle ? (
                    <span className="font-label rounded-full border border-stone/35 bg-white/70 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-warm-charcoal">
                      {heroSubtitle}
                    </span>
                  ) : null}
                  {heroCategoryTagItems.map(({ key, label }) => (
                    <span
                      key={key}
                      className="font-label rounded-full border border-stone/35 bg-white/70 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-warm-charcoal"
                    >
                      {label}
                    </span>
                  ))}
                  {product.capsuleSlugs?.includes('zodiac') ? (
                    <span className="font-label rounded-full border border-moon-gold/40 bg-moon-gold/10 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-obsidian">
                      {copy.pdpZodiacCapsuleLabel}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </header>

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
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-label text-[11px] font-medium uppercase tracking-[0.24em] text-label">
                    {copy.pdpSizeSectionLabel}
                  </p>
                  <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
                    <span
                      className="inline-flex max-w-full rounded-full border border-obsidian/25 bg-white px-3 py-1 font-label text-[10px] font-semibold uppercase tracking-[0.16em] text-obsidian"
                      title={sizeTableResolved.presetKeyUsed}
                    >
                      {formatSizeTablePresetLabel(sizeTableResolved.presetKeyUsed)}
                    </span>
                    <button
                      ref={sizeGuideTriggerRef}
                      type="button"
                      onClick={() => setSizeGuideOpen(true)}
                      className="font-label inline-flex min-h-11 items-center text-[11px] font-medium uppercase tracking-[0.18em] text-deep-teal underline decoration-deep-teal/35 underline-offset-4 transition-colors hover:text-obsidian"
                    >
                      {copy.sizeGuideLabel}
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2.5" role="group" aria-label={copy.pdpSizeGroupAria}>
                  {sizeButtons.map(({ key, disabled }) => {
                    const isSelected = selectedSize === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSelectedSize(isSelected ? null : key)}
                        aria-pressed={isSelected}
                        className={`flex h-12 min-w-12 shrink-0 items-center justify-center rounded-full border px-4 font-headline text-sm font-medium transition-colors focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal ${
                          disabled
                            ? isSelected
                              ? 'border-obsidian bg-obsidian text-white line-through decoration-white/70'
                              : 'border-stone/40 text-clay line-through decoration-obsidian/30 hover:border-obsidian/45'
                            : isSelected
                              ? 'border-obsidian bg-obsidian text-white shadow-sm'
                              : 'border-stone/60 bg-white/80 text-obsidian hover:border-obsidian'
                        }`}
                      >
                        <span aria-disabled={disabled}>{key}</span>
                      </button>
                    );
                  })}
                </div>

                <p className="font-body text-sm leading-relaxed">
                  <span className="text-obsidian">{inlineFitModelDisplay}</span>
                  {inlineFitMeasurementsPart ? (
                    <>
                      {' '}
                      <span className="font-medium text-obsidian">{inlineFitMeasurementsPart}</span>
                    </>
                  ) : null}
                </p>

                {inventoryHint ? (
                  <p className="font-label text-[11px] font-medium uppercase tracking-[0.18em] text-warm-charcoal">
                    {inventoryHint}
                  </p>
                ) : null}

                {oosSelected ? (
                  <p className="font-label text-[11px] font-medium uppercase tracking-[0.18em] text-warm-charcoal">
                    {copy.pdpOutOfStockForSize}
                  </p>
                ) : null}
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handlePrimaryAction}
                  className={`${desktopCtaClass}${addedFeedback ? ' pdp-cta-added' : ''}`}
                  aria-describedby={sizeReady || oosSelected ? undefined : 'pdp-size-hint'}
                >
                  {addedFeedback ? (
                    <>
                      <span className="pdp-cta-check" aria-hidden>
                        ✓
                      </span>
                      <span>{copy.pdpPrimaryCtaAddedLabel}</span>
                    </>
                  ) : (
                    <><IconCart /><span>{primaryCtaLabel()}</span></>
                  )}
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
              </div>

              <div
                className="space-y-2 rounded-xl border border-stone/35 bg-white/55 px-4 py-3"
                aria-labelledby="pdp-delivery-est-heading"
              >
                <p
                  id="pdp-delivery-est-heading"
                  className="font-label text-[10px] font-medium uppercase tracking-[0.22em] text-label"
                >
                  {copy.deliveryEyebrow}
                </p>
                {deliveryDynamic ? (
                  <p className="font-body text-sm font-medium leading-snug text-obsidian">{deliveryDynamic.urgencyLine}</p>
                ) : null}
                <p className="font-body text-sm leading-relaxed text-warm-charcoal">
                  <span className="font-medium text-obsidian">{deliveryStandardBadgeLabel}</span> {standardDeliveryWindow}
                  <span className="mx-2 text-clay/50" aria-hidden>
                    ·
                  </span>
                  <span className="font-medium text-obsidian">{deliveryExpressBadgeLabel}</span> {expressDeliveryWindow}
                </p>
                {deliveryDynamic ? (
                  <p className="font-body text-sm leading-snug text-warm-charcoal">{deliveryDynamic.arrivesLine}</p>
                ) : null}
                {trustItems.length > 0 ? (
                  <p className="font-label text-[10px] font-medium uppercase tracking-[0.18em] text-warm-charcoal">
                    {trustItems.join(' · ')}
                  </p>
                ) : null}
                {whatsappSupportUrl ? (
                  <a
                    href={whatsappSupportUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-label inline-flex min-h-11 items-center text-[11px] font-medium uppercase tracking-[0.18em] text-deep-teal underline decoration-deep-teal/35 underline-offset-4 transition-colors hover:text-obsidian"
                  >
                    {copy.whatsappHelpLabel}
                  </a>
                ) : null}
              </div>

              {!compactPdp ? <PdpShareStrip productName={product.name} productSlug={product.slug} /> : null}

              {pdpArtist ? (
                <div className="flex items-center gap-3 border-t border-stone/30 pt-5">
                  {pdpArtist.avatarSrc ? (
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-surface-container-high ring-1 ring-stone/45">
                      <TeeImage
                        src={pdpArtist.avatarSrc}
                        alt={pdpArtist.name}
                        w={160}
                        eager
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : null}
                  <p className="font-body text-sm leading-snug text-warm-charcoal">
                    <span className="text-clay">{copy.illustratedByLabel}</span>{' '}
                    <span className="font-medium text-obsidian">
                      {pdpArtist.name}
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
              {displayFitLines.length > 0 ? (
                <div className="mb-5 space-y-3">
                  {displayFitLines.map((line, idx) => (
                    <p key={`fit-line-${idx}`} className="font-body text-sm leading-relaxed text-warm-charcoal md:text-[15px]">
                      {line}
                    </p>
                  ))}
                </div>
              ) : physicalFitDisplayLines.length > 0 ? (
                <div className="mb-5 space-y-3">
                  {physicalFitDisplayLines.map((line, idx) => (
                    <p
                      key={`phys-line-${idx}`}
                      className="font-body text-sm leading-relaxed text-warm-charcoal md:text-[15px]"
                    >
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
              {productDescription ? (
                <p className="mb-4 font-body text-sm leading-relaxed text-warm-charcoal md:text-[15px]">
                  {productDescription}
                </p>
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
                  {pdpArtist ? (
                    <span className="font-medium text-deep-teal">
                      {pdpArtist.name}
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
                    <span className="font-medium text-obsidian">{deliveryStandardBadgeLabel}:</span>{' '}
                    {standardDeliveryWindow}
                  </p>
                  <p className="mt-1 leading-relaxed">
                    <span className="font-medium text-obsidian">{deliveryExpressBadgeLabel}:</span>{' '}
                    {expressDeliveryWindow}
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

      {related.length > 0 ? (
        <section className="border-t border-stone/25 bg-papyrus">
          <div className="mx-auto max-w-[1600px] px-4 pb-10 pt-8 md:px-8 md:pb-12 md:pt-10 lg:px-12">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <span className="font-label text-[10px] font-medium uppercase tracking-[0.25em] text-clay">
                  {copy.pdpRelatedEyebrow}
                </span>
                <h2 className="font-headline mt-1 text-2xl font-semibold uppercase tracking-tight text-obsidian md:text-3xl">
                  {fillPdpCopyTemplate(copy.pdpRelatedMoreFromTemplate, {
                    feeling: feeling?.name ?? copy.pdpRelatedFallbackFeeling,
                  })}
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

            <div className="grid gap-4 md:grid-cols-3 md:gap-6">
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
                      {fillPdpCopyTemplate(copy.pdpRelatedCardSrTemplate, {
                        name: item.name,
                        price: formatEgp(item.priceEgp),
                      })}
                    </span>
                  </Link>

                  <div className="pointer-events-none relative z-[2]">
                    <div className="relative overflow-hidden rounded-t-[18px]">
                      <div className="transition-transform duration-700 ease-out group-hover:scale-[1.03]">
                        <TeeImageFrame
                          src={item.media?.main ?? item.thumbnail ?? getProductMedia(item.slug).main}
                          alt={fillPdpCopyTemplate(copy.pdpRelatedCardImageAltTemplate, { name: item.name })}
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
      ) : null}

      <div ref={mainCtaRef} className="pointer-events-none fixed inset-x-0 bottom-0 z-90 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] md:hidden">
        <div className="pointer-events-auto space-y-2 rounded-[20px] border border-obsidian/10 bg-papyrus/92 p-2 shadow-[0_24px_60px_-28px_rgba(26,26,26,0.55)] backdrop-blur-xl">
          <button
            type="button"
            onClick={handlePrimaryAction}
            className={`${mobileCtaClass}${addedFeedback ? ' pdp-cta-added' : ''}`}
            aria-describedby={sizeReady || oosSelected ? undefined : 'pdp-size-hint'}
          >
            {addedFeedback ? (
              <>
                <span className="pdp-cta-check" aria-hidden>
                  ✓
                </span>
                <span>{copy.pdpPrimaryCtaAddedLabel}</span>
              </>
            ) : (
              <><IconCart /><span>{primaryCtaLabel()}</span></>
            )}
          </button>
        </div>
      </div>

      {product ? (
        <StickyAddToCart
          visible={stickyCtaVisible && !lightboxOpen && !sizeGuideOpen}
          productName={product.name}
          thumbnail={media.main}
          selectedSize={selectedSize}
          sizeReady={sizeReady}
          oosSelected={oosSelected}
          displayPrice={displayPriceEgp}
          onAddToBag={handlePrimaryAction}
        />
      ) : null}

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
            </div>
          </div>
        </div>
      ) : null}

      {sizeGuideOpen ? (
        <div className="fixed inset-0 z-125 flex items-end justify-center sm:items-center" role="presentation">
          <div className="absolute inset-0 bg-obsidian/55" aria-hidden onClick={closeSizeGuide} />
          <div
            ref={sizeGuideDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={sizeGuideTitleId}
            className="relative z-10 m-0 max-h-[90vh] w-full overflow-y-auto rounded-t-2xl border border-stone/50 bg-papyrus px-5 py-6 shadow-[0_8px_40px_rgba(26,26,26,0.18)] sm:m-4 sm:max-w-lg sm:rounded-2xl"
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1 space-y-2">
                <h2 id={sizeGuideTitleId} className="font-headline text-[17px] font-medium leading-[1.4] text-obsidian">
                  {copy.sizeGuideLabel}
                </h2>
                <p className="font-label text-[10px] font-medium uppercase tracking-[0.2em] text-label">
                  {copy.sizeGuidePresetEyebrow}
                </p>
                <span className="inline-flex max-w-full rounded-full border border-obsidian/25 bg-white px-3 py-1 font-label text-[10px] font-semibold uppercase tracking-[0.16em] text-obsidian">
                  {formatSizeTablePresetLabel(sizeTableResolved.presetKeyUsed)}
                </span>
              </div>
              <button
                type="button"
                data-size-guide-close
                className="font-label min-h-11 shrink-0 rounded-full border border-obsidian px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-obsidian transition-colors hover:bg-obsidian hover:text-white"
                onClick={closeSizeGuide}
              >
                {copy.lightboxClose}
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-stone/50 bg-white p-3 shadow-sm">
              <table className="w-full min-w-[280px] border-collapse font-body text-sm text-obsidian">
                <thead>
                  <tr className="border-b border-stone/50 text-left">
                    <th scope="col" className="py-2 pr-2 font-label text-[10px] font-semibold uppercase tracking-wider text-obsidian/80">
                      {copy.sizeGuideTableSize}
                    </th>
                    <th scope="col" className="py-2 pr-2 font-label text-[10px] font-semibold uppercase tracking-wider text-obsidian/80">
                      {copy.sizeGuideTableChest}
                    </th>
                    <th scope="col" className="py-2 pr-2 font-label text-[10px] font-semibold uppercase tracking-wider text-obsidian/80">
                      {copy.sizeGuideTableShoulder}
                    </th>
                    <th scope="col" className="py-2 pr-2 font-label text-[10px] font-semibold uppercase tracking-wider text-obsidian/80">
                      {copy.sizeGuideTableLength}
                    </th>
                    <th scope="col" className="py-2 font-label text-[10px] font-semibold uppercase tracking-wider text-obsidian/80">
                      {copy.sizeGuideTableSleeve}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sizeTableResolved.measurements.map((row) => {
                    const rowSelected = selectedSize === row.size;
                    return (
                      <tr key={row.size} className={rowSelected ? '' : 'border-b border-stone/25'}>
                        <td
                          className={`py-2.5 pr-2 font-semibold text-obsidian ${rowSelected ? 'rounded-l-lg bg-stone-200 pl-2' : ''}`}
                        >
                          {row.size}
                        </td>
                        <td className={`py-2.5 pr-2 ${rowSelected ? 'bg-stone-200' : ''}`}>{row.chest}</td>
                        <td className={`py-2.5 pr-2 ${rowSelected ? 'bg-stone-200' : ''}`}>{row.shoulder}</td>
                        <td className={`py-2.5 pr-2 ${rowSelected ? 'bg-stone-200' : ''}`}>{row.length}</td>
                        <td className={`py-2.5 ${rowSelected ? 'rounded-r-lg bg-stone-200 pr-2' : ''}`}>{row.sleeve}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <PdpSizeFlatDiagram
              className="mt-4"
              row={
                selectedSize
                  ? sizeTableResolved.measurements.find((r) => r.size === selectedSize) ?? null
                  : null
              }
              noSelectionMessage={copy.sizeGuideFlatDiagramSelectSize}
              sectionTitle={copy.sizeGuideFlatDiagramTitle}
              disclaimer={copy.sizeGuideFlatDiagramDisclaimer}
              diagramAriaTemplate={copy.sizeGuideFlatDiagramAriaTemplate}
            />

            {displayFitLines.length > 0 ? (
              <div className="mt-4 space-y-2 rounded-xl border border-stone/40 bg-white/90 px-3 py-3 font-body text-[13px] leading-normal text-obsidian">
                {displayFitLines.map((line, idx) => (
                  <p key={`sg-fit-${idx}`}>{line}</p>
                ))}
              </div>
            ) : physicalFitDisplayLines.length > 0 ? (
              <div className="mt-4 space-y-2 rounded-xl border border-stone/40 bg-white/90 px-3 py-3 font-body text-[13px] leading-normal text-obsidian">
                {physicalFitDisplayLines.map((line, idx) => (
                  <p key={`sg-phys-${idx}`}>{line}</p>
                ))}
              </div>
            ) : (
              <p className="mt-4 rounded-xl border border-stone/40 bg-white/90 px-3 py-3 font-body text-[13px] leading-normal text-obsidian">
                {copy.sizeGuideModelNote}
              </p>
            )}
          </div>
        </div>
      ) : null}

      {!compactPdp ? <RecentlyViewedStrip excludeSlug={slug} /> : null}

      <ProductQuickView
        open={relatedQuickViewSlug !== null}
        productSlug={relatedQuickViewSlug}
        onClose={() => setRelatedQuickViewSlug(null)}
        sizeTableConfig={sizeTableResolved}
      />
    </div>
  );
}
