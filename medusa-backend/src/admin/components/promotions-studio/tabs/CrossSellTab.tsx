import { Badge, Button, Input, Text, toast } from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useMemo, useState } from "react"

import { ProductSlotPicker } from "../ProductSlotPicker"
import { fetchProducts, patchProductMetadata, type AdminProduct } from "../api"

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0).map((entry) => entry.trim())
    : []
}

function productSlugArrays(product: AdminProduct | null) {
  const metadata = product?.metadata ?? {}
  return {
    frequentlyBoughtWithSlugs: stringArray(metadata.frequentlyBoughtWithSlugs),
    complementarySlugs: stringArray(metadata.complementarySlugs),
    customersAlsoBoughtSlugs: stringArray(metadata.customersAlsoBoughtSlugs),
  }
}

export function CrossSellTab() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [frequentlyBoughtWithSlugs, setFrequentlyBoughtWithSlugs] = useState<string[]>([])
  const [complementarySlugs, setComplementarySlugs] = useState<string[]>([])
  const [customersAlsoBoughtSlugs, setCustomersAlsoBoughtSlugs] = useState<string[]>([])

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["horo", "promotions-studio", "cross-sell-products", search],
    queryFn: () => fetchProducts(search),
    staleTime: 30_000,
  })

  const visibleProducts = useMemo(() => {
    return products.filter((product) => product.status !== "deleted")
  }, [products])

  useEffect(() => {
    if (selectedProductId || visibleProducts.length === 0) return
    setSelectedProductId(visibleProducts[0].id)
  }, [selectedProductId, visibleProducts])

  const selectedProduct = useMemo(() => {
    return visibleProducts.find((product) => product.id === selectedProductId) ?? null
  }, [visibleProducts, selectedProductId])

  useEffect(() => {
    const arrays = productSlugArrays(selectedProduct)
    setFrequentlyBoughtWithSlugs(arrays.frequentlyBoughtWithSlugs)
    setComplementarySlugs(arrays.complementarySlugs)
    setCustomersAlsoBoughtSlugs(arrays.customersAlsoBoughtSlugs)
  }, [selectedProduct])

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedProduct) throw new Error("Select a product first.")
      const metadata = { ...(selectedProduct.metadata ?? {}) }
      metadata.frequentlyBoughtWithSlugs = frequentlyBoughtWithSlugs
      metadata.complementarySlugs = complementarySlugs
      metadata.customersAlsoBoughtSlugs = customersAlsoBoughtSlugs
      await patchProductMetadata(selectedProduct.id, metadata)
    },
    onSuccess: async () => {
      toast.success("Cross-sell slots saved.")
      await queryClient.invalidateQueries({ queryKey: ["horo", "promotions-studio", "cross-sell-products"] })
    },
    onError: (error: Error) => toast.error("Save failed.", { description: error.message }),
  })

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(280px,360px)_minmax(0,1fr)]">
      <aside className="rounded-md border border-ui-border-base p-4">
        <div className="mb-3">
          <Text weight="plus">Products</Text>
          <Text size="small" className="mt-1 text-ui-fg-muted">
            Select a product, then pin the manual merchandising slots consumed by the PDP CrossSellWidget.
          </Text>
        </div>
        <Input
          size="small"
          placeholder="Search products..."
          value={search}
          onChange={(event) => {
            setSearch(event.target.value)
            setSelectedProductId(null)
          }}
        />
        <div className="mt-3 max-h-[680px] overflow-auto rounded-md border border-ui-border-base">
          {isLoading ? (
            <div className="p-4 text-center text-ui-fg-muted">Loading products...</div>
          ) : visibleProducts.length === 0 ? (
            <div className="p-4 text-center text-ui-fg-muted">No products found.</div>
          ) : (
            visibleProducts.map((product) => {
              const selected = product.id === selectedProductId
              const arrays = productSlugArrays(product)
              const slotCount = arrays.frequentlyBoughtWithSlugs.length + arrays.complementarySlugs.length + arrays.customersAlsoBoughtSlugs.length
              return (
                <button
                  key={product.id}
                  type="button"
                  className={`flex w-full items-center gap-3 border-b border-ui-border-base px-3 py-2 text-left last:border-0 hover:bg-ui-bg-subtle ${selected ? "bg-ui-bg-subtle" : ""}`}
                  onClick={() => setSelectedProductId(product.id)}
                >
                  {product.thumbnail ? (
                    <img src={product.thumbnail} alt="" className="h-10 w-10 shrink-0 rounded object-cover" />
                  ) : (
                    <div className="h-10 w-10 shrink-0 rounded bg-ui-bg-component" />
                  )}
                  <span className="min-w-0 flex-1">
                    <Text size="small" weight="plus" className="truncate">{product.title}</Text>
                    <Text size="xsmall" className="font-mono text-ui-fg-muted">{product.handle}</Text>
                  </span>
                  {slotCount > 0 ? <Badge size="small" color="blue">{slotCount}</Badge> : null}
                </button>
              )
            })
          )}
        </div>
      </aside>

      <section className="grid content-start gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3 rounded-md border border-ui-border-base p-4">
          <div>
            <Text weight="plus">{selectedProduct?.title ?? "Select a product"}</Text>
            <Text size="small" className="mt-1 font-mono text-ui-fg-muted">{selectedProduct?.handle ?? "No product selected"}</Text>
          </div>
          <Button
            size="small"
            disabled={!selectedProduct || saveMutation.isPending}
            isLoading={saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
          >
            Save slots
          </Button>
        </div>

        <ProductSlotPicker
          title="Frequently bought together"
          description="Recommended 2 slots, max 4."
          products={visibleProducts.filter((product) => product.id !== selectedProduct?.id)}
          selectedSlugs={frequentlyBoughtWithSlugs}
          max={4}
          excludeProductId={selectedProduct?.id}
          disabled={!selectedProduct || saveMutation.isPending}
          onChange={setFrequentlyBoughtWithSlugs}
        />
        <ProductSlotPicker
          title="Style with"
          description="Complementary pieces. Recommended 2-3 slots, max 4."
          products={visibleProducts.filter((product) => product.id !== selectedProduct?.id)}
          selectedSlugs={complementarySlugs}
          max={4}
          excludeProductId={selectedProduct?.id}
          disabled={!selectedProduct || saveMutation.isPending}
          onChange={setComplementarySlugs}
        />
        <ProductSlotPicker
          title="Customers also bought"
          description="Social-proof suggestions. Max 6."
          products={visibleProducts.filter((product) => product.id !== selectedProduct?.id)}
          selectedSlugs={customersAlsoBoughtSlugs}
          max={6}
          excludeProductId={selectedProduct?.id}
          disabled={!selectedProduct || saveMutation.isPending}
          onChange={setCustomersAlsoBoughtSlugs}
        />
      </section>
    </div>
  )
}
