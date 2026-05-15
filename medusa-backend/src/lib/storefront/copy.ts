import type { MedusaContainer } from "@medusajs/types"

import { getStorefrontHomepageWithServerCache, type StorefrontHomepageSectionDTO } from "./homepage"

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function recordArray(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter(isRecord) : []
}

function ctaFromPayload(value: unknown) {
  if (!isRecord(value)) return null
  const label = isRecord(value.label) || typeof value.label === "string" ? value.label : null
  const href = typeof value.href === "string" && value.href.trim() ? value.href.trim() : null
  return label || href ? { label, href } : null
}

function defaultGiftRoutes() {
  return [
    {
      key: "gift_hub",
      label: { en: "Shop Gifts", ar: "تسوّق الهدايا" },
      href: "/gifts",
    },
  ]
}

function defaultTrustStripItems() {
  return [
    { key: "artist_made", label: { en: "Artist-made designs", ar: "تصاميم فنانين" } },
    { key: "printed_egypt", label: { en: "Printed in Egypt", ar: "مطبوع في مصر" } },
    { key: "cod", label: { en: "COD available", ar: "دفع عند الاستلام" } },
    { key: "exchange", label: { en: "14-day easy exchange", ar: "استبدال سهل ١٤ يوم" } },
  ]
}

function sectionPayload(section: StorefrontHomepageSectionDTO | undefined | null) {
  return isRecord(section?.payload) ? section.payload : {}
}

export async function getStorefrontCopy(scope: MedusaContainer) {
  const { sections } = await getStorefrontHomepageWithServerCache(scope)
  const hero = sections.find((section) => section.type === "hero" && section.active !== false) ?? null
  const heroPayload = sectionPayload(hero)
  const heroVariants = recordArray(heroPayload.heroVariants)
  const selectedVariant =
    typeof heroPayload.selectedVariant === "string"
      ? heroPayload.selectedVariant
      : typeof heroPayload.variant === "string"
        ? heroPayload.variant
        : "default"

  const trustSection = sections.find((section) => section.type === "trust_ribbon" && section.active !== false)
  const trustPayload = sectionPayload(trustSection)
  const trustStripItems = recordArray(trustPayload.trustStripItems)

  const routesSection = sections.find((section) => section.type === "primary_routes" && section.active !== false)
  const routesPayload = sectionPayload(routesSection)
  const giftRoutes = recordArray(routesPayload.giftRoutes)

  const ctaOptions = [
    hero?.primaryCta,
    hero?.secondaryCta,
    ctaFromPayload(heroPayload.tertiaryCta),
  ].filter(Boolean)

  return {
    generatedAt: new Date().toISOString(),
    homepage: {
      hero: {
        section: hero,
        selectedVariant,
        variants: heroVariants,
        requiredVariantCount: 3,
      },
      ctaOptions,
      trustStripItems: trustStripItems.length > 0 ? trustStripItems : defaultTrustStripItems(),
      giftRoutes: giftRoutes.length > 0 ? giftRoutes : defaultGiftRoutes(),
      activeSectionKeys: sections.map((section) => section.key),
    },
    validation: {
      releaseRule: [
        "2-3 options drafted",
        "Plain-text prototype reviewed",
        "3 of 5 buyers can restate the message",
        "No repeated cultural or credibility concern",
        "Founder override recorded when used",
      ],
    },
  }
}
