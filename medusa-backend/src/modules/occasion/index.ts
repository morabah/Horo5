import { Module } from "@medusajs/framework/utils"

import OccasionModuleService from "./service"

export const OCCASION_MODULE = "occasion"

export default Module(OCCASION_MODULE, {
  service: OccasionModuleService,
})
