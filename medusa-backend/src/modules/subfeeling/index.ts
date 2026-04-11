import { Module } from "@medusajs/framework/utils"

import SubfeelingModuleService from "./service"

export const SUBFEELING_MODULE = "subfeeling"

export default Module(SUBFEELING_MODULE, {
  service: SubfeelingModuleService,
})
