import { loadEnv, defineConfig } from '@medusajs/framework/utils'

import { resolveS3ConfigFromEnv } from "./src/lib/s3-env"

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

if (process.env.NODE_ENV === "production" && !process.env.REDIS_URL?.trim()) {
  throw new Error("REDIS_URL is required in production for the Medusa event bus and distributed locks.")
}

/** Railway / managed Postgres often uses TLS; set only if connections fail with cert errors. */
const databaseSslRejectUnauthorized =
  process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false'

/** Connection pool size: tune based on Railway plan (default: 10, max recommended: 20 for hobby). */
const poolMin = parseInt(process.env.DATABASE_POOL_MIN || '2', 10)
const poolMax = parseInt(process.env.DATABASE_POOL_MAX || '10', 10)

const databaseDriverOptions = {
  connection: {
    ...(databaseSslRejectUnauthorized ? {} : { ssl: { rejectUnauthorized: false } }),
  },
  pool: {
    min: poolMin,
    max: poolMax,
    acquireTimeoutMillis: 30000,
    idleTimeoutMillis: 30000,
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

const redisUrl = process.env.REDIS_URL?.trim()
const cacheRedisUrl = process.env.CACHE_REDIS_URL?.trim() || redisUrl

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

const instapayProviderOptions = {
  payoutPhone: process.env.INSTAPAY_PAYOUT_PHONE?.trim(),
  payoutIban: process.env.INSTAPAY_PAYOUT_IBAN?.trim(),
  payoutBankLabel: process.env.INSTAPAY_PAYOUT_BANK_LABEL?.trim(),
}

const paymentModuleProviders = [
  {
    resolve: "./src/modules/instapay" as const,
    id: "instapay",
    options: instapayProviderOptions,
  },
  ...(paymobConfig
    ? [
        {
          resolve: "./src/modules/paymob" as const,
          id: "paymob",
          options: paymobConfig,
        },
      ]
    : []),
]

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    databaseDriverOptions,
    ...(redisUrl ? { redisUrl } : {}),
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
    ...(redisUrl
      ? [
          {
            resolve: "@medusajs/medusa/event-bus-redis",
            options: {
              redisUrl,
            },
          },
          {
            resolve: "@medusajs/medusa/locking",
            options: {
              providers: [
                {
                  resolve: "@medusajs/locking-redis",
                  id: "locking-redis",
                  is_default: true,
                  options: {
                    redisUrl,
                  },
                },
              ],
            },
          },
        ]
      : []),
    ...(cacheRedisUrl
      ? [
          {
            resolve: "@medusajs/medusa/caching",
            options: {
              ttl: 300,
              providers: [
                {
                  resolve: "@medusajs/caching-redis",
                  id: "caching-redis",
                  is_default: true,
                  options: {
                    redisUrl: cacheRedisUrl,
                  },
                },
              ],
            },
          },
        ]
      : []),
    {
      resolve: "@medusajs/payment",
      options: {
        providers: paymentModuleProviders,
      },
    },
    {
      resolve: "@medusajs/promotion",
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
