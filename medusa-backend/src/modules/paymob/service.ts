import crypto from "node:crypto"

import {
  AbstractPaymentProvider,
  MedusaError,
  PaymentActions,
  PaymentSessionStatus,
} from "@medusajs/framework/utils"
import type {
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  CancelPaymentInput,
  CancelPaymentOutput,
  CapturePaymentInput,
  CapturePaymentOutput,
  DeletePaymentOutput,
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  InitiatePaymentInput,
  InitiatePaymentOutput,
  ProviderWebhookPayload,
  DeletePaymentInput,
  RefundPaymentInput,
  RefundPaymentOutput,
  RetrievePaymentInput,
  RetrievePaymentOutput,
  UpdatePaymentInput,
  UpdatePaymentOutput,
  WebhookActionResult,
} from "@medusajs/types"

type PaymobProviderConfig = {
  apiKey: string
  applePayIntegrationId?: string
  backendUrl: string
  cardIntegrationId: string
  googlePayIntegrationId?: string
  hmacSecret: string
  storeUrl: string
}

type PaymobBillingData = {
  apartment: string
  building: string
  city: string
  country: string
  email: string
  first_name: string
  floor: string
  last_name: string
  phone_number: string
  postal_code: string
  shipping_method: string
  state: string
  street: string
}

type PaymobSessionData = Record<string, unknown> & {
  amount_cents?: number
  cart_id?: string
  currency_code?: string
  integration_id?: string
  last_error?: string
  merchant_order_id?: string
  paymob_order_id?: string
  provider_status?: string
  redirect_url?: string
  return_url?: string
  session_id?: string
  success?: boolean | string
  transaction_id?: string
  webhook_url?: string
}

type PaymobWebhookBody = {
  hmac?: string
  obj?: Record<string, unknown>
  success?: boolean | string
}

const PAYMOB_API_BASE_URL = "https://accept.paymob.com/api"
const PAYMOB_IFRAME_BASE_URL = "https://accept.paymob.com/api/acceptance/iframes"
const FALLBACK_EMAIL = "checkout@horo.local"
const FALLBACK_PHONE = "+201000000000"
const CHECKOUT_RETURN_QUERY = "payment=paymob"

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }

  return undefined
}

function asBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") {
    return value
  }

  if (typeof value === "string") {
    if (value.toLowerCase() === "true") return true
    if (value.toLowerCase() === "false") return false
  }

  return undefined
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function normalizeAmount(amount: unknown): number {
  const normalized = asNumber(amount)

  if (!normalized || normalized <= 0) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Paymob requires a positive cart total before a payment session can be initialized."
    )
  }

  return Math.round(normalized)
}

function mapProviderStatusToSessionStatus(data: PaymobSessionData): PaymentSessionStatus {
  const providerStatus = (asString(data.provider_status) || "").toLowerCase()

  switch (providerStatus) {
    case PaymentSessionStatus.AUTHORIZED:
    case PaymentSessionStatus.CAPTURED:
      return PaymentSessionStatus.AUTHORIZED
    case PaymentSessionStatus.CANCELED:
      return PaymentSessionStatus.CANCELED
    case PaymentSessionStatus.ERROR:
      return PaymentSessionStatus.ERROR
    case PaymentSessionStatus.REQUIRES_MORE:
      return PaymentSessionStatus.REQUIRES_MORE
    default:
      break
  }

  if (asBoolean(data.success) === true) {
    return PaymentSessionStatus.AUTHORIZED
  }

  if (data.redirect_url) {
    return PaymentSessionStatus.REQUIRES_MORE
  }

  return PaymentSessionStatus.PENDING
}

function getHeaderValue(
  headers: ProviderWebhookPayload["payload"]["headers"] | undefined,
  key: string
): string | undefined {
  if (!headers) {
    return undefined
  }

  const value = headers[key] ?? headers[key.toLowerCase()] ?? headers[key.toUpperCase()]

  if (Array.isArray(value)) {
    return value[0]
  }

  return asString(value)
}

function buildHmacSource(obj: Record<string, unknown>) {
  const order = asRecord(obj.order)
  const sourceData = asRecord(obj.source_data)

  return [
    asString(obj.amount_cents) || "",
    asString(obj.created_at) || "",
    asString(obj.currency) || "",
    String(asBoolean(obj.error_occured) ?? false),
    String(asBoolean(obj.has_parent_transaction) ?? false),
    String(asNumber(obj.id) ?? asString(obj.id) ?? ""),
    String(asNumber(obj.integration_id) ?? asString(obj.integration_id) ?? ""),
    String(asBoolean(obj.is_3d_secure) ?? false),
    String(asBoolean(obj.is_auth) ?? false),
    String(asBoolean(obj.is_capture) ?? false),
    String(asBoolean(obj.is_refunded) ?? false),
    String(asBoolean(obj.is_standalone_payment) ?? false),
    String(asBoolean(obj.is_voided) ?? false),
    String(asNumber(order.id) ?? asString(order.id) ?? ""),
    String(asNumber(obj.owner) ?? asString(obj.owner) ?? ""),
    String(asBoolean(obj.pending) ?? false),
    asString(sourceData.pan) || "",
    asString(sourceData.sub_type) || "",
    asString(sourceData.type) || "",
    String(asBoolean(obj.success) ?? false),
  ].join("")
}

function normalizePaymentTokenRedirectUrl(
  integrationId: string,
  paymentToken: string
) {
  return `${PAYMOB_IFRAME_BASE_URL}/${integrationId}?payment_token=${encodeURIComponent(paymentToken)}`
}

export default class PaymobProviderService extends AbstractPaymentProvider<PaymobProviderConfig> {
  static identifier = "paymob"

  constructor(container: Record<string, unknown>, config: PaymobProviderConfig) {
    super(container, config)
  }

  static validateOptions(options: Record<string, unknown>) {
    const requiredKeys = [
      "apiKey",
      "hmacSecret",
      "cardIntegrationId",
      "backendUrl",
      "storeUrl",
    ] as const

    for (const key of requiredKeys) {
      const value = options[key]

      if (typeof value !== "string" || !value.trim()) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Missing Paymob payment provider option: ${key}`
        )
      }
    }
  }

  protected get webhookUrl_() {
    return new URL("/hooks/payment/paymob_paymob", this.config.backendUrl).toString()
  }

  protected buildReturnUrl_(cartId?: string) {
    const url = new URL("/checkout", this.config.storeUrl)

    if (cartId) {
      url.searchParams.set("cart_id", cartId)
    }

    url.searchParams.set("payment_provider", "paymob")
    url.searchParams.set("payment_flow", "return")
    url.searchParams.set("resume", "1")
    url.searchParams.set("state", CHECKOUT_RETURN_QUERY)

    return url.toString()
  }

  protected resolveIntegrationId_(inputData: Record<string, unknown>) {
    const checkout = asRecord(inputData.checkout)
    const paymentMethodKind =
      asString(inputData.payment_method_kind) ||
      asString(checkout.payment_method_kind) ||
      ""
    const paymentMethodProviderId =
      asString(inputData.payment_method_provider_id) ||
      asString(checkout.payment_method_provider_id) ||
      ""
    const selection = `${paymentMethodKind} ${paymentMethodProviderId}`.toLowerCase()

    if (selection.includes("apple") && this.config.applePayIntegrationId) {
      return this.config.applePayIntegrationId
    }

    if (selection.includes("google") && this.config.googlePayIntegrationId) {
      return this.config.googlePayIntegrationId
    }

    return this.config.cardIntegrationId
  }

  protected async paymobRequest_<T>(path: string, body: Record<string, unknown>): Promise<T> {
    const response = await fetch(`${PAYMOB_API_BASE_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    const text = await response.text()
    const parsed = text ? (JSON.parse(text) as T & { message?: string }) : ({} as T)

    if (!response.ok) {
      const message =
        (parsed as { message?: string; detail?: string }).message ||
        (parsed as { message?: string; detail?: string }).detail ||
        `Paymob request failed with status ${response.status}`

      throw new MedusaError(MedusaError.Types.INVALID_DATA, message)
    }

    return parsed
  }

  protected async createAuthToken_() {
    const payload = await this.paymobRequest_<{ token?: string }>("/auth/tokens", {
      api_key: this.config.apiKey,
    })

    const token = asString(payload.token)

    if (!token) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Paymob did not return an auth token."
      )
    }

    return token
  }

  protected buildBillingData_(
    input: InitiatePaymentInput,
    cartData: Record<string, unknown>
  ): PaymobBillingData {
    const customer = asRecord(input.context?.customer)
    const billingAddress = asRecord(customer.billing_address)
    const checkoutAddress = asRecord(cartData.shipping_address)
    const names = [asString(checkoutAddress.first_name), asString(checkoutAddress.last_name)]
    const firstName = names[0] || asString(customer.first_name) || "HORO"
    const lastName = names[1] || asString(customer.last_name) || "Customer"

    return {
      apartment: "NA",
      building: "NA",
      city:
        asString(checkoutAddress.city) ||
        asString(billingAddress.city) ||
        "Cairo",
      country:
        (asString(checkoutAddress.country_code) ||
          asString(billingAddress.country_code) ||
          "eg").toUpperCase(),
      email:
        asString(cartData.email) ||
        asString(customer.email) ||
        FALLBACK_EMAIL,
      first_name: firstName,
      floor: "NA",
      last_name: lastName,
      phone_number:
        asString(checkoutAddress.phone) ||
        asString(customer.phone) ||
        FALLBACK_PHONE,
      postal_code:
        asString(checkoutAddress.postal_code) ||
        asString(billingAddress.postal_code) ||
        "00000",
      shipping_method: "Standard",
      state:
        asString(checkoutAddress.province) ||
        asString(billingAddress.province) ||
        "Cairo",
      street:
        asString(checkoutAddress.address_1) ||
        asString(billingAddress.address_1) ||
        "NA",
    }
  }

  async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentOutput> {
    const amount = normalizeAmount(input.amount)
    const inputData = asRecord(input.data)
    const sessionId = asString(inputData.session_id)

    if (!sessionId) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Paymob payment session is missing the Medusa session identifier."
      )
    }

    const cartId = asString(inputData.cart_id)
    const authToken = await this.createAuthToken_()
    const merchantOrderId = sessionId

    const order = await this.paymobRequest_<{ id?: number | string }>(
      "/ecommerce/orders",
      {
        auth_token: authToken,
        amount_cents: String(amount),
        currency: input.currency_code.toUpperCase(),
        delivery_needed: false,
        items: [],
        merchant_order_id: merchantOrderId,
      }
    )

    const paymobOrderId = String(order.id ?? "")

    if (!paymobOrderId) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Paymob did not return an order id."
      )
    }

    const checkoutData = asRecord(inputData.checkout)
    const billingData = this.buildBillingData_(input, checkoutData)
    const returnUrl = this.buildReturnUrl_(cartId)
    const integrationId = this.resolveIntegrationId_(inputData)

    const paymentKey = await this.paymobRequest_<{ token?: string }>(
      "/acceptance/payment_keys",
      {
        amount_cents: String(amount),
        auth_token: authToken,
        billing_data: billingData,
        currency: input.currency_code.toUpperCase(),
        expiration: 3600,
        integration_id: Number(integrationId),
        order_id: Number(paymobOrderId),
      }
    )

    const token = asString(paymentKey.token)

    if (!token) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Paymob did not return a payment token."
      )
    }

    return {
      id: paymobOrderId,
      status: PaymentSessionStatus.PENDING,
      data: {
        amount_cents: amount,
        cart_id: cartId,
        currency_code: input.currency_code.toLowerCase(),
        integration_id: integrationId,
        merchant_order_id: merchantOrderId,
        paymob_order_id: paymobOrderId,
        provider_status: PaymentSessionStatus.PENDING,
        redirect_url: normalizePaymentTokenRedirectUrl(
          integrationId,
          token
        ),
        return_url: returnUrl,
        session_id: sessionId,
        webhook_url: this.webhookUrl_,
      },
    }
  }

  async updatePayment(input: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
    const currentData = asRecord(input.data)
    const currentAmount = asNumber(currentData.amount_cents)
    const nextAmount = normalizeAmount(input.amount)

    if (
      currentAmount === nextAmount &&
      asString(currentData.paymob_order_id) &&
      asString(currentData.redirect_url)
    ) {
      return {
        data: {
          ...currentData,
          amount_cents: nextAmount,
          currency_code: input.currency_code.toLowerCase(),
        },
        status: mapProviderStatusToSessionStatus(currentData),
      }
    }

    return this.initiatePayment({
      amount: nextAmount,
      context: input.context,
      currency_code: input.currency_code,
      data: currentData,
    })
  }

  async authorizePayment(
    input: AuthorizePaymentInput
  ): Promise<AuthorizePaymentOutput> {
    const data = asRecord(input.data)
    const status = mapProviderStatusToSessionStatus(data)

    return {
      data,
      status,
    }
  }

  async deletePayment(input: DeletePaymentInput): Promise<DeletePaymentOutput> {
    return { data: asRecord(input.data) }
  }

  async capturePayment(_: CapturePaymentInput): Promise<CapturePaymentOutput> {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Paymob capture is not supported in the HORO launch phase."
    )
  }

  async refundPayment(_: RefundPaymentInput): Promise<RefundPaymentOutput> {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Paymob refunds are not supported in the HORO launch phase."
    )
  }

  async retrievePayment(
    input: RetrievePaymentInput
  ): Promise<RetrievePaymentOutput> {
    return {
      data: asRecord(input.data),
    }
  }

  async cancelPayment(input: CancelPaymentInput): Promise<CancelPaymentOutput> {
    const data = asRecord(input.data)

    return {
      data: {
        ...data,
        provider_status: PaymentSessionStatus.CANCELED,
      },
    }
  }

  async getPaymentStatus(
    input: GetPaymentStatusInput
  ): Promise<GetPaymentStatusOutput> {
    const data = asRecord(input.data)

    return {
      data,
      status: mapProviderStatusToSessionStatus(data),
    }
  }

  protected verifyWebhookHmac_(
    payload: PaymobWebhookBody,
    headers: ProviderWebhookPayload["payload"]["headers"] | undefined
  ) {
    const hmac =
      asString(payload.hmac) ||
      getHeaderValue(headers, "hmac") ||
      getHeaderValue(headers, "x-paymob-signature") ||
      getHeaderValue(headers, "x-hmac")

    if (!hmac) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Missing Paymob webhook signature."
      )
    }

    const obj = asRecord(payload.obj)
    const calculated = crypto
      .createHmac("sha512", this.config.hmacSecret)
      .update(buildHmacSource(obj))
      .digest("hex")

    const provided = hmac.toLowerCase()

    if (calculated.length !== provided.length) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Invalid Paymob webhook signature."
      )
    }

    const matches = crypto.timingSafeEqual(
      Buffer.from(calculated),
      Buffer.from(provided)
    )

    if (!matches) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Invalid Paymob webhook signature."
      )
    }
  }

  async getWebhookActionAndData(
    payload: ProviderWebhookPayload["payload"]
  ): Promise<WebhookActionResult> {
    const webhookBody = asRecord(payload.data) as PaymobWebhookBody
    this.verifyWebhookHmac_(webhookBody, payload.headers)

    const obj = asRecord(webhookBody.obj)
    const order = asRecord(obj.order)
    const sessionId =
      asString(order.merchant_order_id) ||
      asString(obj.merchant_order_id)
    const amount = asNumber(obj.amount_cents) ?? 0

    if (!sessionId || amount <= 0) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Paymob webhook payload is missing the Medusa session id or amount."
      )
    }

    const success = asBoolean(obj.success)
    const pending = asBoolean(obj.pending)
    const isCaptured = asBoolean(obj.is_capture)
    const isVoided = asBoolean(obj.is_voided)
    const hasError = asBoolean(obj.error_occured)

    if (isVoided) {
      return {
        action: PaymentActions.CANCELED,
        data: {
          amount,
          session_id: sessionId,
        },
      }
    }

    if (hasError || success === false) {
      return {
        action: PaymentActions.FAILED,
        data: {
          amount,
          session_id: sessionId,
        },
      }
    }

    if (pending === true) {
      return {
        action: PaymentActions.PENDING,
        data: {
          amount,
          session_id: sessionId,
        },
      }
    }

    if (success === true && isCaptured) {
      return {
        action: PaymentActions.SUCCESSFUL,
        data: {
          amount,
          session_id: sessionId,
        },
      }
    }

    if (success === true) {
      return {
        action: PaymentActions.AUTHORIZED,
        data: {
          amount,
          session_id: sessionId,
        },
      }
    }

    return {
      action: PaymentActions.REQUIRES_MORE,
      data: {
        amount,
        session_id: sessionId,
      },
    }
  }
}
