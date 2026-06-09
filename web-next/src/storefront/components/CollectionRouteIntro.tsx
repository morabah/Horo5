'use client';

import type { LaunchCategoryFilter } from '../lib/launch-taxonomy-display';
import {
  isLaunchDesignCategoryFilter,
  launchCategoryFilterLabel,
  zodiacEntertainmentDisclaimer,
} from '../lib/launch-taxonomy-display';
import { useUiLocale } from '../i18n/ui-locale';

type CollectionRouteIntroProps = {
  categoryFilter?: LaunchCategoryFilter;
  feelingSlug?: string;
  giftOnly?: boolean;
};

function designCategoryIntro(
  category: 'walk-alone' | 'i-care' | 'i-dont-care',
  lang: 'en' | 'ar',
): { title: string; body: string } {
  if (lang === 'ar') {
    switch (category) {
      case 'walk-alone':
        return {
          title: 'امشي لوحدك',
          body: 'قطع للي بيمشي على إيقاعه — استقلالية من غير تصنّع.',
        };
      case 'i-care':
        return {
          title: 'اهتم',
          body: 'لللي بيحس بعمق — تعبير عن مشاعر حقيقية مش شعارات عامة.',
        };
      case 'i-dont-care':
        return {
          title: 'مش فارق',
          body: 'لللي بيختار الحرية — موقف واضح من غير مبالغة.',
        };
    }
  }
  switch (category) {
    case 'walk-alone':
      return {
        title: 'Walk Alone',
        body: 'Pieces for your own pace — independence without trying too hard.',
      };
    case 'i-care':
      return {
        title: 'I Care',
        body: 'For people who feel deeply — real emotion, not generic slogans.',
      };
    case 'i-dont-care':
      return {
        title: "I Don't Care",
        body: 'For those who choose freedom — attitude without the noise.',
      };
  }
}

function feelingIntro(slug: string, locale: 'en' | 'ar'): { title: string; body: string } | null {
  if (slug === 'zodiac') {
    return locale === 'ar'
      ? {
          title: 'كبسولة الأبراج',
          body: 'تيشيرتات بتعبّر عن طاقة برجك — للمرح والشخصية، مش تنبؤات.',
        }
      : {
          title: 'Sign Capsule',
          body: 'Tees that match your sign energy — for fun and personality, not predictions.',
        };
  }
  if (slug === 'career') {
    return locale === 'ar'
      ? {
          title: 'تعبّر عن شغلك',
          body: 'قطع للي بياخد شغله بجد — فخر مهني من غير كليشيهات عامة.',
        }
      : {
          title: 'Wear your work',
          body: 'Pieces for people who take their craft seriously — career pride without generic slogans.',
        };
  }
  return null;
}

export function CollectionRouteIntro({ categoryFilter, feelingSlug, giftOnly }: CollectionRouteIntroProps) {
  const { locale } = useUiLocale();
  const lang = locale === 'ar' ? 'ar' : 'en';

  const fromFeeling = feelingSlug ? feelingIntro(feelingSlug, lang) : null;
  const categoryLabel = categoryFilter ? launchCategoryFilterLabel(categoryFilter, lang) : null;
  const fromDesignCategory =
    categoryFilter && isLaunchDesignCategoryFilter(categoryFilter)
      ? designCategoryIntro(categoryFilter, lang)
      : null;
  const fromCategory =
    categoryFilter === 'zodiac'
      ? {
          title: categoryLabel ?? (lang === 'ar' ? 'كبسولة الأبراج' : 'Sign Capsule'),
          body:
            lang === 'ar'
              ? 'كل برج له تصميمه — للمرح والشخصية فقط.'
              : 'Each sign gets its own design — personality and fun only.',
        }
      : null;

  const giftIntro =
    giftOnly && !fromFeeling && !fromCategory && !fromDesignCategory
      ? lang === 'ar'
        ? {
            title: 'جاهز للهدايا',
            body: 'قطع مختارة للهدايا — مع مساعدة مقاس على واتساب قبل الطلب.',
          }
        : {
            title: 'Gift-ready picks',
            body: 'Curated giftable pieces — WhatsApp size help before you order.',
          }
      : null;

  const intro = fromFeeling ?? fromDesignCategory ?? fromCategory ?? giftIntro;
  if (!intro) return null;

  const disclaimer = categoryFilter === 'zodiac' || feelingSlug === 'zodiac'
    ? zodiacEntertainmentDisclaimer(lang)
    : null;

  return (
    <aside
      className="mb-6 rounded-2xl border border-stone/35 bg-white/70 px-5 py-4 md:px-6"
      aria-label={intro.title}
    >
      <h2 className="font-headline text-lg font-semibold tracking-tight text-obsidian">{intro.title}</h2>
      <p className="mt-2 font-body text-sm leading-relaxed text-warm-charcoal">{intro.body}</p>
      {disclaimer ? (
        <p className="mt-2 font-label text-[10px] font-semibold uppercase tracking-[0.16em] text-horo-pulse">
          {disclaimer}
        </p>
      ) : null}
    </aside>
  );
}
