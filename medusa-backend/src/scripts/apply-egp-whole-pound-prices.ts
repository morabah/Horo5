import type { ExecArgs } from "@medusajs/framework/types"
import { Client } from "pg"

/**
 * Medusa v2 `medusa db:migrate` runs **module** migrations only; SQL in `src/migrations/`
 * (e.g. EGP whole-pound updates) is not executed automatically. This script applies the same
 * changes idempotently: piastre-scale `price.amount` → integer EGP, `currency.decimal_digits = 0`.
 *
 * Run: `npm run migrate:egp-prices` from `medusa-backend/` (uses DATABASE_URL from `.env`).
 */
export default async function applyEgpWholePoundPrices(_args: ExecArgs) {
  const url = process.env.DATABASE_URL?.trim()
  if (!url) {
    throw new Error("DATABASE_URL is required")
  }

  const client = new Client({ connectionString: url })
  await client.connect()

  try {
    await client.query("BEGIN")

    const beforeCurrency = await client.query<{ decimal_digits: number }>(
      `SELECT decimal_digits FROM currency WHERE lower(code) = 'egp' LIMIT 1`
    )
    const digits = beforeCurrency.rows[0]?.decimal_digits
    const beforePrices = await client.query<{ c: string }>(
      `SELECT COUNT(*)::text AS c FROM price WHERE deleted_at IS NULL AND lower(currency_code) = 'egp' AND amount >= 10000`
    )
    const beforeLarge = beforePrices.rows[0]?.c ?? "?"

    // While EGP still uses 2 decimals, Medusa stores minor units (piastres). Only divide rows
    // that still look like that scale (>= 10000); never divide already-correct hundreds (e.g. 849)
    // if `decimal_digits` was reset to 2 by a sync without fixing amounts.
    const r1 = await client.query(`
      UPDATE "price" SET "amount" = ROUND("amount" / 100)
      WHERE "deleted_at" IS NULL
        AND LOWER("currency_code") = 'egp'
        AND "amount" >= 10000
        AND EXISTS (SELECT 1 FROM "currency" WHERE LOWER("code") = 'egp' AND "decimal_digits" = 2)
    `)

    await client.query(`UPDATE "currency" SET "decimal_digits" = 0 WHERE LOWER("code") = 'egp'`)

    // Match Migration20260414200000: stale piastre magnitudes after currency was already 0.
    const r2 = await client.query(`
      UPDATE "price" SET "amount" = ROUND("amount" / 100)
      WHERE "deleted_at" IS NULL
        AND LOWER("currency_code") = 'egp'
        AND "amount" >= 10000
        AND EXISTS (SELECT 1 FROM "currency" WHERE LOWER("code") = 'egp' AND "decimal_digits" = 0)
    `)

    const afterCurrency = await client.query<{ decimal_digits: number }>(
      `SELECT decimal_digits FROM currency WHERE lower(code) = 'egp' LIMIT 1`
    )
    const afterPrices = await client.query<{ c: string }>(
      `SELECT COUNT(*)::text AS c FROM price WHERE deleted_at IS NULL AND lower(currency_code) = 'egp' AND amount >= 10000`
    )

    await client.query("COMMIT")

    console.log(
      JSON.stringify(
        {
          message: "apply-egp-whole-pound-prices complete",
          egpDecimalDigitsBefore: digits ?? null,
          egpDecimalDigitsAfter: afterCurrency.rows[0]?.decimal_digits ?? null,
          priceRowsStillGe10kBefore: beforeLarge,
          priceRowsStillGe10kAfter: afterPrices.rows[0]?.c ?? "?",
          rowCountFirstPass: r1.rowCount,
          rowCountSecondPass: r2.rowCount,
        },
        null,
        2
      )
    )
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {})
    throw e
  } finally {
    await client.end()
  }
}
