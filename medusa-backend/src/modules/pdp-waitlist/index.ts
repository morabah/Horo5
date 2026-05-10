import { Module } from "@medusajs/framework/utils"
import PdpWaitlistModuleService from "./service"

export const PDP_WAITLIST_MODULE = "pdpWaitlist"

export default Module(PDP_WAITLIST_MODULE, {
  service: PdpWaitlistModuleService,
})
