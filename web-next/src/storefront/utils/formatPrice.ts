/**
 * Shared price-formatting utility (Finding 3).
 * Ensures "799 EGP" is rendered identically across cards, PDP, cart, and checkout.
 */
const formatter = new Intl.NumberFormat('en-EG', {
  maximumFractionDigits: 0,
  useGrouping: true,
});

export function formatEgp(amount: number): string {
  return `${formatter.format(amount)} EGP`;
}
