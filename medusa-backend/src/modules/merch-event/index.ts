import { Module } from "@medusajs/framework/utils"

import MerchEventModuleService from "./service"

export const MERCH_EVENT_MODULE = "merch_event"

export default Module(MERCH_EVENT_MODULE, {
  service: MerchEventModuleService,
})
