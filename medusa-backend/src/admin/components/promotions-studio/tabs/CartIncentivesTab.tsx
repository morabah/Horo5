import { Gift, Tag, TruckFast } from "@medusajs/icons"
import { Badge, Button, Input, Label, Select, Switch, Text, toast } from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useMemo, useState } from "react"

import { PromoLabelInput } from "../PromoLabelInput"
import { StorefrontPreview } from "../StorefrontPreview"
import { fetchProducts, type AdminProduct, type PromoLabelValue } from "../api"
import { sdk } from "../../../lib/sdk"

type CartIncentivesResponse = {
  freeShipping: {
    promotionId: string
    thresholdEgp: number
    currency: string
    label: PromoLabelValue
  } | null
  bundle: {
    promotionId: string
    type: "buyget"
    requireQuantity: number
    applyToQuantity: number
    applicationValue: number
    applicationKind: "fixed" | "percentage"
    label: PromoLabelValue
  } | null
  timedOffer: {
    promotionId: string
    label: PromoLabelValue
    startsAt: string | null
    endsAt: string
    savingsKind: "fixed" | "percentage"
    savingsValue: number
    scope: "storewide" | "collection"
  } | null
  giftWrapProductHandle: string | null
  giftWrapPriceEgp: number | null
  giftWrapLabel: PromoLabelValue | null
  freeShippingLabel?: PromoLabelValue | null
  bundleLabel?: PromoLabelValue | null
  timedOfferLabel?: PromoLabelValue | null
  timedOfferPromotionId?: string | null
  timedOfferStartsAt?: string | null
  timedOfferEndsAt?: string | null
  timedOfferScope?: "storewide" | "collection"
  timedOfferTargets?: Array<{
    id: string
    code: string
    type: "standard" | "buyget"
    label: string
    startsAt: string | null
    endsAt: string | null
  }>
  giftWrapProduct?: {
    id: string
    title: string
    handle: string
    thumbnail?: string | null
  } | null
}

function labelInput(value: PromoLabelValue | null | undefined): { en: string; ar: string } {
  if (!value) return { en: "", ar: "" }
  if (typeof value === "string") return { en: value, ar: value }
  return {
    en: value.en ?? "",
    ar: value.ar ?? "",
  }
}

function labelForApi(value: { en: string; ar: string }): PromoLabelValue | null {
  const en = value.en.trim()
  const ar = value.ar.trim()
  if (!en && !ar) return null
  return { ...(en ? { en } : {}), ...(ar ? { ar } : {}) }
}

function toLocalDateTimeInput(value: string | null | undefined): string {
  if (!value) return ""
  const ms = Date.parse(value)
  if (!Number.isFinite(ms)) return ""
  const date = new Date(ms)
  const offsetMs = date.getTimezoneOffset() * 60 * 1000
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16)
}

function fromLocalDateTimeInput(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const ms = Date.parse(trimmed)
  if (!Number.isFinite(ms)) return null
  return new Date(ms).toISOString()
}

async function fetchCartIncentives(): Promise<CartIncentivesResponse> {
  return sdk.client.fetch<CartIncentivesResponse>("/admin/custom/promotions-studio/cart-incentives", { method: "GET" })
}

async function saveCartIncentives(body: Record<string, unknown>): Promise<CartIncentivesResponse> {
  return sdk.client.fetch<CartIncentivesResponse>("/admin/custom/promotions-studio/cart-incentives", {
    method: "PUT",
    body,
  })
}

export function CartIncentivesTab() {
  const queryClient = useQueryClient()
  const [thresholdEgp, setThresholdEgp] = useState("1500")
  const [freeShippingLabel, setFreeShippingLabel] = useState({ en: "", ar: "" })
  const [bundleEnabled, setBundleEnabled] = useState(true)
  const [bundleRequireQuantity, setBundleRequireQuantity] = useState("2")
  const [bundleApplyToQuantity, setBundleApplyToQuantity] = useState("1")
  const [bundleApplicationKind, setBundleApplicationKind] = useState<"fixed" | "percentage">("percentage")
  const [bundleApplicationValue, setBundleApplicationValue] = useState("100")
  const [bundleLabel, setBundleLabel] = useState({ en: "", ar: "" })
  const [giftWrapProduct, setGiftWrapProduct] = useState<CartIncentivesResponse["giftWrapProduct"]>(null)
  const [giftWrapSearch, setGiftWrapSearch] = useState("")
  const [giftWrapPriceEgp, setGiftWrapPriceEgp] = useState("")
  const [giftWrapLabel, setGiftWrapLabel] = useState({ en: "", ar: "" })
  const [timedOfferEnabled, setTimedOfferEnabled] = useState(false)
  const [timedOfferPromotionId, setTimedOfferPromotionId] = useState("")
  const [timedOfferStartsAt, setTimedOfferStartsAt] = useState("")
  const [timedOfferEndsAt, setTimedOfferEndsAt] = useState("")
  const [timedOfferScope, setTimedOfferScope] = useState<"storewide" | "collection">("storewide")
  const [timedOfferLabel, setTimedOfferLabel] = useState({ en: "", ar: "" })

  const { data, isLoading } = useQuery({
    queryKey: ["horo", "promotions-studio", "cart-incentives"],
    queryFn: fetchCartIncentives,
    staleTime: 30_000,
  })

  const { data: productResults = [] } = useQuery({
    queryKey: ["horo", "promotions-studio", "cart-incentives", "products", giftWrapSearch],
    queryFn: () => fetchProducts(giftWrapSearch),
    enabled: giftWrapSearch.trim().length > 1,
    staleTime: 30_000,
  })

  useEffect(() => {
    if (!data) return
    setThresholdEgp(String(data.freeShipping?.thresholdEgp ?? 1500))
    setFreeShippingLabel(labelInput(data.freeShippingLabel ?? data.freeShipping?.label))
    setBundleEnabled(Boolean(data.bundle))
    setBundleRequireQuantity(String(data.bundle?.requireQuantity ?? 2))
    setBundleApplyToQuantity(String(data.bundle?.applyToQuantity ?? 1))
    setBundleApplicationKind(data.bundle?.applicationKind ?? "percentage")
    setBundleApplicationValue(String(data.bundle?.applicationValue ?? 100))
    setBundleLabel(labelInput(data.bundleLabel ?? data.bundle?.label))
    setGiftWrapProduct(data.giftWrapProduct ?? null)
    setGiftWrapPriceEgp(data.giftWrapPriceEgp != null ? String(data.giftWrapPriceEgp) : "")
    setGiftWrapLabel(labelInput(data.giftWrapLabel))
    setTimedOfferEnabled(Boolean(data.timedOffer ?? data.timedOfferEndsAt))
    setTimedOfferPromotionId(data.timedOfferPromotionId ?? data.timedOffer?.promotionId ?? data.timedOfferTargets?.[0]?.id ?? "")
    setTimedOfferStartsAt(toLocalDateTimeInput(data.timedOfferStartsAt ?? data.timedOffer?.startsAt))
    setTimedOfferEndsAt(toLocalDateTimeInput(data.timedOfferEndsAt ?? data.timedOffer?.endsAt))
    setTimedOfferScope(data.timedOfferScope ?? data.timedOffer?.scope ?? "storewide")
    setTimedOfferLabel(labelInput(data.timedOfferLabel ?? data.timedOffer?.label))
  }, [data])

  const giftWrapMatches = useMemo(() => {
    return productResults
      .filter((product) => product.status !== "deleted")
      .slice(0, 8)
  }, [productResults])

  const mutation = useMutation({
    mutationFn: async () => {
      const threshold = Number(thresholdEgp)
      if (!Number.isFinite(threshold) || threshold <= 0) {
        throw new Error("Free-shipping threshold must be a positive EGP amount.")
      }
      const bundleValue = Number(bundleApplicationValue)
      if (bundleEnabled && (!Number.isFinite(bundleValue) || bundleValue <= 0)) {
        throw new Error("Bundle value must be positive.")
      }
      const timedEndsAt = fromLocalDateTimeInput(timedOfferEndsAt)
      const timedStartsAt = fromLocalDateTimeInput(timedOfferStartsAt)
      if (timedOfferEnabled && !timedEndsAt) {
        throw new Error("Timed offer needs a valid future end date.")
      }
      return saveCartIncentives({
        freeShipping: {
          thresholdEgp: Math.trunc(threshold),
          label: labelForApi(freeShippingLabel),
        },
        bundle: {
          enabled: bundleEnabled,
          requireQuantity: Math.max(1, Math.trunc(Number(bundleRequireQuantity) || 2)),
          applyToQuantity: Math.max(1, Math.trunc(Number(bundleApplyToQuantity) || 1)),
          applicationKind: bundleApplicationKind,
          applicationValue: Math.trunc(bundleValue || 100),
          label: labelForApi(bundleLabel),
        },
        giftWrap: {
          productId: giftWrapProduct?.id,
          handle: giftWrapProduct?.handle,
          priceEgp: giftWrapPriceEgp ? Math.max(1, Math.trunc(Number(giftWrapPriceEgp))) : null,
          label: labelForApi(giftWrapLabel),
        },
        timedOffer: {
          enabled: timedOfferEnabled,
          promotionId: timedOfferPromotionId || undefined,
          startsAt: timedStartsAt,
          endsAt: timedEndsAt,
          scope: timedOfferScope,
          label: labelForApi(timedOfferLabel),
        },
      })
    },
    onSuccess: async (saved) => {
      toast.success("Cart incentives saved.")
      queryClient.setQueryData(["horo", "promotions-studio", "cart-incentives"], saved)
      await queryClient.invalidateQueries({ queryKey: ["horo", "promotions-studio", "cart-incentives"] })
    },
    onError: (error: Error) => toast.error("Save failed.", { description: error.message }),
  })

  const busy = isLoading || mutation.isPending

  function chooseGiftWrap(product: AdminProduct) {
    setGiftWrapProduct({
      id: product.id,
      title: product.title,
      handle: product.handle,
      thumbnail: product.thumbnail ?? null,
    })
    setGiftWrapSearch("")
  }

  return (
    <div className="grid gap-5">
      <div className="flex justify-end">
        <Button size="small" disabled={busy} isLoading={mutation.isPending} onClick={() => mutation.mutate()}>
          Save cart incentives
        </Button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
        <div className="grid gap-5">
          <section className="rounded-md border border-ui-border-base p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-ui-fg-muted" />
                <div>
                  <Text weight="plus">Timed cart offer</Text>
                  <Text size="small" className="text-ui-fg-muted">Attaches a real campaign window to an active automatic incentive promotion.</Text>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={timedOfferEnabled} disabled={busy} onCheckedChange={setTimedOfferEnabled} />
                <Text size="small">Enabled</Text>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-1">
                <Label htmlFor="timed-offer-promotion" className="text-xs">Target promotion</Label>
                <Select
                  size="small"
                  value={timedOfferPromotionId}
                  disabled={busy || !timedOfferEnabled || !(data?.timedOfferTargets?.length)}
                  onValueChange={setTimedOfferPromotionId}
                >
                  <Select.Trigger id="timed-offer-promotion">
                    <Select.Value />
                  </Select.Trigger>
                  <Select.Content>
                    {(data?.timedOfferTargets ?? []).map((target) => (
                      <Select.Item key={target.id} value={target.id}>
                        {target.label}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="timed-offer-scope" className="text-xs">Display scope</Label>
                <Select
                  size="small"
                  value={timedOfferScope}
                  disabled={busy || !timedOfferEnabled}
                  onValueChange={(value) => setTimedOfferScope(value as "storewide" | "collection")}
                >
                  <Select.Trigger id="timed-offer-scope">
                    <Select.Value />
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Item value="storewide">Storewide</Select.Item>
                    <Select.Item value="collection">Collection</Select.Item>
                  </Select.Content>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="timed-offer-start" className="text-xs">Starts at (optional)</Label>
                <Input
                  id="timed-offer-start"
                  size="small"
                  type="datetime-local"
                  value={timedOfferStartsAt}
                  disabled={busy || !timedOfferEnabled}
                  onChange={(event) => setTimedOfferStartsAt(event.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="timed-offer-end" className="text-xs">Ends at</Label>
                <Input
                  id="timed-offer-end"
                  size="small"
                  type="datetime-local"
                  value={timedOfferEndsAt}
                  disabled={busy || !timedOfferEnabled}
                  onChange={(event) => setTimedOfferEndsAt(event.target.value)}
                />
              </div>
            </div>
            <div className="mt-4">
              <PromoLabelInput idPrefix="timed-offer" value={timedOfferLabel} disabled={busy || !timedOfferEnabled} onChange={setTimedOfferLabel} />
            </div>
          </section>

          <section className="rounded-md border border-ui-border-base p-5">
            <div className="mb-4 flex items-center gap-2">
              <TruckFast className="h-5 w-5 text-ui-fg-muted" />
              <div>
                <Text weight="plus">Free shipping threshold</Text>
                <Text size="small" className="text-ui-fg-muted">Writes the native HORO_FREE_SHIPPING automatic promotion.</Text>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-[180px_minmax(0,1fr)]">
              <div className="flex flex-col gap-1">
                <Label htmlFor="free-shipping-threshold-studio" className="text-xs">Threshold EGP</Label>
                <Input
                  id="free-shipping-threshold-studio"
                  size="small"
                  type="number"
                  min={1}
                  value={thresholdEgp}
                  disabled={busy}
                  onChange={(event) => setThresholdEgp(event.target.value)}
                />
              </div>
              <PromoLabelInput
                idPrefix="free-shipping"
                value={freeShippingLabel}
                disabled={busy}
                onChange={setFreeShippingLabel}
              />
            </div>
          </section>

          <section className="rounded-md border border-ui-border-base p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <Text weight="plus">Bundle (BUYGET)</Text>
                <Text size="small" className="text-ui-fg-muted">Automatic native buy-get promotion for cart math.</Text>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={bundleEnabled} disabled={busy} onCheckedChange={setBundleEnabled} />
                <Text size="small">Enabled</Text>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="flex flex-col gap-1">
                <Label htmlFor="bundle-require" className="text-xs">Buy quantity</Label>
                <Input id="bundle-require" size="small" type="number" min={1} value={bundleRequireQuantity} disabled={busy || !bundleEnabled} onChange={(event) => setBundleRequireQuantity(event.target.value)} />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="bundle-apply" className="text-xs">Discount quantity</Label>
                <Input id="bundle-apply" size="small" type="number" min={1} value={bundleApplyToQuantity} disabled={busy || !bundleEnabled} onChange={(event) => setBundleApplyToQuantity(event.target.value)} />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="bundle-kind" className="text-xs">Discount type</Label>
                <Select
                  size="small"
                  value={bundleApplicationKind}
                  disabled={busy || !bundleEnabled}
                  onValueChange={(value) => setBundleApplicationKind(value as "fixed" | "percentage")}
                >
                  <Select.Trigger id="bundle-kind">
                    <Select.Value />
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Item value="percentage">Percent</Select.Item>
                    <Select.Item value="fixed">Flat EGP</Select.Item>
                  </Select.Content>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="bundle-value" className="text-xs">Value</Label>
                <Input id="bundle-value" size="small" type="number" min={1} value={bundleApplicationValue} disabled={busy || !bundleEnabled} onChange={(event) => setBundleApplicationValue(event.target.value)} />
              </div>
            </div>
            <div className="mt-4">
              <PromoLabelInput idPrefix="bundle" value={bundleLabel} disabled={busy || !bundleEnabled} onChange={setBundleLabel} />
            </div>
          </section>

          <section className="rounded-md border border-ui-border-base p-5">
            <div className="mb-4 flex items-center gap-2">
              <Gift className="h-5 w-5 text-ui-fg-muted" />
              <div>
                <Text weight="plus">Gift wrap</Text>
                <Text size="small" className="text-ui-fg-muted">Display copy and price are stored on the selected product metadata.</Text>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_160px]">
              <div className="grid gap-2">
                <Label htmlFor="gift-wrap-product" className="text-xs">Gift-wrap product</Label>
                {giftWrapProduct ? (
                  <div className="flex items-center gap-3 rounded-md border border-ui-border-base bg-ui-bg-subtle p-2">
                    {giftWrapProduct.thumbnail ? (
                      <img src={giftWrapProduct.thumbnail} alt="" className="h-10 w-10 rounded object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded bg-ui-bg-component" />
                    )}
                    <div className="min-w-0">
                      <Text size="small" weight="plus" className="truncate">{giftWrapProduct.title}</Text>
                      <Text size="xsmall" className="font-mono text-ui-fg-muted">{giftWrapProduct.handle}</Text>
                    </div>
                    <Badge size="small" color={giftWrapProduct.handle === "gift-wrap" ? "green" : "orange"}>
                      {giftWrapProduct.handle === "gift-wrap" ? "canonical" : "custom"}
                    </Badge>
                  </div>
                ) : null}
                <Input
                  id="gift-wrap-product"
                  size="small"
                  value={giftWrapSearch}
                  disabled={busy}
                  onChange={(event) => setGiftWrapSearch(event.target.value)}
                  placeholder="Search product title or handle"
                />
                {giftWrapMatches.length > 0 ? (
                  <div className="max-h-56 overflow-auto rounded-md border border-ui-border-base">
                    {giftWrapMatches.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        className="flex w-full items-center gap-3 border-b border-ui-border-base px-3 py-2 text-left last:border-0 hover:bg-ui-bg-subtle"
                        onClick={() => chooseGiftWrap(product)}
                      >
                        {product.thumbnail ? <img src={product.thumbnail} alt="" className="h-8 w-8 rounded object-cover" /> : <div className="h-8 w-8 rounded bg-ui-bg-component" />}
                        <span className="min-w-0">
                          <Text size="small" weight="plus" className="truncate">{product.title}</Text>
                          <Text size="xsmall" className="font-mono text-ui-fg-muted">{product.handle}</Text>
                        </span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="gift-wrap-price" className="text-xs">Display price EGP</Label>
                <Input id="gift-wrap-price" size="small" type="number" min={1} value={giftWrapPriceEgp} disabled={busy} onChange={(event) => setGiftWrapPriceEgp(event.target.value)} />
              </div>
            </div>
            <div className="mt-4">
              <PromoLabelInput idPrefix="gift-wrap" value={giftWrapLabel} disabled={busy} onChange={setGiftWrapLabel} />
            </div>
          </section>
        </div>

        <div className="grid content-start gap-4">
          <StorefrontPreview
            title="Mini-cart preview"
            label={labelForApi(freeShippingLabel)}
            thresholdEgp={Number(thresholdEgp) || 0}
          />
          <div className="rounded-md border border-ui-border-base bg-ui-bg-subtle p-4">
            <Text size="small" weight="plus">Native engine</Text>
            <Text size="small" className="mt-2 text-ui-fg-muted">
              Free shipping, BUYGET math, and code promos stay in Medusa. This Studio only edits the operator-facing controls and label metadata.
            </Text>
          </div>
        </div>
      </div>
    </div>
  )
}
