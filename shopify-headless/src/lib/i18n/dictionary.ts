export const DICTIONARY = {
  en: {
    home: {
      heroTitle: "Wear what you feel.",
      heroBody: "Artist-made tees for feelings, moments, and meaningful gifts.",
      shopDrop: "Shop the Drop",
      shopFeeling: "Shop by Feeling",
      shopGifts: "Shop Gifts",
    },
    trust: {
      artistMade: "Artist-made",
      printedEgypt: "Printed in Egypt",
      cod: "COD available",
      exchange: "14-day exchange",
      whatsapp: "WhatsApp support",
    },
  },
  ar: {
    home: {
      heroTitle: "إلبس اللي بتحس بيه.",
      heroBody: "تيشيرتات برسومات فنانين، للهدية أو الشعور أو اللحظة اللي تستاهل معنى.",
      shopDrop: "تسوّق الإطلاق",
      shopFeeling: "تسوّق حسب الشعور",
      shopGifts: "تسوّق الهدايا",
    },
    trust: {
      artistMade: "تصاميم فنانين",
      printedEgypt: "مطبوع في مصر",
      cod: "دفع عند الاستلام",
      exchange: "استبدال ١٤ يوم",
      whatsapp: "دعم واتساب",
    },
  },
} as const;

export type SupportedLocale = keyof typeof DICTIONARY;

export function getDictionary(locale: SupportedLocale = "en") {
  return DICTIONARY[locale] ?? DICTIONARY.en;
}
