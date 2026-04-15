import { BRAND_COPY } from '../data/brand';

export function HomeMarqueeBand() {
  const phrase = BRAND_COPY.mantra;
  const repeated = Array.from({ length: 4 }).fill(phrase).join('  ·  ');

  return (
    <section
      aria-hidden="true"
      className="relative overflow-hidden border-y border-obsidian/10 bg-obsidian py-8 md:py-10"
    >
      <div
        className="font-headline whitespace-nowrap text-center text-[clamp(3rem,10vw,7rem)] font-semibold leading-none tracking-tight text-papyrus/95 select-none"
      >
        {repeated}
      </div>
    </section>
  );
}
