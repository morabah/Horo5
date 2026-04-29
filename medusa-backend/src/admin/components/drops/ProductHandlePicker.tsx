import { Badge, Input, Text } from "@medusajs/ui"
import { XMarkMini } from "@medusajs/icons"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"

import { searchProductHandles } from "./api"

type ProductHandlePickerProps = {
  values: string[]
  onChange: (values: string[]) => void
}

export function ProductHandlePicker({ values, onChange }: ProductHandlePickerProps) {
  const [query, setQuery] = useState("")
  const { data: products = [] } = useQuery({
    queryKey: ["horo", "drops", "product-search", query],
    queryFn: () => searchProductHandles(query),
    enabled: query.trim().length >= 2,
    staleTime: 30_000,
  })

  return (
    <div className="flex flex-col gap-2">
      <Input
        size="small"
        value={query}
        placeholder="Search handles"
        onChange={(event) => setQuery(event.target.value)}
      />
      {query.trim().length >= 2 && products.length ? (
        <div className="max-h-36 overflow-auto rounded-md border border-ui-border-base">
          {products.map((product) => (
            <button
              key={product.handle}
              type="button"
              className="flex w-full items-center justify-between gap-3 border-b border-ui-border-base px-3 py-2 text-left text-sm last:border-0 hover:bg-ui-bg-subtle"
              onClick={() => {
                onChange([...new Set([...values, product.handle])])
                setQuery("")
              }}
            >
              <span className="min-w-0 truncate">{product.title}</span>
              <span className="shrink-0 font-mono text-xs text-ui-fg-muted">{product.handle}</span>
            </button>
          ))}
        </div>
      ) : null}
      {values.length ? (
        <div className="flex flex-wrap gap-2">
          {values.map((value) => (
            <Badge key={value} size="small" color="grey" className="gap-1">
              {value}
              <button
                type="button"
                aria-label={`Remove ${value}`}
                onClick={() => onChange(values.filter((item) => item !== value))}
              >
                <XMarkMini />
              </button>
            </Badge>
          ))}
        </div>
      ) : (
        <Text size="xsmall" className="text-ui-fg-muted">
          No handles selected.
        </Text>
      )}
    </div>
  )
}
