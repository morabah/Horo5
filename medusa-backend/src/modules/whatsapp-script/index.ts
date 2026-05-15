import { Module } from "@medusajs/framework/utils"

import WhatsappScriptModuleService from "./service"

export const WHATSAPP_SCRIPT_MODULE = "whatsapp_script"

export default Module(WHATSAPP_SCRIPT_MODULE, {
  service: WhatsappScriptModuleService,
})
