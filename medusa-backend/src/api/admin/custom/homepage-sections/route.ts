import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { revalidateStorefrontForDrop } from "../../../../lib/drops/revalidate-storefront"
import {
  homepageSectionInputToRecord,
  listAdminHomepageSections,
  normalizeHomepageSectionInput,
  retrieveAdminHomepageSection,
} from "../../../../lib/homepage-sections/admin"
import type { HomepageSectionInput, HomepageSectionType } from "../../../../lib/homepage-sections/types"
import { clearStorefrontHomepageCache } from "../../../../lib/storefront/homepage"
import { HOMEPAGE_SECTION_MODULE } from "../../../../modules/homepage-section"
import type HomepageSectionModuleService from "../../../../modules/homepage-section/service"
import { assertTaxonomyAdminWrite } from "../taxonomy-auth"

function parseBoolean(value: unknown): boolean | undefined {
  if (Array.isArray(value)) return parseBoolean(value[0])
  if (typeof value !== "string") return undefined
  const normalized = value.trim().toLowerCase()
  if (["1", "true", "yes", "active"].includes(normalized)) return true
  if (["0", "false", "no", "inactive"].includes(normalized)) return false
  return undefined
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const result = await listAdminHomepageSections(req.scope, {
    type: typeof req.query.type === "string" ? req.query.type as HomepageSectionType : undefined,
    active: parseBoolean(req.query.active),
  })

  res.status(200).json(result)
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  if (!assertTaxonomyAdminWrite(req, res)) {
    return
  }

  const body = (req.body || {}) as HomepageSectionInput
  const normalized = normalizeHomepageSectionInput(body, "create")
  if (!normalized.ok) {
    res.status(400).json({ message: "Invalid homepage section input.", issues: normalized.issues })
    return
  }

  const key = normalized.data.key
  const service = req.scope.resolve<HomepageSectionModuleService>(HOMEPAGE_SECTION_MODULE)
  const duplicate = key ? await service.listHomepageSections({ key }) : []
  if ((duplicate as Array<{ id?: string }>).length > 0) {
    res.status(409).json({ message: `A homepage section with key "${key}" already exists.` })
    return
  }

  await service.createHomepageSections(homepageSectionInputToRecord(normalized.data))

  const section = key ? await retrieveAdminHomepageSection(req.scope, key) : null
  clearStorefrontHomepageCache()
  revalidateStorefrontForDrop("*")
  res.status(201).json({ section })
}
