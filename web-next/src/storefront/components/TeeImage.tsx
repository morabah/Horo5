import type { CSSProperties } from 'react';
import { imgUrl } from '../data/images';

type Props = {
  /** Unsplash base URL (no query) */
  src: string;
  alt: string;
  /** Requested width for Unsplash CDN */
  w?: number;
  /** Above-the-fold / gallery swap — load immediately (no lazy) */
  eager?: boolean;
  className?: string;
  style?: CSSProperties;
};

/**
 * Model / product photo — object-fit cover; lazy by default, eager when above the fold.
 */
export function TeeImage({ src, alt, w = 800, eager = false, className, style }: Props) {
  return (
    <img
      src={imgUrl(src, w)}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding={eager ? 'auto' : 'async'}
      className={className}
      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', ...style }}
    />
  );
}

type FrameProps = Props & {
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
      <TeeImage src={src} alt={alt} w={w} eager={eager} style={{ height: '100%' }} />
    </div>
  );
}
