export type LocalizedText = {
  en: string;
  ar: string;
};

export type PageHeroCta = {
  label: LocalizedText;
  href: string;
};

export type PageHeroImage = {
  src: string;
  alt: LocalizedText;
};

export type PageHeroConfig = {
  pageKey: string;
  eyebrow?: LocalizedText;
  title: LocalizedText;
  titleLayout?: "mantra-grid" | "standard";
  subtitle?: LocalizedText;
  primaryCta?: PageHeroCta;
  secondaryCta?: PageHeroCta;
  desktopImage?: PageHeroImage;
  mobileImage?: PageHeroImage;
  focalPoint?: "center" | "top" | "bottom" | "left" | "right";
  theme?: "dark" | "light" | "beige";
};

const defaultHero: PageHeroConfig = {
  pageKey: "default",
  title: { en: "HORO", ar: "هورو" },
  subtitle: { en: "Wear what you feel.", ar: "ارتدِ ما تشعر به." },
  theme: "dark",
  desktopImage: {
    src: "/images/heroes/default-hero.svg",
    alt: { en: "HORO brand hero image.", ar: "صورة هيرو العلامة التجارية هورو." },
  },
};

export const PAGE_HEROES: Record<string, PageHeroConfig> = {
  default: defaultHero,

  home: {
    pageKey: "home",
    title: { en: "WEAR WHAT YOU FEEL", ar: "ارتدِ ما تشعر به" },
    titleLayout: "mantra-grid",
    subtitle: {
      en: "Artist-made graphic tees printed in Egypt — made for moods, moments, and gifts that feel personal.",
      ar: "تيشيرتات فنية مصرية — مصنوعة للمزاج، اللحظات، والهدايا التي تشعر بالخصوصية.",
    },
    primaryCta: {
      label: { en: "Shop All", ar: "تسوق الكل" },
      href: "/products",
    },
    secondaryCta: {
      label: { en: "Shop by Feeling", ar: "تسوق حسب الشعور" },
      href: "/feelings",
    },
    desktopImage: {
      src: "/images/heroes/home-hero.png",
      alt: { en: "Model wearing HORO graphic tee — Wear What You Feel", ar: "عارض يرتدي تيشيرت هورو — ارتدِ ما تشعر به" },
    },
    focalPoint: "center",
    theme: "dark",
  },

  shop: {
    pageKey: "shop",
    eyebrow: { en: "Shop", ar: "تسوق" },
    title: { en: "Every design, in one place", ar: "كل التصاميم في مكان واحد" },
    subtitle: {
      en: "Browse the full collection. Filter by feeling, occasion, or price to find your piece.",
      ar: "تصفّح المجموعة الكاملة. رشّح حسب الشعور، المناسبة، أو السعر لتجد قطعتك.",
    },
    primaryCta: {
      label: { en: "Shop All", ar: "تسوق الكل" },
      href: "/products",
    },
    desktopImage: {
      src: "/images/heroes/shop-hero.svg",
      alt: { en: "HORO collection overview", ar: "نظرة عامة على مجموعة هورو" },
    },
    focalPoint: "center",
    theme: "dark",
  },

  feelings: {
    pageKey: "feelings",
    eyebrow: { en: "Shop by feeling", ar: "تسوق حسب الشعور" },
    title: { en: "Which feeling is yours?", ar: "أي شعور هو شعورك؟" },
    subtitle: {
      en: "Every design starts with a feeling. Start with yours.",
      ar: "كل تصميم يبدأ بشعور. ابدأ بشعورك.",
    },
    primaryCta: {
      label: { en: "Shop All", ar: "تسوق الكل" },
      href: "/products",
    },
    desktopImage: {
      src: "/images/heroes/feelings-hero.svg",
      alt: {
        en: "Editorial collage showing the HORO feelings through graphic-tee styling.",
        ar: "كولاج إعلاني يظهر مشاعر هورو من خلال تيشيرتات فنية.",
      },
    },
    focalPoint: "center",
    theme: "dark",
  },

  occasions: {
    pageKey: "occasions",
    eyebrow: { en: "Shop by occasion", ar: "تسوق حسب المناسبة" },
    title: { en: "Give something that means something", ar: "أعطِ شيئًا يعني شيئًا" },
    subtitle: {
      en: "Find the design that fits the moment.",
      ar: "اعثر على التصميم الذي يناسب اللحظة.",
    },
    primaryCta: {
      label: { en: "Shop All", ar: "تسوق الكل" },
      href: "/products",
    },
    desktopImage: {
      src: "/images/heroes/occasions-hero.svg",
      alt: { en: "HORO occasion collection hero", ar: "بطل مجموعة مناسبات هورو" },
    },
    focalPoint: "center",
    theme: "dark",
  },

  gifts: {
    pageKey: "gifts",
    eyebrow: { en: "Gifts", ar: "هدايا" },
    title: { en: "Meaningful pieces for meaningful moments", ar: "قطع ذات معنى للحظات ذات معنى" },
    subtitle: {
      en: "Pieces chosen for the person on your mind.",
      ar: "قطع مختارة للشخص الذي في بالك.",
    },
    primaryCta: {
      label: { en: "Shop gift-ready pieces", ar: "تسوق قطع جاهزة للهدايا" },
      href: "/products",
    },
    desktopImage: {
      src: "/images/heroes/gifts-hero.svg",
      alt: { en: "HORO gift-ready collection", ar: "مجموعة هورو الجاهزة للهدايا" },
    },
    focalPoint: "center",
    theme: "dark",
  },

  about: {
    pageKey: "about",
    eyebrow: { en: "Our story", ar: "قصتنا" },
    title: { en: "Our story", ar: "قصتنا" },
    subtitle: {
      en: "Artist-made graphic tees printed in Egypt — made for moods, moments, and gifts that feel personal.",
      ar: "تيشيرتات فنية مصرية — مصنوعة للمزاج، اللحظات، والهدايا التي تشعر بالخصوصية.",
    },
    primaryCta: {
      label: { en: "Shop by feeling", ar: "تسوق حسب الشعور" },
      href: "/feelings",
    },
    desktopImage: {
      src: "/images/heroes/about-hero.svg",
      alt: { en: "HORO brand story", ar: "قصة علامة هورو التجارية" },
    },
    focalPoint: "center",
    theme: "dark",
  },
};

export function getPageHero(pageKey: string): PageHeroConfig {
  return PAGE_HEROES[pageKey] ?? PAGE_HEROES.default;
}
