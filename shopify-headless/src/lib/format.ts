export function formatMoney(amount: string, currencyCode: string): string {
  const parsed = Number(amount);
  if (Number.isNaN(parsed)) {
    return `${amount} ${currencyCode}`;
  }

  if (currencyCode.toUpperCase() === "EGP") {
    return `${new Intl.NumberFormat("en-EG", {
      maximumFractionDigits: 0,
    }).format(parsed)} EGP`;
  }

  return new Intl.NumberFormat("en-EG", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 2,
  }).format(parsed);
}
