import { Module } from "@medusajs/framework/utils"

import StorefrontWishlistModuleService from "./service"

export const STOREFRONT_WISHLIST_MODULE = "storefrontWishlist"

export default Module(STOREFRONT_WISHLIST_MODULE, {
  service: StorefrontWishlistModuleService,
})
