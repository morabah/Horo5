import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Badge, Button, Container, Heading, Input, Label, Text } from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useCallback, useMemo, useState } from "react"

import { sdk } from "../../lib/sdk"

type AdminProduct = {
  id: string
  title: string
  handle: string
  status: string
  thumbnail?: string | null
  metadata?: Record<string, unknown> | null
}

type ProductListResponse = {
  products: AdminProduct[]
  count: number
  limit: number
  offset: number
}

const PAGE_SIZE = 200

async function fetchProducts(q?: string): Promise<AdminProduct[]> {
  const params: Record<string, string> = {
    limit: String(PAGE_SIZE),
    offset: "0",
    fields: "id,title,handle,status,thumbnail,metadata",
  }
  if (q?.trim()) params.q = q.trim()
  const data = await sdk.client.fetch<ProductListResponse>("/admin/products?" + new URLSearchParams(params).toString(), { method: "GET" })
  return data.products ?? []
}

async function patchProductMetadata(id: string, patch: Record<string, unknown>) {
  await sdk.admin.product.update(id, { metadata: patch })
}

function getPromoLabel(product: AdminProduct): string {
  return typeof product.metadata?.promoLabel === "string" ? product.metadata.promoLabel : ""
}

function getPromoEndsAt(product: AdminProduct): string {
  const raw = product.metadata?.promo_ends_at
  if (typeof raw !== "string" || !raw) return ""
  try {
    return new Date(raw).toISOString().slice(0, 16)
  } catch {
    return ""
  }
}

function isPromoActive(product: AdminProduct): boolean {
  const label = getPromoLabel(product)
  if (!label) return false
  const endsAt = product.metadata?.promo_ends_at
  if (!endsAt) return true
  const ms = Date.parse(String(endsAt))
  return !Number.isFinite(ms) || Date.now() <= ms
}

export default function BulkPromoPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [promoLabel, setPromoLabel] = useState("")
  const [promoEndsAt, setPromoEndsAt] = useState("")
  const [statusMsg, setStatusMsg] = useState<string | null>(null)
  const [filterActive, setFilterActive] = useState(false)

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["horo", "bulk-promo-products", search],
    queryFn: () => fetchProducts(search),
    staleTime: 30_000,
  })

  const displayed = useMemo(() => {
    const list = filterActive ? products.filter(isPromoActive) : products
    return list.filter((p) => p.status !== "deleted")
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
      setSelectedIds(new Set(displayed.map((p) => p.id)))
    }
  }, [displayed, selectedIds.size])

  const applyMutation = useMutation({
    mutationFn: async () => {
      if (selectedIds.size === 0) throw new Error("No products selected.")
      if (!promoLabel.trim()) throw new Error("Promo label is required.")
      const endsAtIso = promoEndsAt ? new Date(promoEndsAt).toISOString() : null

      for (const id of selectedIds) {
        const product = products.find((p) => p.id === id)
        if (!product) continue
        const prevMeta = { ...(product.metadata ?? {}) }
        prevMeta.promoLabel = promoLabel.trim()
        if (endsAtIso) {
          prevMeta.promo_ends_at = endsAtIso
        } else {
          delete prevMeta.promo_ends_at
        }
        await patchProductMetadata(id, prevMeta)
      }
    },
    onSuccess: async () => {
      setStatusMsg(`Applied to ${selectedIds.size} product(s).`)
      setSelectedIds(new Set())
      await queryClient.invalidateQueries({ queryKey: ["horo", "bulk-promo-products"] })
    },
    onError: (err: Error) => setStatusMsg(err.message || "Apply failed"),
  })

  const clearMutation = useMutation({
    mutationFn: async () => {
      if (selectedIds.size === 0) throw new Error("No products selected.")
      for (const id of selectedIds) {
        const product = products.find((p) => p.id === id)
        if (!product) continue
        const prevMeta = { ...(product.metadata ?? {}) }
        delete prevMeta.promoLabel
        delete prevMeta.promo_ends_at
        await patchProductMetadata(id, prevMeta)
      }
    },
    onSuccess: async () => {
      setStatusMsg(`Cleared promo from ${selectedIds.size} product(s).`)
      setSelectedIds(new Set())
      await queryClient.invalidateQueries({ queryKey: ["horo", "bulk-promo-products"] })
    },
    onError: (err: Error) => setStatusMsg(err.message || "Clear failed"),
  })

  const busy = applyMutation.isPending || clearMutation.isPending

  return (
    <Container className="mx-auto max-w-5xl p-6">
      <div className="mb-6">
        <Heading level="h1">Bulk Promo Labels</Heading>
        <Text size="small" className="mt-1 text-ui-fg-subtle">
          Select products and apply a timed promo label (sets{" "}
          <code className="text-xs">metadata.promoLabel</code> +{" "}
          <code className="text-xs">metadata.promo_ends_at</code>). The storefront hides the label
          automatically after the end date. No end date = permanent until manually cleared.
        </Text>
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-4 rounded-xl border border-ui-border-base bg-ui-bg-subtle p-4">
        <div className="flex min-w-[180px] flex-1 flex-col gap-1">
          <Label htmlFor="bulk-promo-label" className="text-xs">
            Promo label <span className="text-ui-fg-error">*</span>
          </Label>
          <Input
            id="bulk-promo-label"
            size="small"
            value={promoLabel}
            disabled={busy}
            onChange={(e) => setPromoLabel(e.target.value)}
            placeholder='e.g. "Eid Sale" or "Limited Drop"'
          />
        </div>
        <div className="flex min-w-[200px] flex-col gap-1">
          <Label htmlFor="bulk-promo-ends" className="text-xs">
            Ends at (optional)
          </Label>
          <input
            id="bulk-promo-ends"
            type="datetime-local"
            className="border-ui-border-base bg-ui-bg-field text-ui-fg-base rounded-md border px-3 py-[7px] text-sm shadow-sm disabled:opacity-50"
            value={promoEndsAt}
            disabled={busy}
            onChange={(e) => setPromoEndsAt(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button
            size="small"
            disabled={busy || selectedIds.size === 0 || !promoLabel.trim()}
            isLoading={applyMutation.isPending}
            onClick={() => { setStatusMsg(null); applyMutation.mutate() }}
          >
            Apply to {selectedIds.size} selected
          </Button>
          <Button
            size="small"
            variant="danger"
            disabled={busy || selectedIds.size === 0}
            isLoading={clearMutation.isPending}
            onClick={() => { setStatusMsg(null); clearMutation.mutate() }}
          >
            Clear promo
          </Button>
        </div>
      </div>

      {statusMsg ? (
        <Text size="small" className="mb-3 text-ui-fg-muted">
          {statusMsg}
        </Text>
      ) : null}

      <div className="mb-3 flex flex-wrap items-center gap-3">
        <Input
          size="small"
          placeholder="Search products…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setSelectedIds(new Set()) }}
          className="max-w-xs"
        />
        <label className="flex cursor-pointer items-center gap-2 text-sm text-ui-fg-base">
          <input
            type="checkbox"
            checked={filterActive}
            onChange={(e) => setFilterActive(e.target.checked)}
            className="accent-ui-fg-interactive"
          />
          Show active promos only
        </label>
        <Text size="small" className="ml-auto text-ui-fg-muted">
          {selectedIds.size} / {displayed.length} selected
        </Text>
      </div>

      <div className="overflow-hidden rounded-xl border border-ui-border-base">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-ui-border-base bg-ui-bg-subtle">
              <th className="px-3 py-2 w-8">
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
              <th className="px-3 py-2 font-medium text-ui-fg-base">Promo label</th>
              <th className="px-3 py-2 font-medium text-ui-fg-base">Ends at</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-ui-fg-muted">
                  Loading products…
                </td>
              </tr>
            ) : displayed.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-ui-fg-muted">
                  No products found.
                </td>
              </tr>
            ) : (
              displayed.map((product) => {
                const label = getPromoLabel(product)
                const endsAt = getPromoEndsAt(product)
                const active = isPromoActive(product)
                return (
                  <tr
                    key={product.id}
                    className="border-b border-ui-border-base last:border-0 hover:bg-ui-bg-subtle-hover cursor-pointer"
                    onClick={() => toggleSelect(product.id)}
                  >
                    <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
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
                          <img src={product.thumbnail} alt="" className="h-8 w-8 rounded object-cover shrink-0" />
                        ) : (
                          <div className="h-8 w-8 rounded bg-ui-bg-component shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-ui-fg-base truncate max-w-[260px]">{product.title}</p>
                          <p className="text-xs text-ui-fg-muted font-mono">{product.handle}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <Badge
                        size="small"
                        color={product.status === "published" ? "green" : "grey"}
                      >
                        {product.status}
                      </Badge>
                    </td>
                    <td className="px-3 py-2">
                      {label ? (
                        <Badge size="small" color={active ? "orange" : "grey"}>
                          {label}
                        </Badge>
                      ) : (
                        <span className="text-ui-fg-muted">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs text-ui-fg-muted font-mono">
                      {endsAt ? endsAt.replace("T", " ") : "—"}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Bulk Promo",
  icon: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  ),
})
