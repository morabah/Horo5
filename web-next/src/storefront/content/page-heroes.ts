import { HORO_V19_HERO_SUBTITLE, HORO_V19_SOUNDBITES } from '../brand/horo-v19';

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
    title: {
      en: "Wear What You Feel",
      ar: HORO_V19_SOUNDBITES.primary.ar,
    },
    titleLayout: "standard",
    subtitle: {
      en: HORO_V19_HERO_SUBTITLE.en,
      ar: HORO_V19_HERO_SUBTITLE.ar,
    },
    primaryCta: {
      label: { en: "Shop the Drop", ar: "تسوّق الإطلاق" },
      href: "/products",
    },
    secondaryCta: {
      label: { en: "See the Details", ar: "شاهد التفاصيل" },
      href: "/#editorial-feature",
    },
    desktopImage: {
      src: "/images/homepage-reference/hero-right.png",
      alt: {
        en: "Model wearing HORO graphic tee — Wear What You Feel",
        ar: `عارض يرتدي تيشيرت هورو — ${HORO_V19_SOUNDBITES.primary.ar}`,
      },
    },
    focalPoint: "center",
    theme: "light",
  },

  shop: {
    pageKey: "shop",
    eyebrow: { en: "FOUNDING DROP", ar: "أول مجموعة" },
    title: { en: "The first HORO pieces", ar: "أول قطع من HORO" },
    subtitle: {
      en: "Artist-made graphic tees, printed in Egypt, ready to wear or gift.",
      ar: "تيشيرتات برسومات فنانين، مطبوعة في مصر، جاهزة للبس أو الهدية.",
    },
    primaryCta: {
      label: { en: "Shop All Designs", ar: "تسوّق كل التصاميم" },
      href: "/products",
    },
    desktopImage: {
      src: "/images/heroes/shop-hero.svg",
      alt: { en: "HORO collection overview", ar: "نظرة عامة على مجموعة هورو" },
    },
    focalPoint: "center",
    theme: "dark",
  },

  // Current Feelings hub keeps its dynamic multi-tile photo grid.
  // This image is reserved for a future generic hero or campaign landing page.
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

  // Current Occasions hub keeps its dynamic multi-tile photo grid.
  // This image is reserved for a future generic hero or campaign landing page.
  occasions: {
    pageKey: "occasions",
    eyebrow: { en: "Shop by occasion", ar: "تسوق حسب المناسبة" },
    title: { en: "Give something that means something", ar: "اهدي حاجة لها معنى" },
    subtitle: {
      en: "Find the design that fits the moment.",
      ar: "اختار تصميم يناسب عيد ميلاد، تخرج، العيد، رمضان، أو هدية بدون مناسبة.",
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
    title: { en: "Meaningful pieces for meaningful moments", ar: "هدية شبه اللي في بالك" },
    subtitle: {
      en: "Pieces chosen for the person on your mind.",
      ar: "قطع فنية مختارة لشخص يستاهل حاجة مختلفة.",
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

  // Current About page uses BRAND_COPY.aboutLead for the story body.
  // The subtitle remains here as a secondary/reserved field for future generic hero reuse.
  about: {
    pageKey: "about",
    eyebrow: { en: "Our story", ar: "قصتنا" },
    title: { en: "Our story", ar: "عن HORO" },
    subtitle: {
      en: "Artist-made wearable art from Egypt — for feelings, identity, and meaning you can wear.",
      ar: "فن قابل للّبس من مصر — للمشاعر، الهوية، والمعنى اللي تقدر تلبسه.",
    },
    primaryCta: {
      label: { en: "Shop the Drop", ar: "تسوّق الإطلاق" },
      href: "/products",
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
