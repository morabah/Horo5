'use client';

import { TeeImage } from '../TeeImage';
import type { Artist } from '../../data/catalog-types';
import { PDP_SCHEMA } from '../../data/domain-config';

const { copy } = PDP_SCHEMA;

type PdpArtistCardProps = {
  /** Resolved artist display info (from product.artistDisplay or catalog). */
  artistDisplay: { name: string; avatarSrc?: string } | null;
  /** Full catalog artist record (for style, location, bio). */
  catalogArtist?: Artist | null;
  isArabic?: boolean;
};

export function PdpArtistCard({ artistDisplay, catalogArtist, isArabic = false }: PdpArtistCardProps) {
  if (!artistDisplay) return null;

  const style = catalogArtist?.style;
  const location = catalogArtist?.slug ? 'Egypt' : undefined;

  return (
    <div className="min-h-[268px] rounded-[8px] border border-[#ded7ce] bg-white/88 p-[24px_27px] shadow-[0_1px_2px_rgba(32,25,18,.04),0_12px_26px_rgba(32,25,18,.04)]">
      <h2 className="mb-[18px] font-headline text-[31px] font-normal leading-1 tracking-[-1.1px] text-obsidian">
        {isArabic ? copy.illustratedByLabelAr : copy.illustratedByLabel}
      </h2>

      <div className="grid grid-cols-1 gap-[26px] md:grid-cols-[128px_1fr] md:items-start">
        {artistDisplay.avatarSrc ? (
          <div className="h-[122px] w-[122px] shrink-0 overflow-hidden rounded-full bg-surface-container-high ring-1 ring-stone/30">
            <TeeImage
              src={artistDisplay.avatarSrc}
              alt={artistDisplay.name}
              w={320}
              className="h-full w-full object-cover"
              sizes="122px"
            />
          </div>
        ) : (
          <div
            className="flex h-[122px] w-[122px] shrink-0 items-center justify-center rounded-full bg-obsidian/5 text-obsidian/50 ring-1 ring-stone/25"
            aria-hidden
          >
            <span className="font-headline text-2xl font-semibold">
              {artistDisplay.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
            </span>
          </div>
        )}
        <div className="min-w-0">
          <h3 className="my-[8px_0_1px] text-[14px] font-semibold text-obsidian">
            {artistDisplay.name}
          </h3>
          {location ? (
            <p className="mb-[14px] text-[14px] text-[#625c55]">{location}</p>
          ) : null}
          <span className="mt-1 inline-flex items-center gap-1 text-[9px] font-medium uppercase tracking-[0.14em] text-deep-teal">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
            </svg>
            {isArabic ? copy.verifiedArtistLabelAr : copy.verifiedArtistLabel}
          </span>
          {style ? (
            <p className="mb-[18px] mt-3 max-w-[250px] text-[14px] leading-relaxed text-[#4a4540]">
              {style}
            </p>
          ) : null}
          {catalogArtist?.slug ? (
            <a
              href={`/artists/${catalogArtist.slug}`}
              className="inline-flex min-h-[44px] min-w-[156px] items-center justify-center rounded-[4px] border border-[#d5cdc4] bg-white px-5 text-[13px] text-[#333] transition-colors hover:border-obsidian"
            >
              View Artist Profile
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
