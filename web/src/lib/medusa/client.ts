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

const baseUrl = (
  import.meta.env.VITE_MEDUSA_BACKEND_URL || "http://localhost:9000"
).replace(/\/+$/, "")
const publishableApiKey = import.meta.env.VITE_MEDUSA_PUBLISHABLE_KEY || ""
const missingPublishableKeyMessage =
  "Missing Medusa publishable key. Set NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY in web-next/.env.local (or VITE_MEDUSA_PUBLISHABLE_KEY for the Vite app) and restart the frontend."
const staleCartCustomerPattern = /Customer with id:\s*.+\swas not found/i

export function isMissingMedusaPublishableKeyError(error: unknown): boolean {
  return error instanceof Error && error.message === missingPublishableKeyMessage
}

export function isStaleMedusaCartCustomerError(error: unknown): boolean {
  return error instanceof Error && staleCartCustomerPattern.test(error.message)
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!publishableApiKey) {
    throw new Error(missingPublishableKeyMessage)
  }

  const headers = new Headers(init.headers || {})

  headers.set("Content-Type", "application/json")

  if (publishableApiKey) {
    headers.set("x-publishable-api-key", publishableApiKey)
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
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

async function ensurePaymentCollection(cart: MedusaCart) {
  if (cart.payment_collection?.id) {
    return cart.payment_collection.id
  }

  const created = await request<MedusaPaymentCollectionResponse>("/store/payment-collections", {
    method: "POST",
    body: JSON.stringify({ cart_id: cart.id }),
  })

  return created.payment_collection.id
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

export async function getCart(cartId: string): Promise<MedusaCartResponse> {
  return request<MedusaCartResponse>(`/store/carts/${cartId}`)
}

export async function addLineItem(cartId: string, variantId: string, quantity: number): Promise<MedusaCartResponse> {
  return request<MedusaCartResponse>(`/store/carts/${cartId}/line-items`, {
    method: "POST",
    body: JSON.stringify({ quantity, variant_id: variantId }),
  })
}

export async function updateLineItem(cartId: string, lineId: string, quantity: number): Promise<MedusaCartResponse> {
  return request<MedusaCartResponse>(`/store/carts/${cartId}/line-items/${lineId}`, {
    method: "POST",
    body: JSON.stringify({ quantity }),
  })
}

export async function removeLineItem(cartId: string, lineId: string): Promise<MedusaCartResponse> {
  return request<MedusaCartResponse>(`/store/carts/${cartId}/line-items/${lineId}`, {
    method: "DELETE",
  })
}

export async function updateCart(
  cartId: string,
  payload: Record<string, unknown>
): Promise<MedusaCartResponse> {
  return request<MedusaCartResponse>(`/store/carts/${cartId}`, {
    method: "POST",
    body: JSON.stringify(payload),
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
      item.quantity
    )
  }

  return nextCartResponse
}

export async function listShippingOptions(cartId: string): Promise<MedusaShippingOptionsResponse> {
  return request<MedusaShippingOptionsResponse>(
    withQuery("/store/shipping-options", { cart_id: cartId })
  )
}

export async function addShippingMethod(cartId: string, optionId: string): Promise<MedusaCartResponse> {
  return request<MedusaCartResponse>(`/store/carts/${cartId}/shipping-methods`, {
    method: "POST",
    body: JSON.stringify({ option_id: optionId }),
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

export async function completeCart(cartId: string): Promise<MedusaCompleteCartResponse> {
  return request<MedusaCompleteCartResponse>(`/store/carts/${cartId}/complete`, {
    method: "POST",
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
