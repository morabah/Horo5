import { MedusaService } from "@medusajs/framework/utils"

import ObjectionLog from "./models/objection-log"

class ObjectionLogModuleService extends MedusaService({
  ObjectionLog,
}) {}

export default ObjectionLogModuleService
