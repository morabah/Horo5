export type MedusaMoneyAmount = {
  amount: number
  currency_code: string
  id: string
}

export type MedusaAddress = {
  address_1?: string | null
  address_2?: string | null
  city?: string | null
  company?: string | null
  country_code?: string | null
  first_name?: string | null
  id?: string
  last_name?: string | null
  phone?: string | null
  postal_code?: string | null
  province?: string | null
}

export type MedusaProductVariant = {
  calculated_price?: { calculated_amount?: number; currency_code?: string }
  id: string
  options?: { id: string; option?: { title?: string }; value?: string }[]
  prices?: MedusaMoneyAmount[]
  sku?: string | null
  title: string
}

export type MedusaProduct = {
  description?: string | null
  handle: string
  id: string
  images?: { id: string; url: string }[]
  metadata?: Record<string, unknown> | null
  thumbnail?: string | null
  title: string
  variants?: MedusaProductVariant[]
}

export type MedusaStoreProductResponse = {
  product: MedusaProduct
}

export type MedusaStoreProductsResponse = {
  count?: number
  limit?: number
  offset?: number
  products: MedusaProduct[]
}

export type MedusaCartLineItem = {
  id: string
  metadata?: Record<string, unknown> | null
  product?: MedusaProduct
  product_handle?: string | null
  product_id?: string | null
  product_title?: string | null
  quantity: number
  subtitle?: string | null
  thumbnail?: string | null
  title?: string | null
  total?: number
  unit_price?: number
  variant?: MedusaProductVariant | null
  variant_id: string
  variant_title?: string | null
}

export type MedusaShippingMethod = {
  amount: number
  id?: string
  shipping_option_id: string
}

export type MedusaPaymentProvider = {
  id: string
}

export type PaymobPublicSessionData = {
  amount_cents?: number
  cart_id?: string
  currency_code?: string
  merchant_order_id?: string
  paymob_order_id?: string
  provider_status?: string
  redirect_url?: string
  return_url?: string
  session_id?: string
  transaction_id?: string
  webhook_url?: string
}

export type MedusaPaymentSession = {
  amount?: number
  data?: Record<string, unknown> | PaymobPublicSessionData
  id: string
  provider_id: string
  status: "authorized" | "captured" | "pending" | "requires_more" | "error" | "canceled"
}

export type MedusaPaymentCollection = {
  amount: number
  id: string
  payment_providers?: MedusaPaymentProvider[]
  payment_sessions?: MedusaPaymentSession[]
  status: "not_paid" | "awaiting" | "authorized" | "partially_authorized" | "canceled" | "completed" | "failed"
}

export type MedusaRegion = {
  currency_code: string
  id: string
  name?: string
}

export type MedusaCart = {
  billing_address?: MedusaAddress | null
  completed_at?: string | null
  currency_code: string
  email?: string | null
  id: string
  items: MedusaCartLineItem[]
  metadata?: Record<string, unknown> | null
  payment_collection?: MedusaPaymentCollection | null
  region?: MedusaRegion | null
  region_id?: string | null
  shipping_address?: MedusaAddress | null
  shipping_methods?: MedusaShippingMethod[]
  shipping_total?: number
  subtotal?: number
  tax_total?: number
  total?: number
}

export type MedusaCartResponse = {
  cart: MedusaCart
}

export type MedusaShippingOption = {
  amount: number
  calculated_price?: {
    calculated_amount?: number
  }
  id: string
  name: string
  provider_id: string
  type?: {
    code?: string
    description?: string
    label?: string
  }
}

export type MedusaShippingOptionsResponse = {
  shipping_options: MedusaShippingOption[]
}

export type MedusaPaymentProvidersResponse = {
  payment_providers: MedusaPaymentProvider[]
}

export type MedusaPaymentCollectionResponse = {
  payment_collection: MedusaPaymentCollection
}

export type MedusaOrder = {
  billing_address?: MedusaAddress | null
  completed_at?: string | null
  created_at?: string
  currency_code?: string
  display_id?: number
  email?: string | null
  id: string
  items?: MedusaCartLineItem[] | null
  payment_collections?: MedusaPaymentCollection[]
  shipping_address?: MedusaAddress | null
  shipping_total?: number
  shipping_methods?: Array<{ amount?: number; name?: string | null }> | null
  status?: string
  subtotal?: number
  total?: number
}

export type MedusaOrderResponse = {
  order: MedusaOrder
}

export type MedusaCompleteCartResponse = {
  cart?: MedusaCart
  order?: MedusaOrder
  type: "order" | "cart"
}

export type CheckoutStatusResponse = {
  order_id?: string
  status: "pending" | "authorized" | "completed" | "failed"
}
