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
      key: "shop_by_meaning",
      label: { en: "Shop by Meaning", ar: "تسوّق حسب المعنى" },
      href: "/#shop-by-meaning",
      active: true,
      sortOrder: 10,
    },
    {
      key: "gifts",
      label: { en: "Gift Ready", ar: "جاهزة للهدايا" },
      href: "/gifts",
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
      key: "shop_by_meaning",
      label: { en: "Shop by Meaning", ar: "تسوّق حسب المعنى" },
      href: "/#shop-by-meaning",
      active: true,
      sortOrder: 20,
    },
    {
      key: "gifts",
      label: { en: "Gift Ready", ar: "جاهزة للهدايا" },
      href: "/gifts",
      active: true,
      sortOrder: 30,
    },
    {
      key: "about",
      label: { en: "Our Story", ar: "قصتنا" },
      href: "/about",
      active: true,
      sortOrder: 40,
    },
    {
      key: "sizeGuide",
      label: { en: "Size & Help", ar: "المقاسات والمساعدة" },
      href: "/size-guide",
      active: true,
      sortOrder: 50,
    },
    {
      key: "search",
      label: { en: "Search", ar: "بحث" },
      href: "/search",
      active: true,
      sortOrder: 60,
    },
  ],
}
