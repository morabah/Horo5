import { MedusaService } from "@medusajs/framework/utils"

import Subfeeling from "./models/subfeeling"

class SubfeelingModuleService extends MedusaService({
  Subfeeling,
}) {}

export default SubfeelingModuleService
