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
    <section className="mx-auto mt-[25px] max-w-[1080px] px-4 md:px-0">
      <div className="overflow-hidden rounded-[8px] border border-[#ded7ce] bg-white/88 shadow-[0_1px_2px_rgba(32,25,18,.04),0_12px_26px_rgba(32,25,18,.04)] md:grid md:grid-cols-[335px_1fr]">
        {/* Story image column */}
        {storyImageSrc ? (
          <div className="p-[11px_0_11px_11px]">
            <img
              src={storyImageSrc}
              alt={storyImageAlt ?? 'Artwork detail'}
              className="h-auto w-full rounded-[17px] object-cover md:h-[186px] md:w-[295px]"
              loading="lazy"
            />
          </div>
        ) : null}

        {/* Story copy column */}
        <div className="p-[30px_30px_24px_0] md:pl-0">
          <h2 className="mb-[8px] font-headline text-[43px] font-normal leading-1 tracking-[-1.1px] text-obsidian">
            The Story
          </h2>
          {storyText ? (
            <p className="mb-[25px] max-w-[600px] text-[15.5px] leading-[1.45] text-[#3d3833]">
              {storyText}
            </p>
          ) : null}
          {tagLabels.length > 0 ? (
            <div className="flex flex-wrap gap-[22px]">
              {tagLabels.map((label) => (
                <span
                  key={label}
                  className="inline-flex min-h-[43px] items-center rounded-[5px] border border-[#ded7ce] bg-[#f5f2ee] px-4 py-0 text-[14px] text-[#514c46]"
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
