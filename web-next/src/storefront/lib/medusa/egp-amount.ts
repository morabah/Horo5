/**
 * HORO convention: EGP uses `currency.decimal_digits = 0` in Medusa (whole pounds).
 * Medusa `amount` / cart / order totals for EGP are already integer EGP — no ÷100 in app code.
 * @see medusa-backend migration Migration20260414120000_egp_whole_pound_amounts
 *
 * API payloads may use strings or `{ value | numeric_ | amount | calculated_amount }` — align with
 * medusa-backend `coerceMoneyAmount` so storefront totals match Admin / Medusa.
 */
export function coerceMedusaMoneyToNumber(input: unknown, depth = 0): number | null {
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
    if ("value" in rec) return coerceMedusaMoneyToNumber(rec.value, depth + 1)
    if ("numeric_" in rec) return coerceMedusaMoneyToNumber(rec.numeric_, depth + 1)
    if ("calculated_amount" in rec) return coerceMedusaMoneyToNumber(rec.calculated_amount, depth + 1)
    if ("amount" in rec) return coerceMedusaMoneyToNumber(rec.amount, depth + 1)
  }
  return null
}

export function medusaAmountToEgpUnknown(amount: unknown): number {
  const n = coerceMedusaMoneyToNumber(amount)
  if (n === null || Number.isNaN(n)) return 0
  return Math.round(n)
}

export function medusaAmountToEgp(amount: number | null | undefined): number {
  if (typeof amount !== "number" || Number.isNaN(amount)) return 0
  return Math.round(amount)
}
