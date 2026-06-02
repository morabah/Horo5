/** Shared URLs and ready banner for `npm run dev:local`. */
export const DEV_LOCAL_LINKS = {
  frontend: "http://localhost:3000",
  backend: "http://localhost:9000",
  health: "http://127.0.0.1:9000/health",
  admin: "http://localhost:9000/app",
}

export function printDevLocalReadyBanner(elapsedSeconds) {
  const line = "═".repeat(72)
  console.log("")
  console.log(line)
  console.log("  HORO local dev is ready")
  console.log(`  (startup took ${elapsedSeconds}s)`)
  console.log("")
  console.log("  FRONTEND — open the storefront in your browser:")
  console.log(`    ${DEV_LOCAL_LINKS.frontend}`)
  console.log("")
  console.log("  BACKEND — Medusa API (used by the storefront):")
  console.log(`    ${DEV_LOCAL_LINKS.backend}`)
  console.log(`    Health check: ${DEV_LOCAL_LINKS.health}`)
  console.log("")
  console.log("  MEDUSA ADMIN — catalog, orders, CMS:")
  console.log(`    ${DEV_LOCAL_LINKS.admin}`)
  console.log("")
  console.log("  Stop everything: Ctrl+C in this terminal")
  console.log(line)
  console.log("")
}
