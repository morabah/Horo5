import { MedusaService } from "@medusajs/framework/utils"

import Feeling from "./models/feeling"

class FeelingModuleService extends MedusaService({
  Feeling,
}) {}

export default FeelingModuleService
