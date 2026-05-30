import { MedusaService } from "@medusajs/framework/utils"

import StorefrontAbandonedCart from "./models/storefront-abandoned-cart"

class StorefrontAbandonedCartModuleService extends MedusaService({
  StorefrontAbandonedCart,
}) {}

export default StorefrontAbandonedCartModuleService
