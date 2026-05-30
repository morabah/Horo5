import { Resend } from "resend"

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
}

export function buildAbandonedCartReminderHtml(args: {
  locale: "en" | "ar"
  storeUrl: string
  cartValueEgp?: number | null
}): string {
  const isAr = args.locale === "ar"
  const dir = isAr ? "rtl" : "ltr"
  const align = isAr ? "right" : "left"
  const checkoutUrl = `${args.storeUrl.replace(/\/$/, "")}/checkout`
  const title = isAr ? "لسه في حاجات في سلتك على HORO" : "You left something in your HORO bag"
  const body = isAr
    ? "كمّل طلبك — الدفع عند الاستلام متاح والاستبدال خلال 14 يوماً."
    : "Finish your order — COD is available and 14-day exchange applies."
  const cta = isAr ? "كمّل الطلب" : "Complete checkout"
  const valueLine =
    args.cartValueEgp && args.cartValueEgp > 0
      ? isAr
        ? `قيمة السلة: ${Math.round(args.cartValueEgp)} ج.م`
        : `Cart value: EGP ${Math.round(args.cartValueEgp)}`
      : ""

  return `<!DOCTYPE html>
<html dir="${dir}"><body style="font-family:system-ui,-apple-system,sans-serif;background:#faf8f5;color:#1a1a1a;padding:24px;direction:${dir};">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:28px;border:1px solid #e8e4df;text-align:${align};">
    <h1 style="font-size:20px;margin:0 0 12px;">${escapeHtml(title)}</h1>
    <p style="margin:0 0 12px;color:#444;line-height:1.6;">${escapeHtml(body)}</p>
    ${valueLine ? `<p style="margin:0 0 20px;font-weight:600;">${escapeHtml(valueLine)}</p>` : ""}
    <a href="${escapeHtml(checkoutUrl)}" style="display:inline-block;padding:12px 20px;background:#e8593c;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">${escapeHtml(cta)}</a>
  </div>
</body></html>`
}

export async function sendAbandonedCartReminderResend(
  args: SendAbandonedCartReminderArgs,
): Promise<{ ok: boolean; error?: string }> {
  const resend = new Resend(args.apiKey)
  const html = buildAbandonedCartReminderHtml({
    locale: args.locale,
    storeUrl: args.storeUrl,
    cartValueEgp: args.cartValueEgp,
  })
  const subject =
    args.locale === "ar" ? "كمّل طلبك من HORO" : "Complete your HORO order"

  const { error } = await resend.emails.send({
    from: args.from,
    to: args.to,
    subject,
    html,
  })

  if (error) {
    return { ok: false, error: error.message }
  }
  return { ok: true }
}
