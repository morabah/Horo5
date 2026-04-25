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
    <section className="border-t border-stone/25 bg-papyrus">
      <div className="mx-auto max-w-[1320px] px-4 py-14 md:px-12 md:py-16 lg:px-12">
        <div className="mx-auto max-w-[720px]">
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
      </div>
    </section>
  );
}
