'use client';
import { useDictionary } from '../../i18n/ui-locale';

import Link from 'next/link';
import { type FormEvent, type RefObject } from 'react';

import { trackWhatsAppClick } from '../../analytics/events';
import type { Product, ProductSizeKey, Feeling, StockStatusKey } from '../../data/catalog-types';
import { pdpCodTrustCopy, pdpExchangeTrustCopy } from '../../data/commerce-copy';
import { PDP_SCHEMA, type PdpSizeTableConfig } from '../../data/domain-config';
import { formatEgp } from '../../utils/formatPrice';
import { pickLocalizedText } from '../../lib/storefront/incentives-client';
import { StockStatusChip } from '../StockStatusChip';
import { PdpSizeSelector } from './PdpSizeSelector';


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

function IconWhatsApp() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.981.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

type PdpBuyBoxProps = {
  product: Product;
  feeling: Feeling | undefined;
  pdpArtist: { name: string; avatarSrc?: string } | null;
  isArabic: boolean;
  isRevealMode?: boolean;
  // Price
  displayPriceEgp: number;
  displayOriginalPriceEgp: number | null;
  promoCountdown: { days: number; hours: number; minutes: number; seconds: number; expired: boolean } | null;
  promoLabel: Product['promoLabel'] | null;
  promoShowCountdown: boolean;
  priceSizeLabel: string | null;
  // Description
  compactProductDescription: string;
  // Badges
  heroCategoryTagItems: { key: string; label: string }[];
  trustItems: readonly string[];
  // Color
  selectedColor: string | null;
  colorOptions: string[] | null;
  onColorSelect: (color: string) => void;
  // Size
  sizeButtons: { key: string; disabled?: boolean }[];
  selectedSize: string | null;
  selectedStockStatus?: StockStatusKey | null;
  oosSelected: boolean;
  sizeReady: boolean;
  sizeTableResolved: PdpSizeTableConfig;
  silhouetteCueLabel: string | null | undefined;
  inlineFitModelDisplay: string;
  inlineFitMeasurementsPart: string;
  inventoryHint: string | undefined;
  sizeSectionRef: RefObject<HTMLDivElement | null>;
  sizeGuideTriggerRef: RefObject<HTMLButtonElement | null>;
  onSizeSelect: (size: ProductSizeKey, isSelected: boolean) => void;
  onOpenSizeGuide: () => void;
  // CTA
  mainCtaRef: RefObject<HTMLDivElement | null>;
  addedFeedback: boolean;
  stockMessage?: string;
  onPrimaryAction: () => void;
  // Notify
  notifyFormRef: RefObject<HTMLDivElement | null>;
  notifyInputRef: RefObject<HTMLInputElement | null>;
  notifyFieldId: string;
  notifyEmail: string;
  notifyError: boolean;
  notifySuccess: boolean;
  onNotifyEmailChange: (email: string) => void;
  onNotifySubmit: (e: FormEvent) => void;
  // WhatsApp
  whatsappSupportUrl: string | null;
  // Size confidence
  preferredDefaultSize: string | null;
  // Wishlist
  wishlisted: boolean;
  onWishlistToggle: () => void;
};

export function PdpBuyBox({
  product,
  feeling,
  pdpArtist,
  isArabic,
  isRevealMode,
  displayPriceEgp,
  displayOriginalPriceEgp,
  promoCountdown,
  promoLabel,
  promoShowCountdown,
  priceSizeLabel,
  compactProductDescription,
  heroCategoryTagItems,
  trustItems,
  selectedColor,
  colorOptions,
  onColorSelect,
  sizeButtons,
  selectedSize,
  selectedStockStatus,
  oosSelected,
  sizeReady,
  sizeTableResolved,
  silhouetteCueLabel,
  inlineFitModelDisplay,
  inlineFitMeasurementsPart,
  inventoryHint,
  sizeSectionRef,
  sizeGuideTriggerRef,
  onSizeSelect,
  onOpenSizeGuide,
  mainCtaRef,
  addedFeedback,
  stockMessage,
  onPrimaryAction,
  notifyFormRef,
  notifyInputRef,
  notifyFieldId,
  notifyEmail,
  notifyError,
  notifySuccess,
  onNotifyEmailChange,
  onNotifySubmit,
  whatsappSupportUrl,
  preferredDefaultSize,
  wishlisted,
  onWishlistToggle,
}: PdpBuyBoxProps) {
  const { pdp: copy } = useDictionary();
  function primaryCtaLabel() {
    if (oosSelected) return copy.notifyMeCTA;
    if (sizeReady && product) return `${copy.addBtnCTA} — ${formatEgp(displayPriceEgp)}`;
    return copy.selectSizePrompt;
  }

  const ctaClass = `cta-clay flex min-h-14 w-full items-center justify-center gap-2 border px-4 py-4 text-[13px] font-semibold uppercase tracking-[0.2em] transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal ${
    oosSelected
      ? 'border-obsidian bg-obsidian text-white hover:bg-obsidian/90 opacity-90'
      : 'border-obsidian bg-obsidian text-white hover:bg-obsidian/90'
  }`;
  const localizedPromoLabel = pickLocalizedText(promoLabel, isArabic ? 'ar' : 'en');
  const savingsEgp = displayOriginalPriceEgp && displayOriginalPriceEgp > displayPriceEgp
    ? displayOriginalPriceEgp - displayPriceEgp
    : 0;
  const savingsPct = savingsEgp > 0 && displayOriginalPriceEgp
    ? Math.round((savingsEgp / displayOriginalPriceEgp) * 100)
    : 0;
  const lowStockCount = inventoryHint?.match(/only\s+(\d+)\s+left/i)?.[1] ?? null;
  const promoStockUrgency = selectedSize && savingsEgp > 0 && lowStockCount
    ? isArabic
      ? `باقي ${lowStockCount} فقط بهذا السعر`
      : `Only ${lowStockCount} left at this price`
    : null;

  return (
    <aside className="md:sticky md:top-24 md:self-start">
      <div className="space-y-6 md:p-4 lg:p-6">
        <header className="space-y-4">
          {/* Eyebrow row — feeling chip + low-emphasis meta tags (audit P7: chips out of conversion zone) */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            {feeling ? (
              <Link
                href={`/feelings/${feeling.slug}`}
                className="font-label inline-flex min-h-11 items-center rounded-full border border-dusk-violet/35 bg-dusk-violet/8 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-dusk-violet transition-colors hover:border-dusk-violet/60 hover:bg-dusk-violet/14"
              >
                {feeling.name}
              </Link>
            ) : null}
            <span className="font-label text-[10px] font-medium uppercase tracking-[0.18em] text-clay">
              {[
                product.fitLabel?.trim() || 'Unisex fit',
                ...heroCategoryTagItems.map(({ label }) => label),
                ...(product.capsuleSlugs?.includes('zodiac') ? [copy.pdpZodiacCapsuleLabel] : []),
              ]
                .filter(Boolean)
                .join(' · ')}
            </span>
          </div>

          {/* Product title */}
          <h1 className="font-headline text-[clamp(2rem,5vw,3.2rem)] font-semibold leading-[1.02] tracking-tight text-obsidian">
            {product.name}
          </h1>

          {/* Emotional line */}
          {product.feelsLike && product.feelsLike.length > 0 ? (
            <p className="font-body text-[15px] leading-snug text-obsidian">
              <span className="text-clay">{isArabic ? 'الإحساس' : 'Feels like'}:</span>{' '}
              {product.feelsLike.slice(0, 3).join(' · ')}
            </p>
          ) : null}

          {/* Design meaning — 1-line "what this design says" for gift / self-expression buyers */}
          {product.useCase?.trim() ? (
            <p className="font-body text-[15px] leading-snug text-warm-charcoal">
              {product.useCase.trim()}
            </p>
          ) : null}

          {/* Artist attribution */}
          {pdpArtist ? (
            <p className="font-body text-sm leading-snug text-warm-charcoal">
              <span className="text-clay">{isArabic ? copy.illustratedByLabel : copy.illustratedByLabel}</span>{' '}
              <span className="font-medium text-obsidian">{pdpArtist.name}</span>
            </p>
          ) : null}

          {/* Promo label */}
          {localizedPromoLabel?.trim() ? (
            <p className="font-label text-[11px] font-medium uppercase tracking-[0.16em] text-amber-700">
              {localizedPromoLabel.trim()}
            </p>
          ) : null}

          {/* Price */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-baseline gap-3">
              {displayOriginalPriceEgp ? (
                <p className="font-headline text-[1.05rem] font-medium text-clay line-through md:text-[1.15rem]">
                  {formatEgp(displayOriginalPriceEgp)}
                </p>
              ) : null}
              <p className={`font-headline text-[1.8rem] font-semibold leading-none md:text-[2rem] ${displayOriginalPriceEgp ? 'text-red-600' : 'text-obsidian'}`}>
                {formatEgp(displayPriceEgp)}
              </p>
              {promoShowCountdown && promoCountdown && !promoCountdown.expired ? (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 ring-1 ring-red-200">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-red-500" aria-hidden>
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span className="font-label text-[13px] font-semibold tabular-nums leading-none text-red-600">
                    {promoCountdown.days > 0
                      ? `${promoCountdown.days}d ${String(promoCountdown.hours).padStart(2, '0')}h ${String(promoCountdown.minutes).padStart(2, '0')}m`
                      : `${String(promoCountdown.hours).padStart(2, '0')}:${String(promoCountdown.minutes).padStart(2, '0')}:${String(promoCountdown.seconds).padStart(2, '0')}`}
                  </span>
                </span>
              ) : null}
            </div>
            {savingsEgp > 0 ? (
              <p className="font-label text-[11px] font-semibold uppercase tracking-[0.16em] text-deep-teal">
                {isArabic
                  ? `وفرت ${formatEgp(savingsEgp)}${savingsPct ? ` (${savingsPct}%)` : ''}`
                  : `You saved ${formatEgp(savingsEgp)}${savingsPct ? ` (${savingsPct}%)` : ''}`}
              </p>
            ) : null}
            {promoStockUrgency ? (
              <p className="font-label text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-700">
                {promoStockUrgency}
              </p>
            ) : null}
            {priceSizeLabel ? (
              <p className="font-label text-[11px] font-medium uppercase tracking-[0.18em] text-label">
                {priceSizeLabel}
              </p>
            ) : null}
            <StockStatusChip status={selectedStockStatus} />
          </div>

          {/* Short description */}
          {compactProductDescription ? (
            <p className="font-body text-[13px] leading-relaxed text-warm-charcoal/80 line-clamp-2">
              {compactProductDescription}
            </p>
          ) : null}
        </header>

        {/* Color selector */}
        {colorOptions && colorOptions.length > 0 ? (
          <div className="space-y-2">
            <p className="font-label text-[11px] font-medium uppercase tracking-[0.24em] text-label">Color</p>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Product color">
              {colorOptions.map((color) => {
                const isSelected = selectedColor === color;
                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => onColorSelect(color)}
                    aria-pressed={isSelected}
                    className={`font-label min-h-11 rounded-full border px-4 text-[11px] font-semibold uppercase tracking-[0.16em] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal ${
                      isSelected
                        ? 'border-obsidian bg-obsidian text-white'
                        : 'border-stone/60 bg-white/80 text-obsidian hover:border-obsidian'
                    }`}
                  >
                    {color}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* Size selector */}
        <PdpSizeSelector
          sizeButtons={sizeButtons}
          selectedSize={selectedSize}
          oosSelected={oosSelected}
          sizeReady={sizeReady}
          sizeTableResolved={sizeTableResolved}
          silhouetteCueLabel={silhouetteCueLabel}
          inlineFitModelDisplay={inlineFitModelDisplay}
          inlineFitMeasurementsPart={inlineFitMeasurementsPart}
          inventoryHint={inventoryHint}
          sizeSectionRef={sizeSectionRef}
          sizeGuideTriggerRef={sizeGuideTriggerRef}
          onSizeSelect={onSizeSelect}
          onOpenSizeGuide={onOpenSizeGuide}
        />

        {/* Size confidence + gift hint */}
        {preferredDefaultSize ? (
          <p className="font-body text-sm text-warm-charcoal">
            {copy.sizeConfidenceHint.replace('{size}', preferredDefaultSize)}
          </p>
        ) : null}
        <p className="font-body text-sm">
          <Link
            href="/gifts"
            className="text-deep-teal underline underline-offset-4 transition-colors hover:text-obsidian"
          >
            {copy.buyingAsGiftLink}
          </Link>
        </p>

        {/* Primary CTA */}
        <div ref={mainCtaRef} className="space-y-3">
          <div className="flex items-stretch gap-3">
            <button
              type="button"
              onClick={onPrimaryAction}
              className={`${ctaClass} flex-1${addedFeedback ? ' pdp-cta-added' : ''}`}
              aria-describedby={sizeReady || oosSelected ? undefined : 'pdp-size-hint'}
            >
              {addedFeedback ? (
                <>
                  <span className="pdp-cta-check" aria-hidden>✓</span>
                  <span>{copy.pdpPrimaryCtaAddedLabel}</span>
                </>
              ) : (
                <><IconCart /><span>{primaryCtaLabel()}</span></>
              )}
            </button>
            <button
              type="button"
              aria-label={wishlisted ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
              aria-pressed={wishlisted}
              onClick={onWishlistToggle}
              className="flex min-h-14 min-w-[3.25rem] items-center justify-center border border-obsidian/30 bg-white transition-colors hover:border-obsidian focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
            >
              <svg
                className="h-5 w-5 transition-colors"
                viewBox="0 0 24 24"
                fill={wishlisted ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth={1.75}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
                style={{ color: wishlisted ? '#c0392b' : 'var(--obsidian, #1a1a1a)' }}
              >
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
              </svg>
            </button>
          </div>
          {stockMessage ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 font-body text-sm text-obsidian" role="status" aria-live="polite">
              {stockMessage}
            </p>
          ) : null}

          {/* Task 1.3: Trust badges below Add to Bag */}
          <div className="mt-3 flex items-center justify-center gap-3 text-[11px] text-warm-charcoal">
            <span className="inline-flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span>{pdpCodTrustCopy(isArabic)}</span>
            </span>
            <span className="text-stone">·</span>
            <span className="inline-flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                <path d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
              <span>{pdpExchangeTrustCopy(isArabic)}</span>
            </span>
          </div>

          {/* WhatsApp size-help button — hidden in reveal mode */}
          {whatsappSupportUrl && !isRevealMode ? (
            <a
              href={whatsappSupportUrl}
              target="_blank"
              rel="noreferrer"
              onClick={() => trackWhatsAppClick('size_help', 'pdp_buy_box')}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-stone/60 bg-white/80 px-4 py-3 font-label text-[11px] font-semibold uppercase tracking-[0.16em] text-obsidian transition-colors hover:border-obsidian hover:bg-white"
            >
              <IconWhatsApp />
              {isArabic ? 'تحتاج مساعدة في المقاس؟ اسألنا على واتساب' : 'Need help with size? Ask us on WhatsApp'}
            </a>
          ) : null}

          {product.giftable ? (
            <p className="rounded-xl border border-stone/45 bg-white/70 px-4 py-3 font-body text-sm leading-relaxed text-warm-charcoal">
              {isArabic
                ? 'بتشتريها هدية؟ اسألنا عن المقاس قبل الطلب.'
                : 'Buying it as a gift? Ask us for size help before ordering.'}
            </p>
          ) : null}

          {/* Notify form — OOS or reveal mode */}
          {oosSelected || isRevealMode ? (
            <div ref={notifyFormRef} className="space-y-3">
              {notifySuccess ? (
                <p
                  className="rounded-xl border border-deep-teal/25 bg-frost-blue/40 px-4 py-3 font-body text-sm text-obsidian"
                  role="status"
                >
                  {isRevealMode
                    ? (isArabic ? 'تم الحفظ — سنراسلك عند طرح هذه القطعة.' : "Saved — we'll reach out when this piece goes live.")
                    : copy.notifySuccess}
                </p>
              ) : (
                <form onSubmit={onNotifySubmit} className="space-y-3">
                  <label
                    htmlFor={notifyFieldId}
                    className="font-label block text-[11px] font-medium uppercase tracking-[0.18em] text-label"
                  >
                    {isRevealMode
                      ? (isArabic ? 'احصل على إشعار عند الإطلاق' : 'Get notified when this drops')
                      : copy.notifyFieldLabel}
                  </label>
                  <input
                    ref={notifyInputRef}
                    id={notifyFieldId}
                    type="email"
                    name="notify-email"
                    autoComplete="email"
                    placeholder={isRevealMode ? (isArabic ? 'بريدك الإلكتروني' : 'Your email') : copy.notifyEmailPlaceholder}
                    value={notifyEmail}
                    onChange={(event) => onNotifyEmailChange(event.target.value)}
                    className="min-h-12 w-full rounded-xl border border-stone bg-white px-4 py-3 font-body text-sm text-obsidian shadow-sm placeholder:text-clay/80 focus:border-deep-teal focus:outline-none focus:ring-2 focus:ring-deep-teal/25"
                    aria-invalid={notifyError}
                    aria-describedby={notifyError ? `${notifyFieldId}-error` : undefined}
                  />
                  {notifyError ? (
                    <p id={`${notifyFieldId}-error`} className="font-body text-xs text-obsidian">
                      {copy.notifyInvalidEmail}
                    </p>
                  ) : null}
                  <button type="submit" className={ctaClass}>
                    <IconCart />
                    <span>{isRevealMode ? (isArabic ? 'أخبرني عند الإطلاق' : 'Notify me when live') : copy.notifyMeCTA}</span>
                  </button>
                </form>
              )}
            </div>
          ) : null}
        </div>

        {/* CTA trust line — only key items not already in trust strip */}
        <p className="font-body text-center text-[10px] tracking-wide text-warm-charcoal/70 md:text-left">
          {trustItems.length > 0
            ? trustItems.slice(0, 2).join(' · ')
            : PDP_SCHEMA.trustStripItems.slice(0, 2).join(' · ')}
        </p>
      </div>
    </aside>
  );
}
