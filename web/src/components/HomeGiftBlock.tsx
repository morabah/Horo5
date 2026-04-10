import { Link } from 'react-router-dom';
import { giftWrapPreview, imgUrl } from '../data/images';
import { useUiLocale } from '../i18n/ui-locale';

export function HomeGiftBlock() {
  const { copy } = useUiLocale();

  return (
    <section
      aria-labelledby="home-gift-title"
      className="border-t border-stone/20 bg-linen px-4 py-16 sm:px-6 md:py-20 lg:px-8"
    >
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-14">
          <div data-reveal className="order-2 md:order-1">
            <div className="aspect-[4/3] w-full overflow-hidden rounded-md border border-stone/30 bg-papyrus/50 shadow-[0_12px_32px_rgba(26,26,26,0.06)]">
              <img
                src={imgUrl(giftWrapPreview, 1200)}
                alt="Preview of the HORO story card and gift wrap add-on."
                className="h-full w-full object-cover"
                width={1200}
                height={900}
                decoding="async"
              />
            </div>
          </div>
          <div data-reveal="stagger-1" className="order-1 flex flex-col justify-center md:order-2">
            <p className="font-label text-[10px] font-medium uppercase tracking-[0.26em] text-moon-gold">
              {copy.home.giftEyebrow}
            </p>
            <h2
              id="home-gift-title"
              className="font-headline mt-2 text-[clamp(1.5rem,3.5vw,2.25rem)] font-medium leading-tight tracking-tight text-obsidian"
            >
              {copy.home.giftTitle}
            </h2>
            <p className="mt-4 font-body text-sm leading-relaxed text-warm-charcoal md:text-[15px]">
              When the generic options do not feel right, give something chosen. Add the story card and gift wrap at checkout, remove the price from the receipt, and send it directly with your message.
            </p>
            <div className="mt-8">
              <Link
                to="/occasions"
                className="cta-clay font-body inline-flex min-h-11 items-center justify-center border border-obsidian/15 bg-white px-8 py-3 text-sm font-medium text-obsidian transition-colors hover:border-obsidian/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-river"
              >
                {copy.home.giftCta}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
