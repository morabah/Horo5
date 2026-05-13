import {
  AbstractPaymentProvider,
  MedusaError,
  PaymentSessionStatus,
} from "@medusajs/framework/utils"
import type {
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  CancelPaymentInput,
  CancelPaymentOutput,
  CapturePaymentInput,
  CapturePaymentOutput,
  DeletePaymentInput,
  DeletePaymentOutput,
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  InitiatePaymentInput,
  InitiatePaymentOutput,
  RefundPaymentInput,
  RefundPaymentOutput,
  RetrievePaymentInput,
  RetrievePaymentOutput,
  UpdatePaymentInput,
  UpdatePaymentOutput,
  ProviderWebhookPayload,
  WebhookActionResult,
} from "@medusajs/types"

export type InstapayProviderConfig = {
  /** Instapay-registered phone / wallet number (optional, echoed in session data). */
  payoutPhone?: string
  /** IBAN or account reference (optional). */
  payoutIban?: string
  /** Bank or account holder label (optional). */
  payoutBankLabel?: string
}

import { asRecord, asString } from "../../lib/shared/type-guards"

function payoutPayloadFromConfig(config: InstapayProviderConfig): Record<string, unknown> {
  const out: Record<string, unknown> = { kind: "instapay_deferred" }
  if (config.payoutPhone) out.payout_phone = config.payoutPhone
  if (config.payoutIban) out.payout_iban = config.payoutIban
  if (config.payoutBankLabel) out.payout_bank_label = config.payoutBankLabel
  return out
}

function mergeSessionData(
  base: Record<string, unknown>,
  config: InstapayProviderConfig,
): Record<string, unknown> {
  return {
    ...payoutPayloadFromConfig(config),
    ...base,
  }
}

export default class InstapayProviderService extends AbstractPaymentProvider<InstapayProviderConfig> {
  static identifier = "instapay"

  constructor(container: Record<string, unknown>, config: InstapayProviderConfig) {
    super(container, config)
  }

  static validateOptions(_options: Record<string, unknown>) {
    /* All options optional — deferred Egyptian bank-rail instructions only. */
  }

  async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentOutput> {
    const inputData = asRecord(input.data)
    const sessionId = asString(inputData.session_id)
    if (!sessionId) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Instapay payment session is missing the Medusa session identifier.",
      )
    }

    const data = mergeSessionData(
      {
        session_id: sessionId,
        currency_code: input.currency_code.toLowerCase(),
      },
      this.config,
    )

    return {
      id: sessionId,
      status: PaymentSessionStatus.PENDING,
      data,
    }
  }

  async updatePayment(input: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
    const current = asRecord(input.data)
    return {
      data: mergeSessionData(
        {
          ...current,
          currency_code: input.currency_code.toLowerCase(),
        },
        this.config,
      ),
      status: PaymentSessionStatus.PENDING,
    }
  }

  async authorizePayment(input: AuthorizePaymentInput): Promise<AuthorizePaymentOutput> {
    const data = {
      ...mergeSessionData(asRecord(input.data), this.config),
      provider_status: PaymentSessionStatus.AUTHORIZED,
    }
    return {
      data,
      status: PaymentSessionStatus.AUTHORIZED,
    }
  }

  async deletePayment(input: DeletePaymentInput): Promise<DeletePaymentOutput> {
    return { data: asRecord(input.data) }
  }

  /**
   * Manual “funds received” step for deferred Instapay: no PSP capture API.
   * Ops confirms the bank/wallet transfer in Admin or horo-ops **Capture payment**; Medusa then
   * marks the payment captured so fulfillment gates can proceed.
   */
  async capturePayment(input: CapturePaymentInput): Promise<CapturePaymentOutput> {
    const data = {
      ...mergeSessionData(asRecord(input.data), this.config),
      provider_status: PaymentSessionStatus.CAPTURED,
      horo_transfer_confirmed_at: new Date().toISOString(),
    }
    return { data }
  }

  async refundPayment(input: RefundPaymentInput): Promise<RefundPaymentOutput> {
    // v2.15.1 enhancement: refundPaymentsWorkflow now exposes metadata on refund creation.
    // We preserve any metadata passed so future refund automation can use it.
    const metadata = asRecord(input.data)
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Instapay refunds are not automated in this provider. ` +
      `Metadata keys preserved: ${Object.keys(metadata).join(", ") || "none"}.`,
    )
  }

  async retrievePayment(input: RetrievePaymentInput): Promise<RetrievePaymentOutput> {
    return { data: asRecord(input.data) }
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

  async getPaymentStatus(input: GetPaymentStatusInput): Promise<GetPaymentStatusOutput> {
    const data = asRecord(input.data)
    const st = asString(data.provider_status)?.toLowerCase()
    if (st === PaymentSessionStatus.CANCELED) {
      return { data, status: PaymentSessionStatus.CANCELED }
    }
    if (st === PaymentSessionStatus.CAPTURED) {
      return { data, status: PaymentSessionStatus.CAPTURED }
    }
    if (st === PaymentSessionStatus.AUTHORIZED || data.authorized === true) {
      return { data, status: PaymentSessionStatus.AUTHORIZED }
    }
    return { data, status: PaymentSessionStatus.PENDING }
  }

  async getWebhookActionAndData(
    _payload: ProviderWebhookPayload["payload"],
  ): Promise<WebhookActionResult> {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Instapay deferred provider does not process webhooks.",
    )
  }
}
