import { Resend } from "resend"

import { buildCartRecoverUrl, createCartRecoverToken, createUnsubscribeToken } from "./cart-recover-token"
import { recoveryBodyCopy, recoveryCartCtaLabel } from "./storefront-commerce-copy"

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

export type AbandonCartLinePreview = {
  title: string
  quantity: number
  thumbnailUrl?: string | null
}

export type SendAbandonedCartReminderArgs = {
  apiKey: string
  from: string
  to: string
  locale: "en" | "ar"
  storeUrl: string
  cartValueEgp?: number | null
  cartId?: string | null
  unsubscribeUrl?: string | null
  lines?: AbandonCartLinePreview[]
}

export function buildAbandonedCartReminderHtml(args: {
  locale: "en" | "ar"
  storeUrl: string
  cartValueEgp?: number | null
  ctaUrl: string
  unsubscribeUrl?: string | null
  lines?: AbandonCartLinePreview[]
}): string {
  const isAr = args.locale === "ar"
  const dir = isAr ? "rtl" : "ltr"
  const align = isAr ? "right" : "left"
  const title = isAr ? "لسه في حاجات في سلتك على HORO" : "You left something in your HORO bag"
  const body = recoveryBodyCopy(args.locale)
  const cta = recoveryCartCtaLabel(args.locale)
  const valueLine =
    args.cartValueEgp && args.cartValueEgp > 0
      ? isAr
        ? `قيمة السلة: ${Math.round(args.cartValueEgp)} ج.م`
        : `Cart value: EGP ${Math.round(args.cartValueEgp)}`
      : ""
  const unsub = args.unsubscribeUrl
    ? isAr
      ? `<p style="margin-top:24px;font-size:12px;color:#8C2340;"><a href="${escapeHtml(args.unsubscribeUrl)}" style="color:#8C2340;">إلغاء تذكيرات السلة</a></p>`
      : `<p style="margin-top:24px;font-size:12px;color:#8C2340;"><a href="${escapeHtml(args.unsubscribeUrl)}" style="color:#8C2340;">Unsubscribe from cart reminders</a></p>`
    : ""

  const lineItems =
    args.lines && args.lines.length > 0
      ? `<ul style="margin:0 0 20px;padding:0;list-style:none;">${args.lines
          .slice(0, 4)
          .map((line) => {
            const thumb = line.thumbnailUrl?.trim()
            const img = thumb
              ? `<img src="${escapeHtml(thumb)}" alt="" width="48" height="48" style="object-fit:cover;border-radius:8px;margin-${isAr ? "left" : "right"}:12px;" />`
              : ""
            return `<li style="display:flex;align-items:center;margin-bottom:10px;font-size:14px;color:#4F111F;">${img}<span>${escapeHtml(line.title)} × ${line.quantity}</span></li>`
          })
          .join("")}</ul>`
      : ""

  return `<!DOCTYPE html>
<html dir="${dir}"><body style="font-family:Inter, Arial, Helvetica, sans-serif;background:#FFF7F5;color:#4F111F;padding:24px;direction:${dir};">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:28px;border:1px solid #E8C9C6;text-align:${align};">
    <h1 style="font-family:'Space Grotesk', Inter, Arial, Helvetica, sans-serif;font-size:20px;margin:0 0 12px;">${escapeHtml(title)}</h1>
    <p style="margin:0 0 12px;color:#4F111F;line-height:1.6;">${escapeHtml(body)}</p>
    ${lineItems}
    ${valueLine ? `<p style="margin:0 0 20px;font-weight:600;">${escapeHtml(valueLine)}</p>` : ""}
    <a href="${escapeHtml(args.ctaUrl)}" style="display:inline-block;padding:12px 20px;background:#8C2340;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">${escapeHtml(cta)}</a>
    ${unsub}
  </div>
</body></html>`
}

export function resolveAbandonedCartCtaUrl(args: {
  storeUrl: string
  cartId?: string | null
  email: string
}): string {
  const base = args.storeUrl.replace(/\/$/, "")
  if (args.cartId) {
    const token = createCartRecoverToken({ cartId: args.cartId, email: args.email })
    if (token) return buildCartRecoverUrl(base, token)
    return `${base}/cart`
  }
  return `${base}/cart`
}

export async function sendAbandonedCartReminderResend(
  args: SendAbandonedCartReminderArgs,
): Promise<{ ok: boolean; error?: string }> {
  const resend = new Resend(args.apiKey)
  const ctaUrl = resolveAbandonedCartCtaUrl({
    storeUrl: args.storeUrl,
    cartId: args.cartId,
    email: args.to,
  })
  const html = buildAbandonedCartReminderHtml({
    locale: args.locale,
    storeUrl: args.storeUrl,
    cartValueEgp: args.cartValueEgp,
    ctaUrl,
    unsubscribeUrl: args.unsubscribeUrl,
    lines: args.lines,
  })
  const subject =
    args.locale === "ar" ? "سلتك على HORO لسه موجودة" : "Your HORO bag is still waiting"

  const headers: Record<string, string> = {}
  if (args.unsubscribeUrl) {
    headers["List-Unsubscribe"] = `<${args.unsubscribeUrl}>`
    headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click"
  }

  const { error } = await resend.emails.send({
    from: args.from,
    to: args.to,
    subject,
    html,
    headers: Object.keys(headers).length ? headers : undefined,
  })

  if (error) {
    return { ok: false, error: error.message }
  }
  return { ok: true }
}

export function buildUnsubscribeUrl(storeUrl: string, email: string): string | null {
  const base = storeUrl.replace(/\/$/, "")
  const token = createUnsubscribeToken(email)
  if (!token) return null
  return `${base}/api/abandoned-cart/unsubscribe?token=${encodeURIComponent(token)}`
}
