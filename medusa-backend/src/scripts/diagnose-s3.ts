import { HeadBucketCommand, ListObjectsV2Command } from "@aws-sdk/client-s3"
import { loadEnv } from "@medusajs/framework/utils"
import type { ExecArgs } from "@medusajs/framework/types"

import { createS3Client, resolveS3ConfigFromEnv, storeMediaPublicPath } from "../lib/s3-env"

function redact(config: NonNullable<ReturnType<typeof resolveS3ConfigFromEnv>>) {
  return {
    bucket: config.bucket,
    accessKeyId: `${config.accessKeyId.slice(0, 4)}…${config.accessKeyId.slice(-2)}`,
    secretAccessKey: "(set)",
    region: config.region,
    endpoint: config.endpoint ?? "(default)",
    fileUrl: config.fileUrl,
    forcePathStyle: config.forcePathStyle,
    storeMediaPath: storeMediaPublicPath(),
    proxyEnv: process.env.S3_USE_STORE_MEDIA_PROXY ?? "(unset)",
    medusaBackendUrl: process.env.MEDUSA_BACKEND_URL ? "(set)" : "(unset)",
  }
}

/**
 * Prints resolved S3 env (redacted) and runs HeadBucket + optional ListObjectsV2.
 * Run: npx medusa exec ./src/scripts/diagnose-s3.ts
 */
export default async function diagnoseS3(_args: ExecArgs) {
  loadEnv(process.env.NODE_ENV || "development", process.cwd())

  const config = resolveS3ConfigFromEnv()
  if (!config) {
    // eslint-disable-next-line no-console
    console.log(
      "S3: not fully configured (need bucket + access keys + file URL, or enable S3_USE_STORE_MEDIA_PROXY with MEDUSA_BACKEND_URL)."
    )
    return
  }

  // eslint-disable-next-line no-console
  console.log("S3 resolved config:", JSON.stringify(redact(config), null, 2))

  const client = createS3Client(config)
  await client.send(new HeadBucketCommand({ Bucket: config.bucket }))

  const listed = await client.send(
    new ListObjectsV2Command({ Bucket: config.bucket, MaxKeys: 5 })
  )
  const keys = (listed.Contents || []).map((o) => o.Key).filter(Boolean)
  // eslint-disable-next-line no-console
  console.log("HeadBucket: ok. Sample keys (up to 5):", keys.length ? keys : "(empty)")
}
