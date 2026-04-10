export type MedusaMoneyAmount = {
  id: string
  amount: number
  currency_code: string
}

export type MedusaProductVariant = {
  id: string
  title: string
  sku?: string | null
  options?: { id: string; value: string; option?: { title: string } }[]
  calculated_price?: { calculated_amount?: number; currency_code?: string }
  prices?: MedusaMoneyAmount[]
}

export type MedusaProduct = {
  id: string
  title: string
  handle: string
  description?: string | null
  thumbnail?: string | null
  images?: { id: string; url: string }[]
  metadata?: Record<string, unknown> | null
  variants?: MedusaProductVariant[]
}

export type MedusaStoreProductResponse = {
  product: MedusaProduct
}

export type MedusaStoreProductsResponse = {
  products: MedusaProduct[]
  count?: number
  offset?: number
  limit?: number
}

export type MedusaCartLineItem = {
  id: string
  variant_id: string
  quantity: number
  title?: string
  subtitle?: string
  thumbnail?: string | null
  product_title?: string
  product_handle?: string
  variant_title?: string
  unit_price?: number
  total?: number
}

export type MedusaCart = {
  id: string
  currency_code: string
  region_id?: string | null
  items: MedusaCartLineItem[]
  subtotal?: number
  shipping_total?: number
  tax_total?: number
  total?: number
  email?: string | null
}

export type MedusaCartResponse = {
  cart: MedusaCart
}

export type MedusaCompleteCartResponse = {
  type: "order" | "cart"
  order?: {
    id: string
    display_id?: number
    currency_code?: string
    total?: number
    items?: MedusaCartLineItem[]
  }
  cart?: MedusaCart
}
