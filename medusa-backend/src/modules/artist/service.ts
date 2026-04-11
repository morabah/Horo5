import { MedusaService } from "@medusajs/framework/utils"

import Artist from "./models/artist"

class ArtistModuleService extends MedusaService({
  Artist,
}) {}

export default ArtistModuleService
