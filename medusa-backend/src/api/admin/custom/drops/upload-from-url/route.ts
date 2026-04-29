import path from "node:path"
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { dropMimeType, uploadDropFiles } from "../../../../../lib/drops/upload"
import { assertTaxonomyAdminWrite } from "../../taxonomy-auth"

function filenameFromUrl(url: URL): string {
  const base = path.basename(url.pathname)
  return base && base.includes(".") ? base : "drop-image.jpg"
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  if (!assertTaxonomyAdminWrite(req, res)) {
    return
  }

  const body = (req.body || {}) as { url?: string; filename?: string }
  const rawUrl = body.url?.trim()

  if (!rawUrl) {
    res.status(400).json({ message: "url is required." })
    return
  }

  let parsed: URL
  try {
    parsed = new URL(rawUrl)
  } catch {
    res.status(400).json({ message: "url must be a valid URL." })
    return
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    res.status(400).json({ message: "Only http and https URLs are allowed." })
    return
  }

  const response = await fetch(parsed)
  if (!response.ok) {
    res.status(400).json({ message: `Could not fetch URL (${response.status}).` })
    return
  }

  const mimeType = response.headers.get("content-type")?.split(";")[0]?.trim() || ""
  if (mimeType && !mimeType.startsWith("image/")) {
    res.status(400).json({ message: `URL returned ${mimeType}; expected an image.` })
    return
  }

  const buffer = Buffer.from(await response.arrayBuffer())
  const filename = body.filename?.trim() || filenameFromUrl(parsed)
  const uploaded = await uploadDropFiles(req.scope, [{
    filename,
    mimeType: mimeType || dropMimeType(filename),
    content: buffer.toString("base64"),
  }])

  res.status(200).json({ files: uploaded })
}
