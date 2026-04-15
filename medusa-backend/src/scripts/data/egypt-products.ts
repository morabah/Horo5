export type EgyptProductSeed = {
  handle: string
  titleEn: string
  descriptionEn: string
  imagePath: string
}

/** Integer EGP (whole pounds). Medusa stores this directly when `currency.decimal_digits = 0` for EGP. */
export const EGYPT_PRODUCT_PRICE_EGP = 799
export const EGYPT_PRODUCT_SIZES = ["S", "M", "L", "XL", "XXL"] as const

export const egyptProducts: EgyptProductSeed[] = [
  {
    handle: "horo-emotions-vibe",
    titleEn: "HORO Emotions Vibe Tee",
    descriptionEn:
      "A wearable art t-shirt inspired by emotional storytelling for everyday expression.",
    imagePath: "../web-next/public/images/hero/horo_vectorized_v2.svg",
  },
  {
    handle: "horo-zodiac-vibe",
    titleEn: "HORO Zodiac Vibe Tee",
    descriptionEn:
      "A zodiac-inspired piece designed for confident daily styling with artistic details.",
    imagePath: "../web-next/public/images/hero/horo_vectorized_v2.svg",
  },
  {
    handle: "horo-fiction-vibe",
    titleEn: "HORO Fiction Vibe Tee",
    descriptionEn:
      "A fiction-led print concept blending narrative visuals and modern streetwear basics.",
    imagePath: "../web-next/public/images/hero/horo_vectorized_v2.svg",
  },
  {
    handle: "horo-career-vibe",
    titleEn: "HORO Career Vibe Tee",
    descriptionEn:
      "A career-themed design made for creators who want meaningful fashion statements.",
    imagePath: "../web-next/public/images/hero/horo_vectorized_v2.svg",
  },
  {
    handle: "horo-signature-hero",
    titleEn: "HORO Signature Hero Tee",
    descriptionEn:
      "A signature look featuring hero artwork and balanced silhouettes for versatile wear.",
    imagePath: "../web-next/public/images/hero/horo_vectorized_v2.svg",
  },
]
