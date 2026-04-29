import { Input, Text } from "@medusajs/ui"

import type { ProductSizeKey } from "./types"
import { orderedSizes } from "./utils"

type StockBySizeTableProps = {
  sizes: ProductSizeKey[]
  stockPerSize: Partial<Record<ProductSizeKey, number>>
  onChange: (stock: Partial<Record<ProductSizeKey, number>>) => void
}

export function StockBySizeTable({ sizes, stockPerSize, onChange }: StockBySizeTableProps) {
  const ordered = orderedSizes(sizes)

  if (!ordered.length) {
    return (
      <Text size="small" className="text-ui-fg-muted">
        Select sizes first.
      </Text>
    )
  }

  return (
    <div className="overflow-hidden rounded-md border border-ui-border-base">
      <table className="w-full text-left text-sm">
        <thead className="bg-ui-bg-subtle">
          <tr>
            <th className="px-3 py-2 font-medium">Size</th>
            <th className="px-3 py-2 font-medium">Qty</th>
          </tr>
        </thead>
        <tbody>
          {ordered.map((size) => (
            <tr key={size} className="border-t border-ui-border-base">
              <td className="px-3 py-2">{size}</td>
              <td className="px-3 py-2">
                <Input
                  size="small"
                  type="number"
                  min={0}
                  value={stockPerSize[size] ?? 0}
                  onChange={(event) => {
                    const qty = Math.max(0, Number(event.target.value || 0))
                    onChange({ ...stockPerSize, [size]: Number.isFinite(qty) ? Math.floor(qty) : 0 })
                  }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
