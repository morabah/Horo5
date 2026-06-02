'use client';

import Image from 'next/image';
import { useState } from 'react';

import {
  resolveProductImageSrcForDisplay,
  useNextImageOptimizerForSrc,
} from '../../data/images';

export function EditorialFeatureMedia({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) {
  const [failed, setFailed] = useState(false);
  const resolved = resolveProductImageSrcForDisplay(src);
  const useOptimizer = useNextImageOptimizerForSrc(resolved);

  if (!resolved.trim() || failed) {
    return null;
  }

  return (
    <div className="home-editorial-feature__media-frame relative aspect-[4/5] w-full max-h-[520px] overflow-hidden rounded-[4px] bg-[#faf7f6]">
      {useOptimizer ? (
        <Image
          src={resolved}
          alt={alt}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover object-[center_22%]"
          onError={() => setFailed(true)}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- CMS / Medusa hosts may skip next/image optimizer
        <img
          src={resolved}
          alt={alt}
          className="absolute inset-0 h-full w-full object-cover object-[center_22%]"
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
