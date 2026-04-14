import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Label, Text } from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { HttpTypes } from "@medusajs/types"
import { useCallback, useEffect, useMemo, useState } from "react"

import { sdk } from "../lib/sdk"

/** Matches default keys in `src/scripts/data/size-tables-defaults.json` when store has no presets yet. */
const FALLBACK_PRESET_KEYS = ["regular", "oversized", "fitted"] as const

type SizeTableOptionsResponse = {
  presetKeys: string[]
  defaultSizeTableKey: string | null
}

async function fetchSizeTableOptions(): Promise<SizeTableOptionsResponse> {
  return sdk.client.fetch<SizeTableOptionsResponse>("/admin/custom/storefront-size-table-options", {
    method: "GET",
  })
}

type ProductDetailData = Pick<HttpTypes.AdminProduct, "id" | "metadata">

const ProductSizeTableKeyWidget = ({ data }: { data: ProductDetailData }) => {
  const queryClient = useQueryClient()
  const [message, setMessage] = useState<string | null>(null)

  const { data: options, isLoading: optionsLoading } = useQuery({
    queryKey: ["horo", "storefront-size-table-options"],
    queryFn: fetchSizeTableOptions,
    staleTime: 60_000,
    enabled: Boolean(data?.id),
  })

  const presetKeys = useMemo(() => {
    const fromStore = options?.presetKeys?.length ? options.presetKeys : []
    if (fromStore.length > 0) {
      return fromStore
    }
    return [...FALLBACK_PRESET_KEYS]
  }, [options?.presetKeys])

  const defaultKeyLabel = options?.defaultSizeTableKey ?? "regular"

  const currentRaw =
    data?.metadata && typeof data.metadata === "object" && !Array.isArray(data.metadata)
      ? (data.metadata as Record<string, unknown>).sizeTableKey
      : undefined
  const currentKey =
    typeof currentRaw === "string" && currentRaw.trim() ? currentRaw.trim() : ""

  const [localValue, setLocalValue] = useState<string>(() => (currentKey ? currentKey : "__default__"))

  useEffect(() => {
    setLocalValue(currentKey ? currentKey : "__default__")
  }, [data?.id, currentKey])

  const selectValue = useMemo(() => {
    if (localValue === "__default__") return "__default__"
    if (presetKeys.includes(localValue)) return localValue
    if (localValue && localValue !== "__default__") return localValue
    return "__default__"
  }, [localValue, presetKeys])

  const { mutate, isPending } = useMutation({
    mutationFn: async (next: string) => {
      if (!data?.id) return
      const prevMeta =
        data.metadata && typeof data.metadata === "object" && !Array.isArray(data.metadata)
          ? { ...(data.metadata as Record<string, unknown>) }
          : ({} as Record<string, unknown>)

      if (!next || next === "__default__") {
        delete prevMeta.sizeTableKey
      } else {
        prevMeta.sizeTableKey = next
      }

      await sdk.admin.product.update(data.id, { metadata: prevMeta })
    },
    onSuccess: async () => {
      setMessage("Saved.")
      await queryClient.invalidateQueries()
    },
    onError: (err: Error) => {
      setMessage(err?.message || "Save failed")
    },
  })

  const onSelectChange = useCallback(
    (value: string) => {
      setLocalValue(value)
      setMessage(null)
      mutate(value)
    },
    [mutate],
  )

  if (!data?.id) {
    return null
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex flex-col gap-3 px-6 py-4">
        <div>
          <Label weight="plus">PDP size guide preset</Label>
          <Text size="small" className="text-ui-fg-subtle">
            Controls the size chart and model lines on the storefront PDP. Keys come from{" "}
            <code className="text-xs">store.metadata.sizeTables</code> (apply script). Choose &quot;Store
            default&quot; to follow <code className="text-xs">defaultSizeTableKey</code> ({defaultKeyLabel}).
          </Text>
        </div>

        {optionsLoading ? (
          <Text size="small">Loading presets…</Text>
        ) : (
          <div className="flex max-w-md flex-col gap-2">
            <select
              className="border-ui-border-base bg-ui-bg-field text-ui-fg-base w-full rounded-md border px-3 py-2 text-sm shadow-sm"
              disabled={isPending}
              value={selectValue}
              onChange={(e) => {
                onSelectChange(e.target.value)
              }}
              aria-label="Size table preset"
            >
              <option value="__default__">Store default ({defaultKeyLabel})</option>
              {presetKeys.map((key) => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
              {currentKey && !presetKeys.includes(currentKey) ? (
                <option value={currentKey}>
                  {currentKey} (on product, not in store list)
                </option>
              ) : null}
            </select>
            {isPending ? (
              <Text size="small" className="text-ui-fg-muted">
                Saving…
              </Text>
            ) : null}
            {message ? (
              <Text size="small" className="text-ui-fg-muted">
                {message}
              </Text>
            ) : null}
          </div>
        )}
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.after",
})

export default ProductSizeTableKeyWidget
