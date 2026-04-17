import { useState, type CSSProperties } from 'react';
import Image from 'next/image';

import {
  imgUrl,
  resolveProductImageSrcForDisplay,
  useNextImageOptimizerForSrc,
} from '../data/images';

export type TeeImageProps = {
  /** Unsplash base URL (no query) or absolute product image URL */
  src: string;
  alt: string;
  /** Requested width for Unsplash CDN and default `sizes` hint */
  w?: number;
  /** Above-the-fold / gallery swap — load immediately (no lazy) */
  eager?: boolean;
  className?: string;
  style?: CSSProperties;
  /** Responsive `sizes` for `next/image` (grid vs PDP hero). */
  sizes?: string;
  /** Optional LQIP from catalog (`media.blurDataUrlMain`). */
  blurDataURL?: string | null;
  /** Optional framing override (e.g. torso-first crop in product cards). */
  objectPosition?: string;
};

/**
 * Model / product photo — object-fit cover; lazy by default, eager when above the fold.
 * Uses `next/image` for responsive srcset + optimization (see `next.config.ts` `images.remotePatterns`).
 */
export function TeeImage({
  src,
  alt,
  w = 800,
  eager = false,
  className,
  style,
  sizes,
  blurDataURL,
  objectPosition,
}: TeeImageProps) {
  const forDisplay = resolveProductImageSrcForDisplay(src);
  const resolvedSrc = imgUrl(forDisplay, w);
  const defaultSizes = sizes ?? `(max-width: 1024px) 100vw, min(${Math.min(w * 2, 1600)}px, 45vw)`;
  const useNextOptimizer = useNextImageOptimizerForSrc(forDisplay);
  const [errored, setErrored] = useState(false);
  const missingSrc = !forDisplay.trim();
  const showPlaceholder = missingSrc || errored;

  return (
    <div
      className={['relative h-full w-full min-h-0', className].filter(Boolean).join(' ')}
      style={{ ...style }}
    >
      {showPlaceholder ? (
        <div
          role="img"
          aria-label={alt}
          className="absolute inset-0 flex items-center justify-center bg-stone/40 text-obsidian/70"
        >
          <span className="font-headline text-sm font-semibold tracking-[0.24em] uppercase">
            HORO
          </span>
        </div>
      ) : useNextOptimizer ? (
        <Image
          src={resolvedSrc}
          alt={alt}
          fill
          sizes={defaultSizes}
          priority={eager}
          className="object-cover"
          style={objectPosition ? { objectPosition } : undefined}
          placeholder={blurDataURL ? 'blur' : 'empty'}
          blurDataURL={blurDataURL || undefined}
          onError={() => setErrored(true)}
        />
      ) : (
        <img
          src={resolvedSrc}
          alt={alt}
          className="absolute inset-0 h-full w-full object-cover"
          style={objectPosition ? { objectPosition } : undefined}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          onError={() => setErrored(true)}
        />
      )}
    </div>
  );
}

type FrameProps = TeeImageProps & {
  aspectRatio?: string;
  borderRadius?: string;
  frameStyle?: CSSProperties;
};

export function TeeImageFrame({
  aspectRatio = '1',
  borderRadius = '12px',
  src,
  alt,
  w,
  eager,
  frameStyle,
  sizes,
  blurDataURL,
  objectPosition,
}: FrameProps) {
  return (
    <div
      style={{
        aspectRatio,
        borderRadius,
        overflow: 'hidden',
        background: 'var(--stone)',
        ...frameStyle,
      }}
    >
      <TeeImage
        src={src}
        alt={alt}
        w={w}
        eager={eager}
        sizes={sizes ?? '(min-width: 1024px) 33vw, 100vw'}
        blurDataURL={blurDataURL}
        objectPosition={objectPosition}
        style={{ height: '100%' }}
      />
    </div>
  );
}
