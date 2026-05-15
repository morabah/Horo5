import { Module } from "@medusajs/framework/utils"

import ValidationRegisterModuleService from "./service"

export const VALIDATION_REGISTER_MODULE = "validation_register"

export default Module(VALIDATION_REGISTER_MODULE, {
  service: ValidationRegisterModuleService,
})
