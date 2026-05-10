'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAppSearchParams } from '@/storefront/hooks/useAppSearchParams';

import {
  useEffect,
  useId,
  useMemo,
  useCallback,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import {
  getArtist,
  getFeeling,
  getOccasion,
  getProduct,
  productHasRealImage,
  productsByFeeling,
  setRuntimeCatalog,
  type Artist,
  type Feeling,
  type Occasion,
  type Product,
  type ProductSizeKey,
  type RuntimeCatalog,
} from '../data/site';
import { trackSizeSelected, trackViewItem, trackWishlistAdd, trackWishlistRemove } from '../analytics/events';
import { useCart } from '../cart/CartContext';
import { formatCartStockMessage } from '../cart/stock';
import { StickyAddToCart } from '../components/StickyAddToCart';
import {
  buildProductPdpGallery,
  galleryItemsToSrcList,
  getProductMedia,
  imgUrl,
} from '../data/images';
import dynamic from 'next/dynamic';
import { Skeleton, SkeletonText } from '../components/ui/Skeleton';

const CrossSellWidget = dynamic(
  () => import('../components/CrossSellWidget').then((m) => m.CrossSellWidget),
  { ssr: false, loading: () => <div className="h-48" /> },
);
const PdpShareStrip = dynamic(
  () => import('../components/PdpShareStrip').then((m) => m.PdpShareStrip),
  { ssr: false, loading: () => <div className="h-12" /> },
);
const RecentlyViewedStrip = dynamic(
  () => import('../components/RecentlyViewedStrip').then((m) => m.RecentlyViewedStrip),
  { ssr: false, loading: () => <div className="h-32" /> },
);
const PdpSizeFlatDiagram = dynamic(
  () => import('../components/PdpSizeFlatDiagram').then((m) => m.PdpSizeFlatDiagram),
  { ssr: false, loading: () => <div className="h-40" /> },
);
const ProductQuickView = dynamic(
  () => import('../components/ProductQuickView').then((m) => m.ProductQuickView),
  { ssr: false },
);
const ArtistStudioBlock = dynamic(
  () => import('../components/ArtistStudioBlock').then((m) => m.ArtistStudioBlock),
  { ssr: false, loading: () => <div className="h-64" /> },
);
import {  useUiLocale, useDictionary  } from '../i18n/ui-locale';
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
import { useRecentlyViewed } from '../hooks/useRecentlyViewed';
import { useWishlist } from '../hooks/useWishlist';
import { useCountdown } from '../hooks/useCountdown';
import { useStableNow } from '../runtime/render-time';
import type { PreLaunchPhase } from '@/lib/pre-launch';
import type { PdpDeliveryRules } from '../utils/deliveryEstimate';
import {
  formatPdpFitModelLine,
  formatPdpFitModelLineForSizeSelection,
} from '../utils/pdpFitModels';
import { compareAtPrice, getDisplayPriceSelection, productHasVariablePricing } from '../utils/productPricing';
import { productAvailableSizes } from '../utils/productSizes';
import {
  buildPdpDeliveryLines,
  formatDeliveryWindow,
} from '../utils/deliveryEstimate';
import {
  PdpTrustStrip,
  PdpHeroGallery,
  PdpBuyBox,
  PdpProofStrip,
  PdpReviewsZone,
  PdpStoryCard,
  PdpArtistCard,
  PdpQualityProofCard,
  PdpDeliveryPaymentCard,
  PdpGiftReadyCard,
  PdpRelatedProducts,
} from '../components/pdp';


const EMPTY_PRODUCT_LIST: Product[] = [];
const EMPTY_FEELING_LIST: Feeling[] = [];
const EMPTY_ARTIST_LIST: Artist[] = [];
const EMPTY_OCCASION_LIST: Occasion[] = [];

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



type ProductDetailProps = {
  catalogSnapshot?: Partial<Pick<RuntimeCatalog, 'artists' | 'feelings' | 'occasions' | 'products'>> | null;
  catalogProducts?: Product[];
  initialProduct?: Product | null;
  initialSlug?: string;
  /** Merged delivery windows from RSC (Medusa store metadata + defaults). */
  deliveryRules?: PdpDeliveryRules;
  /** Size chart + model lines from RSC; when omitted, merged from built-in defaults + product.sizeTableKey. */
  sizeTableConfig?: PdpSizeTableConfig;
  preLaunchPhase?: PreLaunchPhase;
};

export function ProductDetail({
  catalogSnapshot,
  catalogProducts,
  initialProduct,
  initialSlug,
  deliveryRules: deliveryRulesProp,
  sizeTableConfig: sizeTableConfigProp,
  preLaunchPhase,
}: ProductDetailProps = {}) {
  if (initialProduct || catalogSnapshot || catalogProducts?.length) {
    const productsForRuntime = [
      ...(initialProduct ? [initialProduct] : []),
      ...(catalogProducts ?? catalogSnapshot?.products ?? []),
    ];
    setRuntimeCatalog({
      ...catalogSnapshot,
      products: productsForRuntime,
    });
  }

  const params = useParams();
  const routeSlug = typeof params?.slug === 'string' ? params.slug : (Array.isArray(params?.slug) ? params.slug[0] : '');
  const slug = initialSlug ?? routeSlug;
  const { locale } = useUiLocale();
  const shellCopy = useDictionary();
  const { pdp: copy } = shellCopy;
  const isArabic = locale === 'ar';
  const isRevealMode = preLaunchPhase === 'reveal';
  const now = useStableNow();
  const [searchParams] = useAppSearchParams();
  const { addItem, setMiniCartOpen } = useCart();
  const { recordView } = useRecentlyViewed();
  const { has: isWishlisted, toggle: toggleWishlist } = useWishlist();
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

  const defaultColorSelection = useMemo(() => {
    if (!product?.variantsByColor) return null;
    const keys = Object.keys(product.variantsByColor).sort();
    const pref = getPreferredDefaultSize(product);
    for (const k of keys) {
      const row = product.variantsByColor[k];
      if (pref && row?.some((v) => v.size === pref)) return k;
    }
    return keys[0] ?? null;
  }, [product]);

  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  const pdpProduct = useMemo((): Product | null => {
    if (!product) return null;
    if (!selectedColor || !product.variantsByColor?.[selectedColor]) return product;
    const row = product.variantsByColor[selectedColor];
    const variantsBySize = Object.fromEntries(row.map((v) => [v.size, v])) as Product['variantsBySize'];
    return { ...product, variantsBySize };
  }, [product, selectedColor]);

  const preferredDefaultSize = useMemo(() => getPreferredDefaultSize(product), [product]);

  const [photoIndex, setPhotoIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(preferredDefaultSize);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [relatedQuickViewSlug, setRelatedQuickViewSlug] = useState<string | null>(null);
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifyError, setNotifyError] = useState(false);
  const [notifySuccess, setNotifySuccess] = useState(false);
  const [designStoryExpanded, setDesignStoryExpanded] = useState(false);
  const [galleryLiveText, setGalleryLiveText] = useState('');
  const [stickyCtaVisible, setStickyCtaVisible] = useState(false);
  const [addedFeedback, setAddedFeedback] = useState(false);
  const [stockMessage, setStockMessage] = useState('');
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
    setSelectedColor(defaultColorSelection);
    setLightboxOpen(false);
    setRelatedQuickViewSlug(null);
    setAddedFeedback(false);
    setStockMessage('');
    setStickyCtaVisible(false);
  }, [preferredDefaultSize, defaultColorSelection, slug]);

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

  const colorVariantMedia = useMemo(() => {
    if (!product?.variantsByColor || !selectedColor) return null;
    const row = product.variantsByColor[selectedColor];
    const withMedia = row.find(
      (v) => v.media && (v.media.main || galleryItemsToSrcList(v.media.gallery).length > 0),
    );
    return withMedia?.media ?? null;
  }, [product, selectedColor]);

  const media = useMemo(() => {
    if (!product) {
      return getProductMedia('');
    }

    const colorMain = colorVariantMedia?.main ?? undefined;
    const colorGallery = galleryItemsToSrcList(colorVariantMedia?.gallery);
    if (colorMain || colorGallery.length > 0) {
      const backendGallery = Array.from(
        new Set(
          [
            colorMain,
            ...colorGallery,
            product.thumbnail ?? undefined,
          ].filter((value): value is string => Boolean(value)),
        ),
      );
      return {
        gallery: backendGallery,
        main: colorMain ?? backendGallery[0] ?? product.thumbnail ?? '',
      };
    }

    const backendGallery = Array.from(
      new Set([
        product.media?.main ?? undefined,
        ...galleryItemsToSrcList(product.media?.gallery),
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
  }, [preferBackendCatalog, product, colorVariantMedia]);
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

  const hasGalleryRail = gallery.length > 1;
  const primaryGallerySrc = gallery[0]?.src ?? media.main;
  const scopeProduct = pdpProduct ?? product;
  const displayPriceSelection = scopeProduct
    ? getDisplayPriceSelection(scopeProduct, selectedSize as ProductSizeKey | null)
    : { isSelected: false, size: null, variant: null };
  const displayPriceEgp = displayPriceSelection.variant?.priceEgp ?? scopeProduct?.priceEgp ?? 0;
  const displayOriginalPriceEgp = displayPriceSelection.variant
    ? compareAtPrice(displayPriceSelection.variant.priceEgp, displayPriceSelection.variant.originalPriceEgp)
    : compareAtPrice(scopeProduct?.priceEgp ?? 0, scopeProduct?.originalPriceEgp);
  const promoEndsAt = displayOriginalPriceEgp ? (scopeProduct?.promoEndsAt ?? null) : null;
  const promoShowCountdown = scopeProduct?.promoShowCountdown ?? true;
  const promoCountdown = useCountdown(promoShowCountdown ? promoEndsAt : null);
  const pricingVariesBySize = scopeProduct ? productHasVariablePricing(scopeProduct) : false;
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
  const productDescription = product?.storyDescription ?? product?.description ?? product?.story ?? '';
  const compactProductDescription = useMemo(() => {
    if (!productDescription) return '';
    const trimmed = productDescription.trim();
    if (trimmed.length <= 180) return trimmed;
    return `${trimmed.slice(0, 180).trimEnd()}…`;
  }, [productDescription]);

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
    const scope = pdpProduct ?? product;
    const rowSizes = new Set(Object.keys(scope.variantsBySize || {}) as ProductSizeKey[]);
    const avail = new Set(productAvailableSizes(scope));
    const definedSizeList: ProductSizeKey[] = product.availableSizes?.length
      ? product.availableSizes
      : product.variantsByColor
        ? [
            ...new Set(
              Object.values(product.variantsByColor)
                .flat()
                .map((v) => v.size as ProductSizeKey),
            ),
          ]
        : (Object.keys(product.variantsBySize || {}) as ProductSizeKey[]);
    const definedSizes = new Set<ProductSizeKey>(definedSizeList);
    const hasDefinedSizes = definedSizes.size > 0;

    return PDP_SCHEMA.sizes.map(({ key, disabled }) => ({
      key,
      disabled:
        Boolean(disabled) ||
        (hasDefinedSizes && !definedSizes.has(key as ProductSizeKey)) ||
        !avail.has(key as ProductSizeKey) ||
        (Boolean(product.variantsByColor) && !rowSizes.has(key as ProductSizeKey)),
    }));
  }, [product, pdpProduct]);

  const sizeDef = selectedSize ? sizeButtons.find((s) => s.key === selectedSize) : undefined;
  const oosSelected = Boolean(sizeDef?.disabled);
  const sizeReady = Boolean(selectedSize && sizeDef && !sizeDef.disabled);
  const selectedVariant = selectedSize
    ? displayPriceSelection.variant ?? product?.variantsBySize?.[selectedSize as ProductSizeKey] ?? null
    : null;
  const selectedStockStatus = selectedSize ? product?.stockStatusBySize?.[selectedSize as ProductSizeKey] : undefined;
  const inventoryHint =
    selectedStockStatus === 'low_stock' && typeof selectedVariant?.inventoryQuantity === 'number'
      ? `Only ${selectedVariant.inventoryQuantity} left`
      : selectedSize && product?.inventoryHintBySize
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
  const uniqueCrossSellCompanions = useMemo(() => {
    const bySlug = new Map<string, Product>();
    for (const p of frequentlyBoughtWithProducts) bySlug.set(p.slug, p);
    for (const p of styleWithProducts) bySlug.set(p.slug, p);
    return [...bySlug.values()];
  }, [frequentlyBoughtWithProducts, styleWithProducts]);
  const showCrossSellSection =
    !isRevealMode &&
    !compactPdp &&
    uniqueCrossSellCompanions.length >= 3 &&
    (primaryCrossSellProducts.length > 0 || fallbackCrossSellProducts.length > 0);
  /** Prefer `metadata.fitLabel` from Medusa / storefront API; static PDP line is fallback only. */
  const silhouetteCueLabel = useMemo(() => {
    const fromCatalog = product?.fitLabel?.trim();
    if (fromCatalog) return fromCatalog;
    return PDP_SCHEMA.features.find((f) => f.icon === 'SilhouetteIcon')?.label;
  }, [product?.fitLabel]);
  const deliveryRules: PdpDeliveryRules = useMemo(
    () => deliveryRulesProp ?? mergePdpDeliveryRules(undefined),
    [deliveryRulesProp],
  );
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
    if (!product) return;

    const email = notifyEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setNotifyError(true);
      return;
    }

    setNotifyError(false);

    if (isRevealMode) {
      void fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email,
          locale,
          source: `pdp_notify_${product.slug}`,
        }),
      });
      setNotifySuccess(true);
      return;
    }

    if (!selectedSize || !sizeDef?.disabled) return;
    notifyRestockSignup({ productSlug: product.slug, size: selectedSize, email });
    setNotifySuccess(true);
  }

  function handleSizeSelect(size: ProductSizeKey, isSelected: boolean) {
    const nextSize = isSelected ? null : size;
    setSelectedSize(nextSize);
    setStockMessage('');
    if (product && nextSize) {
      trackSizeSelected(product, nextSize, 'pdp');
    }
  }

  function handlePrimaryAction() {
    if (!product) return;

    if (isRevealMode) {
      notifyFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      window.setTimeout(() => notifyInputRef.current?.focus(), 320);
      return;
    }

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
    const vId = scopeProduct?.variantsBySize?.[selectedSize as ProductSizeKey]?.id;
    const result = addItem(product.slug, selectedSize as ProductSizeKey, 1, vId);
    if (!result.ok) {
      setAddedFeedback(false);
      setStockMessage(formatCartStockMessage(result, product.name, isArabic));
      return;
    }
    setStockMessage('');
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
    const vId = scopeProduct?.variantsBySize?.[sz]?.id;
    const mainResult = addItem(product.slug, sz, 1, vId);
    if (!mainResult.ok) {
      setAddedFeedback(false);
      setStockMessage(formatCartStockMessage(mainResult, product.name, isArabic));
      return;
    }
    let blockedMessage = '';
    for (const p of companions) {
      const avail = productAvailableSizes(p);
      const u = avail.includes(sz) ? sz : avail[0];
      if (u) {
        const companionResult = addItem(p.slug, u, 1);
        if (!companionResult.ok && !blockedMessage) {
          blockedMessage = formatCartStockMessage(companionResult, p.name, isArabic);
        }
      }
    }
    setStockMessage(blockedMessage);
    setAddedFeedback(true);
    setMiniCartOpen(true);
    window.setTimeout(() => setAddedFeedback(false), 2200);
  }



  function primaryCtaLabel() {
    if (isRevealMode) return isArabic ? 'أخبرني عند الإطلاق' : 'Notify me when live';
    if (oosSelected) return copy.notifyMeCTA;
    if (sizeReady && product) return `${copy.addBtnCTA} — ${formatEgp(displayPriceEgp)}`;
    return copy.selectSizePrompt;
  }

  const storyTagLabels = useMemo(() => {
    const tags: string[] = [];
    if (feeling) tags.push(feeling.name);
    if (product?.fitLabel?.trim()) tags.push(product.fitLabel.trim());
    heroCategoryTagItems.forEach(({ label }) => tags.push(label));
    return [...new Set(tags)];
  }, [feeling, product?.fitLabel, heroCategoryTagItems]);

  const storyText = useMemo(() => {
    const desc = productDescription.trim();
    if (!desc) return '';
    if (desc.length <= 400) return desc;
    return designStoryExpanded ? desc : `${desc.slice(0, 400).trimEnd()}…`;
  }, [productDescription, designStoryExpanded]);

  const mobileCtaClass = `cta-clay flex min-h-14 w-full items-center justify-center gap-2 border px-4 py-4 text-[13px] font-semibold uppercase tracking-[0.2em] transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal ${
    oosSelected
      ? 'border-obsidian bg-obsidian text-white hover:bg-obsidian/90 opacity-90'
      : 'border-obsidian bg-obsidian text-white hover:bg-obsidian/90'
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
    if (preferBackendCatalog) {
      return (
        <div className="product-page pdp-page-content bg-papyrus px-4 py-8 md:px-12 md:py-10">
          <div className="mx-auto grid max-w-[1320px] gap-8 md:grid-cols-[minmax(0,1.45fr)_minmax(22rem,30rem)] md:gap-12 lg:gap-16">
            <div className="flex flex-col gap-4">
              <Skeleton className="aspect-[4/5] w-full rounded-[18px]" />
              <div className="flex gap-3">
                <Skeleton className="h-16 w-16 rounded-lg" />
                <Skeleton className="h-16 w-16 rounded-lg" />
                <Skeleton className="h-16 w-16 rounded-lg" />
              </div>
            </div>
            <div className="flex flex-col gap-6">
              <SkeletonText lines={2} />
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
              <SkeletonText lines={4} />
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="bg-papyrus px-4 py-16 text-center">
        <p className="font-body text-warm-charcoal">{copy.pdpProductNotFound}</p>
        <Link href="/feelings" className="font-label mt-4 inline-block text-deep-teal underline">
          {shellCopy.shell.shopByFeeling}
        </Link>
      </div>
    );
  }

  const blurForProductMain = (src: string) =>
    product.media?.blurDataUrlMain && product.media?.main && src === product.media.main
      ? product.media.blurDataUrlMain
      : null;

  const colorOptions = product?.variantsByColor
    ? Object.keys(product.variantsByColor).sort()
    : null;
  const sizeTableDisplayLabel = sizeTableResolved.displayLabel
    ? isArabic
      ? sizeTableResolved.displayLabel.ar || sizeTableResolved.displayLabel.en || ''
      : sizeTableResolved.displayLabel.en || sizeTableResolved.displayLabel.ar || ''
    : '';

  return (
    <div className="product-page pdp-page-content bg-papyrus text-obsidian">
      <span id="pdp-size-hint" className="sr-only">
        {copy.sizeRequiredPrompt}
      </span>

      <PdpTrustStrip />

      <nav
        className="bg-papyrus px-4 pb-2 pt-6 font-body text-[11px] uppercase tracking-wider text-clay md:px-12 md:pb-4 md:pt-8"
        aria-label={shellCopy.shell.breadcrumb}
      >
        <div className="mx-auto flex max-w-[1320px] flex-wrap items-center gap-x-2 gap-y-1">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center rounded-sm px-1 text-clay transition-colors hover:text-obsidian"
          >
            {shellCopy.shell.home}
          </Link>
          <span className="text-clay/50" aria-hidden>/</span>
          {feeling ? (
            <>
              <Link
                href={`/feelings/${feeling.slug}`}
                className="inline-flex min-h-11 max-w-[12rem] items-center truncate rounded-sm px-1 text-clay transition-colors hover:text-obsidian"
              >
                {feeling.name}
              </Link>
              <span className="text-clay/50" aria-hidden>/</span>
            </>
          ) : null}
          <span className="min-h-11 max-w-[min(100%,100vw-8rem)] truncate py-2 text-warm-charcoal">{product.name}</span>
        </div>
      </nav>

      <section className="mx-auto grid max-w-[1320px] gap-6 px-4 pb-12 pt-4 md:grid-cols-[minmax(0,1.45fr)_minmax(22rem,30rem)] md:gap-12 md:px-12 md:pb-16 md:pt-6 lg:gap-16">
        <PdpHeroGallery
          product={product}
          gallery={gallery}
          photoIndex={photoIndex}
          hasGalleryRail={hasGalleryRail}
          heroView={heroView}
          galleryLiveRegionId={galleryLiveRegionId}
          galleryLiveText={galleryLiveText}
          onSetPhotoIndex={setPhotoIndex}
          onOpenLightbox={() => setLightboxOpen(true)}
          onBlurForMain={blurForProductMain}
        />
        <PdpBuyBox
          product={product}
          feeling={feeling}
          pdpArtist={pdpArtist}
          isArabic={isArabic}
          isRevealMode={isRevealMode}
          displayPriceEgp={displayPriceEgp}
          displayOriginalPriceEgp={displayOriginalPriceEgp}
          promoCountdown={promoCountdown}
          promoLabel={scopeProduct?.promoLabel ?? null}
          promoShowCountdown={promoShowCountdown}
          priceSizeLabel={priceSizeLabel}
          compactProductDescription={compactProductDescription}
          heroCategoryTagItems={heroCategoryTagItems}
          trustItems={trustItems}
          selectedColor={selectedColor}
          colorOptions={colorOptions}
          onColorSelect={(color) => {
            setSelectedColor(color);
            setStockMessage('');
          }}
          sizeButtons={sizeButtons}
          selectedSize={selectedSize}
          selectedStockStatus={selectedStockStatus}
          oosSelected={oosSelected}
          sizeReady={sizeReady}
          sizeTableResolved={sizeTableResolved}
          silhouetteCueLabel={silhouetteCueLabel}
          inlineFitModelDisplay={inlineFitModelDisplay}
          inlineFitMeasurementsPart={inlineFitMeasurementsPart}
          inventoryHint={inventoryHint}
          sizeSectionRef={sizeSectionRef}
          sizeGuideTriggerRef={sizeGuideTriggerRef}
          onSizeSelect={handleSizeSelect}
          onOpenSizeGuide={() => setSizeGuideOpen(true)}
          mainCtaRef={mainCtaRef}
          addedFeedback={addedFeedback}
          stockMessage={stockMessage}
          onPrimaryAction={handlePrimaryAction}
          notifyFormRef={notifyFormRef}
          notifyInputRef={notifyInputRef}
          notifyFieldId={notifyFieldId}
          notifyEmail={notifyEmail}
          notifyError={notifyError}
          notifySuccess={notifySuccess}
          onNotifyEmailChange={(email: string) => { setNotifyEmail(email); setNotifyError(false); }}
          onNotifySubmit={handleNotifySubmit}
          whatsappSupportUrl={whatsappSupportUrl}
          wishlisted={isWishlisted(product.slug)}
          onWishlistToggle={() => {
            const currently = isWishlisted(product.slug);
            if (currently) trackWishlistRemove(product);
            else trackWishlistAdd(product);
            toggleWishlist(product.slug);
          }}
        />
      </section>

      <PdpProofStrip product={product} />

      {showCrossSellSection ? (
        <section className="border-t border-stone/25 bg-papyrus">
          <div className="mx-auto max-w-[1320px] px-4 py-10 md:px-12 md:py-12">
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
          </div>
        </section>
      ) : null}

      {!compactPdp ? <PdpShareStrip productName={product.name} productSlug={product.slug} /> : null}

      {isRevealMode ? (
        <ArtistStudioBlock
          slides={product.artistStorySlides as any}
          artistName={pdpArtist?.name}
          isRevealMode={isRevealMode}
        />
      ) : null}

      <PdpReviewsZone product={product} />

      <PdpStoryCard storyText={storyText} tagLabels={storyTagLabels} />

      <section className="border-t border-stone/25 bg-papyrus">
        <div className="mx-auto max-w-[1320px] px-4 py-14 md:px-12 md:py-16">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <PdpArtistCard artistDisplay={pdpArtist} catalogArtist={artist} isArabic={isArabic} />
            <PdpQualityProofCard physicalLines={physicalFitDisplayLines} />
            <PdpDeliveryPaymentCard
              deliveryRules={deliveryRules}
              deliveryDynamic={deliveryDynamic}
              standardDeliveryWindow={standardDeliveryWindow}
              expressDeliveryWindow={expressDeliveryWindow}
              trustItems={trustItems}
            />
          </div>
        </div>
      </section>

      <section className="border-t border-stone/25 bg-papyrus">
        <div className="mx-auto max-w-[820px] px-4 py-14 md:px-12 md:py-16">
          <PdpGiftReadyCard giftWrapAvailable />
        </div>
      </section>

      {productDescription && productDescription.trim().length > 400 ? (
        <section className="border-t border-stone/25 bg-papyrus">
          <div className="mx-auto max-w-[1320px] px-4 py-6 md:px-12">
            <button
              type="button"
              onClick={() => setDesignStoryExpanded((open) => !open)}
              className="font-label inline-flex min-h-11 items-center text-[11px] font-medium uppercase tracking-[0.18em] text-deep-teal underline decoration-deep-teal/35 underline-offset-4 transition-colors hover:text-obsidian"
            >
              {designStoryExpanded ? 'Show less' : 'Read full story'}
            </button>
          </div>
        </section>
      ) : null}

      <PdpRelatedProducts
        products={related}
        feeling={feeling}
        shopByFeelingLabel={shellCopy.shell.shopByFeeling}
        onQuickView={setRelatedQuickViewSlug}
      />

      {product && !isRevealMode ? (
        <StickyAddToCart
          visible={stickyCtaVisible && !lightboxOpen && !sizeGuideOpen}
          productName={product.name}
          thumbnail={media.main}
          selectedSize={selectedSize}
          sizeReady={sizeReady}
          oosSelected={oosSelected}
          displayPrice={displayPriceEgp}
          onAddToBag={handlePrimaryAction}
          addBtnCta={copy.addBtnCTA}
          selectSizePrompt={copy.selectSizePrompt}
          notifyMeCta={copy.notifyMeCTA}
          selectSizeHint={copy.pdpStickySelectSizeHint}
          statusMessage={stockMessage}
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
                {sizeTableDisplayLabel ? (
                  <span className="inline-flex max-w-full rounded-full border border-obsidian/25 bg-white px-3 py-1 font-label text-[10px] font-semibold uppercase tracking-[0.16em] text-obsidian">
                    {sizeTableDisplayLabel}
                  </span>
                ) : null}
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
