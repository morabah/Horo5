import { imgUrl } from '../data/images';
import { formatEgp } from '../utils/formatPrice';

type StickyAddToCartProps = {
  visible: boolean;
  productName: string;
  thumbnail?: string;
  selectedSize: string | null;
  sizeReady: boolean;
  oosSelected: boolean;
  displayPrice: number;
  onAddToBag: () => void;
  addBtnCta: string;
  selectSizePrompt: string;
  notifyMeCta: string;
  selectSizeHint?: string;
};

export function StickyAddToCart({
  visible,
  productName,
  thumbnail,
  selectedSize,
  sizeReady,
  oosSelected,
  displayPrice,
  onAddToBag,
  addBtnCta,
  selectSizePrompt,
  notifyMeCta,
  selectSizeHint = 'Select a size',
}: StickyAddToCartProps) {
  const ctaLabel = oosSelected
    ? notifyMeCta
    : sizeReady
      ? `${addBtnCta} — ${formatEgp(displayPrice)}`
      : selectSizePrompt;

  return (
    <div
      className={`sticky-atc ${visible ? 'sticky-atc--visible' : ''}`}
      aria-hidden={!visible}
    >
      <div className="sticky-atc-inner">
        {/* Product info */}
        <div className="sticky-atc-product">
          {thumbnail ? (
            <img
              src={imgUrl(thumbnail, 96)}
              alt=""
              className="sticky-atc-thumb"
              width={48}
              height={48}
            />
          ) : null}
          <div className="sticky-atc-details">
            <p className="sticky-atc-name">{productName}</p>
            {selectedSize ? (
              <p className="sticky-atc-size">Size: {selectedSize}</p>
            ) : (
              <p className="sticky-atc-size sticky-atc-size--prompt">{selectSizeHint} ↑</p>
            )}
          </div>
        </div>

        {/* CTA */}
        <div className="sticky-atc-actions">
          <button
            type="button"
            className={`sticky-atc-btn ${sizeReady && !oosSelected ? 'sticky-atc-btn--ready' : 'sticky-atc-btn--prompt'}`}
            onClick={onAddToBag}
          >
            {ctaLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
