import { HOME_COPY, HOME_STORY_QUOTES } from '../data/homeContent';

export function HomeStoryQuotes() {
  return (
    <section
      aria-labelledby="home-stories-title"
      className="border-t border-stone/20 bg-papyrus px-4 py-16 sm:px-6 md:py-20 lg:px-8"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 text-center md:mb-12" data-reveal>
          <p className="font-label text-[10px] font-medium uppercase tracking-[0.24em] text-label">
            {HOME_COPY.storiesEyebrow}
          </p>
          <h2
            id="home-stories-title"
            className="font-headline mt-2 text-xl font-medium tracking-tight text-obsidian md:text-2xl"
          >
            {HOME_COPY.storiesTitle}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl font-body text-sm leading-relaxed text-warm-charcoal md:text-[15px]">
            {HOME_COPY.storiesBody}
          </p>
        </div>

        {/* Mobile: horizontal snap carousel; Desktop: 3-col grid */}
        <div className="quote-carousel -mx-4 flex gap-4 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-3 md:gap-5 md:overflow-x-visible md:px-0">
          {HOME_STORY_QUOTES.map((item, i) => (
            <blockquote
              key={item.name}
              data-reveal={(['stagger-1', 'stagger-2', 'stagger-3'] as const)[i]}
              className="warm-glow-glass flex w-[min(84vw,340px)] flex-col rounded-xl border-stone/50 p-7 md:w-auto md:p-8"
            >
              <p className="font-headline text-[1.05rem] italic leading-relaxed text-obsidian md:text-[1.15rem]">&ldquo;{item.quote}&rdquo;</p>
              <footer className="mt-7 border-t border-stone/20 pt-4">
                <cite className="font-headline not-italic text-[1rem] font-semibold text-clay">{item.name}</cite>
                <p className="mt-0.5 font-label text-[10px] font-medium uppercase tracking-[0.2em] text-clay">
                  {item.city}
                </p>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
