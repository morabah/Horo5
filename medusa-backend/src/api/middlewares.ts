import {
  defineMiddlewares,
  type MedusaNextFunction,
  type MedusaRequest,
  type MedusaResponse,
} from "@medusajs/framework/http"

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
    if (!logAll && durationMs < slowMs) {
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
  })

  next()
}

export default defineMiddlewares({
  routes: [
    {
      matcher: /^\/(store|admin|storefront|store-media)(\/|$)/,
      middlewares: [httpRequestTiming],
    },
  ],
})
