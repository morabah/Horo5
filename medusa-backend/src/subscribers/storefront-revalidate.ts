import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"

import { ARTIST_MODULE } from "../modules/artist"
import type ArtistModuleService from "../modules/artist/service"
import { MERCH_EVENT_MODULE } from "../modules/merch-event"
import type MerchEventModuleService from "../modules/merch-event/service"
import { OCCASION_MODULE } from "../modules/occasion"
import type OccasionModuleService from "../modules/occasion/service"
import { triggerStorefrontRevalidation } from "../lib/storefront/revalidate"

type EventPayload = { id?: string }

async function resolveRevalidateTags(
  container: SubscriberArgs<EventPayload>["container"],
  eventName: string,
  data: EventPayload
): Promise<string[]> {
  const coarse = ["catalog", "taxonomy"] as string[]

  if (eventName.startsWith("store.")) {
    return [...coarse, "settings"]
  }

  if (eventName.startsWith("product.product-category")) {
    return [...coarse, "taxonomy:feelings"]
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
    "occasion.occasion.created",
    "occasion.occasion.updated",
    "occasion.occasion.deleted",
    "artist.artist.created",
    "artist.artist.updated",
    "artist.artist.deleted",
    "merch_event.merch_event.created",
    "merch_event.merch_event.updated",
    "merch_event.merch_event.deleted",
    "product.product-category.created",
    "product.product-category.updated",
    "product.product-category.deleted",
    "product.product-category.restored",
    "product.product-category.attached",
    "product.product-category.detached",
  ],
}
