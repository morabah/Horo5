import type { StorefrontNavigationDTO } from "./types"

/** Launch IA navigation for store.metadata.navigation — use when re-seeding or clearing legacy nav. */
export const DEFAULT_LAUNCH_NAVIGATION: StorefrontNavigationDTO = {
  primary: [
    {
      key: "products",
      label: { en: "Founding Drop", ar: "الإطلاق الأول" },
      href: "/products",
      active: true,
      sortOrder: 0,
    },
    {
      key: "zodiac",
      label: { en: "Zodiac", ar: "برج" },
      href: "/feelings/zodiac",
      active: true,
      sortOrder: 10,
    },
    {
      key: "about",
      label: { en: "Our Story", ar: "قصتنا" },
      href: "/about",
      active: true,
      sortOrder: 20,
    },
    {
      key: "sizeGuide",
      label: { en: "Size & Help", ar: "المقاسات والمساعدة" },
      href: "/size-guide",
      active: true,
      sortOrder: 30,
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
      label: { en: "Founding Drop", ar: "الإطلاق الأول" },
      href: "/products",
      active: true,
      sortOrder: 10,
    },
    {
      key: "zodiac",
      label: { en: "Zodiac", ar: "برج" },
      href: "/feelings/zodiac",
      active: true,
      sortOrder: 20,
    },
    {
      key: "about",
      label: { en: "Our Story", ar: "قصتنا" },
      href: "/about",
      active: true,
      sortOrder: 30,
    },
    {
      key: "sizeGuide",
      label: { en: "Size & Help", ar: "المقاسات والمساعدة" },
      href: "/size-guide",
      active: true,
      sortOrder: 40,
    },
    {
      key: "search",
      label: { en: "Search", ar: "بحث" },
      href: "/search",
      active: true,
      sortOrder: 50,
    },
  ],
}
