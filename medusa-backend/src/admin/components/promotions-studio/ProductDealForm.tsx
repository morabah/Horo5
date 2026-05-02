import { Button, Input, Label, Switch, Text } from "@medusajs/ui"

import { PromoLabelInput } from "./PromoLabelInput"
import { StorefrontPreview } from "./StorefrontPreview"
import type { PromoLabelValue } from "./api"

type ProductDealFormProps = {
  label: { en: string; ar: string }
  startsAt: string
  endsAt: string
  showCountdown: boolean
  discountType: "flat" | "percent"
  discountValue: string
  selectedCount: number
  busy?: boolean
  applying?: boolean
  clearing?: boolean
  onLabelChange: (value: { en: string; ar: string }) => void
  onStartsAtChange: (value: string) => void
  onEndsAtChange: (value: string) => void
  onShowCountdownChange: (value: boolean) => void
  onDiscountTypeChange: (value: "flat" | "percent") => void
  onDiscountValueChange: (value: string) => void
  onApply: () => void
  onClear: () => void
}

export function ProductDealForm({
  label,
  startsAt,
  endsAt,
  showCountdown,
  discountType,
  discountValue,
  selectedCount,
  busy,
  applying,
  clearing,
  onLabelChange,
  onStartsAtChange,
  onEndsAtChange,
  onShowCountdownChange,
  onDiscountTypeChange,
  onDiscountValueChange,
  onApply,
  onClear,
}: ProductDealFormProps) {
  const hasLabel = Boolean(label.en.trim() || label.ar.trim())
  const discountNumber = Number(discountValue)
  const canApply = selectedCount > 0 && hasLabel && discountValue && Number.isFinite(discountNumber) && discountNumber > 0
  const previewOriginal = 1200
  const previewSale = discountType === "flat"
    ? Math.max(1, previewOriginal - (Number.isFinite(discountNumber) ? discountNumber : 0))
    : Math.max(1, Math.round(previewOriginal * (1 - (Number.isFinite(discountNumber) ? discountNumber : 0) / 100)))
  const previewLabel: PromoLabelValue | null = hasLabel
    ? { ...(label.en.trim() ? { en: label.en.trim() } : {}), ...(label.ar.trim() ? { ar: label.ar.trim() } : {}) }
    : null

  return (
    <div className="grid gap-4">
      <div className="rounded-md border border-ui-border-base bg-ui-bg-subtle p-4">
        <div className="flex flex-wrap items-end gap-4">
          <PromoLabelInput
            idPrefix="product-deal"
            value={label}
            disabled={busy}
            required
            onChange={onLabelChange}
          />
          <div className="flex min-w-[190px] flex-col gap-1">
            <Label htmlFor="product-deal-starts" className="text-xs">
              Starts at
            </Label>
            <input
              id="product-deal-starts"
              type="datetime-local"
              className="border-ui-border-base bg-ui-bg-field text-ui-fg-base rounded-md border px-3 py-[7px] text-sm shadow-sm disabled:opacity-50"
              value={startsAt}
              disabled={busy}
              onChange={(event) => onStartsAtChange(event.target.value)}
            />
          </div>
          <div className="flex min-w-[190px] flex-col gap-1">
            <Label htmlFor="product-deal-ends" className="text-xs">
              Ends at
            </Label>
            <input
              id="product-deal-ends"
              type="datetime-local"
              className="border-ui-border-base bg-ui-bg-field text-ui-fg-base rounded-md border px-3 py-[7px] text-sm shadow-sm disabled:opacity-50"
              value={endsAt}
              disabled={busy}
              onChange={(event) => onEndsAtChange(event.target.value)}
            />
          </div>
          <div className="flex min-w-[140px] flex-col gap-1">
            <Label htmlFor="product-deal-discount-type" className="text-xs">
              Discount type
            </Label>
            <select
              id="product-deal-discount-type"
              className="border-ui-border-base bg-ui-bg-field text-ui-fg-base rounded-md border px-3 py-[7px] text-sm shadow-sm disabled:opacity-50"
              value={discountType}
              disabled={busy}
              onChange={(event) => onDiscountTypeChange(event.target.value as "flat" | "percent")}
            >
              <option value="flat">Flat (EGP)</option>
              <option value="percent">Percent (%)</option>
            </select>
          </div>
          <div className="flex min-w-[110px] flex-col gap-1">
            <Label htmlFor="product-deal-discount-value" className="text-xs">
              Discount {discountType === "flat" ? "EGP" : "%"}
            </Label>
            <Input
              id="product-deal-discount-value"
              size="small"
              type="number"
              min={1}
              step={discountType === "flat" ? 1 : 0.5}
              value={discountValue}
              disabled={busy}
              onChange={(event) => onDiscountValueChange(event.target.value)}
              placeholder={discountType === "flat" ? "240" : "20"}
            />
          </div>
          <div className="flex min-h-[34px] items-center gap-2">
            <Switch
              id="product-deal-countdown"
              checked={showCountdown}
              disabled={busy}
              onCheckedChange={onShowCountdownChange}
            />
            <Label htmlFor="product-deal-countdown" className="text-xs">
              Show countdown
            </Label>
          </div>
          <div className="ml-auto flex gap-2">
            <Button
              size="small"
              disabled={busy || !canApply}
              isLoading={applying}
              onClick={onApply}
            >
              Apply to {selectedCount} selected
            </Button>
            <Button
              size="small"
              variant="danger"
              disabled={busy || selectedCount === 0}
              isLoading={clearing}
              onClick={onClear}
            >
              Clear promo
            </Button>
          </div>
        </div>
        <Text size="xsmall" className="mt-3 text-ui-fg-muted">
          Changes apply to new carts only. Existing carts keep captured prices from Medusa.
        </Text>
      </div>

      <StorefrontPreview
        title="Storefront preview"
        label={previewLabel}
        originalPriceEgp={previewOriginal}
        priceEgp={previewSale < previewOriginal ? previewSale : null}
        showCountdown={showCountdown}
      />
    </div>
  )
}
