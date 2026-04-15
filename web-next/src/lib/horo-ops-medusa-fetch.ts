/**
 * Server-only: Medusa backend base URL for admin custom routes.
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const OPS_SECRET_KEY = ["HORO", "_OPS", "_BACKEND", "_SECRET"].join("")
const PUBLISHABLE_KEY = ["NEXT", "_PUBLIC", "_MEDUSA", "_PUBLISHABLE", "_KEY"].join("")

function envTrim(key: string): string {
  const v = process.env[key]
  return typeof v === "string" ? v.trim() : ""
}

/**
 * Parse KEY=value from a dotenv-style file (minimal; no multiline values).
 */
function readEnvFileValue(filePath: string, key: string): string {
  try {
    const raw = fs.readFileSync(filePath, "utf8")
    for (const line of raw.split(/\r?\n/)) {
      const t = line.trim()
      if (!t || t.startsWith("#")) continue
      const eq = t.indexOf("=")
      if (eq <= 0) continue
      const k = t.slice(0, eq).trim()
      if (k !== key) continue
      let val = t.slice(eq + 1).trim()
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1)
      }
      return val.replace(/^\ufeff/, "").replace(/\r$/, "").trim()
    }
  } catch {
    /* missing file or unreadable */
  }
  return ""
}

let cachedOpsSecret: string | undefined
let cachedPublishableKey: string | undefined

/**
 * Read HORO ops secret at runtime (avoid Next/Webpack replacing `process.env.*` at compile time with
 * `undefined` when the var was added to `.env.local` after the first dev compile).
 *
 * In **development**, if `process.env` is still empty, falls back to reading `web-next/.env.local`
 * from disk (same directory Next uses as `cwd` for `next dev`).
 */
export function horoOpsBackendSecret(): string {
  if (cachedOpsSecret !== undefined) return cachedOpsSecret

  let s = envTrim(OPS_SECRET_KEY)
  if (!s && process.env.NODE_ENV !== "production") {
    /** Stable path even when `process.cwd()` is the monorepo root or another package. */
    let besideModule = ""
    try {
      besideModule = path.join(path.dirname(fileURLToPath(import.meta.url)), "../../.env.local")
    } catch {
      /* import.meta.url unavailable in rare bundles */
    }
    const candidates = [
      besideModule,
      path.join(process.cwd(), ".env.local"),
      path.join(process.cwd(), "web-next", ".env.local"),
    ]
    for (const p of candidates) {
      if (!p) continue
      s = readEnvFileValue(p, OPS_SECRET_KEY)
      if (s) break
    }
  }

  if (s) {
    cachedOpsSecret = s
  }
  return s
}

export function medusaBackendBaseUrl(): string {
  const raw =
    envTrim("MEDUSA_BACKEND_URL") || envTrim("NEXT_PUBLIC_MEDUSA_BACKEND_URL") || ""
  return raw.replace(/\/+$/, "")
}

/**
 * Store-scoped Medusa routes require `x-publishable-api-key` (same as storefront).
 */
export function medusaPublishableKey(): string {
  if (cachedPublishableKey !== undefined) return cachedPublishableKey

  let s = envTrim(PUBLISHABLE_KEY) || envTrim("MEDUSA_PUBLISHABLE_KEY")
  if (!s && process.env.NODE_ENV !== "production") {
    let besideModule = ""
    try {
      besideModule = path.join(path.dirname(fileURLToPath(import.meta.url)), "../../.env.local")
    } catch {
      /* ignore */
    }
    const candidates = [
      besideModule,
      path.join(process.cwd(), ".env.local"),
      path.join(process.cwd(), "web-next", ".env.local"),
    ]
    for (const p of candidates) {
      if (!p) continue
      s = readEnvFileValue(p, PUBLISHABLE_KEY)
      if (s) break
    }
  }

  if (s) {
    cachedPublishableKey = s
  }
  return s
}
