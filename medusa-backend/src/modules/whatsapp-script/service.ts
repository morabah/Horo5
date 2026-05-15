import { MedusaService } from "@medusajs/framework/utils"

import WhatsappScript from "./models/whatsapp-script"

class WhatsappScriptModuleService extends MedusaService({
  WhatsappScript,
}) {}

export default WhatsappScriptModuleService
