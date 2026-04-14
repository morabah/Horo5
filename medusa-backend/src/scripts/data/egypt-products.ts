export type EgyptProductSeed = {
  handle: string
  titleEn: string
  descriptionEn: string
  imagePath: string
}

export const EGYPT_PRODUCT_PRICE_EGP = 79900
export const EGYPT_PRODUCT_SIZES = ["S", "M", "L", "XL", "XXL"] as const

export const egyptProducts: EgyptProductSeed[] = [
  {
    handle: "horo-emotions-vibe",
    titleEn: "HORO Emotions Vibe Tee",
    descriptionEn:
      "A wearable art t-shirt inspired by emotional storytelling for everyday expression.",
    imagePath: "../web-next/public/images/tees/emotions_vibe_1_1774374034307.png",
  },
  {
    handle: "horo-zodiac-vibe",
    titleEn: "HORO Zodiac Vibe Tee",
    descriptionEn:
      "A zodiac-inspired piece designed for confident daily styling with artistic details.",
    imagePath: "../web-next/public/images/tees/zodiac_vibe_1_1774374128029.png",
  },
  {
    handle: "horo-fiction-vibe",
    titleEn: "HORO Fiction Vibe Tee",
    descriptionEn:
      "A fiction-led print concept blending narrative visuals and modern streetwear basics.",
    imagePath: "../web-next/public/images/tees/fiction_vibe_1_1774374247152.png",
  },
  {
    handle: "horo-career-vibe",
    titleEn: "HORO Career Vibe Tee",
    descriptionEn:
      "A career-themed design made for creators who want meaningful fashion statements.",
    imagePath: "../web-next/public/images/tees/career_vibe_1_1774374340994.png",
  },
  {
    handle: "horo-signature-hero",
    titleEn: "HORO Signature Hero Tee",
    descriptionEn:
      "A signature look featuring hero artwork and balanced silhouettes for versatile wear.",
    imagePath: "../web-next/public/images/hero/hero-model.png",
  },
]
