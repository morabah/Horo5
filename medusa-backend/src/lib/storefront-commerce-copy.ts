/** Conditional commerce copy — do not overpromise COD or exchange in recovery emails. */

export function recoveryBodyCopy(locale: "en" | "ar"): string {
  return locale === "ar"
    ? "كمّل الطلب — الدفع عند الاستلام متاح عند ظهوره في الدفع. الاستبدال حسب السياسة."
    : "Finish checkout — COD is available when shown at checkout. Exchange applies according to policy."
}

export function recoveryCartCtaLabel(locale: "en" | "ar"): string {
  return locale === "ar" ? "افتح سلتك" : "View your bag"
}
