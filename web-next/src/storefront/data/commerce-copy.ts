/** Conditional recovery copy — aligned with PDP/cart trust chips. */

export function recoveryBodyCopy(isArabic: boolean): string {
  return isArabic
    ? "كمّل الطلب — الدفع عند الاستلام متاح عند ظهوره في الدفع. الاستبدال حسب السياسة."
    : "Finish checkout — COD is available when shown at checkout. Exchange applies according to policy."
}

export const ABANDON_EMAIL_CONSENT_LABEL = {
  en: "I agree to receive one email reminder about this cart.",
  ar: "أوافق على استلام تذكير واحد بالبريد عن هذه السلة.",
} as const
