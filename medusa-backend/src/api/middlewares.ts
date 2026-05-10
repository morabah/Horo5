import {
  defineMiddlewares,
  type MedusaNextFunction,
  type MedusaRequest,
  type MedusaResponse,
} from "@medusajs/framework/http"
import multer from "multer"

const dropsUpload = multer({ storage: multer.memoryStorage() })

const PUBLIC_STOREFRONT_CACHE_MAX_AGE = parseInt(
  process.env.STOREFRONT_PUBLIC_CACHE_MAX_AGE || "60",
  10
) || 60

/**
 * Sets Cache-Control on safe, public storefront GET responses.
 * Allows CDN / edge caching without exposing private data.
 */
function storefrontCacheControl(req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) {
  if (req.method === "GET" || req.method === "HEAD") {
    const maxAge = PUBLIC_STOREFRONT_CACHE_MAX_AGE
    res.setHeader(
      "Cache-Control",
      `public, max-age=${maxAge}, s-maxage=${maxAge}, stale-while-revalidate=300`
    )
  }
  next()
}

/**
 * Medusa's built-in CORS covers /store/* but not custom /storefront/* routes.
 * Apply store CORS origins to /storefront/* so browser fetch() from the storefront works.
 */
function storefrontCors(req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) {
  const origin = req.headers.origin || ""
  const storeCors = String(process.env.STORE_CORS || "").split(",").map((s) => s.trim()).filter(Boolean)
  const allowed = storeCors.length > 0 ? storeCors : ["*"]
  const isAllowed = allowed.includes(origin) || allowed.includes("*")

  if (isAllowed) {
    res.setHeader("Access-Control-Allow-Origin", origin || "*")
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-publishable-api-key, Authorization")
  res.setHeader("Access-Control-Allow-Credentials", "true")

  if (req.method === "OPTIONS") {
    res.status(204).end()
    return
  }
  next()
}

/**
 * Logs request duration to help trace slow Railway responses.
 *
 * - Default: log only when duration ≥ HORO_LOG_SLOW_MS (default 500).
 * - Set HORO_HTTP_TIMING=all to log every matched request.
 */
function httpRequestTiming(req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) {
  const mode = String(process.env.HORO_HTTP_TIMING || "").trim().toLowerCase()
  const logAll = mode === "all" || mode === "1" || mode === "true"
  const slowMsRaw = String(process.env.HORO_LOG_SLOW_MS ?? "500").trim()
  const slowMs = Math.max(0, Number(slowMsRaw) || 500)

  const started = performance.now()
  const path = (req as { originalUrl?: string }).originalUrl ?? req.url ?? ""

  res.once("finish", () => {
    const durationMs = Math.round(performance.now() - started)
    const structured =
      String(process.env.HORO_HTTP_STRUCTURED_LOG || "").trim() === "1" ||
      String(process.env.HORO_HTTP_STRUCTURED_LOG || "").trim().toLowerCase() === "true"
    if (!logAll && durationMs < slowMs && !structured) {
      return
    }

    const line = [
      "horo_http_timing",
      `method=${req.method}`,
      `path=${path}`,
      `status=${res.statusCode}`,
      `duration_ms=${durationMs}`,
    ].join(" ")

    let wrote = false
    try {
      const logger = req.scope?.resolve("logger") as { info?: (msg: string) => void } | undefined
      if (typeof logger?.info === "function") {
        logger.info(line)
        wrote = true
      }
    } catch {
      /* scope may be unavailable in edge cases */
    }

    if (!wrote) {
      console.info(line)
    }

    if (structured) {
      const payload = JSON.stringify({
        type: "horo_http_request",
        method: req.method,
        path,
        status: res.statusCode,
        duration_ms: durationMs,
      })
      try {
        const logger = req.scope?.resolve("logger") as { info?: (msg: string) => void } | undefined
        if (typeof logger?.info === "function") {
          logger.info(payload)
        } else {
          console.info(payload)
        }
      } catch {
        console.info(payload)
      }
    }
  })

  next()
}

export default defineMiddlewares({
  routes: [
    {
      matcher: /^\/storefront(\/|$)/,
      middlewares: [storefrontCors, storefrontCacheControl, httpRequestTiming],
    },
    {
      matcher: /^\/(store|admin|store-media|integrations)(\/|$)/,
      middlewares: [httpRequestTiming],
    },
    {
      method: ["POST"],
      matcher: "/admin/custom/drops/upload",
      middlewares: [dropsUpload.array("files")],
    },
  ],
})
