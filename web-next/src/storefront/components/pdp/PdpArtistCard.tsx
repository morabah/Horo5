'use client';
import { useDictionary } from '../../i18n/ui-locale';

import { TeeImage } from '../TeeImage';
import type { Artist } from '../../data/catalog-types';
import { PDP_SCHEMA } from '../../data/domain-config';


type PdpArtistCardProps = {
  /** Resolved artist display info (from product.artistDisplay or catalog). */
  artistDisplay: { name: string; avatarSrc?: string } | null;
  /** Full catalog artist record (for style, location, bio). */
  catalogArtist?: Artist | null;
  isArabic?: boolean;
};

export function PdpArtistCard({ artistDisplay, catalogArtist, isArabic = false }: PdpArtistCardProps) {
  const { pdp: copy } = useDictionary();
  if (!artistDisplay) return null;

  const style = catalogArtist?.style;
  const location = catalogArtist?.slug ? 'Egypt' : undefined;

  return (
    <div className="rounded-2xl border border-stone/30 bg-white/60 p-6 md:p-8">
      <span className="font-label text-[10px] font-medium uppercase tracking-[0.25em] text-clay">
        The Artist
      </span>

      <div className="mt-4 flex items-center gap-4">
        {artistDisplay.avatarSrc ? (
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-surface-container-high ring-1 ring-stone/45">
            <TeeImage
              src={artistDisplay.avatarSrc}
              alt={artistDisplay.name}
              w={160}
              eager
              className="h-full w-full"
              sizes="56px"
            />
          </div>
        ) : (
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-obsidian/8 text-obsidian/70 ring-1 ring-stone/30"
            aria-hidden
          >
            <span className="font-headline text-lg font-semibold">
              {artistDisplay.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
            </span>
          </div>
        )}
        <div className="min-w-0">
          <h3 className="font-headline text-base font-semibold tracking-tight text-obsidian">
            {artistDisplay.name}
          </h3>
          <span className="mt-0.5 inline-flex items-center gap-1 font-label text-[9px] font-medium uppercase tracking-[0.14em] text-deep-teal">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
            </svg>
            {isArabic ? copy.verifiedArtistLabel : copy.verifiedArtistLabel}
          </span>
        </div>
      </div>

      {style || location ? (
        <div className="mt-4 space-y-1">
          {style ? (
            <p className="font-body text-sm text-warm-charcoal">
              <span className="font-medium text-obsidian">Style:</span> {style}
            </p>
          ) : null}
          {location ? (
            <p className="font-body text-sm text-warm-charcoal">
              <span className="font-medium text-obsidian">Based in</span> {location}
            </p>
          ) : null}
        </div>
      ) : null}

      <p className="mt-4 font-body text-sm leading-relaxed text-warm-charcoal">
        {isArabic ? copy.illustratedByLabel : copy.illustratedByLabel}{' '}
        <span className="font-medium text-obsidian">{artistDisplay.name}</span>
      </p>
    </div>
  );
}
