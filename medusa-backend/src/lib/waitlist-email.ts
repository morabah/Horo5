import { Resend } from "resend"

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

export type SendWaitlistWelcomeArgs = {
  apiKey: string
  from: string
  to: string
  locale: "en" | "ar"
  storeUrl?: string | null
}

export function buildWaitlistWelcomeHtml(args: { locale: "en" | "ar"; storeUrl?: string | null }): string {
  const isAr = args.locale === "ar"
  const dir = isAr ? "rtl" : "ltr"
  const align = isAr ? "right" : "left"
  const storeUrl = args.storeUrl?.trim() || ""

  const title = isAr ? "مرحباً بك في قائمة انتظار HORO" : "You're on the HORO waitlist"
  const body = isAr
    ? "أصلك الفن المصري الأصلي على قميصك. سنرسل لك التفاصيل فور الإطلاق — لا بريد مزعج، فقط ما يستحق."
    : "Original Egyptian art on a tee. We'll reach out the moment we go live — no spam, only what matters."
  const share = isAr ? "شارك مع صديق" : "Share with a friend"
  const shareBody = isAr
    ? "ساعدنا في نشر الكلمة. كلما زاد العدد، كانت الانطلاقة أقوى."
    : "Help us spread the word. The more people who join, the stronger the launch."
  const footer = isAr
    ? "للإلغاء من القائمة، أجب على هذا البريد بكلمة 'unsubscribe'."
    : "To unsubscribe, reply to this email with 'unsubscribe'."

  const shareUrl = storeUrl ? `${storeUrl.replace(/\/$/, "")}` : ""
  const shareLinks = shareUrl
    ? `<p style="margin:16px 0 0;">
      <a href="https://wa.me/?text=${encodeURIComponent(`${isAr ? "سجّلت في قائمة انتظار HORO" : "I joined the HORO waitlist"} ${shareUrl}`)}" style="display:inline-block;margin-${isAr ? "left" : "right"}:8px;padding:10px 16px;background:#25D366;color:#fff;border-radius:6px;text-decoration:none;font-size:13px;">WhatsApp</a>
      <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(isAr ? "سجّلت في قائمة انتظار HORO" : "I joined the HORO waitlist")}&url=${encodeURIComponent(shareUrl)}" style="display:inline-block;padding:10px 16px;background:#4F111F;color:#fff;border-radius:6px;text-decoration:none;font-size:13px;">X</a>
    </p>`
    : ""

  return `<!DOCTYPE html>
<html dir="${dir}"><body style="font-family:Inter,Arial,Helvetica,sans-serif;background:#FFF7F5;color:#4F111F;padding:24px;direction:${dir};">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:28px;border:1px solid #E8C9C6;text-align:${align};">
    <h1 style="font-size:20px;margin:0 0 12px;">${escapeHtml(title)}</h1>
    <p style="margin:0 0 20px;color:#4F111F;line-height:1.6;">${escapeHtml(body)}</p>
    <hr style="border:0;border-top:1px solid #E8C9C6;margin:24px 0;" />
    <h2 style="font-size:15px;margin:0 0 8px;">${escapeHtml(share)}</h2>
    <p style="margin:0 0 12px;color:#4F111F;line-height:1.6;">${escapeHtml(shareBody)}</p>
    ${shareLinks}
    <p style="margin-top:28px;font-size:12px;color:#8C2340;">${escapeHtml(footer)}</p>
  </div>
</body></html>`
}

export async function sendWaitlistWelcomeResend(args: SendWaitlistWelcomeArgs): Promise<{ ok: boolean; error?: string }> {
  const resend = new Resend(args.apiKey)
  const html = buildWaitlistWelcomeHtml({ locale: args.locale, storeUrl: args.storeUrl })
  const subject = args.locale === "ar" ? "مرحباً بك في قائمة انتظار HORO" : "Welcome to the HORO waitlist"

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

export type SendWaitlistLaunchArgs = {
  apiKey: string
  from: string
  to: string
  locale: "en" | "ar"
  storeUrl?: string | null
  referralCode?: string | null
  couponCode?: string | null
}

export function buildWaitlistLaunchHtml(args: { locale: "en" | "ar"; storeUrl?: string | null; referralCode?: string | null; couponCode?: string | null }): string {
  const isAr = args.locale === "ar"
  const dir = isAr ? "rtl" : "ltr"
  const align = isAr ? "right" : "left"
  const storeUrl = args.storeUrl?.trim() || ""
  const referralCode = args.referralCode?.trim() || null
  const couponCode = args.couponCode?.trim() || null

  const title = isAr ? "HORO متاح الآن — فن مصري ترتديه" : "HORO is live — Egyptian art you can wear"
  const body = isAr
    ? "لحظتك التي انتظرتها وصلت. كل قطعة مطبوعة بعناية، ومصممة لتعكس ما تشعر به. تسوّق الآن قبل نفاد المقاسات."
    : "The moment you've been waiting for is here. Every piece is printed with care and designed to reflect how you feel. Shop now before sizes sell out."
  const cta = isAr ? "تسوّق الآن" : "Shop now"
  const referralTitle = isAr ? "شارك مع صديق واحصل على مكافأة" : "Share with a friend & earn"
  const referralBody = isAr
    ? "كلما زاد عدد الأصدقاء الذين يسجّلون برابطك، زادت مكافأتك."
    : "The more friends who join through your link, the bigger your reward."
  const couponTitle = isAr ? "هديتك الحصرية" : "Your exclusive gift"
  const couponBody = isAr
    ? "استخدم الكود أدناه لتحصل على خصم ٢٠٪ على طلبيتك الأولى (صالح لـ ٧٢ ساعة)."
    : "Use the code below for 20% off your first order (valid for 72 hours)."
  const footer = isAr
    ? "للإلغاء من القائمة، أجب على هذا البريد بكلمة 'unsubscribe'."
    : "To unsubscribe, reply to this email with 'unsubscribe'."

  const shopUrl = storeUrl ? `${storeUrl.replace(/\/$/, "")}` : ""
  const referralUrl = referralCode ? `${shopUrl}?ref=${referralCode}` : shopUrl

  const ctaBlock = shopUrl
    ? `<a href="${escapeHtml(shopUrl)}" style="display:inline-block;margin:20px 0;padding:14px 28px;background:#8C2340;color:#FFFFFF;border-radius:8px;text-decoration:none;font-size:15px;font-weight:600;">${escapeHtml(cta)}</a>`
    : ""

  const referralBlock = referralCode && referralUrl
    ? `<hr style="border:0;border-top:1px solid #E8C9C6;margin:24px 0;" />
    <h2 style="font-size:15px;margin:0 0 8px;">${escapeHtml(referralTitle)}</h2>
    <p style="margin:0 0 12px;color:#4F111F;line-height:1.6;">${escapeHtml(referralBody)}</p>
    <p style="margin:0 0 12px;font-size:13px;word-break:break-all;color:#8C2340;">${escapeHtml(referralUrl)}</p>
    <p style="margin:16px 0 0;">
      <a href="https://wa.me/?text=${encodeURIComponent(`${isAr ? "HORO متاح الآن! تسوّق معي:" : "HORO is live! Shop with me:"} ${referralUrl}`)}" style="display:inline-block;margin-${isAr ? "left" : "right"}:8px;padding:10px 16px;background:#25D366;color:#fff;border-radius:6px;text-decoration:none;font-size:13px;">WhatsApp</a>
      <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(isAr ? "HORO متاح الآن! فن مصري ترتديه." : "HORO is live! Egyptian art you can wear.")}&url=${encodeURIComponent(referralUrl)}" style="display:inline-block;padding:10px 16px;background:#4F111F;color:#fff;border-radius:6px;text-decoration:none;font-size:13px;">X</a>
    </p>`
    : ""

  const couponBlock = couponCode
    ? `<hr style="border:0;border-top:1px solid #E8C9C6;margin:24px 0;" />
    <h2 style="font-size:15px;margin:0 0 8px;">${escapeHtml(couponTitle)}</h2>
    <p style="margin:0 0 12px;color:#4F111F;line-height:1.6;">${escapeHtml(couponBody)}</p>
    <p style="margin:0 0 0;padding:12px 16px;background:#FEE5E2;border:1px dashed #8C2340;border-radius:6px;font-size:18px;font-weight:600;letter-spacing:2px;text-align:center;color:#4F111F;">${escapeHtml(couponCode)}</p>`
    : ""

  return `<!DOCTYPE html>
<html dir="${dir}"><body style="font-family:Inter,Arial,Helvetica,sans-serif;background:#FFF7F5;color:#4F111F;padding:24px;direction:${dir};">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:28px;border:1px solid #E8C9C6;text-align:${align};">
    <h1 style="font-size:22px;margin:0 0 12px;">${escapeHtml(title)}</h1>
    <p style="margin:0 0 20px;color:#4F111F;line-height:1.6;">${escapeHtml(body)}</p>
    ${ctaBlock}
    ${couponBlock}
    ${referralBlock}
    <p style="margin-top:28px;font-size:12px;color:#8C2340;">${escapeHtml(footer)}</p>
  </div>
</body></html>`
}

export async function sendWaitlistLaunchResend(args: SendWaitlistLaunchArgs): Promise<{ ok: boolean; error?: string }> {
  const resend = new Resend(args.apiKey)
  const html = buildWaitlistLaunchHtml({ locale: args.locale, storeUrl: args.storeUrl, referralCode: args.referralCode, couponCode: args.couponCode })
  const subject = args.locale === "ar" ? "HORO متاح الآن — فن مصري ترتديه" : "HORO is live — Egyptian art you can wear"

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
