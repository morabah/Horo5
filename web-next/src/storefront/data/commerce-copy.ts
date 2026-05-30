/** Conditional recovery copy — aligned with PDP/cart trust chips. */

export function pdpCodTrustCopy(isArabic: boolean): string {
  return isArabic ? "الدفع عند الاستلام عند ظهوره في الدفع" : "COD when shown at checkout"
}

export function pdpExchangeTrustCopy(isArabic: boolean): string {
  return isArabic ? "الاستبدال حسب السياسة" : "Exchange applies according to policy"
}

/** Cart / checkout preview footnote — shipping, tax, and payment truth. */
export function cartCostPreviewCheckoutNote(isArabic: boolean): string {
  return isArabic
    ? "يتم تأكيد الشحن النهائي والضرائب إن وُجدت وطرق الدفع عند إتمام الدفع."
    : "Final shipping, taxes if applicable, and payment methods are confirmed at checkout."
}

export function recoveryBodyCopy(isArabic: boolean): string {
  return isArabic
    ? "كمّل الطلب — الدفع عند الاستلام عند ظهوره في الدفع. الاستبدال حسب السياسة."
    : "Finish checkout — COD is available when shown at checkout. Exchange applies according to policy."
}

export const ABANDON_EMAIL_CONSENT_LABEL = {
  en: "I agree to receive one email reminder about this cart.",
  ar: "أوافق على استلام تذكير واحد بالبريد عن هذه السلة.",
} as const

/** Order-summary shipping row when Medusa has not quoted shipping yet. */
export function shippingCalculatedAfterAddressCopy(isArabic: boolean): string {
  return isArabic ? "يُحسب بعد العنوان" : "Calculated after address"
}

/** Mobile sticky / inline hint before address is saved. */
export function shippingFinalizesAfterAddressCopy(isArabic: boolean): string {
  return isArabic ? "يُثبت الشحن بعد العنوان" : "Shipping finalizes after address"
}

export function governorateShippingBasisCopy(isArabic: boolean, governorateLabel: string | null): string {
  if (governorateLabel?.trim()) {
    return isArabic
      ? `تقدير الشحن بناءً على: ${governorateLabel.trim()}`
      : `Shipping estimate based on: ${governorateLabel.trim()}`
  }
  return isArabic ? "اختر المحافظة لحساب الشحن" : "Choose governorate to calculate shipping"
}

type StickyCostLineArgs = {
  shippingPending: boolean
  freeShippingUnlocked: boolean
  shippingEgp: number
  giftWrapEgp: number
  merchandiseSubtotalEgp: number
  formatMoney: (amount: number) => string
}

/** Second line under mobile checkout total — must not hide shipping. */
export function checkoutStickyCostLine(isArabic: boolean, args: StickyCostLineArgs): string {
  const segments: string[] = []
  if (args.giftWrapEgp > 0) {
    segments.push(isArabic ? "يشمل تغليف الهدية" : "Includes gift wrap")
  }
  if (args.shippingPending) {
    segments.push(shippingFinalizesAfterAddressCopy(isArabic))
  } else if (args.freeShippingUnlocked) {
    segments.push(isArabic ? "يشمل شحن مجاني" : "Includes free shipping")
  } else if (args.shippingEgp > 0) {
    segments.push(
      isArabic
        ? `${args.formatMoney(args.merchandiseSubtotalEgp)} + شحن ${args.formatMoney(args.shippingEgp)}`
        : `Subtotal ${args.formatMoney(args.merchandiseSubtotalEgp)} + Shipping ${args.formatMoney(args.shippingEgp)}`,
    )
  } else {
    segments.push(shippingCalculatedAfterAddressCopy(isArabic))
  }
  return segments.join(isArabic ? " · " : " · ")
}
