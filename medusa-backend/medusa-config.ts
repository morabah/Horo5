import { loadEnv, defineConfig } from '@medusajs/framework/utils'

import { resolveS3ConfigFromEnv } from "./src/lib/s3-env"

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

/** Railway "Storage Bucket" presets use BUCKET, ENDPOINT, AWS_*; see `src/lib/s3-env.ts`. */
const s3 = resolveS3ConfigFromEnv()

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
