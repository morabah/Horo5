import { Clock, PencilSquare, Trash } from "@medusajs/icons"
import { Badge, Button, IconButton, Input, Label, Switch, Text, Tooltip, toast } from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useCallback, useMemo, useState } from "react"

import { ProductDealForm } from "../ProductDealForm"
import { PromoLabelInput } from "../PromoLabelInput"
import {
  computeVariantPrices,
  fetchProducts,
  formatPricePreview,
  getPromoEndsAt,
  getPromoLabel,
  getPromoLabelDisplay,
  getPromoPriceListId,
  getPromoShowCountdown,
  getPromoStartsAt,
  getPromoStatus,
  getPromoStatusText,
  isPromoActive,
  patchProductMetadata,
  promoLabelForMetadata,
  toIsoOrNull,
  type AdminProduct,
} from "../api"
import { sdk } from "../../../lib/sdk"

function promoStatusColor(status: ReturnType<typeof getPromoStatus>) {
  if (status === "scheduled") return "blue"
  if (status === "active") return "green"
  if (status === "expired") return "grey"
  return "grey"
}

async function deletePriceListIfPresent(product: AdminProduct) {
  const priceListId = getPromoPriceListId(product)
  if (!priceListId) return
  try {
    await sdk.admin.priceList.delete(priceListId)
  } catch (err: any) {
    if (err?.status !== 404) {
      console.warn(`Failed to delete price list ${priceListId}:`, err)
    }
  }
}

async function clearProductPromo(product: AdminProduct) {
  await deletePriceListIfPresent(product)
  const metadata = { ...(product.metadata ?? {}) }
  delete metadata.promoLabel
  delete metadata.promo_starts_at
  delete metadata.promo_ends_at
  delete metadata.promoShowCountdown
  delete metadata.promoPriceListId
  await patchProductMetadata(product.id, metadata)
}

export function ProductDealsTab() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [promoLabel, setPromoLabel] = useState({ en: "", ar: "" })
  const [promoStartsAt, setPromoStartsAt] = useState("")
  const [promoEndsAt, setPromoEndsAt] = useState("")
  const [showCountdown, setShowCountdown] = useState(true)
  const [discountType, setDiscountType] = useState<"flat" | "percent">("flat")
  const [discountValue, setDiscountValue] = useState("")
  const [statusMsg, setStatusMsg] = useState<string | null>(null)
  const [filterActive, setFilterActive] = useState(false)
  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState({ en: "", ar: "" })
  const [editStartsAt, setEditStartsAt] = useState("")
  const [editEndsAt, setEditEndsAt] = useState("")
  const [editShowCountdown, setEditShowCountdown] = useState(true)

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["horo", "promotions-studio", "products", search],
    queryFn: () => fetchProducts(search),
    staleTime: 30_000,
  })

  const displayed = useMemo(() => {
    const list = filterActive ? products.filter(isPromoActive) : products
    return list.filter((product) => product.status !== "deleted")
  }, [products, filterActive])

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === displayed.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(displayed.map((product) => product.id)))
    }
  }, [displayed, selectedIds.size])

  const invalidateProducts = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["horo", "promotions-studio", "products"] })
  }, [queryClient])

  const applyMutation = useMutation({
    mutationFn: async () => {
      if (selectedIds.size === 0) throw new Error("No products selected.")
      const labelForMeta = promoLabelForMetadata(promoLabel)
      if (!labelForMeta) throw new Error("Promo label EN or AR is required.")
      const dval = Number(discountValue)
      if (!Number.isFinite(dval) || dval <= 0) throw new Error("Discount value must be a positive number.")
      if (discountType === "percent" && dval >= 100) throw new Error("Percent discount must be less than 100%.")
      const startsAtIso = toIsoOrNull(promoStartsAt)
      const endsAtIso = toIsoOrNull(promoEndsAt)
      const selectedProducts = products.filter((product) => selectedIds.has(product.id))
      const priceUpdates = selectedProducts.map((product) => ({
        product,
        variantPrices: computeVariantPrices(product, discountType, dval),
      }))
      const productWithoutDiscount = priceUpdates.find(({ variantPrices }) => variantPrices.length === 0)?.product
      if (productWithoutDiscount) {
        throw new Error(`No discounted EGP variant price could be generated for ${productWithoutDiscount.title}.`)
      }

      await Promise.all(
        priceUpdates.map(async ({ product, variantPrices }) => {
          await deletePriceListIfPresent(product)
          const metadata = { ...(product.metadata ?? {}) }
          metadata.promoLabel = labelForMeta
          if (startsAtIso) metadata.promo_starts_at = startsAtIso
          else delete metadata.promo_starts_at
          if (endsAtIso) metadata.promo_ends_at = endsAtIso
          else delete metadata.promo_ends_at
          metadata.promoShowCountdown = showCountdown

          if (variantPrices.length > 0) {
            const priceList = await sdk.admin.priceList.create({
              title: `Horo Promo - ${product.title}`,
              description: `Auto-generated promo price list for ${product.handle}`,
              status: "active",
              type: "sale",
              starts_at: startsAtIso,
              ends_at: endsAtIso,
              prices: variantPrices,
            })
            metadata.promoPriceListId = priceList.price_list.id
          } else {
            delete metadata.promoPriceListId
          }
          await patchProductMetadata(product.id, metadata)
        })
      )
    },
    onSuccess: async () => {
      setStatusMsg(`Applied to ${selectedIds.size} product(s).`)
      toast.success("Product deal applied.")
      setSelectedIds(new Set())
      setDiscountValue("")
      await invalidateProducts()
    },
    onError: (err: Error) => {
      const message = err.message || "Apply failed."
      setStatusMsg(message)
      toast.error("Product deal failed.", { description: message })
    },
  })

  const clearMutation = useMutation({
    mutationFn: async () => {
      if (selectedIds.size === 0) throw new Error("No products selected.")
      const selectedProducts = products.filter((product) => selectedIds.has(product.id))
      await Promise.all(selectedProducts.map(clearProductPromo))
    },
    onSuccess: async () => {
      setStatusMsg(`Cleared promo from ${selectedIds.size} product(s).`)
      toast.success("Product deals cleared.")
      setSelectedIds(new Set())
      await invalidateProducts()
    },
    onError: (err: Error) => {
      const message = err.message || "Clear failed."
      setStatusMsg(message)
      toast.error("Clear failed.", { description: message })
    },
  })

  const editMutation = useMutation({
    mutationFn: async (product: AdminProduct) => {
      const labelForMeta = promoLabelForMetadata(editLabel)
      if (!labelForMeta) throw new Error("Promo label EN or AR is required.")
      const startsAtIso = toIsoOrNull(editStartsAt)
      const endsAtIso = toIsoOrNull(editEndsAt)
      const metadata = { ...(product.metadata ?? {}) }
      metadata.promoLabel = labelForMeta
      if (startsAtIso) metadata.promo_starts_at = startsAtIso
      else delete metadata.promo_starts_at
      if (endsAtIso) metadata.promo_ends_at = endsAtIso
      else delete metadata.promo_ends_at
      metadata.promoShowCountdown = editShowCountdown
      const priceListId = getPromoPriceListId(product)
      if (priceListId) {
        await sdk.admin.priceList.update(priceListId, {
          starts_at: startsAtIso,
          ends_at: endsAtIso,
        })
      }
      await patchProductMetadata(product.id, metadata)
    },
    onSuccess: async () => {
      setEditingProductId(null)
      toast.success("Product deal updated.")
      await invalidateProducts()
    },
    onError: (err: Error) => toast.error("Update failed.", { description: err.message }),
  })

  const deleteOneMutation = useMutation({
    mutationFn: clearProductPromo,
    onSuccess: async () => {
      toast.success("Product deal deleted.")
      await invalidateProducts()
    },
    onError: (err: Error) => toast.error("Delete failed.", { description: err.message }),
  })

  const busy = applyMutation.isPending || clearMutation.isPending || editMutation.isPending || deleteOneMutation.isPending

  function beginEdit(product: AdminProduct) {
    setEditingProductId(product.id)
    setEditLabel(getPromoLabel(product))
    setEditStartsAt(getPromoStartsAt(product))
    setEditEndsAt(getPromoEndsAt(product))
    setEditShowCountdown(getPromoShowCountdown(product))
  }

  return (
    <div className="grid gap-5">
      <ProductDealForm
        label={promoLabel}
        startsAt={promoStartsAt}
        endsAt={promoEndsAt}
        showCountdown={showCountdown}
        discountType={discountType}
        discountValue={discountValue}
        selectedCount={selectedIds.size}
        busy={busy}
        applying={applyMutation.isPending}
        clearing={clearMutation.isPending}
        onLabelChange={setPromoLabel}
        onStartsAtChange={setPromoStartsAt}
        onEndsAtChange={setPromoEndsAt}
        onShowCountdownChange={setShowCountdown}
        onDiscountTypeChange={setDiscountType}
        onDiscountValueChange={setDiscountValue}
        onApply={() => { setStatusMsg(null); applyMutation.mutate() }}
        onClear={() => { setStatusMsg(null); clearMutation.mutate() }}
      />

      {statusMsg ? (
        <Text size="small" className="text-ui-fg-muted">
          {statusMsg}
        </Text>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Input
          size="small"
          placeholder="Search products..."
          value={search}
          onChange={(event) => { setSearch(event.target.value); setSelectedIds(new Set()) }}
          className="max-w-xs"
        />
        <label className="flex cursor-pointer items-center gap-2 text-sm text-ui-fg-base">
          <input
            type="checkbox"
            checked={filterActive}
            onChange={(event) => setFilterActive(event.target.checked)}
            className="accent-ui-fg-interactive"
          />
          Show active promos only
        </label>
        <Text size="small" className="ml-auto text-ui-fg-muted">
          {selectedIds.size} / {displayed.length} selected
        </Text>
      </div>

      <div className="overflow-hidden rounded-md border border-ui-border-base">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-ui-border-base bg-ui-bg-subtle">
              <th className="w-8 px-3 py-2">
                <input
                  type="checkbox"
                  checked={displayed.length > 0 && selectedIds.size === displayed.length}
                  onChange={toggleSelectAll}
                  className="accent-ui-fg-interactive"
                  aria-label="Select all"
                />
              </th>
              <th className="px-3 py-2 font-medium text-ui-fg-base">Product</th>
              <th className="px-3 py-2 font-medium text-ui-fg-base">Status</th>
              <th className="px-3 py-2 font-medium text-ui-fg-base">Labels</th>
              <th className="px-3 py-2 font-medium text-ui-fg-base">Promo</th>
              <th className="px-3 py-2 font-medium text-ui-fg-base">Starts</th>
              <th className="px-3 py-2 font-medium text-ui-fg-base">Ends</th>
              <th className="px-3 py-2 font-medium text-ui-fg-base">Discount preview</th>
              <th className="px-3 py-2 text-right font-medium text-ui-fg-base">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={9} className="px-3 py-6 text-center text-ui-fg-muted">
                  Loading products...
                </td>
              </tr>
            ) : displayed.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-6 text-center text-ui-fg-muted">
                  No products found.
                </td>
              </tr>
            ) : (
              displayed.map((product) => {
                const label = getPromoLabel(product)
                const labelDisplay = getPromoLabelDisplay(product)
                const startsAt = getPromoStartsAt(product)
                const endsAt = getPromoEndsAt(product)
                const status = getPromoStatus(product)
                const editing = editingProductId === product.id
                return (
                  <tr
                    key={product.id}
                    className="border-b border-ui-border-base last:border-0 hover:bg-ui-bg-subtle-hover"
                    onClick={() => !editing && toggleSelect(product.id)}
                  >
                    <td className="px-3 py-2" onClick={(event) => event.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(product.id)}
                        onChange={() => toggleSelect(product.id)}
                        className="accent-ui-fg-interactive"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        {product.thumbnail ? (
                          <img src={product.thumbnail} alt="" className="h-8 w-8 shrink-0 rounded object-cover" />
                        ) : (
                          <div className="h-8 w-8 shrink-0 rounded bg-ui-bg-component" />
                        )}
                        <div className="min-w-0">
                          <p className="max-w-[240px] truncate font-medium text-ui-fg-base">{product.title}</p>
                          <p className="font-mono text-xs text-ui-fg-muted">{product.handle}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <Badge size="small" color={product.status === "published" ? "green" : "grey"}>
                        {product.status}
                      </Badge>
                    </td>
                    <td className="px-3 py-2" onClick={(event) => event.stopPropagation()}>
                      {editing ? (
                        <div className="min-w-[280px]">
                          <PromoLabelInput
                            idPrefix={`edit-${product.id}`}
                            value={editLabel}
                            disabled={busy}
                            onChange={setEditLabel}
                          />
                        </div>
                      ) : labelDisplay ? (
                        <div className="grid gap-1">
                          {label.en ? <Badge size="small" color="orange">EN {label.en}</Badge> : null}
                          {label.ar ? <Badge size="small" color="blue">AR {label.ar}</Badge> : null}
                          {getPromoShowCountdown(product) ? (
                            <span className="inline-flex items-center gap-1 text-xs text-ui-fg-muted">
                              <Clock className="h-3 w-3" /> countdown
                            </span>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-ui-fg-muted">-</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {status ? (
                        <Badge size="small" color={promoStatusColor(status)}>
                          {getPromoStatusText(product)}
                        </Badge>
                      ) : (
                        <span className="text-ui-fg-muted">-</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs text-ui-fg-muted" onClick={(event) => event.stopPropagation()}>
                      {editing ? (
                        <input
                          type="datetime-local"
                          className="border-ui-border-base bg-ui-bg-field text-ui-fg-base rounded-md border px-2 py-1 text-xs shadow-sm disabled:opacity-50"
                          value={editStartsAt}
                          disabled={busy}
                          onChange={(event) => setEditStartsAt(event.target.value)}
                        />
                      ) : startsAt ? startsAt.replace("T", " ") : "-"}
                    </td>
                    <td className="px-3 py-2 text-xs text-ui-fg-muted" onClick={(event) => event.stopPropagation()}>
                      {editing ? (
                        <input
                          type="datetime-local"
                          className="border-ui-border-base bg-ui-bg-field text-ui-fg-base rounded-md border px-2 py-1 text-xs shadow-sm disabled:opacity-50"
                          value={editEndsAt}
                          disabled={busy}
                          onChange={(event) => setEditEndsAt(event.target.value)}
                        />
                      ) : endsAt ? endsAt.replace("T", " ") : "-"}
                    </td>
                    <td className="px-3 py-2 text-xs text-ui-fg-muted">
                      {selectedIds.has(product.id) && discountValue && Number(discountValue) > 0
                        ? formatPricePreview(product, discountType, Number(discountValue))
                        : getPromoPriceListId(product)
                          ? "Price list active"
                          : "-"}
                    </td>
                    <td className="px-3 py-2" onClick={(event) => event.stopPropagation()}>
                      {editing ? (
                        <div className="flex items-center justify-end gap-2">
                          <div className="flex items-center gap-2">
                            <Switch
                              id={`edit-countdown-${product.id}`}
                              checked={editShowCountdown}
                              disabled={busy}
                              onCheckedChange={setEditShowCountdown}
                            />
                            <Label htmlFor={`edit-countdown-${product.id}`} className="text-xs">Countdown</Label>
                          </div>
                          <Button size="small" disabled={busy} isLoading={editMutation.isPending} onClick={() => editMutation.mutate(product)}>
                            Save
                          </Button>
                          <Button size="small" variant="secondary" disabled={busy} onClick={() => setEditingProductId(null)}>
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-1">
                          <Tooltip content="Edit label and schedule">
                            <IconButton
                              type="button"
                              size="small"
                              variant="transparent"
                              aria-label={`Edit ${product.title} promo`}
                              disabled={busy || !labelDisplay}
                              onClick={() => beginEdit(product)}
                            >
                              <PencilSquare />
                            </IconButton>
                          </Tooltip>
                          <Tooltip content="Delete product deal">
                            <IconButton
                              type="button"
                              size="small"
                              variant="transparent"
                              aria-label={`Delete ${product.title} promo`}
                              disabled={busy || !labelDisplay}
                              onClick={() => deleteOneMutation.mutate(product)}
                            >
                              <Trash />
                            </IconButton>
                          </Tooltip>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
