import { MedusaService } from "@medusajs/framework/utils"

import MerchEvent from "./models/merch-event"

class MerchEventModuleService extends MedusaService({
  MerchEvent,
}) {}

export default MerchEventModuleService
