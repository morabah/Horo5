import { GetObjectCommand } from "@aws-sdk/client-s3"
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Readable } from "stream"

import { createS3Client, isSafePublicS3FileKey, resolveS3ConfigFromEnv } from "../../../lib/s3-env"

/**
 * Public GET proxy for S3 objects when the bucket is private or ACL public-read is ignored.
 * URLs stored by the file module must use `S3_FILE_URL` or `S3_USE_STORE_MEDIA_PROXY` (see `src/lib/s3-env.ts`).
 */
export async function GET(req: MedusaRequest<{ key: string }>, res: MedusaResponse) {
  const config = resolveS3ConfigFromEnv()
  if (!config) {
    res.status(503).json({ message: "File storage is not configured" })
    return
  }

  const raw = req.params.key || ""
  let key: string
  try {
    key = decodeURIComponent(raw)
  } catch {
    res.status(400).json({ message: "Invalid key" })
    return
  }

  if (!isSafePublicS3FileKey(key)) {
    res.status(400).json({ message: "Invalid key" })
    return
  }

  const client = createS3Client(config)

  try {
    const out = await client.send(
      new GetObjectCommand({
        Bucket: config.bucket,
        Key: key,
      })
    )

    const body = out.Body
    if (!body) {
      res.status(404).end()
      return
    }

    const contentType = out.ContentType || "application/octet-stream"
    res.setHeader("Content-Type", contentType)
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable")

    const stream = body as Readable
    stream.on("error", () => {
      if (!res.headersSent) {
        res.status(500).end()
      }
    })
    stream.pipe(res as unknown as NodeJS.WritableStream)
  } catch (e: unknown) {
    const name = e && typeof e === "object" && "name" in e ? String((e as { name?: string }).name) : ""
    if (name === "NoSuchKey" || name === "NotFound") {
      res.status(404).end()
      return
    }
    throw e
  }
}
