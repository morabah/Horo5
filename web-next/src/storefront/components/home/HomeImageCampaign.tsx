'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

import { resolveProductImageSrcForDisplay, useNextImageOptimizerForSrc } from '../../data/images';
import type { HomepagePresentation } from '../../lib/parseHomepagePresentation';

const CAMPAIGN_BLUR_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAFklEQVR4nGMQERP6TwxmGFUoQtfgAQAHCnsNFNbySQAAAABJRU5ErkJggg==';

export type HomeImageCampaignCta = {
  label: string;
  href: string;
};

export type HomeImageCampaignProps = {
  id: string;
  eyebrow?: string;
  title: string;
  body?: string;
  imageSrc: string;
  imageAlt: string;
  primaryCta?: HomeImageCampaignCta;
  secondaryCta?: HomeImageCampaignCta;
  presentation?: HomepagePresentation;
  priority?: boolean;
  minHeight?: string;
  sectionClassName?: string;
  titleAs?: 'h1' | 'h2';
  titleId?: string;
  onPrimaryClick?: () => void;
  onSecondaryClick?: () => void;
  /** Parent should switch to copy-only fallback when the image fails to load. */
  onImageError?: () => void;
};

function placementClass(placement: HomepagePresentation['textPlacement']): string {
  switch (placement) {
    case 'bottom-center':
      return 'home-image-campaign__content--bottom-center';
    case 'center':
      return 'home-image-campaign__content--center';
    case 'below':
      return 'home-image-campaign__content--below';
    default:
      return 'home-image-campaign__content--bottom-left';
  }
}

function maxWidthClass(width: HomepagePresentation['maxTextWidth']): string {
  switch (width) {
    case 'sm':
      return 'max-w-sm';
    case 'lg':
      return 'max-w-2xl';
    default:
      return 'max-w-xl';
  }
}

export function HomeImageCampaign({
  id,
  eyebrow,
  title,
  body,
  imageSrc,
  imageAlt,
  primaryCta,
  secondaryCta,
  presentation,
  priority = false,
  minHeight = 'min-h-[min(52vh,36rem)]',
  sectionClassName = '',
  titleAs = 'h2',
  titleId,
  onPrimaryClick,
  onSecondaryClick,
  onImageError,
}: HomeImageCampaignProps) {
  const TitleTag = titleAs;
  const [imageFailed, setImageFailed] = useState(false);
  const showEyebrow = presentation?.showEyebrow !== false && Boolean(eyebrow?.trim());
  const showBody = presentation?.showBody !== false && Boolean(body?.trim());
  const placement = presentation?.textPlacement ?? 'bottom-left';
  const mobileBelow = presentation?.mobileTextMode === 'below';
  const opacity = presentation?.overlayOpacity ?? 0.45;
  const resolvedSrc = resolveProductImageSrcForDisplay(imageSrc);
  const useOptimizer = useNextImageOptimizerForSrc(resolvedSrc);

  const handleImageError = () => {
    if (imageFailed) return;
    setImageFailed(true);
    onImageError?.();
  };

  if (!resolvedSrc || imageFailed) {
    return null;
  }

  const overlayStyle = {
    background: `linear-gradient(to top, rgba(36,31,33,${Math.min(0.88, opacity + 0.35)}) 0%, rgba(36,31,33,${opacity * 0.5}) 45%, transparent 100%)`,
  };

  const copyBlock = (
    <>
      {showEyebrow ? <p className="home-image-campaign__eyebrow">{eyebrow}</p> : null}
      <TitleTag id={titleId} className="home-image-campaign__title">
        {title}
      </TitleTag>
      {showBody && body ? <p className="home-image-campaign__body">{body}</p> : null}
      {primaryCta || secondaryCta ? (
        <div className="home-image-campaign__actions">
          {primaryCta ? (
            <Link
              href={primaryCta.href}
              onClick={onPrimaryClick}
              className="home-btn home-btn--primary font-body inline-flex min-h-11 items-center justify-center rounded-[4px] bg-horo-pulse px-5 py-2 text-[12px] font-bold text-white hover:bg-horo-root focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-horo-pulse md:focus-visible:outline-white"
            >
              {primaryCta.label}
            </Link>
          ) : null}
          {secondaryCta ? (
            <Link
              href={secondaryCta.href}
              onClick={onSecondaryClick}
              className="home-btn home-btn--secondary font-body inline-flex min-h-11 items-center justify-center rounded-[4px] border border-horo-pulse bg-transparent px-5 py-2 text-[12px] font-bold text-horo-root hover:bg-horo-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-horo-pulse md:border-white/80 md:text-white md:hover:bg-white/12 md:focus-visible:outline-white"
            >
              {secondaryCta.label}
            </Link>
          ) : null}
        </div>
      ) : null}
    </>
  );

  return (
    <div
      id={id}
      className={`home-image-campaign ${mobileBelow ? 'home-image-campaign--mobile-below' : ''} ${sectionClassName}`}
      data-text-placement={placement}
    >
      <div className={`home-image-campaign__frame relative isolate overflow-hidden rounded-[4px] ${minHeight}`}>
        <div className={`home-image-campaign__media absolute inset-0 ${minHeight}`}>
          {useOptimizer ? (
            <Image
              src={resolvedSrc}
              alt={imageAlt}
              fill
              priority={priority}
              placeholder="blur"
              blurDataURL={CAMPAIGN_BLUR_DATA_URL}
              sizes="(max-width: 1280px) 100vw, 1280px"
              className="object-cover"
              onError={handleImageError}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resolvedSrc}
              alt={imageAlt}
              className="absolute inset-0 h-full w-full object-cover"
              loading={priority ? 'eager' : 'lazy'}
              decoding="async"
              onError={handleImageError}
            />
          )}
          <div
            className="home-image-campaign__overlay pointer-events-none absolute inset-0"
            style={overlayStyle}
            aria-hidden
          />
        </div>
        <div
          className={`home-image-campaign__content home-image-campaign__content--overlay relative z-10 flex min-h-[inherit] flex-col p-5 sm:p-6 md:p-8 ${placementClass(placement)} ${maxWidthClass(presentation?.maxTextWidth)}`}
        >
          {copyBlock}
        </div>
      </div>
      {mobileBelow ? (
        <div className="home-image-campaign__below-panel">{copyBlock}</div>
      ) : null}
    </div>
  );
}
