import { useEffect, useId, useMemo, useRef, useState, type SyntheticEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { buildProductPdpGallery, getProductMedia, imgUrl } from '../data/images';
import { getFeeling, getProduct, type ProductSizeKey } from '../data/site';
import { useCart } from '../cart/CartContext';
import {
  fillPdpCopyTemplate,
  mergePdpSizeTableConfig,
  PDP_SCHEMA,
  QUICK_VIEW_SCHEMA,
  resolvePdpDisplayFitModels,
  type PdpSizeTableConfig,
} from '../data/domain-config';
import { formatEgp } from '../utils/formatPrice';
import { formatPdpFitModelLine } from '../utils/pdpFitModels';
import { compareAtPrice, getDisplayPriceSelection, productHasVariablePricing } from '../utils/productPricing';
import { productAvailableSizes } from '../utils/productSizes';
import { AppIcon } from './AppIcon';

type ProductQuickViewProps = {
  open: boolean;
  productSlug: string | null;
  onClose: () => void;
  /** When set (e.g. from PDP), reuses merged store preset; otherwise merges built-in + product.sizeTableKey. */
  sizeTableConfig?: PdpSizeTableConfig;
};

const QUICK_VIEW_BASE_SIZES = PDP_SCHEMA.sizes.map((size) => ({
  key: size.key as ProductSizeKey,
  disabled: Boolean(size.disabled),
}));

const pdpCopy = PDP_SCHEMA.copy;

export function ProductQuickView({ open, productSlug, onClose, sizeTableConfig }: ProductQuickViewProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<Element | null>(null);
  const navigate = useNavigate();
  const { addItem, setMiniCartOpen } = useCart();
  const titleId = useId();
  const descId = useId();
  const sizeChartId = useId();
  const [selectedSize, setSelectedSize] = useState<ProductSizeKey | null>(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [addedToBag, setAddedToBag] = useState(false);
  const [sizeChartOpen, setSizeChartOpen] = useState(false);

  const product = productSlug ? getProduct(productSlug) : undefined;

  const resolvedSizeTable = useMemo(
    () =>
      sizeTableConfig ??
      mergePdpSizeTableConfig(undefined, product?.sizeTableKey),
    [sizeTableConfig, product?.sizeTableKey],
  );

  const quickViewFitLines = useMemo(
    () => resolvePdpDisplayFitModels(resolvedSizeTable).map(formatPdpFitModelLine),
    [resolvedSizeTable],
  );
  const feelingSlug = product?.primaryFeelingSlug ?? product?.feelingSlug;
  const feeling = feelingSlug ? getFeeling(feelingSlug) : undefined;
  const media = useMemo(() => {
    if (!product) return null;
    const fallbackMedia = getProductMedia(product.slug);
    const backendGallery = Array.from(
      new Set([
        product.media?.main ?? undefined,
        ...(product.media?.gallery ?? []),
        product.thumbnail ?? undefined,
      ].filter((value): value is string => Boolean(value))),
    );

    if (backendGallery.length === 0) {
      return fallbackMedia;
    }

    return {
      gallery: backendGallery,
      main: product.media?.main ?? backendGallery[0] ?? fallbackMedia.main,
    };
  }, [product]);
  const gallery = product && media ? buildProductPdpGallery(product.name, media) : [];
  const galleryLen = gallery.length;
  const safePhotoIndex = galleryLen > 0 ? Math.min(photoIndex, galleryLen - 1) : 0;
  const mainView =
    gallery[safePhotoIndex] ??
    gallery[0] ?? {
      src: media?.main ?? '',
      alt: product
        ? fillPdpCopyTemplate(pdpCopy.pdpHeroImageAltTemplate, {
            name: product.name.trim() || pdpCopy.pdpHeroImageNameFallback,
          })
        : '',
      label: 'image',
    };
  const fit = product?.fitLabel?.trim() || null;
  const displayPriceSelection = product
    ? getDisplayPriceSelection(product, selectedSize)
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
      return pdpCopy.pdpPriceSelectedSizeTemplate.replace('{size}', sz);
    }
    if (pricingVariesBySize) {
      return pdpCopy.pdpPriceForSizeTemplate.replace('{size}', sz);
    }
    return null;
  }, [displayPriceSelection.size, displayPriceSelection.isSelected, pricingVariesBySize]);
  const priceStr = product ? formatEgp(displayPriceEgp) : '';
  const descriptionText = product?.description ?? product?.story ?? '';

  const quickViewSizes = useMemo(() => {
    if (!product) return QUICK_VIEW_BASE_SIZES;
    const avail = new Set(productAvailableSizes(product));
    const definedSizes = new Set<ProductSizeKey>(
      product.availableSizes?.length
        ? product.availableSizes
        : (Object.keys(product.variantsBySize || {}) as ProductSizeKey[]),
    );
    const hasDefinedSizes = definedSizes.size > 0;
    return QUICK_VIEW_BASE_SIZES.map((size) => ({
      ...size,
      disabled:
        size.disabled ||
        (hasDefinedSizes && !definedSizes.has(size.key)) ||
        !avail.has(size.key),
    }));
  }, [product]);

  const sizeDef = selectedSize ? quickViewSizes.find((s) => s.key === selectedSize) : undefined;
  const oosSelected = Boolean(sizeDef?.disabled);
  const inventoryHint =
    selectedSize && product?.inventoryHintBySize
      ? product.inventoryHintBySize[selectedSize]
      : undefined;

  const primaryCtaLabel = addedToBag
    ? QUICK_VIEW_SCHEMA.copy.viewBagCta
    : oosSelected
      ? pdpCopy.notifyMeCTA
      : selectedSize
        ? `${pdpCopy.addBtnCTA} — ${priceStr}`
        : pdpCopy.selectSizePrompt;

  useEffect(() => {
    setSelectedSize(null);
    setPhotoIndex(0);
    setAddedToBag(false);
    setSizeChartOpen(false);
  }, [productSlug]);

  useEffect(() => {
    if (!open) {
      setAddedToBag(false);
      setSizeChartOpen(false);
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && productSlug) {
      openerRef.current = document.activeElement;
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
      const opener = openerRef.current;
      if (opener instanceof HTMLElement) {
        opener.focus();
        openerRef.current = null;
      }
    }
  }, [open, productSlug]);

  const handleCancel = (event: SyntheticEvent<HTMLDialogElement>) => {
    event.preventDefault();
    onClose();
  };

  const showContent = Boolean(open && productSlug);

  const handleAddToBag = () => {
    if (!product || !selectedSize || oosSelected) return;
    addItem(product.slug, selectedSize, 1);
    setAddedToBag(true);
    // Close the dialog and open the mini-cart drawer for a consistent experience
    onClose();
    setMiniCartOpen(true);
  };

  const handlePrimaryCta = () => {
    if (!product) return;
    if (oosSelected && selectedSize) {
      onClose();
      navigate(`/products/${product.slug}`);
      return;
    }
    handleAddToBag();
  };

  const handleViewBag = () => {
    onClose();
    setMiniCartOpen(true);
  };

  return (
    <dialog
      ref={dialogRef}
      className="product-quick-view-dialog w-[min(calc(100vw-max(0.5rem,env(safe-area-inset-left,0px))-max(0.5rem,env(safe-area-inset-right,0px))),980px)] max-h-[min(92dvh,calc(100dvh-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px)-0.5rem))] overflow-hidden rounded-2xl border border-white/20 bg-obsidian/88 p-0 shadow-[0_32px_96px_-24px_rgba(0,0,0,0.72)] backdrop-blur-xl"
      aria-labelledby={showContent ? titleId : undefined}
      aria-describedby={showContent && product ? descId : undefined}
      onCancel={handleCancel}
    >
      {showContent && !product ? (
        <div className="p-6 text-white">
          <p id={titleId} className="font-headline text-lg">
            {pdpCopy.pdpProductNotFound}
          </p>
          <button
            type="button"
            className="font-label mt-4 min-h-12 w-full rounded-sm border border-white/20 py-3 text-xs font-semibold uppercase tracking-widest"
            onClick={onClose}
          >
            {pdpCopy.lightboxClose}
          </button>
        </div>
      ) : null}

      {showContent && product ? (
        <div className="relative flex max-h-[min(92dvh,calc(100dvh-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px)-0.5rem))] flex-col md:min-h-[min(600px,84dvh)] md:flex-row">
          <button
            type="button"
            className="absolute right-3 top-3 z-30 inline-flex min-h-12 min-w-12 items-center justify-center rounded-full border border-white/15 bg-black/45 text-lg text-white backdrop-blur-md transition-colors hover:bg-black/65 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            aria-label={QUICK_VIEW_SCHEMA.copy.closeLabel}
            onClick={onClose}
          >
            <AppIcon name="close" className="h-5 w-5" />
          </button>

          <div
            className="flex w-full shrink-0 flex-col border-b border-white/10 md:min-h-[min(600px,84dvh)] md:w-[52%] md:border-b-0 md:border-r"
            aria-label={pdpCopy.pdpGalleryRegionAria}
          >
            <div className="relative min-h-[280px] flex-1 bg-black/10 md:min-h-0">
              <img
                src={imgUrl(mainView.src, 1200)}
                alt={mainView.alt}
                className="h-full min-h-[280px] w-full object-cover md:absolute md:inset-0 md:min-h-full"
                width={1200}
                height={1500}
              />
              {product.merchandisingBadge ? (
                <span className="font-label absolute left-4 top-4 z-10 max-w-[calc(100%-5rem)] rounded-md border border-white/15 bg-obsidian/55 px-3 py-2 text-[10px] font-medium uppercase tracking-[0.18em] text-white/92 backdrop-blur-md">
                  {product.merchandisingBadge}
                </span>
              ) : null}
            </div>

            {galleryLen > 1 ? (
              <div
                className="flex shrink-0 gap-2 overflow-x-auto overscroll-x-contain border-t border-white/10 bg-black/35 p-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                aria-label={pdpCopy.pdpGalleryThumbnailsAria}
              >
                {gallery.map((view, index) => (
                  <button
                    key={`${product.slug}-qv-${view.label}-${index}`}
                    type="button"
                    onClick={() => setPhotoIndex(index)}
                    className={`aspect-square h-16 w-16 shrink-0 overflow-hidden rounded-lg p-0 transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                      safePhotoIndex === index ? 'ring-2 ring-white' : 'ring-1 ring-white/20 hover:ring-white/45'
                    }`}
                    aria-label={fillPdpCopyTemplate(pdpCopy.pdpGalleryShowImageTemplate, { label: view.label })}
                    aria-pressed={safePhotoIndex === index}
                  >
                    <img src={imgUrl(view.src, 240)} alt="" className="h-full w-full object-cover" width={240} height={240} />
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-black/30 px-5 py-5 text-white sm:px-7 md:px-8 md:py-8">
            <div className="space-y-5 md:pr-10">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  {feeling || fit ? (
                    <p className="font-label text-[10px] font-medium uppercase tracking-[0.2em] text-kohl-gold-bright">
                      {[feeling?.name, fit].filter(Boolean).join(' / ')}
                    </p>
                  ) : null}
                  <h2 id={titleId} className="font-headline mt-2 text-[clamp(1.9rem,3vw,3.05rem)] font-bold uppercase leading-[0.95] tracking-tight text-white">
                    {product.name}
                  </h2>
                  {product.capsuleSlugs?.includes('zodiac') ? (
                    <span className="font-label mt-2 inline-flex rounded-full border border-moon-gold/40 bg-moon-gold/10 px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.16em] text-white">
                      {pdpCopy.pdpZodiacCapsuleLabel}
                    </span>
                  ) : null}
                </div>
                <div className="shrink-0 pt-1 text-right">
                  <div className="flex flex-wrap items-end justify-end gap-2">
                    {displayOriginalPriceEgp ? (
                      <p className="font-headline text-sm text-white/55 line-through md:text-base">{formatEgp(displayOriginalPriceEgp)}</p>
                    ) : null}
                    <p className="font-headline text-lg font-bold text-white md:text-xl">{priceStr}</p>
                  </div>
                  {priceSizeLabel ? (
                    <p className="font-label mt-1 text-[10px] uppercase tracking-[0.18em] text-white/72">{priceSizeLabel}</p>
                  ) : null}
                </div>
              </div>

              <p id={descId} className="font-body max-w-xl text-sm leading-relaxed text-white/92 md:text-[15px]">
                {descriptionText}
              </p>

              <div>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <span className="font-label text-[11px] font-semibold uppercase tracking-[0.2em] text-white/92">
                    {pdpCopy.pdpQuickViewSelectSizeLabel}
                  </span>
                  <button
                    type="button"
                    className="font-label inline-flex min-h-11 items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-frost-blue transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                    aria-expanded={sizeChartOpen}
                    aria-controls={sizeChartId}
                    onClick={() => setSizeChartOpen((current) => !current)}
                  >
                    <AppIcon name="straighten" className="h-4 w-4" />
                    {pdpCopy.sizeGuideLabel}
                  </button>
                </div>

                <div className="flex flex-wrap gap-2" role="group" aria-label={pdpCopy.pdpSizeGroupAria}>
                  {quickViewSizes.map((size) => {
                    const isSelected = selectedSize === size.key;
                    const { disabled } = size;
                    return (
                      <button
                        key={size.key}
                        type="button"
                        onClick={() => {
                          setSelectedSize(isSelected ? null : size.key);
                          setAddedToBag(false);
                        }}
                        className={`font-label min-h-12 min-w-12 rounded-lg border px-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                          disabled
                            ? isSelected
                              ? 'border-white bg-white/90 text-obsidian line-through decoration-obsidian/50'
                              : 'border-white/15 bg-white/[0.04] text-white/40 line-through decoration-white/25 hover:border-white/30'
                            : isSelected
                              ? 'border-white bg-white text-obsidian'
                              : 'border-white/25 bg-transparent text-white hover:border-white/50'
                        }`}
                        aria-pressed={isSelected}
                      >
                        <span aria-disabled={disabled}>{size.key}</span>
                      </button>
                    );
                  })}
                </div>

                {inventoryHint ? (
                  <p className="font-label text-[11px] font-medium uppercase tracking-[0.18em] text-white/70">
                    {inventoryHint}
                  </p>
                ) : null}
                {oosSelected ? (
                  <p className="font-label text-[11px] font-medium uppercase tracking-[0.18em] text-white/72">
                    {pdpCopy.pdpOutOfStockForSize}
                  </p>
                ) : null}

                {sizeChartOpen ? (
                  <div
                    id={sizeChartId}
                    role="region"
                    aria-label={pdpCopy.sizeGuideLabel}
                    className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]"
                  >
                    <div className="overflow-x-auto">
                      <table className="min-w-full border-collapse text-left text-xs text-white/92">
                        <thead className="bg-white/[0.08] text-[10px] uppercase tracking-[0.18em] text-white/80">
                          <tr>
                            <th className="px-3 py-3 font-medium">{pdpCopy.sizeGuideTableSize}</th>
                            <th className="px-3 py-3 font-medium">{pdpCopy.sizeGuideTableChest}</th>
                            <th className="px-3 py-3 font-medium">{pdpCopy.sizeGuideTableShoulder}</th>
                            <th className="px-3 py-3 font-medium">{pdpCopy.sizeGuideTableLength}</th>
                            <th className="px-3 py-3 font-medium">{pdpCopy.sizeGuideTableSleeve}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {resolvedSizeTable.measurements.map((row) => (
                            <tr key={row.size} className="border-t border-white/8">
                              <td className="px-3 py-3 font-semibold text-white">{row.size}</td>
                              <td className="px-3 py-3">{row.chest}</td>
                              <td className="px-3 py-3">{row.shoulder}</td>
                              <td className="px-3 py-3">{row.length}</td>
                              <td className="px-3 py-3">{row.sleeve}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="font-body border-t border-white/8 px-3 py-3 text-xs text-white/82">
                      {quickViewFitLines.length > 0 ? (
                        quickViewFitLines.map((line, idx) => <p key={`qv-fit-${idx}`}>{line}</p>)
                      ) : (
                        <p>{pdpCopy.sizeGuideModelNote}</p>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="space-y-3">
                {addedToBag ? (
                  <>
                    <p className="font-label text-center text-[11px] font-medium uppercase tracking-[0.18em] text-primary" role="status" aria-live="polite">
                      {pdpCopy.pdpPrimaryCtaAddedLabel}
                    </p>
                    <button
                      type="button"
                      className="font-label flex min-h-12 w-full items-center justify-center rounded-lg bg-primary px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.2em] text-obsidian shadow-md transition-all hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                      onClick={handleViewBag}
                    >
                      {primaryCtaLabel}
                    </button>
                    <button
                      type="button"
                      className="font-label inline-flex min-h-11 w-full items-center justify-center text-[11px] font-medium uppercase tracking-[0.18em] text-white/90 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                      onClick={onClose}
                    >
                      {QUICK_VIEW_SCHEMA.copy.continueBrowsingCta}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    disabled={!selectedSize}
                    className={`font-label flex min-h-12 w-full items-center justify-center rounded-lg px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.2em] shadow-md transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                      selectedSize
                        ? oosSelected
                          ? 'bg-primary/90 text-obsidian hover:brightness-95'
                          : 'bg-primary text-obsidian hover:brightness-95'
                        : 'cursor-not-allowed border border-white/12 bg-white/[0.08] text-white/48 shadow-none'
                    }`}
                    aria-disabled={!selectedSize}
                    onClick={handlePrimaryCta}
                  >
                    {primaryCtaLabel}
                  </button>
                )}
              </div>
            </div>

            <div className="mt-5 border-t border-white/10 pt-5">
              <ul className="flex flex-wrap gap-2">
                {PDP_SCHEMA.trustStripItems.map((item) => (
                  <li
                    key={item}
                    className="font-label inline-flex min-h-9 items-center rounded-full border border-white/12 bg-white/[0.04] px-3 py-2 text-[10px] font-medium uppercase tracking-[0.16em] text-white/85"
                  >
                    {item}
                  </li>
                ))}
              </ul>

              <Link
                to={`/products/${product.slug}`}
                className="font-label mt-4 inline-flex min-h-11 items-center text-[11px] font-medium uppercase tracking-[0.18em] text-white/92 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                onClick={() => {
                  onClose();
                }}
              >
                {QUICK_VIEW_SCHEMA.copy.viewFullProductCta}
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </dialog>
  );
}
