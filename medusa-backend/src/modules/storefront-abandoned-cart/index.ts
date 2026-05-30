import { Module } from "@medusajs/framework/utils"

import StorefrontAbandonedCartModuleService from "./service"

export const STOREFRONT_ABANDONED_CART_MODULE = "storefrontAbandonedCart"

export default Module(STOREFRONT_ABANDONED_CART_MODULE, {
  service: StorefrontAbandonedCartModuleService,
})
