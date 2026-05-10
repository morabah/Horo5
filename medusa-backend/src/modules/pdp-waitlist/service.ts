import { MedusaService } from "@medusajs/framework/utils"
import PdpWaitlist from "./models/pdp-waitlist"

class PdpWaitlistModuleService extends MedusaService({
  PdpWaitlist,
}) {}

export default PdpWaitlistModuleService
