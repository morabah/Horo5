import type { CSSProperties } from 'react';
import { imgUrl } from '../data/images';

type Props = {
  /** Unsplash base URL (no query) */
  src: string;
  alt: string;
  /** Requested width for Unsplash CDN */
  w?: number;
  className?: string;
  style?: CSSProperties;
};

/**
 * Model / product photo — object-fit cover, lazy-loaded.
 */
export function TeeImage({ src, alt, w = 800, className, style }: Props) {
  return (
    <img
      src={imgUrl(src, w)}
      alt={alt}
      loading="lazy"
      decoding="async"
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

export function TeeImageFrame({ aspectRatio = '1', borderRadius = '12px', src, alt, w, frameStyle }: FrameProps) {
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
      <TeeImage src={src} alt={alt} w={w} style={{ height: '100%' }} />
    </div>
  );
}
