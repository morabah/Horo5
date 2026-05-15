import { MedusaService } from "@medusajs/framework/utils"

import ValidationRegisterEntry from "./models/validation-register-entry"

class ValidationRegisterModuleService extends MedusaService({
  ValidationRegisterEntry,
}) {}

export default ValidationRegisterModuleService
