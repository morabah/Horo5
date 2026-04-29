import type {
  CheckoutStatusResponse,
  MedusaCart,
  MedusaCartResponse,
  MedusaCompleteCartResponse,
  MedusaOrderResponse,
  MedusaPaymentCollectionResponse,
  MedusaPaymentProvidersResponse,
  MedusaShippingOptionsResponse,
  MedusaStoreProductResponse,
  MedusaStoreProductsResponse,
} from "./types"

const baseUrl =
  typeof window !== "undefined" &&
  (process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "").includes("railway.app")
    ? ""
    : (process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000").replace(/\/+$/, "")
const publishableApiKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""
const missingPublishableKeyMessage =
  "Missing Medusa publishable key. Set NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY in web-next/.env.local (or VITE_MEDUSA_PUBLISHABLE_KEY for the Vite app) and restart the frontend."
const staleCartCustomerPattern = /Customer with id:\s*.+\swas not found/i

export function isMissingMedusaPublishableKeyError(error: unknown): boolean {
  return error instanceof Error && error.message === missingPublishableKeyMessage
}

export function isStaleMedusaCartCustomerError(error: unknown): boolean {
  return error instanceof Error && staleCartCustomerPattern.test(error.message)
}

type RequestOptions = RequestInit & { idempotencyKey?: string }

async function request<T>(path: string, init: RequestOptions = {}): Promise<T> {
  if (!publishableApiKey) {
    throw new Error(missingPublishableKeyMessage)
  }

  const { idempotencyKey, headers: rawHeaders, ...rest } = init
  const headers = new Headers(rawHeaders || {})

  headers.set("Content-Type", "application/json")

  if (publishableApiKey) {
    headers.set("x-publishable-api-key", publishableApiKey)
  }

  if (idempotencyKey) {
    // Forward to Medusa under both the canonical RFC name and the lowercase variant some
    // gateways normalize to. Routes that don't recognize the header simply ignore it, so
    // there is no risk in sending it on every mutating request.
    headers.set("Idempotency-Key", idempotencyKey)
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...rest,
    credentials: "include",
    headers,
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Medusa request failed (${response.status}): ${text}`)
  }

  return (await response.json()) as T
}

function withQuery(path: string, query?: Record<string, string | undefined>) {
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(query || {})) {
    if (value) {
      params.set(key, value)
    }
  }

  const search = params.toString()
  return search ? `${path}?${search}` : path
}

/**
 * In-flight de-duplication for `POST /store/payment-collections`. If two checkout
 * actions race (e.g. an effect prefetch + a provider click), they would otherwise
 * both create a payment collection for the same cart and Medusa would then have
 * orphaned collections to reconcile on `complete`.
 */
const inflightPaymentCollections = new Map<string, Promise<string>>()

async function ensurePaymentCollection(cart: MedusaCart) {
  if (cart.payment_collection?.id) {
    return cart.payment_collection.id
  }

  const cached = inflightPaymentCollections.get(cart.id)
  if (cached) return cached

  const promise = request<MedusaPaymentCollectionResponse>("/store/payment-collections", {
    method: "POST",
    body: JSON.stringify({ cart_id: cart.id }),
  })
    .then((created) => created.payment_collection.id)
    .finally(() => {
      inflightPaymentCollections.delete(cart.id)
    })

  inflightPaymentCollections.set(cart.id, promise)
  return promise
}

export async function listProducts(): Promise<MedusaStoreProductsResponse> {
  return request<MedusaStoreProductsResponse>("/store/products?limit=100")
}

export async function getProductByHandle(handle: string): Promise<MedusaStoreProductResponse | null> {
  const params = new URLSearchParams({ handle, limit: "1" })
  const data = await request<MedusaStoreProductsResponse>(
    `/store/products?${params.toString()}`
  )

  if (!data.products.length) {
    return null
  }

  return { product: data.products[0] }
}

export async function createCart(regionId?: string): Promise<MedusaCartResponse> {
  return request<MedusaCartResponse>("/store/carts", {
    method: "POST",
    body: JSON.stringify(regionId ? { region_id: regionId } : {}),
  })
}

/** Store API `fields` for cart reads used by checkout + bag sync (smaller payload than default expansion). */
export const STORE_CART_CHECKOUT_FIELDS = [
  "id",
  "email",
  "region_id",
  "currency_code",
  "completed_at",
  "metadata",
  "subtotal",
  "total",
  "discount_total",
  "shipping_total",
  "tax_total",
  "*billing_address",
  "*shipping_address",
  "*items",
  "*items.variant",
  "*items.variant.product",
  "*payment_collection",
  "*payment_collection.payment_sessions",
  "*shipping_methods",
  "*region",
].join(",")

export async function getCart(cartId: string): Promise<MedusaCartResponse> {
  return request<MedusaCartResponse>(
    withQuery(`/store/carts/${cartId}`, { fields: STORE_CART_CHECKOUT_FIELDS }),
  )
}

export async function addLineItem(
  cartId: string,
  variantId: string,
  quantity: number,
  options: { idempotencyKey?: string } = {},
): Promise<MedusaCartResponse> {
  return request<MedusaCartResponse>(`/store/carts/${cartId}/line-items`, {
    method: "POST",
    body: JSON.stringify({ quantity, variant_id: variantId }),
    idempotencyKey: options.idempotencyKey,
  })
}

export async function updateLineItem(
  cartId: string,
  lineId: string,
  quantity: number,
  options: { idempotencyKey?: string } = {},
): Promise<MedusaCartResponse> {
  return request<MedusaCartResponse>(`/store/carts/${cartId}/line-items/${lineId}`, {
    method: "POST",
    body: JSON.stringify({ quantity }),
    idempotencyKey: options.idempotencyKey,
  })
}

export async function removeLineItem(cartId: string, lineId: string): Promise<MedusaCartResponse> {
  return request<MedusaCartResponse>(`/store/carts/${cartId}/line-items/${lineId}`, {
    method: "DELETE",
  })
}

export async function updateCart(
  cartId: string,
  payload: Record<string, unknown>,
  options: { idempotencyKey?: string } = {},
): Promise<MedusaCartResponse> {
  return request<MedusaCartResponse>(`/store/carts/${cartId}`, {
    method: "POST",
    body: JSON.stringify(payload),
    idempotencyKey: options.idempotencyKey,
  })
}

export async function recreateGuestCartFromCart(
  cart: MedusaCart
): Promise<MedusaCartResponse> {
  let nextCartResponse = await createCart(cart.region_id || undefined)

  for (const item of cart.items || []) {
    nextCartResponse = await addLineItem(
      nextCartResponse.cart.id,
      item.variant_id,
      item.quantity,
      // Deterministic per (recovered cart, variant) so a network-retry can't double-add.
      { idempotencyKey: `recreate_${nextCartResponse.cart.id}_${item.variant_id}` },
    )
  }

  return nextCartResponse
}

export async function listShippingOptions(cartId: string): Promise<MedusaShippingOptionsResponse> {
  return request<MedusaShippingOptionsResponse>(
    withQuery("/store/shipping-options", { cart_id: cartId })
  )
}

export async function addShippingMethod(
  cartId: string,
  optionId: string,
  options: { idempotencyKey?: string } = {},
): Promise<MedusaCartResponse> {
  return request<MedusaCartResponse>(`/store/carts/${cartId}/shipping-methods`, {
    method: "POST",
    body: JSON.stringify({ option_id: optionId }),
    idempotencyKey: options.idempotencyKey,
  })
}

export async function listPaymentProviders(regionId: string): Promise<MedusaPaymentProvidersResponse> {
  return request<MedusaPaymentProvidersResponse>(
    withQuery("/store/payment-providers", { region_id: regionId })
  )
}

export async function initiatePaymentSession(
  cart: MedusaCart,
  providerId: string,
  data: Record<string, unknown> = {}
): Promise<MedusaPaymentCollectionResponse> {
  const paymentCollectionId = await ensurePaymentCollection(cart)

  return request<MedusaPaymentCollectionResponse>(
    `/store/payment-collections/${paymentCollectionId}/payment-sessions`,
    {
      method: "POST",
      body: JSON.stringify({
        data,
        provider_id: providerId,
      }),
    }
  )
}

export async function completeCart(
  cartId: string,
  idempotencyKey?: string,
): Promise<MedusaCompleteCartResponse> {
  return request<MedusaCompleteCartResponse>(`/store/carts/${cartId}/complete`, {
    method: "POST",
    idempotencyKey,
  })
}

export async function getCheckoutStatus(cartId: string): Promise<CheckoutStatusResponse> {
  return request<CheckoutStatusResponse>(
    withQuery("/store/custom/checkout-status", { cart_id: cartId })
  )
}

export async function getOrder(orderId: string): Promise<MedusaOrderResponse> {
  return request<MedusaOrderResponse>(
    withQuery(`/store/orders/${orderId}`, {
      fields: [
        'id',
        'display_id',
        'email',
        'subtotal',
        'total',
        'shipping_total',
        'tax_total',
        'discount_total',
        '*items',
        '*items.variant',
        '*items.variant.product',
        '*shipping_methods',
        '*shipping_address',
        '*payment_collections',
        '*payment_collections.payment_sessions',
      ].join(','),
    })
  )
}
