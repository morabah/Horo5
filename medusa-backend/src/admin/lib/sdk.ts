import Medusa from "@medusajs/js-sdk"

/**
 * JS SDK for Medusa Admin extensions (session auth).
 * @see https://docs.medusajs.com/learn/fundamentals/admin/tips
 */
export const sdk = new Medusa({
  baseUrl: import.meta.env.VITE_BACKEND_URL || "/",
  debug: import.meta.env.DEV,
  auth: {
    type: "session",
  },
})
