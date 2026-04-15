/**
 * Optional buyer-facing Instapay payout hints (Egypt: phone / IBAN / bank label).
 * Set in web-next `.env` as `NEXT_PUBLIC_*` so Order Confirmation can list them.
 */
export type InstapayPayoutLine = { en: string; ar: string };

export function getInstapayPublicPayoutLines(): InstapayPayoutLine[] {
  const lines: InstapayPayoutLine[] = [];
  const phone = process.env.NEXT_PUBLIC_INSTAPAY_PAYOUT_PHONE?.trim();
  const iban = process.env.NEXT_PUBLIC_INSTAPAY_PAYOUT_IBAN?.trim();
  const bank = process.env.NEXT_PUBLIC_INSTAPAY_PAYOUT_BANK_LABEL?.trim();
  if (phone) {
    lines.push({
      en: `Instapay / wallet phone: ${phone}`,
      ar: `رقم الهاتف (إنستاباي / محفظة): ${phone}`,
    });
  }
  if (iban) {
    lines.push({
      en: `IBAN / account: ${iban}`,
      ar: `الآيبان أو الحساب: ${iban}`,
    });
  }
  if (bank) {
    lines.push({
      en: `Bank / recipient: ${bank}`,
      ar: `البنك أو اسم المستفيد: ${bank}`,
    });
  }
  return lines;
}
