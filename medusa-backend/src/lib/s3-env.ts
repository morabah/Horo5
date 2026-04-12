import { S3Client } from "@aws-sdk/client-s3"

/**
 * Resolved S3 / S3-compatible storage settings (Railway bucket presets + explicit S3_*).
 * Used by medusa-config and the public store-media proxy route.
 */
export type ResolvedS3Config = {
  bucket: string
  accessKeyId: string
  secretAccessKey: string
  region: string
  endpoint: string | undefined
  /** Public base URL used in stored file URLs (no trailing slash). */
  fileUrl: string
  forcePathStyle: boolean
}

const STORE_MEDIA_PATH = "/store-media"

/**
 * When `S3_USE_STORE_MEDIA_PROXY=true`, file URLs point at this backend (`MEDUSA_BACKEND_URL` + `/store-media`)
 * so browsers load objects through a server-side GetObject proxy (needed when the bucket is private or ACL is ignored).
 *
 * Order: `S3_FILE_URL` (if set) → proxy base (if enabled) → virtual-host URL from `bucket` + `endpoint`.
 */
export function resolveS3ConfigFromEnv(): ResolvedS3Config | null {
  const bucket =
    process.env.S3_BUCKET || process.env.BUCKET || process.env.AWS_S3_BUCKET_NAME || ""
  const accessKeyId = process.env.S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || ""
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY || ""
  const region = process.env.S3_REGION || process.env.AWS_DEFAULT_REGION || "auto"
  const endpoint =
    process.env.S3_ENDPOINT || process.env.ENDPOINT || process.env.AWS_ENDPOINT_URL || ""

  const backendBase = (process.env.MEDUSA_BACKEND_URL || "").replace(/\/+$/, "")
  const useProxy =
    process.env.S3_USE_STORE_MEDIA_PROXY === "true" || process.env.S3_USE_STORE_MEDIA_PROXY === "1"

  let fileUrl = (process.env.S3_FILE_URL || "").replace(/\/+$/, "")
  if (!fileUrl && useProxy && backendBase) {
    fileUrl = `${backendBase}${STORE_MEDIA_PATH}`
  }
  if (!fileUrl && bucket && endpoint) {
    try {
      const u = new URL(endpoint)
      fileUrl = `https://${bucket}.${u.host}`
    } catch {
      /* ignore */
    }
  }

  if (!bucket || !accessKeyId || !secretAccessKey || !fileUrl) {
    return null
  }

  return {
    bucket,
    accessKeyId,
    secretAccessKey,
    region,
    endpoint: endpoint || undefined,
    fileUrl,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
  }
}

export function createS3Client(config: ResolvedS3Config): S3Client {
  return new S3Client({
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    region: config.region,
    endpoint: config.endpoint,
    ...(config.forcePathStyle ? { forcePathStyle: true } : {}),
  })
}

/** Public path segment for the proxy route (leading slash). */
export function storeMediaPublicPath(): string {
  return STORE_MEDIA_PATH
}

const SAFE_KEY = /^[a-zA-Z0-9._-]+$/

export function isSafePublicS3FileKey(key: string): boolean {
  if (!key || key.length === 0 || key.length > 512) {
    return false
  }
  if (key.includes("/") || key.includes("\\") || key.includes("..")) {
    return false
  }
  return SAFE_KEY.test(key)
}
