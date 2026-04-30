import type { HomepageSectionInput } from "./types"

export type HomepageSectionSeed = Required<
  Pick<HomepageSectionInput, "key" | "type" | "sort_order" | "active">
> &
  Omit<HomepageSectionInput, "key" | "type" | "sort_order" | "active">

export const DEFAULT_HOMEPAGE_SECTIONS: HomepageSectionSeed[] = [
  {
    key: "hero",
    type: "hero",
    title_en: "WEAR WHAT YOU FEEL",
    title_ar: "ارتدِ ما تشعر به",
    body_en: "Artist-made tees · Printed in Egypt · COD",
    body_ar: "تيشيرتات فنانين · مطبوعة في مصر · الدفع عند الاستلام",
    primary_cta_label_en: "Shop the Founding Drop",
    primary_cta_label_ar: "تسوق الإطلاق الأول",
    primary_cta_href: "/products",
    secondary_cta_label_en: "Shop by Feeling",
    secondary_cta_label_ar: "تسوق حسب الشعور",
    secondary_cta_href: "/feelings",
    image_src: "/images/heroes/home-hero.png",
    image_alt_en: "Model wearing HORO graphic tee - Wear What You Feel",
    image_alt_ar: "عارض يرتدي تيشيرت هورو - ارتدِ ما تشعر به",
    sort_order: 0,
    active: true,
  },
  {
    key: "trust_ribbon",
    type: "trust_ribbon",
    sort_order: 10,
    active: true,
    payload: {
      items: [
        { key: "artistMade", label_en: "Artist-made", label_ar: "تصميم فنانين", icon: "artistSigned" },
        { key: "printedEgypt", label_en: "Printed in Egypt", label_ar: "مطبوعة في مصر", icon: "printedEgypt" },
        { key: "codAvailable", label_en: "COD available", label_ar: "الدفع عند الاستلام", icon: "codExchange" },
        { key: "exchange14d", label_en: "14-day exchange", label_ar: "استبدال خلال ١٤ يوم", icon: "codExchange" },
      ],
    },
  },
  {
    key: "founding_drop",
    type: "founding_drop",
    eyebrow_en: "FOUNDING DROP",
    eyebrow_ar: "أول مجموعة",
    title_en: "Start with the first pieces",
    title_ar: "ابدأ بأول قطع من HORO",
    primary_cta_label_en: "Shop all",
    primary_cta_label_ar: "تسوق الكل",
    primary_cta_href: "/products",
    sort_order: 20,
    active: true,
  },
  {
    key: "feeling_grid",
    type: "feeling_grid",
    eyebrow_en: "SHOP BY FEELING",
    eyebrow_ar: "تسوق حسب الشعور",
    title_en: "Which feeling is yours?",
    title_ar: "أي شعور هو شعورك؟",
    primary_cta_label_en: "Explore feelings",
    primary_cta_label_ar: "اكتشف المشاعر",
    primary_cta_href: "/feelings",
    sort_order: 30,
    active: true,
  },
  {
    key: "gift_block",
    type: "gift_block",
    eyebrow_en: "GIFT READY",
    eyebrow_ar: "جاهزة للهدايا",
    title_en: "A tee that feels picked, not grabbed",
    title_ar: "هدية باين إنها مختارة",
    primary_cta_label_en: "Shop gifts",
    primary_cta_label_ar: "تسوق الهدايا",
    primary_cta_href: "/gifts",
    sort_order: 40,
    active: true,
  },
]
