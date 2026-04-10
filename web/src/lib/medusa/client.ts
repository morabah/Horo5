import type {
  MedusaCartResponse,
  MedusaCompleteCartResponse,
  MedusaStoreProductResponse,
  MedusaStoreProductsResponse,
} from "./types"

const baseUrl = (import.meta.env.VITE_MEDUSA_BACKEND_URL || "http://localhost:9000").replace(/\/+$/, "")
const publishableApiKey = import.meta.env.VITE_MEDUSA_PUBLISHABLE_KEY || ""

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers || {})
  headers.set("Content-Type", "application/json")
  if (publishableApiKey) headers.set("x-publishable-api-key", publishableApiKey)

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers,
    credentials: "include",
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Medusa request failed (${response.status}): ${text}`)
  }

  return (await response.json()) as T
}

export async function listProducts(): Promise<MedusaStoreProductsResponse> {
  return request<MedusaStoreProductsResponse>("/store/products?limit=100")
}

export async function getProductByHandle(handle: string): Promise<MedusaStoreProductResponse | null> {
  const params = new URLSearchParams({ handle, limit: "1" })
  const data = await request<MedusaStoreProductsResponse>(`/store/products?${params.toString()}`)
  if (!data.products.length) return null
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
    body: JSON.stringify({ variant_id: variantId, quantity }),
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

export async function updateCart(cartId: string, payload: Record<string, unknown>): Promise<MedusaCartResponse> {
  return request<MedusaCartResponse>(`/store/carts/${cartId}`, {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function createPaymentSessions(cartId: string): Promise<MedusaCartResponse> {
  return request<MedusaCartResponse>(`/store/carts/${cartId}/payment-sessions`, { method: "POST" })
}

export async function setPaymentSession(cartId: string, providerId: string): Promise<MedusaCartResponse> {
  return request<MedusaCartResponse>(`/store/carts/${cartId}/payment-sessions/${providerId}`, { method: "POST" })
}

export async function completeCart(cartId: string): Promise<MedusaCompleteCartResponse> {
  return request<MedusaCompleteCartResponse>(`/store/carts/${cartId}/complete`, { method: "POST" })
}
