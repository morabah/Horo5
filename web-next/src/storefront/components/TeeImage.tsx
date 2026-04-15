import type { CSSProperties } from 'react';
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
}: TeeImageProps) {
  const forDisplay = resolveProductImageSrcForDisplay(src);
  const resolvedSrc = imgUrl(forDisplay, w);
  const defaultSizes = sizes ?? `(max-width: 1024px) 100vw, min(${Math.min(w * 2, 1600)}px, 45vw)`;
  const useNextOptimizer = useNextImageOptimizerForSrc(forDisplay);

  return (
    <div
      className={['relative h-full w-full min-h-0', className].filter(Boolean).join(' ')}
      style={{ ...style }}
    >
      {useNextOptimizer ? (
        <Image
          src={resolvedSrc}
          alt={alt}
          fill
          sizes={defaultSizes}
          priority={eager}
          className="object-cover"
          placeholder={blurDataURL ? 'blur' : 'empty'}
          blurDataURL={blurDataURL || undefined}
        />
      ) : (
        <img
          src={resolvedSrc}
          alt={alt}
          className="absolute inset-0 h-full w-full object-cover"
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
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
        style={{ height: '100%' }}
      />
    </div>
  );
}
