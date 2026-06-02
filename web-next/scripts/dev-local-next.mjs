#!/usr/bin/env node
/**
 * Waits for Medusa /health, starts Next, then prints storefront/backend URLs when ready.
 */
import { spawn } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { DEV_LOCAL_LINKS, printDevLocalReadyBanner } from "./dev-local-links.mjs"

const MEDUSA_HEALTH_URL = DEV_LOCAL_LINKS.health
const STOREFRONT_PROBE_URL = "http://127.0.0.1:3000/"
const WAIT_TIMEOUT_MS = 180_000
const STOREFRONT_WAIT_MS = 240_000
const POLL_INTERVAL_MS = 1_000
const FETCH_TIMEOUT_MS = 8_000

const webNextRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const devLocalStartedAt = Date.now()

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function urlOk(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) })
    return res.ok
  } catch {
    return false
  }
}

async function waitForMedusaHealth() {
  const started = Date.now()
  let attempt = 0

  while (Date.now() - started < WAIT_TIMEOUT_MS) {
    attempt += 1
    if (await urlOk(MEDUSA_HEALTH_URL)) return

    if (attempt === 1 || attempt % 15 === 0) {
      console.log(`[dev:local] Waiting for backend (Medusa) at ${MEDUSA_HEALTH_URL}…`)
    }
    await sleep(POLL_INTERVAL_MS)
  }

  console.error(
    `[dev:local] Backend did not respond on ${MEDUSA_HEALTH_URL} within ${WAIT_TIMEOUT_MS / 1000}s.`,
  )
  console.error("[dev:local] Check the [backend] log (DB, Redis, or API route import errors).")
  process.exit(1)
}

async function waitForStorefrontAndPrintBanner() {
  const started = Date.now()

  while (Date.now() - started < STOREFRONT_WAIT_MS) {
    if (await urlOk(STOREFRONT_PROBE_URL)) {
      const elapsed = ((Date.now() - devLocalStartedAt) / 1000).toFixed(1)
      printDevLocalReadyBanner(elapsed)
      return
    }
    await sleep(POLL_INTERVAL_MS)
  }

  console.warn("")
  console.warn("[dev:local] Storefront did not respond in time.")
  console.warn(`  Try opening: ${DEV_LOCAL_LINKS.frontend}`)
  console.warn(`  Backend:    ${DEV_LOCAL_LINKS.backend}`)
  console.warn("")
}

await waitForMedusaHealth()

void waitForStorefrontAndPrintBanner()

const child = spawn(
  "npx",
  [
    "dotenv-cli",
    "-e",
    ".env.local",
    "-v",
    "NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000",
    "--",
    "next",
    "dev",
    "--webpack",
  ],
  { cwd: webNextRoot, stdio: "inherit", shell: true },
)

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal)
  process.exit(code ?? 1)
})
