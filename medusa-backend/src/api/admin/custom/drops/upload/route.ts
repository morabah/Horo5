import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { uploadDropFiles } from "../../../../../lib/drops/upload"
import type { DropUploadFileInput } from "../../../../../lib/drops/types"
import { assertTaxonomyAdminWrite } from "../../taxonomy-auth"

type MulterFile = {
  originalname: string
  mimetype: string
  buffer: Buffer
}

type UploadRequest = MedusaRequest & {
  files?: MulterFile[]
}

export async function POST(req: UploadRequest, res: MedusaResponse) {
  if (!assertTaxonomyAdminWrite(req, res)) {
    return
  }

  const multipartFiles = (req.files ?? []).map((file) => ({
    filename: file.originalname,
    mimeType: file.mimetype,
    content: file.buffer.toString("base64"),
  }))
  const body = (req.body || {}) as { files?: DropUploadFileInput[] }
  const jsonFiles = Array.isArray(body.files) ? body.files : []
  const files = multipartFiles.length ? multipartFiles : jsonFiles

  if (!files.length) {
    res.status(400).json({ message: "No files were uploaded." })
    return
  }

  const uploaded = await uploadDropFiles(req.scope, files)
  res.status(200).json({ files: uploaded })
}
