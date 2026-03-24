import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getProductMedia, imgUrl } from '../data/images';
import { getProduct, getVibe, type ProductSizeKey } from '../data/site';
import { useCart } from '../cart/CartContext';
import { formatEgp } from '../utils/formatPrice';

const QUICK_VIEW_SIZES = ['M', 'L', 'XL'] as const;

const GALLERY_VIEW_LABELS = ['flat lay', 'on-body', 'lifestyle', 'print detail', 'size reference'] as const;

function galleryViewLabel(photoIndex: number): string {
  if (photoIndex >= 0 && photoIndex < GALLERY_VIEW_LABELS.length) {
    return GALLERY_VIEW_LABELS[photoIndex];
  }
  return `image ${photoIndex + 1}`;
}

type ProductQuickViewProps = {
  open: boolean;
  productSlug: string | null;
  onClose: () => void;
};

export function ProductQuickView({ open, productSlug, onClose }: ProductQuickViewProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<Element | null>(null);
  const navigate = useNavigate();
  const { addItem } = useCart();
  const titleId = useId();
  const descId = useId();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [cartNavPending, setCartNavPending] = useState(false);

  const p = productSlug ? getProduct(productSlug) : undefined;
  const vibe = p ? getVibe(p.vibeSlug) : undefined;
  const media = p ? getProductMedia(p.slug) : null;
  const gallery = media?.gallery ?? [];
  const galleryLen = gallery.length;
  const safePhotoIndex = galleryLen > 0 ? Math.min(photoIndex, galleryLen - 1) : 0;
  const mainSrc = gallery[safePhotoIndex] ?? gallery[0] ?? '';
  const fit = p?.fitLabel ?? 'Regular';

  useEffect(() => {
    setSelectedSize(null);
    setPhotoIndex(0);
    setCartNavPending(false);
  }, [productSlug]);

  useEffect(() => {
    if (!open) setCartNavPending(false);
  }, [open]);

  useLayoutEffect(() => {
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
      const el = openerRef.current;
      if (el instanceof HTMLElement) {
        el.focus();
        openerRef.current = null;
      }
    }
  }, [open, productSlug]);

  const handleCancel = (e: React.SyntheticEvent<HTMLDialogElement>) => {
    e.preventDefault();
    onClose();
  };

  const showContent = Boolean(open && productSlug);
  const priceStr = p ? formatEgp(p.priceEgp) : '';

  return (
    <dialog
      ref={dialogRef}
      className="product-quick-view-dialog w-[min(calc(100vw-max(0.5rem,env(safe-area-inset-left,0px))-max(0.5rem,env(safe-area-inset-right,0px))),960px)] max-h-[min(90dvh,calc(100dvh-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px)-0.5rem))] overflow-hidden rounded-2xl border border-white/25 bg-obsidian/75 p-0 shadow-[0_32px_96px_-24px_rgba(0,0,0,0.72)] backdrop-blur-2xl"
      aria-labelledby={showContent ? titleId : undefined}
      aria-describedby={showContent && p ? descId : undefined}
      onCancel={handleCancel}
    >
      {showContent && !p ? (
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

      {showContent && p ? (
        <div className="flex max-h-[min(90dvh,calc(100dvh-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px)-0.5rem))] flex-col md:flex-row md:min-h-[min(560px,85dvh)]">
          <div className="flex w-full shrink-0 flex-col md:min-h-[min(560px,85vh)] md:w-1/2">
            <div className="relative min-h-[240px] flex-1 md:min-h-0">
              <img
                src={imgUrl(mainSrc, 1000)}
                alt={`HORO “${p.name}” — ${galleryViewLabel(safePhotoIndex)}`}
                className="h-full min-h-[240px] w-full object-cover md:absolute md:inset-0 md:min-h-full"
                width={1000}
                height={1333}
              />
              {p.merchandisingBadge ? (
                <span className="font-label absolute left-4 top-4 z-10 max-w-[min(100%,calc(100%-2rem))] rounded-md border border-white/20 bg-obsidian/55 px-3 py-2 text-[10px] font-medium uppercase leading-snug tracking-wide text-white/95 backdrop-blur-md">
                  {p.merchandisingBadge}
                </span>
              ) : null}
              <button
                type="button"
                className="material-symbols-outlined absolute left-3 top-3 z-10 inline-flex min-h-12 min-w-12 items-center justify-center rounded-full border border-white/20 bg-obsidian/50 text-base text-white backdrop-blur-sm transition-colors hover:bg-obsidian/70 md:left-auto md:right-3"
                aria-label="Close quick view"
                onClick={onClose}
              >
                close
              </button>
            </div>
            <div className="flex shrink-0 gap-2 overflow-x-auto overscroll-x-contain border-t border-white/10 bg-black/40 p-2 pb-3 [-ms-overflow-style:none] [scrollbar-width:none] snap-x snap-mandatory md:grid md:grid-cols-5 md:gap-2 md:overflow-visible md:p-3 md:pb-3 md:snap-none [&::-webkit-scrollbar]:hidden">
              {gallery.map((src, i) => (
                <button
                  key={`${p.slug}-qv-${i}`}
                  type="button"
                  onClick={() => setPhotoIndex(i)}
                  className={`aspect-square h-14 w-14 shrink-0 snap-start overflow-hidden rounded-lg p-0 transition-shadow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal md:h-auto md:w-full ${
                    safePhotoIndex === i ? 'ring-2 ring-white' : 'ring-1 ring-white/25 opacity-90 hover:opacity-100'
                  }`}
                  aria-label={galleryLen > 0 ? `View image ${i + 1} of ${galleryLen}` : `View image ${i + 1}`}
                  aria-pressed={safePhotoIndex === i}
                >
                  <img src={imgUrl(src, 200)} alt="" className="h-full w-full object-cover" width={200} height={200} />
                </button>
              ))}
            </div>
          </div>

          <div className="flex max-h-[min(50dvh,480px)] min-h-0 w-full flex-1 flex-col overflow-y-auto overscroll-y-contain bg-black/40 px-5 py-4 text-white backdrop-blur-2xl sm:px-7 md:max-h-none md:w-1/2 md:py-8">
            <div className="sticky top-0 z-20 -mx-5 mb-3 border-b border-white/10 bg-black/50 px-5 pb-3 pt-1 backdrop-blur-2xl md:static md:mx-0 md:mb-0 md:border-0 md:bg-transparent md:px-0 md:pb-4 md:pt-0 md:backdrop-blur-none">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  {vibe ? (
                    <p className="font-label text-[10px] font-medium uppercase tracking-[0.2em] text-kohl-gold-bright">
                      {vibe.name} / {fit}
                    </p>
                  ) : null}
                  <h2 id={titleId} className="font-headline mt-1 text-xl font-bold uppercase tracking-tight text-white sm:text-2xl md:text-3xl">
                    {p.name}
                  </h2>
                </div>
                <p className="font-headline shrink-0 text-lg font-bold text-white md:text-xl">{priceStr}</p>
              </div>
              <p className="font-label mt-2 text-[10px] uppercase tracking-[0.18em] text-white/55 md:hidden">
                Scroll for size &amp; details
              </p>
            </div>

            <p id={descId} className="font-body text-sm leading-relaxed text-white/85 md:mt-0">
              {p.story}
            </p>

            <div className="mt-5 rounded-xl border border-white/15 bg-white/[0.07] p-4 backdrop-blur-lg">
              <ul className="space-y-3 text-sm text-white/90">
                <li className="flex gap-3">
                  <span className="material-symbols-outlined mt-0.5 shrink-0 text-lg text-primary" aria-hidden>
                    checkroom
                  </span>
                  <span>220gsm combed cotton, DTF print with sharp detail</span>
                </li>
                <li className="flex gap-3">
                  <span className="material-symbols-outlined mt-0.5 shrink-0 text-lg text-primary" aria-hidden>
                    palette
                  </span>
                  <span>Original illustration</span>
                </li>
                <li className="flex gap-3">
                  <span className="material-symbols-outlined mt-0.5 shrink-0 text-lg text-primary" aria-hidden>
                    sync
                  </span>
                  <span>Free exchange within 14 days</span>
                </li>
                <li className="flex gap-3">
                  <span className="material-symbols-outlined mt-0.5 shrink-0 text-lg text-primary" aria-hidden>
                    local_shipping
                  </span>
                  <span>COD available nationwide</span>
                </li>
              </ul>
            </div>

            <div className="mt-6">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <span className="font-label text-[11px] font-semibold uppercase tracking-[0.2em] text-white/90">Select size</span>
                <Link
                  to={`/products/${p.slug}`}
                  className="font-label inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-frost-blue hover:underline"
                  onClick={onClose}
                >
                  <span className="material-symbols-outlined text-[16px]" aria-hidden>
                    straighten
                  </span>
                  Size chart
                </Link>
              </div>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Size">
                {QUICK_VIEW_SIZES.map((s) => {
                  const isSel = selectedSize === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSelectedSize(s)}
                      className={`font-label min-h-11 min-w-11 rounded-lg border px-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                        isSel ? 'border-white bg-white text-obsidian' : 'border-white/25 bg-transparent text-white hover:border-white/50'
                      }`}
                      aria-pressed={isSel}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
              {p.stockNote ? (
                <p className="font-body mt-3 flex items-start gap-2 text-xs text-primary">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                  {p.stockNote}
                </p>
              ) : null}
            </div>

            <div className="mt-6">
              {cartNavPending ? (
                <p className="font-label mb-3 text-center text-[11px] font-medium uppercase tracking-wider text-primary" role="status" aria-live="polite">
                  Added to bag — opening cart…
                </p>
              ) : null}
              {selectedSize ? (
                <button
                  type="button"
                  className="font-label flex min-h-12 w-full items-center justify-center rounded-lg bg-primary px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-md transition-all hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  onClick={() => {
                    if (!p || !selectedSize) return;
                    setCartNavPending(true);
                    addItem(p.slug, selectedSize as ProductSizeKey, 1);
                    window.setTimeout(() => {
                      onClose();
                      navigate('/cart');
                    }, 420);
                  }}
                >
                  Add to cart
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  className="font-label min-h-12 w-full cursor-not-allowed rounded-lg border border-stone bg-stone/20 px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.2em] text-stone"
                  aria-disabled="true"
                >
                  Select a size
                </button>
              )}
            </div>

            <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 border-t border-white/10 pt-5 text-[10px] uppercase tracking-wider text-stone">
              <span className="inline-flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-desert-sand" aria-hidden>
                  local_shipping
                </span>
                Free shipping on prepaid
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-desert-sand" aria-hidden>
                  payments
                </span>
                COD available
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-desert-sand" aria-hidden>
                  history
                </span>
                14-day exchange
              </span>
            </div>
          </div>
        </div>
      ) : null}
    </dialog>
  );
}
