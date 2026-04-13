export const EGYPT_REGION_NAME = "Egypt"

export function isPaymobConfigured() {
  const storeUrl =
    process.env.STORE_URL?.trim() || process.env.STORE_CORS?.split(",")[0]?.trim()

  return Boolean(
    process.env.PAYMOB_API_KEY?.trim() &&
      process.env.PAYMOB_HMAC_SECRET?.trim() &&
      process.env.PAYMOB_CARD_INTEGRATION_ID?.trim() &&
      process.env.MEDUSA_BACKEND_URL?.trim() &&
      storeUrl
  )
}

export function getEgyptRegionPaymentProviders() {
  return [
    "pp_system_default",
    ...(isPaymobConfigured() ? ["pp_paymob_paymob"] : []),
  ]
}
