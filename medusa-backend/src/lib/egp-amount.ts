/**
 * HORO convention: EGP uses `currency.decimal_digits = 0` in Postgres (whole pounds).
 * Medusa `amount` / cart / order totals for EGP are already integer EGP — no ÷100 in app code.
 * @see Migration20260414120000_egp_whole_pound_amounts
 *
 * `query.graph` and some DB layers expose money as numeric strings or `{ value }`; normalize here.
 */
export function coerceMoneyAmount(input: unknown): number | null {
  if (input == null) return null
  if (typeof input === "bigint") return Number(input)
  if (typeof input === "number") return Number.isFinite(input) ? input : null
  if (typeof input === "string") {
    const t = input.trim()
    if (!t) return null
    const n = Number(t)
    return Number.isFinite(n) ? n : null
  }
  if (typeof input === "object" && input !== null && "value" in input) {
    return coerceMoneyAmount((input as { value: unknown }).value)
  }
  return null
}

export function medusaAmountToEgp(amount: unknown): number {
  const n = coerceMoneyAmount(amount)
  if (n === null || Number.isNaN(n)) return 0
  return Math.round(n)
}
