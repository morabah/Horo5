import { STOREFRONT_IMAGE_SLOTS, imgUrl, type StorefrontImageSlot } from '../data/images';

type CommerceContinuityPanelProps = {
  eyebrow?: string;
  title: string;
  body: string;
  chips?: readonly string[];
  image?: StorefrontImageSlot;
  imageOverlayClassName?: string;
};

export function CommerceContinuityPanel({
  eyebrow,
  title,
  body,
  chips = [],
  image = STOREFRONT_IMAGE_SLOTS.gifts.proof,
  imageOverlayClassName,
}: CommerceContinuityPanelProps) {
  return (
    <section className="overflow-hidden rounded-[1.5rem] border border-stone/60 bg-white/76 shadow-[0_18px_48px_-26px_rgba(26,26,26,0.22)]">
      <div className="grid gap-0 md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div className="relative min-h-[15rem] md:min-h-full">
          <img
            src={imgUrl(image.src, 900)}
            alt={image.alt}
            width={900}
            height={900}
            className="absolute inset-0 h-full w-full object-cover"
            style={image.objectPosition ? { objectPosition: image.objectPosition } : undefined}
          />
          <div
            className={imageOverlayClassName ?? 'absolute inset-0 bg-[linear-gradient(180deg,rgba(18,18,18,0.18)_0%,rgba(18,18,18,0.54)_100%)]'}
            aria-hidden
          />
        </div>
        <div className="space-y-4 p-5 sm:p-6">
          {eyebrow ? (
            <p className="font-label text-[10px] font-semibold uppercase tracking-[0.24em] text-label">{eyebrow}</p>
          ) : null}
          <h2 className="font-headline text-[1.4rem] font-semibold tracking-tight text-obsidian sm:text-[1.7rem]">{title}</h2>
          <p className="font-body text-sm leading-relaxed text-warm-charcoal sm:text-[0.98rem]">{body}</p>
          {chips.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {chips.map((chip) => (
                <span
                  key={chip}
                  className="font-label inline-flex min-h-11 items-center rounded-full border border-stone bg-papyrus/84 px-4 py-2 text-[10px] font-medium uppercase tracking-[0.18em] text-obsidian"
                >
                  {chip}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
