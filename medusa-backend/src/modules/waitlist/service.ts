import { MedusaService } from "@medusajs/framework/utils"

import Waitlist from "./models/waitlist"

class WaitlistModuleService extends MedusaService({
  Waitlist,
}) {}

export default WaitlistModuleService
