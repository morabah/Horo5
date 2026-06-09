import type { StorefrontNavigationDTO } from "./store-settings"

/** Launch IA navigation for store.metadata.navigation — use when re-seeding or clearing legacy nav. */
export const DEFAULT_LAUNCH_NAVIGATION: StorefrontNavigationDTO = {
  primary: [
    {
      key: "products",
      label: { en: "Shop", ar: "تسوّق" },
      href: "/products",
      active: true,
      sortOrder: 0,
    },
    {
      key: "shop_by_meaning",
      label: { en: "Collections", ar: "المجموعات" },
      href: "/#shop-by-meaning",
      active: true,
      sortOrder: 10,
    },
    {
      key: "about",
      label: { en: "About", ar: "عن هورو" },
      href: "/about",
      active: true,
      sortOrder: 20,
    },
  ],
  drawer: [
    {
      key: "home",
      label: { en: "Home", ar: "الرئيسية" },
      href: "/",
      active: true,
      sortOrder: 0,
    },
    {
      key: "products",
      label: { en: "Shop All", ar: "تسوّق الكل" },
      href: "/products",
      active: true,
      sortOrder: 10,
    },
    {
      key: "shop_by_meaning",
      label: { en: "Shop by Feeling", ar: "تسوّق حسب الشعور" },
      href: "/#shop-by-meaning",
      active: true,
      sortOrder: 20,
    },
    {
      key: "gifts",
      label: { en: "Gifts", ar: "الهدايا" },
      href: "/gifts",
      active: true,
      sortOrder: 30,
    },
    {
      key: "zodiac",
      label: { en: "Zodiac", ar: "كبسولة الأبراج" },
      href: "/feelings/zodiac",
      active: true,
      sortOrder: 40,
    },
    {
      key: "career",
      label: { en: "Career & Work", ar: "المهنة والشغل" },
      href: "/feelings/career",
      active: true,
      sortOrder: 50,
    },
    {
      key: "about",
      label: { en: "Our Story", ar: "قصتنا" },
      href: "/about",
      active: true,
      sortOrder: 60,
    },
    {
      key: "sizeGuide",
      label: { en: "Size Guide", ar: "دليل المقاسات" },
      href: "/size-guide",
      active: true,
      sortOrder: 70,
    },
    {
      key: "faq",
      label: { en: "FAQ", ar: "الأسئلة الشائعة" },
      href: "/faq",
      active: true,
      sortOrder: 80,
    },
    {
      key: "exchange",
      label: { en: "Exchange Policy", ar: "سياسة الاستبدال" },
      href: "/exchange",
      active: true,
      sortOrder: 90,
    },
    {
      key: "search",
      label: { en: "Search", ar: "بحث" },
      href: "/search",
      active: true,
      sortOrder: 100,
    },
  ],
}
