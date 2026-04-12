import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

/** Railway / managed Postgres often uses TLS; set only if connections fail with cert errors. */
const databaseSslRejectUnauthorized =
  process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false'

const databaseDriverOptions =
  databaseSslRejectUnauthorized
    ? undefined
    : {
        connection: {
          ssl: { rejectUnauthorized: false },
        },
      }

/**
 * Railway "Storage Bucket" presets use BUCKET, ENDPOINT, AWS_*.
 * Explicit S3_* vars still work (e.g. local .env).
 */
function s3ConfigFromEnv() {
  const bucket =
    process.env.S3_BUCKET ||
    process.env.BUCKET ||
    process.env.AWS_S3_BUCKET_NAME ||
    ""
  const accessKeyId =
    process.env.S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || ""
  const secretAccessKey =
    process.env.S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY || ""
  const region =
    process.env.S3_REGION || process.env.AWS_DEFAULT_REGION || "auto"
  const endpoint =
    process.env.S3_ENDPOINT ||
    process.env.ENDPOINT ||
    process.env.AWS_ENDPOINT_URL ||
    ""

  let fileUrl = (process.env.S3_FILE_URL || "").replace(/\/+$/, "")
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

const s3 = s3ConfigFromEnv()

const fileModule = s3
  ? {
      resolve: "@medusajs/medusa/file" as const,
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/file-s3" as const,
            id: "s3",
            options: {
              file_url: s3.fileUrl,
              access_key_id: s3.accessKeyId,
              secret_access_key: s3.secretAccessKey,
              region: s3.region,
              bucket: s3.bucket,
              ...(s3.endpoint ? { endpoint: s3.endpoint } : {}),
              ...(s3.forcePathStyle
                ? {
                    additional_client_config: {
                      forcePathStyle: true,
                    },
                  }
                : {}),
            },
          },
        ],
      },
    }
  : null

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    ...(databaseDriverOptions ? { databaseDriverOptions } : {}),
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET!,
      cookieSecret: process.env.COOKIE_SECRET!,
    },
  },
  modules: [
    ...(fileModule ? [fileModule] : []),
    {
      resolve: "./src/modules/feeling",
    },
    {
      resolve: "./src/modules/subfeeling",
    },
    {
      resolve: "./src/modules/artist",
    },
    {
      resolve: "./src/modules/occasion",
    },
    {
      resolve: "./src/modules/merch-event",
    },
  ],
  admin: {
    backendUrl: process.env.MEDUSA_BACKEND_URL,
  },
})
