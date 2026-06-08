import { ArrowDownMini, ArrowUpMini, PlusMini, Trash } from "@medusajs/icons"
import { Badge, IconButton, Input, Label, Text, Tooltip } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { useMemo, useState } from "react"

import { fetchProducts, type AdminProduct } from "./api"

type ProductSlotPickerProps = {
  title: string
  description: string
  products: AdminProduct[]
  selectedSlugs: string[]
  max: number
  excludeProductId?: string | null
  disabled?: boolean
  onChange: (slugs: string[]) => void
}

function move(slugs: string[], index: number, direction: -1 | 1) {
  const next = [...slugs]
  const target = index + direction
  if (target < 0 || target >= next.length) return next
  const current = next[index]
  next[index] = next[target]
  next[target] = current
  return next
}

function firstEgpPrice(product: AdminProduct): number | null {
  const prices = (product.variants ?? [])
    .flatMap((variant) => variant.prices ?? [])
    .filter((price) => (price.currency_code ?? "").toLowerCase() === "egp" && typeof price.amount === "number")
    .map((price) => price.amount as number)
  if (prices.length === 0) return null
  return Math.min(...prices)
}

function priceText(product: AdminProduct): string | null {
  const price = firstEgpPrice(product)
  return price === null ? null : `${price} EGP`
}

export function ProductSlotPicker({
  title,
  description,
  products,
  selectedSlugs,
  max,
  excludeProductId,
  disabled,
  onChange,
}: ProductSlotPickerProps) {
  const [query, setQuery] = useState("")
  const [localProducts, setLocalProducts] = useState<AdminProduct[]>([])
  const canAdd = selectedSlugs.length < max
  const trimmedQuery = query.trim()
  const { data: searchProducts = [] } = useQuery({
    queryKey: ["horo", "promotions-studio", "slot-picker-products", title, trimmedQuery],
    queryFn: () => fetchProducts(trimmedQuery),
    enabled: !disabled && canAdd && trimmedQuery.length > 1,
    staleTime: 30_000,
  })

  const candidates = useMemo(() => {
    const byId = new Map<string, AdminProduct>()
    for (const product of [...products, ...localProducts, ...searchProducts]) {
      byId.set(product.id, product)
    }
    return [...byId.values()]
  }, [products, localProducts, searchProducts])

  const selected = useMemo(() => {
    const bySlug = new Map(candidates.map((product) => [product.handle, product]))
    return selectedSlugs.map((slug) => ({ slug, product: bySlug.get(slug) }))
  }, [candidates, selectedSlugs])

  const results = useMemo(() => {
    const q = trimmedQuery.toLowerCase()
    if (!q) return []
    return candidates
      .filter((product) => product.status === "published")
      .filter((product) => product.id !== excludeProductId)
      .filter((product) => !selectedSlugs.includes(product.handle))
      .filter((product) => {
        return product.title.toLowerCase().includes(q) || product.handle.toLowerCase().includes(q)
      })
      .slice(0, 8)
  }, [candidates, excludeProductId, trimmedQuery, selectedSlugs])

  return (
    <section className="rounded-md border border-ui-border-base p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Text size="small" weight="plus">{title}</Text>
            <Badge size="small" color={selectedSlugs.length > max ? "red" : "grey"}>
              {selectedSlugs.length}/{max}
            </Badge>
          </div>
          <Text size="xsmall" className="mt-1 text-ui-fg-muted">{description}</Text>
        </div>
      </div>

      <div className="grid gap-2">
        {selected.length === 0 ? (
          <div className="rounded-md border border-dashed border-ui-border-base p-3">
            <Text size="small" className="text-ui-fg-muted">No slots pinned.</Text>
          </div>
        ) : (
          selected.map(({ slug, product }, index) => (
            <div key={`${title}-${slug}`} className="flex items-center gap-3 rounded-md border border-ui-border-base bg-ui-bg-subtle p-2">
              {product?.thumbnail ? (
                <img src={product.thumbnail} alt="" className="h-10 w-10 shrink-0 rounded object-cover" />
              ) : (
                <div className="h-10 w-10 shrink-0 rounded bg-ui-bg-component" />
              )}
              <div className="min-w-0 flex-1">
                <Text size="small" weight="plus" className="truncate">{product?.title ?? slug}</Text>
                <Text size="xsmall" className="font-mono text-ui-fg-muted">
                  {slug}{product ? ` · ${priceText(product) ?? "no EGP price"}` : ""}
                </Text>
              </div>
              {product && product.status !== "published" ? (
                <Badge size="small" color="orange">not published</Badge>
              ) : null}
              <div className="flex shrink-0 items-center gap-1">
                <Tooltip content="Move up">
                  <IconButton
                    type="button"
                    size="small"
                    variant="transparent"
                    aria-label={`Move ${slug} up`}
                    disabled={disabled || index === 0}
                    onClick={() => onChange(move(selectedSlugs, index, -1))}
                  >
                    <ArrowUpMini />
                  </IconButton>
                </Tooltip>
                <Tooltip content="Move down">
                  <IconButton
                    type="button"
                    size="small"
                    variant="transparent"
                    aria-label={`Move ${slug} down`}
                    disabled={disabled || index === selectedSlugs.length - 1}
                    onClick={() => onChange(move(selectedSlugs, index, 1))}
                  >
                    <ArrowDownMini />
                  </IconButton>
                </Tooltip>
                <Tooltip content="Remove slot">
                  <IconButton
                    type="button"
                    size="small"
                    variant="transparent"
                    aria-label={`Remove ${slug}`}
                    disabled={disabled}
                    onClick={() => onChange(selectedSlugs.filter((entry) => entry !== slug))}
                  >
                    <Trash />
                  </IconButton>
                </Tooltip>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-3 grid gap-2">
        <Label htmlFor={`${title}-search`} className="text-xs">Add product</Label>
        <Input
          id={`${title}-search`}
          size="small"
          value={query}
          disabled={disabled || !canAdd}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={canAdd ? "Search title or handle" : "Slot limit reached"}
        />
        {results.length > 0 ? (
          <div className="max-h-64 overflow-auto rounded-md border border-ui-border-base bg-ui-bg-base">
            {results.map((product) => (
              <button
                type="button"
                key={`${title}-result-${product.id}`}
                className="flex w-full items-center gap-3 border-b border-ui-border-base px-3 py-2 text-left last:border-0 hover:bg-ui-bg-subtle"
                disabled={disabled || !canAdd}
                onClick={() => {
                  setLocalProducts((prev) => {
                    return prev.some((entry) => entry.id === product.id) ? prev : [...prev, product]
                  })
                  onChange([...selectedSlugs, product.handle])
                  setQuery("")
                }}
              >
                {product.thumbnail ? (
                  <img src={product.thumbnail} alt="" className="h-8 w-8 shrink-0 rounded object-cover" />
                ) : (
                  <div className="h-8 w-8 shrink-0 rounded bg-ui-bg-component" />
                )}
                <span className="min-w-0 flex-1">
                  <Text size="small" weight="plus" className="truncate">{product.title}</Text>
                  <Text size="xsmall" className="font-mono text-ui-fg-muted">
                    {product.handle} · {priceText(product) ?? "no EGP price"}
                  </Text>
                </span>
                <PlusMini />
              </button>
            ))}
          </div>
        ) : query.trim() ? (
          <Text size="xsmall" className="text-ui-fg-muted">No published products found.</Text>
        ) : null}
      </div>
    </section>
  )
}
