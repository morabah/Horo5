/**
 * HORO convention: EGP uses `currency.decimal_digits = 0` in Postgres (whole pounds).
 * Medusa `amount` / cart / order totals for EGP are already integer EGP — no ÷100 in app code.
 * @see Migration20260414120000_egp_whole_pound_amounts
 */
export function medusaAmountToEgp(amount: number | null | undefined): number {
  if (typeof amount !== "number" || Number.isNaN(amount)) return 0
  return Math.round(amount)
}
