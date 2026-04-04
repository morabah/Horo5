import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type SyntheticEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getProductMedia, getProductPdpGallery, imgUrl } from '../data/images';
import { getProduct, getVibe, type ProductSizeKey } from '../data/site';
import { useCart } from '../cart/CartContext';
import { PDP_SCHEMA, QUICK_VIEW_SCHEMA } from '../data/domain-config';
import { formatEgp } from '../utils/formatPrice';
import { formatPdpFitModelLine } from '../utils/pdpFitModels';
import { productAvailableSizes } from '../utils/productSizes';
import { AppIcon } from './AppIcon';

type ProductQuickViewProps = {
  open: boolean;
  productSlug: string | null;
  onClose: () => void;
};

const QUICK_VIEW_BASE_SIZES = PDP_SCHEMA.sizes.map((size) => ({
  key: size.key as ProductSizeKey,
  disabled: Boolean(size.disabled),
}));

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

export function ProductQuickView({ open, productSlug, onClose }: ProductQuickViewProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<Element | null>(null);
  const navigate = useNavigate();
  const { addItem } = useCart();
  const titleId = useId();
  const descId = useId();
  const sizeChartId = useId();
  const [selectedSize, setSelectedSize] = useState<ProductSizeKey | null>(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [addedToBag, setAddedToBag] = useState(false);
  const [sizeChartOpen, setSizeChartOpen] = useState(false);

  const product = productSlug ? getProduct(productSlug) : undefined;
  const vibe = product ? getVibe(product.vibeSlug) : undefined;
  const media = product ? getProductMedia(product.slug) : null;
  const gallery = product ? getProductPdpGallery(product.name, product.slug) : [];
  const galleryLen = gallery.length;
  const safePhotoIndex = galleryLen > 0 ? Math.min(photoIndex, galleryLen - 1) : 0;
  const mainView =
    gallery[safePhotoIndex] ??
    gallery[0] ?? {
      src: media?.main ?? '',
      alt: product ? `HORO “${product.name}” t-shirt.` : '',
      label: 'image',
    };
  const fit = product?.fitLabel ?? 'Regular';
  const priceStr = product ? formatEgp(product.priceEgp) : '';

  const quickViewSizes = useMemo(() => {
    if (!product) return QUICK_VIEW_BASE_SIZES;
    const avail = new Set(productAvailableSizes(product));
    return QUICK_VIEW_BASE_SIZES.map((size) => ({
      ...size,
      disabled: size.disabled || !avail.has(size.key),
    }));
  }, [product]);
  const primaryCtaLabel = addedToBag
    ? QUICK_VIEW_SCHEMA.copy.viewBagCta
    : selectedSize
      ? QUICK_VIEW_SCHEMA.copy.addToBagCta.replace('{price}', priceStr)
      : QUICK_VIEW_SCHEMA.copy.chooseSizeCta;

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

  useIsomorphicLayoutEffect(() => {
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
    if (!product || !selectedSize) return;
    addItem(product.slug, selectedSize, 1);
    setAddedToBag(true);
  };

  const handleViewBag = () => {
    onClose();
    navigate('/cart');
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
            Product not found
          </p>
          <button
            type="button"
            className="font-label mt-4 min-h-12 w-full rounded-sm border border-white/20 py-3 text-xs font-semibold uppercase tracking-widest"
            onClick={onClose}
          >
            Close
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

          <div className="flex w-full shrink-0 flex-col border-b border-white/10 md:min-h-[min(600px,84dvh)] md:w-[52%] md:border-b-0 md:border-r">
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
              <div className="flex shrink-0 gap-2 overflow-x-auto overscroll-x-contain border-t border-white/10 bg-black/35 p-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {gallery.map((view, index) => (
                  <button
                    key={`${product.slug}-qv-${view.label}-${index}`}
                    type="button"
                    onClick={() => setPhotoIndex(index)}
                    className={`aspect-square h-16 w-16 shrink-0 overflow-hidden rounded-lg p-0 transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                      safePhotoIndex === index ? 'ring-2 ring-white' : 'ring-1 ring-white/20 hover:ring-white/45'
                    }`}
                    aria-label={`Show ${view.label}`}
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
                  {vibe ? (
                    <p className="font-label text-[10px] font-medium uppercase tracking-[0.2em] text-kohl-gold-bright">
                      {vibe.name} / {fit}
                    </p>
                  ) : null}
                  <h2 id={titleId} className="font-headline mt-2 text-[clamp(1.9rem,3vw,3.05rem)] font-bold uppercase leading-[0.95] tracking-tight text-white">
                    {product.name}
                  </h2>
                </div>
                <p className="font-headline shrink-0 pt-1 text-lg font-bold text-white md:text-xl">{priceStr}</p>
              </div>

              <p id={descId} className="font-body max-w-xl text-sm leading-relaxed text-white/78 md:text-[15px]">
                {product.story}
              </p>

              <div>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <span className="font-label text-[11px] font-semibold uppercase tracking-[0.2em] text-white/92">Select size</span>
                  <button
                    type="button"
                    className="font-label inline-flex min-h-11 items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-frost-blue transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  aria-expanded={sizeChartOpen}
                  aria-controls={sizeChartId}
                  onClick={() => setSizeChartOpen((current) => !current)}
                >
                  <AppIcon name="straighten" className="h-4 w-4" />
                  {QUICK_VIEW_SCHEMA.copy.sizeChartLabel}
                </button>
                </div>

                <div className="flex flex-wrap gap-2" role="group" aria-label="Size">
                  {quickViewSizes.map((size) => {
                    const isSelected = selectedSize === size.key;
                    return (
                      <button
                        key={size.key}
                        type="button"
                        disabled={size.disabled}
                        onClick={() => {
                          setSelectedSize(size.key);
                          setAddedToBag(false);
                        }}
                        className={`font-label min-h-12 min-w-12 rounded-lg border px-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                          size.disabled
                            ? 'cursor-not-allowed border-white/10 bg-white/[0.04] text-white/25'
                            : isSelected
                              ? 'border-white bg-white text-obsidian'
                              : 'border-white/25 bg-transparent text-white hover:border-white/50'
                        }`}
                        aria-pressed={isSelected}
                      >
                        {size.key}
                      </button>
                    );
                  })}
                </div>

                {sizeChartOpen ? (
                  <div
                    id={sizeChartId}
                    role="region"
                    aria-label={QUICK_VIEW_SCHEMA.copy.sizeChartRegionLabel}
                    className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]"
                  >
                    <div className="overflow-x-auto">
                      <table className="min-w-full border-collapse text-left text-xs text-white/85">
                        <thead className="bg-white/[0.06] text-[10px] uppercase tracking-[0.18em] text-white/58">
                          <tr>
                            <th className="px-3 py-3 font-medium">Size</th>
                            <th className="px-3 py-3 font-medium">Chest</th>
                            <th className="px-3 py-3 font-medium">Shoulder</th>
                            <th className="px-3 py-3 font-medium">Length</th>
                            <th className="px-3 py-3 font-medium">Sleeve</th>
                          </tr>
                        </thead>
                        <tbody>
                          {PDP_SCHEMA.sizeTable.map((row) => (
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
                    <div className="font-body border-t border-white/8 px-3 py-3 text-xs text-white/62">
                      {product.pdpFitModels?.length ? (
                        product.pdpFitModels.map((m) => <p key={`${m.heightCm}-${m.sizeWorn}`}>{formatPdpFitModelLine(m)}</p>)
                      ) : (
                        <p>{PDP_SCHEMA.copy.sizeGuideModelNote}</p>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="space-y-3">
                {addedToBag ? (
                  <>
                    <p className="font-label text-center text-[11px] font-medium uppercase tracking-[0.18em] text-primary" role="status" aria-live="polite">
                      {QUICK_VIEW_SCHEMA.copy.addedStatus}
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
                      className="font-label inline-flex min-h-11 w-full items-center justify-center text-[11px] font-medium uppercase tracking-[0.18em] text-white/78 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
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
                        ? 'bg-primary text-obsidian hover:brightness-95'
                        : 'cursor-not-allowed border border-white/12 bg-white/[0.08] text-white/38 shadow-none'
                    }`}
                    aria-disabled={!selectedSize}
                    onClick={handleAddToBag}
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
                    className="font-label inline-flex min-h-9 items-center rounded-full border border-white/12 bg-white/[0.04] px-3 py-2 text-[10px] font-medium uppercase tracking-[0.16em] text-white/72"
                  >
                    {item}
                  </li>
                ))}
              </ul>

              <Link
                to={`/products/${product.slug}`}
                className="font-label mt-4 inline-flex min-h-11 items-center text-[11px] font-medium uppercase tracking-[0.18em] text-white/84 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
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
