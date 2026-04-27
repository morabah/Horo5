import { Module } from "@medusajs/framework/utils"

import HomepageSectionModuleService from "./service"

export const HOMEPAGE_SECTION_MODULE = "homepage_section"

export default Module(HOMEPAGE_SECTION_MODULE, {
  service: HomepageSectionModuleService,
})
