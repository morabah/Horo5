import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"

import { ARTIST_MODULE } from "../modules/artist"
import type ArtistModuleService from "../modules/artist/service"
import { MERCH_EVENT_MODULE } from "../modules/merch-event"
import type MerchEventModuleService from "../modules/merch-event/service"
import { OCCASION_MODULE } from "../modules/occasion"
import type OccasionModuleService from "../modules/occasion/service"
import { HOMEPAGE_SECTION_MODULE } from "../modules/homepage-section"
import type HomepageSectionModuleService from "../modules/homepage-section/service"
import { triggerStorefrontRevalidation } from "../lib/storefront/revalidate"

type EventPayload = { id?: string }

async function resolveRevalidateTags(
  container: SubscriberArgs<EventPayload>["container"],
  eventName: string,
  data: EventPayload
): Promise<string[]> {
  const coarse = ["catalog", "taxonomy"] as string[]
  const commerceCatalog = ["catalog", "storefront", "product"] as string[]

  if (eventName.startsWith("store.")) {
    return [...coarse, "settings", "homepage"]
  }

  if (eventName.startsWith("product.product-category")) {
    return [...coarse, "taxonomy:feelings"]
  }

  if (eventName.startsWith("pricing.")) {
    return [...commerceCatalog, "incentives"]
  }

  if (eventName.startsWith("inventory.")) {
    return commerceCatalog
  }

  if (eventName.startsWith("promotion.")) {
    return ["storefront", "incentives", "catalog"]
  }

  if (eventName.startsWith("product.")) {
    if (!data?.id) {
      return coarse
    }

    try {
      const productModule = container.resolve(Modules.PRODUCT) as {
        retrieveProduct: (id: string, config?: unknown) => Promise<{ handle?: string | null }>
      }
      const product = await productModule.retrieveProduct(data.id, {
        select: ["handle"],
      })
      const handle = product?.handle
      if (handle) {
        // Match Next.js fetch tags in web-next/src/lib/storefront-server.ts (product:${slug}).
        return [...coarse, `catalog:product:${handle}`, `product:${encodeURIComponent(handle)}`]
      }
    } catch {
      // fall through to coarse
    }

    return coarse
  }

  if (eventName.startsWith("occasion.occasion.")) {
    if (!data?.id) {
      return [...coarse, "taxonomy:occasions"]
    }

    try {
      const occasionService = container.resolve<OccasionModuleService>(OCCASION_MODULE)
      const rows = await occasionService.listOccasions({ id: data.id })
      const slug = (rows as Array<{ slug?: string }>)[0]?.slug
      if (slug) {
        return [...coarse, "taxonomy:occasions", `taxonomy:occasion:${slug}`]
      }
    } catch {
      // ignore
    }

    return [...coarse, "taxonomy:occasions"]
  }

  if (eventName.startsWith("merch_event.merch_event.")) {
    if (!data?.id) {
      return coarse
    }

    try {
      const merchService = container.resolve<MerchEventModuleService>(MERCH_EVENT_MODULE)
      const rows = await merchService.listMerchEvents({ id: data.id })
      const slug = (rows as Array<{ slug?: string }>)[0]?.slug
      if (slug) {
        return [...coarse, `catalog:merch_event:${slug}`]
      }
    } catch {
      // ignore
    }

    return coarse
  }

  if (eventName.startsWith("homepage_section.homepage_section.")) {
    if (!data?.id) {
      return ["homepage", "storefront"]
    }

    try {
      const homepageSectionService = container.resolve<HomepageSectionModuleService>(HOMEPAGE_SECTION_MODULE)
      const rows = await homepageSectionService.listHomepageSections({ id: data.id })
      const key = (rows as Array<{ key?: string }>)[0]?.key
      if (key) {
        return ["homepage", "storefront", `homepage:${key}`]
      }
    } catch {
      // ignore
    }

    return ["homepage", "storefront"]
  }

  if (eventName.startsWith("artist.artist.")) {
    if (!data?.id) {
      return [...coarse, "taxonomy:artists"]
    }

    try {
      const artistService = container.resolve<ArtistModuleService>(ARTIST_MODULE)
      const rows = await artistService.listArtists({ id: data.id })
      const slug = (rows as Array<{ slug?: string }>)[0]?.slug
      if (slug) {
        return [...coarse, "taxonomy:artists", `taxonomy:artist:${slug}`]
      }
    } catch {
      // ignore
    }

    return [...coarse, "taxonomy:artists"]
  }

  return coarse
}

export default async function storefrontRevalidateHandler({
  container,
  event,
}: SubscriberArgs<EventPayload>) {
  const logger = container.resolve("logger")

  try {
    const tags = await resolveRevalidateTags(container, event.name, event.data || {})
    await triggerStorefrontRevalidation(tags)
  } catch (error) {
    logger.warn(
      `Failed to trigger storefront revalidation: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

export const config: SubscriberConfig = {
  event: [
    "store.updated",
    "product.created",
    "product.updated",
    "product.deleted",
    "product.product-variant.created",
    "product.product-variant.updated",
    "product.product-variant.deleted",
    "product.product-variant.restored",
    "product.product-variant.attached",
    "product.product-variant.detached",
    "inventory.inventory-level.created",
    "inventory.inventory-level.updated",
    "inventory.inventory-level.deleted",
    "inventory.inventory-level.restored",
    "inventory.inventory-level.attached",
    "inventory.inventory-level.detached",
    "pricing.price-list-rule.created",
    "pricing.price-list.created",
    "pricing.price-rule.created",
    "pricing.price-set.created",
    "pricing.price.created",
    "pricing.price-list-rule.updated",
    "pricing.price-list.updated",
    "pricing.price-rule.updated",
    "pricing.price-set.updated",
    "pricing.price.updated",
    "pricing.price-list-rule.deleted",
    "pricing.price-list.deleted",
    "pricing.price-rule.deleted",
    "pricing.price-set.deleted",
    "pricing.price.deleted",
    "pricing.price-list-rule.restored",
    "pricing.price-list.restored",
    "pricing.price-rule.restored",
    "pricing.price-set.restored",
    "pricing.price.restored",
    "pricing.price-list-rule.attached",
    "pricing.price-list.attached",
    "pricing.price-rule.attached",
    "pricing.price-set.attached",
    "pricing.price.attached",
    "pricing.price-list-rule.detached",
    "pricing.price-list.detached",
    "pricing.price-rule.detached",
    "pricing.price-set.detached",
    "pricing.price.detached",
    "promotion.created",
    "promotion.updated",
    "promotion.deleted",
    "promotion.restored",
    "promotion.promotion.created",
    "promotion.promotion.updated",
    "promotion.promotion.deleted",
    "promotion.promotion.restored",
    "occasion.occasion.created",
    "occasion.occasion.updated",
    "occasion.occasion.deleted",
    "artist.artist.created",
    "artist.artist.updated",
    "artist.artist.deleted",
    "merch_event.merch_event.created",
    "merch_event.merch_event.updated",
    "merch_event.merch_event.deleted",
    "homepage_section.homepage_section.created",
    "homepage_section.homepage_section.updated",
    "homepage_section.homepage_section.deleted",
    "product.product-category.created",
    "product.product-category.updated",
    "product.product-category.deleted",
    "product.product-category.restored",
    "product.product-category.attached",
    "product.product-category.detached",
  ],
}
