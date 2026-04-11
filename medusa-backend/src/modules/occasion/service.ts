import { MedusaService } from "@medusajs/framework/utils"

import Occasion from "./models/occasion"

class OccasionModuleService extends MedusaService({
  Occasion,
}) {}

export default OccasionModuleService
