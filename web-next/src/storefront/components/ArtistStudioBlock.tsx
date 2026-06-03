'use client';

import Image from 'next/image';
import { useUiLocale } from '../i18n/ui-locale';

export type ArtistStorySlide = {
  src: string;
  labelEn: string;
  labelAr: string;
  descriptionEn: string;
  descriptionAr: string;
};

export type ArtistStudioBlockProps = {
  slides?: ArtistStorySlide[];
  artistName?: string;
  /** Pass true when inside Reveal mode to show specific messaging or styling if needed */
  isRevealMode?: boolean;
};

const DEFAULT_SLIDES: ArtistStorySlide[] = [
  {
    src: '/images/studio-sketch.jpg',
    labelEn: 'Sketch',
    labelAr: 'الرسم الأولي',
    descriptionEn: 'The original concept, drawn by hand.',
    descriptionAr: 'الفكرة الأصلية مرسومة يدوياً.',
  },
  {
    src: '/images/studio-wip.jpg',
    labelEn: 'Work in Progress',
    labelAr: 'قيد العمل',
    descriptionEn: 'Digitizing and refining the strokes for screen printing.',
    descriptionAr: 'تحويل الرسمة رقمياً وتحسين الخطوط للطباعة.',
  },
  {
    src: '/images/studio-final.jpg',
    labelEn: 'Final Master',
    labelAr: 'النسخة النهائية',
    descriptionEn: 'The exact vector file used to expose the screens.',
    descriptionAr: 'ملف الفيكتور النهائي المستخدم للطباعة.',
  },
  {
    src: '/images/studio-print.jpg',
    labelEn: 'First Pull',
    labelAr: 'أول طباعة',
    descriptionEn: 'Testing the ink mixture on heavyweight cotton.',
    descriptionAr: 'اختبار خلطة الحبر على القطن الثقيل.',
  },
];

export function ArtistStudioBlock({ slides, artistName }: ArtistStudioBlockProps) {
  const { locale } = useUiLocale();
  const isArabic = locale === 'ar';
  
  // Use metadata slides if provided, otherwise default fallback. 
  // In production, products must provide their own slides or we map default from DB.
  const activeSlides = slides && slides.length > 0 ? slides : DEFAULT_SLIDES;

  const title = isArabic ? 'من الاستوديو' : 'From the Studio';
  const subtitle = artistName 
    ? (isArabic ? `كيف صمم ${artistName} هذه القطعة` : `How ${artistName} created this piece`)
    : (isArabic ? `مراحل تصميم هذه القطعة` : `The making of this piece`);

  return (
    <section className="w-full py-12 md:py-16 overflow-hidden bg-sand">
      <div className="mx-auto max-w-screen-xl px-4 md:px-8">
        <div className="mb-8 md:mb-12">
          <h2 className="font-display text-2xl md:text-3xl font-medium tracking-tight text-obsidian">
            {title}
          </h2>
          <p className="font-body mt-2 text-stone md:text-lg">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="relative w-full">
        <div className="flex w-full snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-8 md:gap-6 md:px-8 hide-scrollbar">
          {activeSlides.map((slide, index) => {
            const label = isArabic ? slide.labelAr : slide.labelEn;
            const description = isArabic ? slide.descriptionAr : slide.descriptionEn;

            return (
              <div 
                key={index} 
                className="relative w-[85vw] max-w-[400px] shrink-0 snap-start flex-col gap-4 overflow-hidden rounded-xl bg-white shadow-sm"
              >
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-stone/5">
                  <Image
                    src={slide.src}
                    alt={label}
                    fill
                    className="object-cover transition-transform duration-700 hover:scale-105"
                    sizes="(max-width: 768px) 85vw, 400px"
                  />
                  <div className="absolute top-4 left-4 rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-obsidian backdrop-blur-sm">
                    {index + 1} / {activeSlides.length}
                  </div>
                </div>
                
                <div className="flex flex-col p-5 md:p-6">
                  <h3 className="font-display text-lg font-medium text-obsidian">
                    {label}
                  </h3>
                  <p className="font-body mt-2 text-sm leading-relaxed text-stone">
                    {description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </section>
  );
}
