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

export type SendAbandonedCartReminderArgs = {
  apiKey: string
  from: string
  to: string
  locale: "en" | "ar"
  storeUrl: string
  cartValueEgp?: number | null
  cartId?: string | null
  unsubscribeUrl?: string | null
}

export function buildAbandonedCartReminderHtml(args: {
  locale: "en" | "ar"
  storeUrl: string
  cartValueEgp?: number | null
  ctaUrl: string
  unsubscribeUrl?: string | null
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
      ? `<p style="margin-top:24px;font-size:12px;color:#888;"><a href="${escapeHtml(args.unsubscribeUrl)}">إلغاء تذكيرات السلة</a></p>`
      : `<p style="margin-top:24px;font-size:12px;color:#888;"><a href="${escapeHtml(args.unsubscribeUrl)}">Unsubscribe from cart reminders</a></p>`
    : ""

  return `<!DOCTYPE html>
<html dir="${dir}"><body style="font-family:system-ui,-apple-system,sans-serif;background:#faf8f5;color:#1a1a1a;padding:24px;direction:${dir};">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:28px;border:1px solid #e8e4df;text-align:${align};">
    <h1 style="font-size:20px;margin:0 0 12px;">${escapeHtml(title)}</h1>
    <p style="margin:0 0 12px;color:#444;line-height:1.6;">${escapeHtml(body)}</p>
    ${valueLine ? `<p style="margin:0 0 20px;font-weight:600;">${escapeHtml(valueLine)}</p>` : ""}
    <a href="${escapeHtml(args.ctaUrl)}" style="display:inline-block;padding:12px 20px;background:#e8593c;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">${escapeHtml(cta)}</a>
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
