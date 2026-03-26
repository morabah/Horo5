import { getProductMedia, imgUrl } from '../data/images';
import { useScrollReveal } from '../hooks/useScrollReveal';

type Frame =
  | { type: 'text'; content: React.ReactNode; className?: string; style?: React.CSSProperties }
  | { type: 'image'; slug: string };

/**
 * The 7-frame sequence requested for the cinematic "short movie".
 * Alternates between massive typography and full-screen editorial product images.
 */
const SEQUENCE: Frame[] = [
  { 
    type: 'text', 
    content: 'Nothing in your', 
    className: 'text-[clamp(50px,10vw,140px)] font-black text-[#F5F0E8]' 
  },
  { type: 'image', slug: 'zodiac-lunar-pull' },
  { 
    type: 'text', 
    content: 'Closet', 
    className: 'text-[clamp(70px,18vw,260px)] font-black text-primary drop-shadow-[0_0_60px_rgba(232,89,60,0.4)]' 
  },
  { type: 'image', slug: 'zodiac-astral-body' },
  { 
    type: 'text', 
    content: "Says what you're", 
    className: 'text-[clamp(45px,9vw,120px)] font-black text-white/80' 
  },
  { type: 'image', slug: 'the-weight-of-light' },
  { 
    type: 'text', 
    content: 'Thinking.', 
    className: 'text-[clamp(60px,15vw,220px)] font-black text-transparent', 
    style: { WebkitTextStroke: 'clamp(1px, 0.4vw, 4px) rgba(255,255,255,0.9)' } 
  },
];

/**
 * Cinematic Scroll Sequence — "Short Movie"
 * Uses native CSS sticky positioning to create a wipe-up stacking effect.
 * Each frame sticks for 50vh, then the next frame scrolls up and covers it.
 */
export function HomeFeelingExplosion() {
  useScrollReveal();

  return (
    <section className="relative w-full bg-obsidian">
      {/* 
        We map through the 7 frames.
        Each frame lives inside a wrapper that is taller than 100vh (150vh here).
        This gives it 50vh of "sticky scroll" time before the next element reaches the top of the viewport.
      */}
      <div className="relative w-full">
        {SEQUENCE.map((frame, index) => (
          <div key={index} className="relative w-full" style={{ height: '150vh' }}>
            
            {/* The Sticky Frame */}
            <div 
              // We use shadow-up to cast a cinematic shadow onto the frame behind it as it wipes up
              className="sticky top-0 flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-obsidian shadow-[0_-30px_60px_rgba(10,10,10,0.8)]"
              style={{ zIndex: 10 + index }}
            >
              {/* Grain layer per frame for seamless blending */}
              <div className="hero-grain pointer-events-none absolute inset-0 z-10 opacity-[0.03]" aria-hidden />
              
              <div className="relative z-20 flex h-full w-full items-center justify-center px-4 text-center">
                {frame.type === 'text' ? (
                  <span 
                    className={`font-headline uppercase leading-[0.85] tracking-[-0.04em] ${frame.className || ''}`}
                    style={frame.style}
                  >
                    {frame.content}
                  </span>
                ) : (
                  <ImageFrame slug={frame.slug} index={index} />
                )}
              </div>
            </div>
            
          </div>
        ))}
      </div>

      {/* Bottom gradient transition buffer before the next section */}
      <div
        className="pointer-events-none relative z-50 h-32 w-full bg-gradient-to-b from-obsidian to-papyrus sm:h-48"
        aria-hidden
      />
    </section>
  );
}

/**
 * Full-screen edge-to-edge product image renderer for the cinematic sequence.
 */
function ImageFrame({ slug, index }: { slug: string; index: number }) {
  const media = getProductMedia(slug);
  return (
    <div className="absolute inset-0 h-full w-full">
      <img
        src={imgUrl(media.main, 1920)}
        alt={`Product ${slug}`}
        className="h-full w-full object-cover opacity-70"
        loading={index < 3 ? 'eager' : 'lazy'}
      />
      {/* Vignettes for dramatic blend into the dark UI */}
      <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-obsidian to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-obsidian via-obsidian/40 to-transparent" />
    </div>
  );
}

