/**
 * Frees Medusa (9000) and Next dev (3000) before `npm run dev:local`.
 * Uses kill-port so Windows/macOS/Linux behave consistently.
 */
import killPort from "kill-port"

const ports = process.argv.slice(2).map((p) => Number.parseInt(p, 10)).filter((n) => n > 0)
const defaultPorts = [9000, 3000]
const toFree = ports.length ? ports : defaultPorts

for (const port of toFree) {
  try {
    await killPort(String(port))
    console.log(`[dev:local] Freed port ${port}`)
  } catch (e) {
    const msg = e && typeof e === "object" && "message" in e ? String(e.message) : String(e)
    if (/No process running on port/i.test(msg)) {
      // already free
    } else {
      console.warn(`[dev:local] Could not free port ${port}: ${msg}`)
      process.exitCode = 1
    }
  }
}
