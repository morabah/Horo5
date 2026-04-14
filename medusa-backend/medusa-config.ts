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

const paymobConfig = (() => {
  const apiKey = process.env.PAYMOB_API_KEY?.trim()
  const hmacSecret = process.env.PAYMOB_HMAC_SECRET?.trim()
  const cardIntegrationId = process.env.PAYMOB_CARD_INTEGRATION_ID?.trim()
  const applePayIntegrationId = process.env.PAYMOB_APPLE_PAY_INTEGRATION_ID?.trim()
  const googlePayIntegrationId = process.env.PAYMOB_GOOGLE_PAY_INTEGRATION_ID?.trim()
  const backendUrl = process.env.MEDUSA_BACKEND_URL?.trim()
  const storeUrl =
    process.env.STORE_URL?.trim() ||
    process.env.STORE_CORS?.split(",")[0]?.trim() ||
    undefined

  if (!apiKey || !hmacSecret || !cardIntegrationId || !backendUrl || !storeUrl) {
    return null
  }

  return {
    apiKey,
    applePayIntegrationId,
    hmacSecret,
    cardIntegrationId,
    backendUrl,
    googlePayIntegrationId,
    storeUrl,
  }
})()

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    ...(databaseDriverOptions ? { databaseDriverOptions } : {}),
    ...(process.env.REDIS_URL ? { redisUrl: process.env.REDIS_URL } : {}),
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET!,
      cookieSecret: process.env.COOKIE_SECRET!,
    },
  },
  ...(process.env.REDIS_URL
    ? {
        eventBusModule: {
          resolve: "@medusajs/medusa/event-bus-redis",
          options: {
            redisUrl: process.env.REDIS_URL,
          },
        },
      }
    : {}),
  modules: [
    ...(fileModule ? [fileModule] : []),
    {
      resolve: "@medusajs/payment",
      options: {
        providers: paymobConfig
          ? [
              {
                resolve: "./src/modules/paymob",
                id: "paymob",
                options: paymobConfig,
              },
            ]
          : [],
      },
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
