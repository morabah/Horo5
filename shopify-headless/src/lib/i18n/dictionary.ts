export const DICTIONARY = {
  en: {
    home: {
      heroTitle: "Wear what you feel.",
      heroBody: "Artist-made tees for feelings, moments, and meaningful gifts.",
      heroProof: "Printed in Egypt with COD and exchange reassurance.",
      shopDrop: "Shop the Drop",
      shopFeeling: "Shop by Feeling",
      shopGifts: "Shop Gifts",
      routeFeelingTitle: "Shop by Feeling",
      routeFeelingBody: "Start from the mood and choose the piece that matches it.",
      routeOccasionTitle: "Shop by Occasion",
      routeOccasionBody: "Find a piece for birthdays, milestones, and everyday moments.",
      routeGiftTitle: "Shop Gifts",
      routeGiftBody: "Pick by recipient, meaning, and size-help confidence.",
      collectionsTitle: "Collections",
      latestProductsTitle: "Latest Products",
    },
    nav: {
      home: "Home",
      shop: "Shop",
      feelings: "Feelings",
      occasions: "Occasions",
      gifts: "Gifts",
      cart: "Cart",
    },
    trust: {
      artistMade: "Artist-made",
      artistMadeBody: "Original artwork, not stock-print filler.",
      printedEgypt: "Printed in Egypt",
      printedEgyptBody: "Local production and clearer turnaround.",
      cod: "COD available",
      codBody: "Cash on delivery when enabled in checkout.",
      exchange: "14-day exchange",
      exchangeBody: "An easier path if the fit is off.",
      whatsapp: "WhatsApp support",
    },
  },
  ar: {
    home: {
      heroTitle: "إلبس اللي بتحس بيه.",
      heroBody: "تيشيرتات برسومات فنانين، للهدية أو الشعور أو اللحظة اللي تستاهل معنى.",
      heroProof: "مطبوع في مصر مع دفع عند الاستلام وطمأنة للاستبدال.",
      shopDrop: "تسوّق الإطلاق",
      shopFeeling: "تسوّق حسب الشعور",
      shopGifts: "تسوّق الهدايا",
      routeFeelingTitle: "تسوّق حسب الشعور",
      routeFeelingBody: "ابدأ بالإحساس واختار القطعة اللي تعبّر عنه.",
      routeOccasionTitle: "تسوّق حسب اللحظة",
      routeOccasionBody: "اختار قطعة لعيد ميلاد، مناسبة، أو لحظة يومية لها معنى.",
      routeGiftTitle: "تسوّق الهدايا",
      routeGiftBody: "اختار حسب الشخص، المعنى، ومساعدة المقاس قبل الطلب.",
      collectionsTitle: "المجموعات",
      latestProductsTitle: "أحدث القطع",
    },
    nav: {
      home: "الرئيسية",
      shop: "المتجر",
      feelings: "المشاعر",
      occasions: "اللحظات",
      gifts: "الهدايا",
      cart: "السلة",
    },
    trust: {
      artistMade: "تصاميم فنانين",
      artistMadeBody: "رسومات أصلية، مش طبعة عشوائية.",
      printedEgypt: "مطبوع في مصر",
      printedEgyptBody: "إنتاج محلي ووقت تنفيذ أوضح.",
      cod: "دفع عند الاستلام",
      codBody: "الدفع عند الاستلام عند تفعيله في الدفع.",
      exchange: "استبدال ١٤ يوم",
      exchangeBody: "طريق أسهل لو المقاس محتاج يتبدل.",
      whatsapp: "دعم واتساب",
    },
  },
} as const;

export type SupportedLocale = keyof typeof DICTIONARY;

export function getDictionary(locale: SupportedLocale = "en") {
  return DICTIONARY[locale] ?? DICTIONARY.en;
}
