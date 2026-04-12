#!/usr/bin/env node
/**
 * Compare two parity-snapshot JSON files (only `snapshot` must match; `meta` is ignored).
 *
 * Usage:
 *   node scripts/compare-parity-json.mjs .parity/local.json .parity/railway.json
 *   node scripts/compare-parity-json.mjs .parity/local.json .parity/railway.json --ignore-media
 *
 * --ignore-media   Drops productThumbnailHosts before compare (local vs prod URLs differ by design).
 */

import fs from "node:fs"

const args = process.argv.slice(2).filter((a) => !a.startsWith("-"))
const flags = new Set(process.argv.slice(2).filter((a) => a.startsWith("--")))

const [aPath, bPath] = args

if (!aPath || !bPath) {
  console.error("Usage: node scripts/compare-parity-json.mjs <local.json> <remote.json> [--ignore-media]")
  process.exit(2)
}

const ignoreMedia = flags.has("--ignore-media")

function readSnapshot(file) {
  const raw = fs.readFileSync(file, "utf8")
  const data = JSON.parse(raw)
  if (!data.snapshot) {
    throw new Error(`${file}: missing .snapshot`)
  }
  return data.snapshot
}

function sortKeysDeep(x) {
  if (Array.isArray(x)) {
    return x.map(sortKeysDeep)
  }
  if (x !== null && typeof x === "object") {
    return Object.keys(x)
      .sort()
      .reduce((acc, k) => {
        acc[k] = sortKeysDeep(x[k])
        return acc
      }, {})
  }
  return x
}

function stripMedia(snapshot) {
  const s = { ...snapshot }
  delete s.productThumbnailHosts
  return s
}

function reportDiff(labelA, labelB, A, B, ignoreMediaFlag) {
  console.error("\n--- Parity report (snapshot) ---\n")
  console.error(`productCount: ${A.productCount} (${labelA}) vs ${B.productCount} (${labelB})`)
  console.error(
    `productCategories: ${A.productCategories?.length ?? 0} (${labelA}) vs ${B.productCategories?.length ?? 0} (${labelB})`
  )

  const ha = new Set(A.productHandles || [])
  const hb = new Set(B.productHandles || [])
  const onlyA = [...ha].filter((h) => !hb.has(h)).sort()
  const onlyB = [...hb].filter((h) => !ha.has(h)).sort()
  if (onlyA.length) {
    console.error(`\nProduct handles only in ${labelA} (${onlyA.length}):`, onlyA.join(", "))
  }
  if (onlyB.length) {
    console.error(`\nProduct handles only in ${labelB} (${onlyB.length}):`, onlyB.join(", "))
  }

  const ca = new Set((A.productCategories || []).map((c) => c.handle))
  const cb = new Set((B.productCategories || []).map((c) => c.handle))
  const catOnlyA = [...ca].filter((h) => !cb.has(h)).sort()
  const catOnlyB = [...cb].filter((h) => !ca.has(h)).sort()
  if (catOnlyA.length) {
    console.error(`\nCategory handles only in ${labelA}:`, catOnlyA.join(", "))
  }
  if (catOnlyB.length) {
    console.error(`\nCategory handles only in ${labelB}:`, catOnlyB.join(", "))
  }

  const fields = [
    "feelingSlugs",
    "subfeelingSlugs",
    "occasionSlugs",
    "artistSlugs",
    "merchEventSlugs",
  ]
  for (const f of fields) {
    const aa = JSON.stringify(A[f] || [])
    const bb = JSON.stringify(B[f] || [])
    if (aa !== bb) {
      console.error(`\n${f} differs.`)
    }
  }

  if (JSON.stringify(A.regions) !== JSON.stringify(B.regions)) {
    console.error("\nregions differ:", JSON.stringify(A.regions), "vs", JSON.stringify(B.regions))
  }
  if (A.storeDefaultCurrency !== B.storeDefaultCurrency) {
    console.error(`\nstoreDefaultCurrency: ${A.storeDefaultCurrency} vs ${B.storeDefaultCurrency}`)
  }

  const thA = A.productThumbnailHosts || []
  const thB = B.productThumbnailHosts || []
  if (JSON.stringify(thA) !== JSON.stringify(thB)) {
    if (ignoreMediaFlag) {
      console.error("\nproductThumbnailHosts differ (ignored for compare).")
    } else {
      console.error(`\nproductThumbnailHosts: ${JSON.stringify(thA)} vs ${JSON.stringify(thB)}`)
      console.error("(Re-run with --ignore-media if only media hosts differ.)\n")
    }
  }

  console.error(
    '\nTip: align DB with medusa-backend README (section "Local is the source of truth"), seeds, taxonomy; sync product catalog; rewrite media URLs if needed.\n'
  )
}

try {
  const rawA = readSnapshot(aPath)
  const rawB = readSnapshot(bPath)

  const A = sortKeysDeep(ignoreMedia ? stripMedia(rawA) : rawA)
  const B = sortKeysDeep(ignoreMedia ? stripMedia(rawB) : rawB)

  const sa = JSON.stringify(A)
  const sb = JSON.stringify(B)

  if (sa === sb) {
    console.log(
      ignoreMedia
        ? "OK: snapshots match (productThumbnailHosts ignored)."
        : "OK: snapshot blocks are identical (meta ignored)."
    )
    process.exit(0)
  }

  console.error("MISMATCH: snapshot differs between environments.")
  reportDiff(aPath, bPath, rawA, rawB, ignoreMedia)
  process.exit(1)
} catch (e) {
  console.error(e instanceof Error ? e.message : e)
  process.exit(2)
}
