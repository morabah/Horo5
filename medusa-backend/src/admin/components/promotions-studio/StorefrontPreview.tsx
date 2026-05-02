import { Badge, Text } from "@medusajs/ui"

import type { PromoLabelValue } from "./api"

function labelText(label: PromoLabelValue | null | undefined, locale: "en" | "ar") {
  if (!label) return null
  if (typeof label === "string") return label.trim() || null
  const preferred = locale === "ar" ? label.ar : label.en
  const fallback = locale === "ar" ? label.en : label.ar
  return preferred?.trim() || fallback?.trim() || null
}

type StorefrontPreviewProps = {
  title: string
  label?: PromoLabelValue | null
  priceEgp?: number | null
  originalPriceEgp?: number | null
  thresholdEgp?: number | null
  cartSubtotalEgp?: number
  showCountdown?: boolean
}

export function StorefrontPreview({
  title,
  label,
  priceEgp,
  originalPriceEgp,
  thresholdEgp,
  cartSubtotalEgp = 1150,
  showCountdown = true,
}: StorefrontPreviewProps) {
  const en = labelText(label, "en")
  const ar = labelText(label, "ar")
  const savings = typeof priceEgp === "number" && typeof originalPriceEgp === "number" && originalPriceEgp > priceEgp
    ? originalPriceEgp - priceEgp
    : null
  const pct = savings && originalPriceEgp ? Math.round((savings / originalPriceEgp) * 100) : null
  const remaining = thresholdEgp ? Math.max(0, thresholdEgp - cartSubtotalEgp) : null

  return (
    <div className="rounded-md border border-ui-border-base bg-ui-bg-subtle p-4">
      <Text size="small" weight="plus" className="mb-3">
        {title}
      </Text>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-md border border-ui-border-base bg-ui-bg-base p-3">
          <Text size="small" weight="plus">Product card</Text>
          {en ? <Badge size="small" color="orange" className="mt-2">{en}</Badge> : null}
          <div className="mt-3 flex items-baseline gap-2">
            <Text weight="plus">{priceEgp ? `${priceEgp} EGP` : "Sale price"}</Text>
            {originalPriceEgp ? <Text size="small" className="text-ui-fg-muted line-through">{originalPriceEgp} EGP</Text> : null}
          </div>
          {savings ? (
            <Text size="small" className="mt-1 text-ui-fg-interactive">
              Save {savings} EGP{pct ? ` (${pct}%)` : ""}
            </Text>
          ) : null}
          {showCountdown ? (
            <Text size="xsmall" className="mt-2 text-ui-fg-muted">Countdown chip shown when an end date is set.</Text>
          ) : null}
        </div>
        <div className="rounded-md border border-ui-border-base bg-ui-bg-base p-3">
          <Text size="small" weight="plus">Cart / Arabic label</Text>
          {ar ? <Badge size="small" color="blue" className="mt-2">{ar}</Badge> : null}
          {remaining !== null ? (
            <Text size="small" className="mt-3 text-ui-fg-muted">
              Add {remaining} EGP more for free shipping.
            </Text>
          ) : (
            <Text size="small" className="mt-3 text-ui-fg-muted">
              Storefront uses the shopper locale and falls back between EN and AR.
            </Text>
          )}
        </div>
      </div>
    </div>
  )
}
