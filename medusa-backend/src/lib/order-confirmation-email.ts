import { Resend } from "resend"

import { medusaAmountToEgp } from "./egp-amount"

/** Matches storefront `GIFT_WRAP_PRODUCT_HANDLE` — line excluded from apparel list in confirmation. */
export const GIFT_WRAP_PRODUCT_HANDLE = "gift-wrap"

export function isGiftWrapLineItem(item: { product_handle?: string | null }): boolean {
  return (item.product_handle || "").toLowerCase() === GIFT_WRAP_PRODUCT_HANDLE
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function formatEgpLine(amount: unknown): string {
  const n = medusaAmountToEgp(amount)
  return `${n.toLocaleString("en-US")} EGP`
}

export type OrderLineLike = {
  title?: string | null
  product_title?: string | null
  variant_title?: string | null
  quantity?: number | string | null
  unit_price?: number | string | null
  total?: number | string | null
  product_handle?: string | null
}

export type AddressLike = {
  first_name?: string | null
  last_name?: string | null
  address_1?: string | null
  address_2?: string | null
  city?: string | null
  province?: string | null
  postal_code?: string | null
  country_code?: string | null
  phone?: string | null
} | null

export type ShippingMethodLike = {
  name?: string | null
  /** Order shipping method total (preferred). */
  total?: number | string | null
  /** Some payloads expose shipping as `amount` only. */
  amount?: number | string | null
} | null

export type OrderConfirmationInput = {
  id: string
  display_id?: number | string | null
  email?: string | null
  currency_code?: string | null
  created_at?: string | null
  subtotal?: number | string | null
  tax_total?: number | string | null
  shipping_total?: number | string | null
  discount_total?: number | string | null
  total?: number | string | null
  items?: OrderLineLike[] | null
  shipping_address?: AddressLike
  billing_address?: AddressLike
  shipping_methods?: ShippingMethodLike[] | null
  storeUrl?: string | null
}

function formatAddress(label: string, addr: AddressLike | undefined): string {
  if (!addr) return ""
  const name = [addr.first_name, addr.last_name].filter(Boolean).join(" ").trim()
  const lines = [
    name,
    addr.address_1,
    addr.address_2,
    [addr.city, addr.province].filter(Boolean).join(", "),
    [addr.postal_code, addr.country_code?.toUpperCase()].filter(Boolean).join(" "),
    addr.phone ? `Phone: ${addr.phone}` : "",
  ]
    .map((l) => (typeof l === "string" ? l.trim() : ""))
    .filter(Boolean)
  if (!lines.length) return ""
  return `<h2 style="margin:24px 0 8px;font-size:15px;">${escapeHtml(label)}</h2><p style="margin:0;line-height:1.5;">${lines
    .map((l) => escapeHtml(l))
    .join("<br/>")}</p>`
}

function lineTitle(item: OrderLineLike): string {
  return (
    item.product_title ||
    item.title ||
    item.variant_title ||
    "Item"
  ).trim()
}

function displayIdNumber(v: number | string | null | undefined): number | null {
  if (typeof v === "number" && Number.isFinite(v) && v > 0) return Math.floor(v)
  if (typeof v === "string") {
    const n = parseInt(v.trim(), 10)
    return Number.isFinite(n) && n > 0 ? n : null
  }
  return null
}

export function buildOrderConfirmationHtml(order: OrderConfirmationInput): string {
  const dispNum = displayIdNumber(order.display_id ?? null)
  const display = dispNum != null ? `HORO-${dispNum}` : order.id
  const created = order.created_at
    ? new Date(order.created_at).toLocaleString("en-EG", { dateStyle: "medium", timeStyle: "short" })
    : ""

  const items = (order.items || []).filter((i) => !isGiftWrapLineItem(i))
  const gift = (order.items || []).find((i) => isGiftWrapLineItem(i))

  const rows = items
    .map((item) => {
      const name = escapeHtml(lineTitle(item))
      const variant = item.variant_title ? escapeHtml(String(item.variant_title)) : ""
      const qty =
        typeof item.quantity === "number" && Number.isFinite(item.quantity)
          ? Math.max(1, Math.floor(item.quantity))
          : Math.max(1, Math.floor(medusaAmountToEgp(item.quantity)) || 1)
      const unit = formatEgpLine(item.unit_price)
      const unitNum = medusaAmountToEgp(item.unit_price)
      const lineTotal = formatEgpLine(
        item.total != null && item.total !== "" ? item.total : unitNum > 0 ? unitNum * qty : null,
      )
      return `<tr>
  <td style="padding:10px 8px;border-bottom:1px solid #e8e4df;">${name}${variant ? `<div style="font-size:12px;color:#666;margin-top:4px;">${variant}</div>` : ""}</td>
  <td style="padding:10px 8px;border-bottom:1px solid #e8e4df;text-align:center;">${qty}</td>
  <td style="padding:10px 8px;border-bottom:1px solid #e8e4df;text-align:right;">${unit}</td>
  <td style="padding:10px 8px;border-bottom:1px solid #e8e4df;text-align:right;">${lineTotal}</td>
</tr>`
    })
    .join("")

  const shipMethod = (order.shipping_methods || [])
    .filter(Boolean)
    .map((m) => {
      const nm = m?.name || "Shipping"
      const amt = formatEgpLine(m?.total ?? m?.amount)
      return `<li>${escapeHtml(nm)} — ${escapeHtml(amt)}</li>`
    })
    .join("")

  const giftBlock = gift
    ? `<p style="margin:16px 0 0;font-size:14px;"><strong>Gift add-on:</strong> ${escapeHtml(lineTitle(gift))} — ${escapeHtml(
        formatEgpLine(gift.total ?? gift.unit_price),
      )}</p>`
    : ""

  const totals = `
<table style="width:100%;max-width:420px;margin-top:20px;border-collapse:collapse;font-size:14px;">
  <tr><td style="padding:6px 0;">Subtotal</td><td style="padding:6px 0;text-align:right;">${escapeHtml(formatEgpLine(order.subtotal))}</td></tr>
  ${medusaAmountToEgp(order.discount_total) > 0 ? `<tr><td style="padding:6px 0;">Discount</td><td style="padding:6px 0;text-align:right;">-${escapeHtml(formatEgpLine(order.discount_total))}</td></tr>` : ""}
  <tr><td style="padding:6px 0;">Shipping</td><td style="padding:6px 0;text-align:right;">${escapeHtml(formatEgpLine(order.shipping_total))}</td></tr>
  ${medusaAmountToEgp(order.tax_total) > 0 ? `<tr><td style="padding:6px 0;">Tax</td><td style="padding:6px 0;text-align:right;">${escapeHtml(formatEgpLine(order.tax_total))}</td></tr>` : ""}
  <tr><td style="padding:10px 0 0;font-weight:bold;">Total (${escapeHtml((order.currency_code || "egp").toUpperCase())})</td><td style="padding:10px 0 0;text-align:right;font-weight:bold;">${escapeHtml(formatEgpLine(order.total))}</td></tr>
</table>`

  const trackUrl =
    order.storeUrl && order.storeUrl.length > 0
      ? `${order.storeUrl.replace(/\/$/, "")}/checkout/success?order_id=${encodeURIComponent(order.id)}`
      : ""

  return `<!DOCTYPE html>
<html><body style="font-family:system-ui,-apple-system,sans-serif;background:#faf8f5;color:#1a1a1a;padding:24px;">
  <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:12px;padding:28px;border:1px solid #e8e4df;">
    <h1 style="font-size:20px;margin:0 0 8px;">Thank you — order confirmed</h1>
    <p style="margin:0 0 16px;color:#444;">Order <strong>${escapeHtml(display)}</strong>${created ? ` · ${escapeHtml(created)}` : ""}</p>
    ${trackUrl ? `<p style="margin:0 0 20px;"><a href="${escapeHtml(trackUrl)}" style="color:#0d5c5c;">View order summary</a></p>` : ""}

    <h2 style="margin:24px 0 8px;font-size:15px;">Items</h2>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <thead><tr>
        <th align="left" style="padding:8px;text-align:left;border-bottom:2px solid #1a1a1a;">Product</th>
        <th style="padding:8px;border-bottom:2px solid #1a1a1a;">Qty</th>
        <th align="right" style="padding:8px;text-align:right;border-bottom:2px solid #1a1a1a;">Unit</th>
        <th align="right" style="padding:8px;text-align:right;border-bottom:2px solid #1a1a1a;">Line</th>
      </tr></thead>
      <tbody>${rows || `<tr><td colspan="4" style="padding:12px;">No line items returned.</td></tr>`}</tbody>
    </table>
    ${giftBlock}
    ${totals}

    ${shipMethod ? `<h2 style="margin:24px 0 8px;font-size:15px;">Shipping method</h2><ul style="margin:0;padding-left:18px;">${shipMethod}</ul>` : ""}

    ${formatAddress("Ship to", order.shipping_address)}
    ${formatAddress("Bill to", order.billing_address)}

    <p style="margin-top:28px;font-size:13px;color:#666;">Questions? Reply to this email or contact us from the site.</p>
  </div>
</body></html>`
}

export type SendResendEmailArgs = {
  apiKey: string
  from: string
  to: string
  subject: string
  html: string
  bcc?: string | null
}

export async function sendOrderConfirmationResend(args: SendResendEmailArgs): Promise<{ ok: boolean; error?: string }> {
  const resend = new Resend(args.apiKey)
  const { error } = await resend.emails.send({
    from: args.from,
    to: args.to,
    subject: args.subject,
    html: args.html,
    ...(args.bcc?.trim() ? { bcc: args.bcc.trim() } : {}),
  })

  if (error) {
    return { ok: false, error: error.message }
  }
  return { ok: true }
}
