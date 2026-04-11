import { Module } from "@medusajs/framework/utils"

import FeelingModuleService from "./service"

export const FEELING_MODULE = "feeling"

export default Module(FEELING_MODULE, {
  service: FeelingModuleService,
})
