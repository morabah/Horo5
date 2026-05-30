import { MedusaService } from "@medusajs/framework/utils"

import StorefrontWishlist from "./models/storefront-wishlist"

class StorefrontWishlistModuleService extends MedusaService({
  StorefrontWishlist,
}) {}

export default StorefrontWishlistModuleService
