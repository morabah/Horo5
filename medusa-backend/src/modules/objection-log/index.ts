import { Module } from "@medusajs/framework/utils"

import ObjectionLogModuleService from "./service"

export const OBJECTION_LOG_MODULE = "objection_log"

export default Module(OBJECTION_LOG_MODULE, {
  service: ObjectionLogModuleService,
})
