import { useState } from 'react';
import { Link } from 'react-router-dom';
import { vibes } from '../data/site';
import { getVibeCollectionVisual, imgUrl } from '../data/images';

export function HomeStickyVibeShowcase() {
  const [hoveredVibe, setHoveredVibe] = useState<string>(vibes[0].slug);

  return (
    <section className="bg-obsidian w-full relative overflow-hidden py-12 md:py-24">
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
        <div className="mb-8 md:mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6" data-reveal>
          <div className="max-w-2xl">
            <h2 className="font-headline text-[38px] md:text-[56px] lg:text-[72px] font-semibold leading-[0.9] tracking-[-0.05em] text-white">
              Find your <span className="text-primary italic block md:inline">vibe.</span>
            </h2>
            <p className="font-body mt-5 text-[17px] md:text-[19px] text-stone max-w-xl leading-relaxed">
              Five lines. Five moods. Pick the one that feels closest to you, then drop straight into the edit.
            </p>
          </div>
        </div>

        {/* Immersive Accordion Gallery */}
        <div className="flex flex-col md:flex-row h-[70vh] min-h-[500px] max-h-[750px] gap-2 md:gap-4 transition-all duration-700" data-reveal="stagger-1">
          {vibes.map((v) => {
            const isHovered = hoveredVibe === v.slug;
            const visual = getVibeCollectionVisual(v.slug).hero;
            return (
              <div
                key={v.slug}
                onMouseEnter={() => setHoveredVibe(v.slug)}
                onClick={() => setHoveredVibe(v.slug)}
                className={`vibe-accent-glow group relative overflow-hidden rounded-[2rem] transition-all duration-700 ease-[cubic-bezier(0.33,1,0.68,1)] cursor-pointer flex-1
                  ${isHovered ? 'md:flex-[3] flex-[3]' : 'md:flex-1 flex-[0.5]'}`}
                style={isHovered ? { boxShadow: `0 0 60px ${v.accent}35, 0 0 120px ${v.accent}15, inset 0 0 30px ${v.accent}10` } : undefined}
              >
                {/* Individual Column Image */}
                <img
                  src={imgUrl(visual.src, 800)}
                  alt={visual.alt}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-[2000ms] group-hover:scale-110"
                />
                
                {/* Authorized Glassmorphism Overlays */}
                <div className={`absolute inset-0 transition-opacity duration-700 ${isHovered ? 'bg-gradient-to-t from-obsidian/80 via-obsidian/20 to-transparent' : 'bg-obsidian/60 md:bg-obsidian/40 group-hover:bg-obsidian/30'}`} />
                
                {/* Content */}
                <div className="absolute inset-0 flex flex-col justify-end p-5 md:p-8">
                  <div className={`transition-all duration-700 transform ${isHovered ? 'translate-y-0 opacity-100 delay-100' : 'translate-y-6 opacity-0 md:opacity-0 md:group-hover:opacity-40'}`}>
                    <h3 className="font-headline text-3xl md:text-5xl font-semibold mb-3 md:mb-4 tracking-tight drop-shadow-md" style={{ color: isHovered ? v.accent : '#fff' }}>
                      {v.name}
                    </h3>
                    {isHovered && (
                      <p className="font-body text-[15px] md:text-[17px] text-white/95 line-clamp-2 max-w-sm mb-6 drop-shadow-sm hidden md:block animate-fade-in">
                        {v.tagline}
                      </p>
                    )}
                    
                    <Link
                      to={`/vibes#vibe-${v.slug}`}
                      className={`font-label inline-flex min-h-12 items-center justify-center rounded-sm bg-obsidian/40 backdrop-blur-md border border-white/20 px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-xl transition-all hover:bg-white hover:text-obsidian hover:scale-105 active:scale-95 ${isHovered ? 'flex' : 'hidden'}`}
                    >
                      Explore
                    </Link>
                  </div>
                  
                  {/* Vertical text + index for collapsed state on desktop */}
                  {!isHovered && (
                    <div className="hidden md:flex absolute inset-0 items-center justify-center pointer-events-none flex-col gap-4">
                      <span className="font-label text-[11px] font-bold tracking-[0.25em] text-white/30 uppercase">
                        {String(vibes.indexOf(v) + 1).padStart(2, '0')}
                      </span>
                      <h3 className="font-headline text-2xl font-semibold text-white/80 tracking-widest uppercase -rotate-90 whitespace-nowrap transition-all duration-500 group-hover:text-white">
                        {v.name}
                      </h3>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
