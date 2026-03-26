import { useState } from 'react';
import { Link } from 'react-router-dom';
import { vibes } from '../data/site';
import { getVibeCollectionVisual, imgUrl } from '../data/images';

export function HomeStickyVibeShowcase() {
  const [hoveredVibe, setHoveredVibe] = useState<string>(vibes[0].slug);

  return (
    <section
      aria-labelledby="home-vibes-title"
      className="relative w-full overflow-hidden bg-obsidian py-12 md:py-24"
    >
      {/* Background Layer that fades based on hovered vibe */}
      <div className="absolute inset-0 z-0">
        {vibes.map((v) => {
          const visual = getVibeCollectionVisual(v.slug).hero;
          return (
            <img
              key={`bg-${v.slug}`}
              src={imgUrl(visual.src, 1920)}
              alt={visual.alt}
              className={`absolute inset-0 h-full w-full object-cover transition-all duration-[1200ms] ease-[cubic-bezier(0.25,1,0.5,1)] ${
                hoveredVibe === v.slug ? 'opacity-40 scale-105 blur-sm' : 'opacity-0 scale-100 blur-none'
              }`}
            />
          );
        })}
        <div className="absolute inset-0 bg-linear-to-t from-obsidian via-obsidian/30 to-obsidian/70" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col justify-between gap-6 md:mb-12 md:flex-row md:items-end" data-reveal>
          <div className="max-w-2xl">
            <h2
              id="home-vibes-title"
              className="font-headline text-[38px] font-semibold leading-[0.9] tracking-[-0.05em] text-white md:text-[56px] lg:text-[72px]"
            >
              Find your <span className="text-primary italic block md:inline">vibe.</span>
            </h2>
            <p className="font-body mt-5 text-[17px] md:text-[19px] text-stone max-w-xl leading-relaxed">
              Five lines. Five moods. Pick the one that feels closest to you, then drop straight into the edit.
            </p>
          </div>
        </div>

        {/* Immersive Accordion Gallery */}
        <div
          className="flex flex-col gap-3 md:h-[70vh] md:min-h-[500px] md:max-h-[750px] md:flex-row md:gap-4 md:transition-all md:duration-700"
          data-reveal="stagger-1"
        >
          {vibes.map((v) => {
            const isHovered = hoveredVibe === v.slug;
            const visual = getVibeCollectionVisual(v.slug).hero;
            return (
              <Link
                key={v.slug}
                id={`vibe-${v.slug}`}
                onMouseEnter={() => setHoveredVibe(v.slug)}
                onFocus={() => setHoveredVibe(v.slug)}
                to={`/vibes/${v.slug}`}
                aria-label={`Explore the ${v.name} vibe`}
                className={`vibe-accent-glow group relative w-full min-h-[20rem] overflow-hidden rounded-[2rem] transition-all duration-700 ease-[cubic-bezier(0.33,1,0.68,1)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white md:min-h-0 md:flex-1 ${
                  isHovered ? 'md:flex-[2.8]' : 'md:flex-1'
                }`}
                style={isHovered ? { boxShadow: `0 0 60px ${v.accent}35, 0 0 120px ${v.accent}15, inset 0 0 30px ${v.accent}10` } : undefined}
              >
                {/* Individual Column Image */}
                <img
                  src={imgUrl(visual.src, 800)}
                  alt={visual.alt}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-[2000ms] group-hover:scale-110"
                />
                
                {/* Authorized Glassmorphism Overlays */}
                <div
                  className={`absolute inset-0 transition-opacity duration-700 ${
                    isHovered
                      ? 'bg-gradient-to-t from-obsidian/84 via-obsidian/28 to-transparent'
                      : 'bg-gradient-to-t from-obsidian/78 via-obsidian/34 to-obsidian/24 group-hover:from-obsidian/72'
                  }`}
                />
                
                {/* Content */}
                <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8">
                  <div className="flex flex-col items-start h-full">
                    {/* Spacer to push content to bottom */}
                    <div className="flex-1 w-full" />
                    
                    <h3
                      className={`font-headline text-2xl md:text-3xl lg:text-4xl font-light uppercase text-white/90 drop-shadow-sm transition-all duration-1000 ease-out [writing-mode:vertical-rl] rotate-180 mb-6 ${
                        isHovered ? 'tracking-[0.4em]' : 'tracking-[0.25em]'
                      }`}
                      style={isHovered ? { color: v.accent, textShadow: `0 0 24px ${v.accent}50`, transform: 'scale(1.02) rotate(180deg)' } : { transform: 'scale(1) rotate(180deg)' }}
                    >
                      {v.name}
                    </h3>

                    <div className={`transition-all duration-700 ease-[cubic-bezier(0.33,1,0.68,1)] overflow-hidden w-full ${
                      isHovered ? 'max-h-20 opacity-100 translate-y-0' : 'max-h-0 opacity-0 translate-y-8'
                    }`}>
                      <span
                        className="font-label inline-flex items-center justify-center rounded-full border border-white/20 bg-black/20 px-6 py-2.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-white backdrop-blur-md hover:bg-white hover:text-black hover:border-white transition-colors duration-300"
                      >
                        Explore
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
