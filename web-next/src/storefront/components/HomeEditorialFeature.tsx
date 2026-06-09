'use client';

import Link from 'next/link';
import { useMemo } from 'react';

import { trackCloserLookClick, trackEditorialFeatureCtaClick } from '../analytics/events';
import {
  pickLocalizedStorefrontText,
  type StorefrontHomepageSection,
} from '../data/catalog-types';
import {
  HOME_EDITORIAL_REFERENCE_IMAGES,
  isBackLikeProductImageSrc,
  isGenericBrandPlaceholderSrc,
  isUnavailableHomepageReferenceImageSrc,
  pickHomeCardImageSrc,
  shouldUseConversionReferenceImage,
} from '../data/images';
import { getProduct } from '../data/site';
import { useDictionary, useUiLocale } from '../i18n/ui-locale';
import { isImageOverlayPresentation, parseHomepagePresentation } from '../lib/parseHomepagePresentation';
import { resolveHomeProducts } from '../lib/resolveHomeProducts';
import { normalizeLegacyStorefrontLabel } from '../utils/legacyStorefrontCopy';
import { HomeFoundingProductCard } from './home/HomeFoundingProductCard';
import { HomeImageCampaign } from './home/HomeImageCampaign';

const LOW_CONTRAST_EDITORIAL_IMAGES = new Set([
  '/images/homepage-reference/editorial-artwork-detail.png',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function payloadAnchor(section: StorefrontHomepageSection | undefined): string {
  const payload = isRecord(section?.payload) ? section.payload : null;
  const anchor = typeof payload?.anchorId === 'string' ? payload.anchorId.trim() : '';
  return anchor || 'editorial-feature';
}

function payloadFallbackHandle(section: StorefrontHomepageSection | undefined): string | undefined {
  const payload = isRecord(section?.payload) ? section.payload : null;
  const handle =
    (typeof payload?.fallbackProductHandle === 'string' && payload.fallbackProductHandle.trim()) ||
    (typeof payload?.fallback_product_handle === 'string' && payload.fallback_product_handle.trim()) ||
    '';
  return handle || undefined;
}

function resolveEditorialImageSrc(section: StorefrontHomepageSection | undefined): string | undefined {
  const cmsImageSrc = section?.image?.src?.trim();
  if (
    cmsImageSrc &&
    !isBackLikeProductImageSrc(cmsImageSrc) &&
    !isUnavailableHomepageReferenceImageSrc(cmsImageSrc) &&
    !LOW_CONTRAST_EDITORIAL_IMAGES.has(cmsImageSrc)
  ) {
    return cmsImageSrc;
  }

  for (const referenceSrc of HOME_EDITORIAL_REFERENCE_IMAGES) {
    if (!isUnavailableHomepageReferenceImageSrc(referenceSrc)) {
      return referenceSrc;
    }
  }

  const fallbackHandle = payloadFallbackHandle(section);
  const fallbackProduct = fallbackHandle ? getProduct(fallbackHandle) : undefined;
  if (!fallbackProduct) return undefined;
  const fromProduct = pickHomeCardImageSrc(fallbackProduct);
  if (
    fromProduct &&
    !isBackLikeProductImageSrc(fromProduct) &&
    !isGenericBrandPlaceholderSrc(fromProduct) &&
    !shouldUseConversionReferenceImage(fromProduct)
  ) {
    return fromProduct;
  }
  return undefined;
}

function EditorialCopyFallback({
  sectionId,
  eyebrow,
  title,
  body,
  ctaLabel,
  ctaHref,
  variant,
  productRefLabel,
}: {
  sectionId: string;
  eyebrow: string;
  title?: string;
  body?: string;
  ctaLabel: string;
  ctaHref: string;
  variant: string;
  productRefLabel?: string;
}) {
  return (
    <div className="home-editorial-feature__copy-only mx-auto max-w-2xl text-center">
      {productRefLabel ? (
        <p className="home-editorial-feature__product-ref">{productRefLabel}</p>
      ) : null}
      <p className="home-section-eyebrow">{eyebrow}</p>
      {title ? (
        <h2 id={`${sectionId}-title`} className="home-section-title mt-2">
          {title}
        </h2>
      ) : null}
      {body ? (
        <p className="font-body mt-4 text-[15px] leading-relaxed text-warm-charcoal md:text-base">
          {body}
        </p>
      ) : null}
      <Link
        href={ctaHref}
        onClick={() => {
          if (variant === 'closer_look') {
            trackCloserLookClick('editorial_feature', ctaHref);
          }
          trackEditorialFeatureCtaClick(variant, ctaHref);
        }}
        className="home-btn home-btn--primary font-body mt-6 inline-flex min-h-11 items-center justify-center rounded-[4px] bg-horo-pulse px-5 py-2 text-[12px] font-bold text-white hover:bg-horo-root focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-horo-pulse"
      >
        {ctaLabel}
      </Link>
    </div>
  );
}

export function HomeEditorialFeature({ section }: { section?: StorefrontHomepageSection }) {
  const { locale } = useUiLocale();
  const copy = useDictionary();
  const resolvedLocale = locale as 'en' | 'ar';
  const payload = isRecord(section?.payload) ? section.payload : null;
  const presentation = parseHomepagePresentation(payload);
  const variant = typeof payload?.variant === 'string' ? payload.variant : 'closer_look';
  const fallbackHandle = payloadFallbackHandle(section) ?? 'calm-inside';

  const eyebrow =
    pickLocalizedStorefrontText(section?.eyebrow, resolvedLocale) ??
    (variant === 'closer_look' ? copy.home.editorialCloserLookEyebrow : copy.home.behindThePieceEyebrow);
  const title =
    pickLocalizedStorefrontText(section?.title, resolvedLocale) ??
    (variant === 'closer_look' ? copy.home.editorialCloserLookTitle : copy.home.behindThePieceTitle);
  const body =
    pickLocalizedStorefrontText(section?.body, resolvedLocale) ??
    (variant === 'closer_look' ? copy.home.editorialCloserLookBody : copy.home.behindThePieceBody);
  const imageSrc = resolveEditorialImageSrc(section);
  const imageAlt =
    pickLocalizedStorefrontText(section?.image?.alt, resolvedLocale) ??
    (title ? `HORO — ${title}` : 'HORO editorial feature');
  const ctaLabel =
    normalizeLegacyStorefrontLabel(
      pickLocalizedStorefrontText(section?.primaryCta?.label, resolvedLocale),
      resolvedLocale,
    ) ?? copy.home.viewPiece;
  const ctaHref = section?.primaryCta?.href?.trim() ?? `/products/${fallbackHandle}`;
  const featuredProduct = getProduct(fallbackHandle);
  const lookProducts = useMemo(
    () => (section ? resolveHomeProducts(undefined, section).slice(0, 3) : []),
    [section],
  );
  const isShopTheLook = variant === 'shop_the_look' || lookProducts.length >= 2;
  const shopLookHref =
    lookProducts[0]?.slug ? `/products/${lookProducts[0].slug}` : ctaHref;
  const shopLookCtaLabel =
    normalizeLegacyStorefrontLabel(copy.home.shopTheLookCta, resolvedLocale) ??
    copy.home.shopTheLookCta;
  const displayPrimaryCta = isShopTheLook
    ? { label: shopLookCtaLabel, href: shopLookHref }
    : { label: ctaLabel, href: ctaHref };
  const bridgeLine = copy.home.editorialBridge;
  const sectionId = payloadAnchor(section);
  const wantsOverlay = section ? isImageOverlayPresentation(payload) : true;
  const canShowImageCampaign = wantsOverlay && Boolean(title);
  const productRefLabel = featuredProduct?.name
    ? `${copy.home.editorialFeaturing} ${featuredProduct.name}`
    : undefined;

  if (!title && !body && !imageSrc) {
    return null;
  }

  return (
    <section
      id={sectionId}
      aria-labelledby={`${sectionId}-title`}
      className="home-section home-editorial-feature home-editorial-feature--full-bleed bg-horo-white px-4 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-6xl">
        {bridgeLine ? (
          <p className="home-editorial-bridge">
            {bridgeLine}
          </p>
        ) : null}
        {productRefLabel && canShowImageCampaign ? (
          <p className="home-editorial-feature__product-ref mb-3 text-center">{productRefLabel}</p>
        ) : null}
        {canShowImageCampaign ? (
          <HomeImageCampaign
            id={`${sectionId}-campaign`}
            titleId={`${sectionId}-title`}
            eyebrow={eyebrow}
            title={title ?? ''}
            body={body ?? undefined}
            imageSrc={imageSrc ?? ''}
            imageAlt={imageAlt}
            primaryCta={displayPrimaryCta}
            presentation={{
              ...presentation,
              layout: 'image_overlay',
              textPlacement: presentation.textPlacement ?? 'bottom-left',
              showEyebrow: presentation.showEyebrow !== false,
              showBody: presentation.showBody !== false,
            }}
            minHeight="min-h-[min(52vh,32rem)]"
            sectionClassName="home-editorial-feature__campaign"
            onPrimaryClick={() => {
              if (variant === 'closer_look') {
                trackCloserLookClick('editorial_feature', ctaHref);
              }
              trackEditorialFeatureCtaClick(variant, isShopTheLook ? shopLookHref : ctaHref);
            }}
          />
        ) : (
          <EditorialCopyFallback
            sectionId={sectionId}
            eyebrow={eyebrow}
            title={title}
            body={body}
            ctaLabel={ctaLabel}
            ctaHref={ctaHref}
            variant={variant}
            productRefLabel={productRefLabel}
          />
        )}
        {isShopTheLook && lookProducts.length >= 2 ? (
          <div className="home-editorial-feature__look-rail mt-8">
            <div className="mb-4 flex items-end justify-between gap-4">
              <h3 className="font-headline text-lg font-semibold tracking-tight text-horo-root md:text-xl">
                {copy.home.shopTheLookTitle}
              </h3>
              <Link
                href={shopLookHref}
                onClick={() => trackEditorialFeatureCtaClick('shop_the_look', shopLookHref)}
                className="font-body text-sm font-medium text-horo-pulse underline decoration-horo-pulse/35 underline-offset-4"
              >
                {shopLookCtaLabel}
              </Link>
            </div>
            <div className="home-founding-grid home-founding-grid--featured flex gap-4 overflow-x-auto pb-2">
              {lookProducts.map((product, index) => (
                <div key={product.slug} className="w-[min(72vw,16rem)] shrink-0">
                  <HomeFoundingProductCard product={product} eager={index === 0} />
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
