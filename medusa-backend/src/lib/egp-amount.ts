/**
 * HORO convention: EGP uses `currency.decimal_digits = 0` in Postgres (whole pounds).
 * Medusa `amount` / cart / order totals for EGP are already integer EGP — no ÷100 in app code.
 * @see Migration20260414120000_egp_whole_pound_amounts
 *
 * `query.graph` and some DB layers expose money as numeric strings, `{ value }`, `{ numeric_: … }`,
 * or nested `{ amount: … }` / `{ calculated_amount: … }`; normalize here.
 */
export function coerceMoneyAmount(input: unknown, depth = 0): number | null {
  if (input == null || depth > 8) return null
  if (typeof input === "bigint") return Number(input)
  if (typeof input === "number") return Number.isFinite(input) ? input : null
  if (typeof input === "string") {
    const t = input.trim()
    if (!t) return null
    const n = Number(t)
    return Number.isFinite(n) ? n : null
  }
  if (typeof input === "object" && input !== null) {
    const rec = input as Record<string, unknown>
    if ("value" in rec) return coerceMoneyAmount(rec.value, depth + 1)
    if ("numeric_" in rec) return coerceMoneyAmount(rec.numeric_, depth + 1)
    if ("calculated_amount" in rec) return coerceMoneyAmount(rec.calculated_amount, depth + 1)
    if ("amount" in rec) return coerceMoneyAmount(rec.amount, depth + 1)
  }
  return null
}

export function medusaAmountToEgp(amount: unknown): number {
  const n = coerceMoneyAmount(amount)
  if (n === null || Number.isNaN(n)) return 0
  return Math.round(n)
}
