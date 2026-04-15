import path from "node:path"
import { loadEnvConfig } from "@next/env"
import { defineConfig, devices } from "@playwright/test"

loadEnvConfig(path.join(__dirname))

const host = "127.0.0.1"
const port = Number(process.env.E2E_PORT || "3005")
const baseURL = process.env.PLAYWRIGHT_BASE_URL || `http://${host}:${port}`

/**
 * Headless E2E: Playwright defaults to headless; we never open a visible browser here.
 * Starts Next on `E2E_PORT` (default 3005) unless `PLAYWRIGHT_SKIP_WEBSERVER=1` and you run the app yourself.
 */
export default defineConfig({
  testDir: "e2e",
  timeout: 120_000,
  expect: { timeout: 20_000 },
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["list"]],
  use: {
    baseURL,
    headless: true,
    trace: "on-first-retry",
    actionTimeout: 30_000,
    navigationTimeout: 60_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER
    ? undefined
    : {
        command: `npm run sync:public && npx next dev --webpack -H ${host} -p ${String(port)}`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
        stdout: "pipe",
        stderr: "pipe",
      },
})
