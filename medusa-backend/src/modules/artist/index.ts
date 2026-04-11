import { Module } from "@medusajs/framework/utils"

import ArtistModuleService from "./service"

export const ARTIST_MODULE = "artist"

export default Module(ARTIST_MODULE, {
  service: ArtistModuleService,
})
