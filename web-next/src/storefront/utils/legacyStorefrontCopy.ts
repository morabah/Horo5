type StorefrontLocale = 'en' | 'ar';

const LEGACY_LABELS: Record<StorefrontLocale, Record<string, string>> = {
  en: {
    'a closer look': 'See the Details',
    'find a gift': 'Shop Gifts',
    'find the perfect gift': 'Shop Gifts',
    'find the perfect gift →': 'Shop Gifts',
    'gift ready': 'Gifts',
    'shop by meaning': 'Shop by Feeling',
    'shop the founding drop': 'Shop the Drop',
    'shop the piece': 'View Design',
    'size & help': 'Size Guide',
    'view all': 'Shop the Drop',
    'view all designs': 'Shop All Designs',
    'view piece': 'View Design',
    'view tee': 'View Details',
    'view the piece': 'View Design',
  },
  ar: {
    'اعثر على الهدية المثالية →': 'تسوّق الهدايا',
    'المقاسات والمساعدة': 'دليل المقاسات',
    'تسوق الهدايا': 'تسوّق الهدايا',
    'تسوّق الإطلاق الأول': 'تسوّق الإطلاق',
    'تسوّق حسب المعنى': 'تسوّق حسب الشعور',
    'جاهزة للهدايا': 'الهدايا',
    'شاهد التيشيرت': 'شاهد التفاصيل',
    'شاهد القطعة': 'شاهد التصميم',
    'عرض القطعة': 'شاهد التصميم',
    'عرض كل التصاميم': 'تسوّق كل التصاميم',
    'عرض الكل': 'تسوّق الإطلاق',
    'نظرة أقرب': 'شاهد التفاصيل',
  },
};

export function normalizeLegacyStorefrontLabel(
  label: string | null | undefined,
  locale: StorefrontLocale,
): string | null | undefined {
  const trimmed = label?.trim();
  if (!trimmed) return label;
  const key = locale === 'en' ? trimmed.toLowerCase() : trimmed;
  return LEGACY_LABELS[locale][key] ?? trimmed;
}
