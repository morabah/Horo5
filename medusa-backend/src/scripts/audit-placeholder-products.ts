#!/usr/bin/env node
/**
 * Audit script: lists all publishable products with placeholder images.
 *
 * Usage: npx tsx src/scripts/audit-placeholder-products.ts
 *
 * Checks product.thumbnail against STOREFRONT_PLACEHOLDER_URL_PATTERNS env
 * (comma-separated, defaults to "coming-soon,placeholder").
 *
 * Outputs a JSON file at .parity/placeholders.json and a summary to stdout.
 * Exits with code 1 if any placeholders are found (use as CI gate).
 */

import { createRequire } from "module"

const DEFAULT_PATTERNS = "coming-soon,placeholder,placehold.co,via.placeholder"

function isPlaceholderImage(url: string | null | undefined): boolean {
  if (!url) return true
  const patterns = (process.env.STOREFRONT_PLACEHOLDER_URL_PATTERNS ?? DEFAULT_PATTERNS).split(",")
  return patterns.some((p) => new RegExp(p.trim(), "i").test(url))
}

async function main() {
  // Resolve the Medusa container to query products
  const medusaUrl = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"
  const apiKey = process.env.MEDUSA_ADMIN_API_TOKEN || process.env.ADMIN_API_TOKEN || ""

  if (!apiKey) {
    console.error("❌ MEDUSA_ADMIN_API_TOKEN required. Set it in env or .env file.")
    process.exit(1)
  }

  console.log(`\n🔍 Auditing products at ${medusaUrl}...\n`)

  const res = await fetch(`${medusaUrl}/admin/products?limit=200&fields=id,title,handle,thumbnail,status`, {
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
  })

  if (!res.ok) {
    console.error(`❌ Failed to fetch products: ${res.status} ${res.statusText}`)
    process.exit(1)
  }

  const data = (await res.json()) as { products: Array<{ id: string; title: string; handle: string; thumbnail: string | null; status: string }> }
  const products = data.products ?? []

  const publishable = products.filter((p) => p.status === "published")
  const withPlaceholder = publishable.filter((p) => isPlaceholderImage(p.thumbnail))

  // Output
  const result = {
    auditedAt: new Date().toISOString(),
    totalProducts: products.length,
    publishedProducts: publishable.length,
    placeholderCount: withPlaceholder.length,
    placeholders: withPlaceholder.map((p) => ({
      id: p.id,
      title: p.title,
      handle: p.handle,
      thumbnail: p.thumbnail,
    })),
  }

  // Write to .parity directory
  const fs = await import("fs")
  const path = await import("path")
  const parityDir = path.join(process.cwd(), ".parity")
  fs.mkdirSync(parityDir, { recursive: true })
  fs.writeFileSync(path.join(parityDir, "placeholders.json"), JSON.stringify(result, null, 2))

  console.log(`📦 Total products: ${products.length}`)
  console.log(`📢 Published products: ${publishable.length}`)
  console.log(`🖼️  With placeholder image: ${withPlaceholder.length}`)

  if (withPlaceholder.length > 0) {
    console.log("\n⚠️  Products with placeholder images:")
    for (const p of withPlaceholder) {
      console.log(`   - ${p.title} (${p.handle}) → ${p.thumbnail ?? "(null)"}`)
    }
    console.log("\n❌ Audit FAILED: placeholder images found on published products.")
    console.log("   Output: .parity/placeholders.json")
    process.exit(1)
  }

  console.log("\n✅ Audit PASSED: no placeholder images on published products.")
  console.log("   Output: .parity/placeholders.json")
}

main().catch((err) => {
  console.error("Fatal:", err)
  process.exit(1)
})
