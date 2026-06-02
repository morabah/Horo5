/**
 * Frees Medusa (9000) and Next dev (3000) before `npm run dev:local`.
 * Kills listeners, then polls until ports are actually released.
 */
import net from "node:net"
import killPort from "kill-port"

const HOST = "127.0.0.1"
const SETTLE_MS = 400
const VERIFY_TIMEOUT_MS = 20_000
const VERIFY_INTERVAL_MS = 200

const ports = process.argv
  .slice(2)
  .map((p) => Number.parseInt(p, 10))
  .filter((n) => n > 0)
const toFree = ports.length ? ports : [9000, 3000]

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isPortListening(port) {
  return new Promise((resolve) => {
    const socket = net.connect({ host: HOST, port })
    const done = (listening) => {
      socket.removeAllListeners()
      socket.destroy()
      resolve(listening)
    }
    socket.setTimeout(300)
    socket.once("connect", () => done(true))
    socket.once("timeout", () => done(false))
    socket.once("error", () => done(false))
  })
}

async function waitUntilPortFree(port) {
  const deadline = Date.now() + VERIFY_TIMEOUT_MS
  while (Date.now() < deadline) {
    if (!(await isPortListening(port))) return
    await sleep(VERIFY_INTERVAL_MS)
  }
  throw new Error(
    `Port ${port} is still in use on ${HOST} after ${VERIFY_TIMEOUT_MS}ms — stop the other process manually`,
  )
}

async function freePort(port) {
  try {
    await killPort(String(port))
    console.log(`[dev:local] Freed port ${port}`)
  } catch (e) {
    const msg = e && typeof e === "object" && "message" in e ? String(e.message) : String(e)
    if (/No process running on port/i.test(msg)) {
      console.log(`[dev:local] Port ${port} already free`)
    } else {
      console.warn(`[dev:local] kill-port ${port}: ${msg}`)
    }
  }
}

console.log(`[dev:local] Freeing ports ${toFree.join(", ")}…`)
await Promise.all(toFree.map((port) => freePort(port)))
await sleep(SETTLE_MS)

for (const port of toFree) {
  try {
    await waitUntilPortFree(port)
    console.log(`[dev:local] Port ${port} is available`)
  } catch (e) {
    console.error(`[dev:local] ${e instanceof Error ? e.message : String(e)}`)
    process.exit(1)
  }
}
