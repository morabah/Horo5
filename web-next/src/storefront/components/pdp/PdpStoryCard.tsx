'use client';

type PdpStoryCardProps = {
  /** Resolved story text: storyDescription → description → story, already deduplicated. */
  storyText: string;
  /** Category/tag labels from Medusa or occasion slugs. */
  tagLabels: string[];
  /** Optional story/illustration image src (e.g. artwork detail). */
  storyImageSrc?: string | null;
  /** Alt text for story image. */
  storyImageAlt?: string;
};

export function PdpStoryCard({ storyText, tagLabels, storyImageSrc, storyImageAlt }: PdpStoryCardProps) {
  if (!storyText && tagLabels.length === 0) return null;

  return (
    <section className="border-t border-stone/25 bg-papyrus">
      <div className="mx-auto max-w-[1320px] px-4 py-5 md:px-12">
        <div className="overflow-hidden rounded-lg border border-stone/25 bg-white/88 shadow-[0_1px_2px_rgba(32,25,18,.04),0_12px_26px_rgba(32,25,18,.04)] md:grid md:grid-cols-[335px_1fr]">
          {/* Story image column */}
          {storyImageSrc ? (
            <div className="p-3 md:p-3">
              <img
                src={storyImageSrc}
                alt={storyImageAlt ?? 'Artwork detail'}
                className="h-auto w-full rounded-2xl object-cover md:h-[186px] md:w-[295px]"
                loading="lazy"
              />
            </div>
          ) : null}

          {/* Story copy column */}
          <div className="p-6 md:py-7 md:pr-7 md:pl-0">
            <h2 className="font-headline text-[clamp(1.75rem,4vw,2.7rem)] font-normal leading-1 tracking-tight text-obsidian">
              The Story
            </h2>
            {storyText ? (
              <p className="mt-2 max-w-[600px] font-body text-[15.5px] leading-[1.45] text-warm-charcoal/80">
                {storyText}
              </p>
            ) : null}
            {tagLabels.length > 0 ? (
              <div className="mt-5 flex flex-wrap gap-3">
                {tagLabels.map((label) => (
                  <span
                    key={label}
                    className="inline-flex min-h-[43px] items-center rounded-md border border-stone/30 bg-papyrus px-4 py-1.5 font-body text-[14px] text-warm-charcoal"
                  >
                    {label}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
