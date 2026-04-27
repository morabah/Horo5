'use client';

type PdpStoryCardProps = {
  /** Resolved story text: storyDescription → description → story, already deduplicated. */
  storyText: string;
  /** Category/tag labels from Medusa or occasion slugs. */
  tagLabels: string[];
};

export function PdpStoryCard({ storyText, tagLabels }: PdpStoryCardProps) {
  if (!storyText && tagLabels.length === 0) return null;

  return (
    <section className="rounded-2xl border border-stone/30 bg-white/60 p-6 md:p-8 shadow-sm">
      <div className="mx-auto w-full">
          <span className="font-label text-[10px] font-medium uppercase tracking-[0.25em] text-clay">
            The Story
          </span>
          {storyText ? (
            <p className="mt-4 font-body text-[15px] leading-[1.75] text-warm-charcoal md:text-base md:leading-[1.8]">
              {storyText}
            </p>
          ) : null}
          {tagLabels.length > 0 ? (
            <div className="mt-6 flex flex-wrap gap-2">
              {tagLabels.map((label) => (
                <span
                  key={label}
                  className="font-label rounded-full border border-stone/35 bg-white/70 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-warm-charcoal"
                >
                  {label}
                </span>
              ))}
            </div>
          ) : null}
        </div>
    </section>
  );
}
