import { ArrowUpRightMini } from "@medusajs/icons"
import { Badge, Button, Table, Text, toast } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"

import { sdk } from "../../../lib/sdk"

type DiscountCodePromotion = {
  id: string
  code: string
  type: "standard" | "buyget"
  application_method: {
    type?: "fixed" | "percentage"
    target_type?: "order" | "shipping_methods" | "items"
    value?: number
    currency_code?: string
    allocation?: string
    buy_rules_min_quantity?: number | null
    apply_to_quantity?: number | null
  } | null
  status: "draft" | "active" | "inactive"
  starts_at: string | null
  ends_at: string | null
  usage_count: number
  usage_limit: number | null
}

type DiscountCodesResponse = {
  promotions: DiscountCodePromotion[]
}

async function fetchDiscountCodes(): Promise<DiscountCodesResponse> {
  return sdk.client.fetch<DiscountCodesResponse>("/admin/custom/promotions-studio/codes", { method: "GET" })
}

function formatDate(value: string | null) {
  if (!value) return "-"
  const ms = Date.parse(value)
  if (!Number.isFinite(ms)) return "-"
  return new Date(ms).toLocaleString()
}

function formatDiscount(promotion: DiscountCodePromotion) {
  const method = promotion.application_method
  if (!method) return "-"
  const value = method.value ?? 0
  const target = method.target_type === "shipping_methods" ? "shipping" : method.target_type ?? "order"
  if (promotion.type === "buyget") {
    return `BUYGET ${method.buy_rules_min_quantity ?? "-"} -> ${method.apply_to_quantity ?? "-"}`
  }
  return method.type === "fixed"
    ? `${value} ${(method.currency_code ?? "egp").toUpperCase()} off ${target}`
    : `${value}% off ${target}`
}

function statusColor(status: DiscountCodePromotion["status"]) {
  if (status === "active") return "green"
  if (status === "inactive") return "grey"
  return "orange"
}

export function DiscountCodesTab() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["horo", "promotions-studio", "discount-codes"],
    queryFn: fetchDiscountCodes,
    staleTime: 30_000,
  })

  const promotions = data?.promotions ?? []

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-md border border-ui-border-base p-4">
        <div>
          <Text weight="plus">Native Medusa discount codes</Text>
          <Text size="small" className="mt-1 max-w-3xl text-ui-fg-muted">
            Read-only by design. Use native Admin for evolving conditions, campaigns, segments, and code editing.
          </Text>
        </div>
        <div className="flex gap-2">
          <Button
            size="small"
            variant="secondary"
            disabled={isLoading}
            onClick={() => {
              void refetch().then(() => toast.success("Discount codes refreshed."))
            }}
          >
            Refresh
          </Button>
          <Button size="small" asChild>
            <a href="/app/promotions">
              Create code <ArrowUpRightMini />
            </a>
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-md border border-ui-border-base">
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Code</Table.HeaderCell>
              <Table.HeaderCell>Discount</Table.HeaderCell>
              <Table.HeaderCell>Usage</Table.HeaderCell>
              <Table.HeaderCell>Starts</Table.HeaderCell>
              <Table.HeaderCell>Ends</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell className="text-right">Actions</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {isLoading ? (
              <Table.Row>
                <td colSpan={7} className="py-8 text-center text-ui-fg-muted">Loading discount codes...</td>
              </Table.Row>
            ) : promotions.length === 0 ? (
              <Table.Row>
                <td colSpan={7} className="py-8 text-center text-ui-fg-muted">No native code promotions found.</td>
              </Table.Row>
            ) : (
              promotions.map((promotion) => (
                <Table.Row key={promotion.id}>
                  <Table.Cell>
                    <Text size="small" weight="plus" className="font-mono">{promotion.code || "-"}</Text>
                  </Table.Cell>
                  <Table.Cell>{formatDiscount(promotion)}</Table.Cell>
                  <Table.Cell>
                    {promotion.usage_count}{promotion.usage_limit ? ` / ${promotion.usage_limit}` : ""}
                  </Table.Cell>
                  <Table.Cell>{formatDate(promotion.starts_at)}</Table.Cell>
                  <Table.Cell>{formatDate(promotion.ends_at)}</Table.Cell>
                  <Table.Cell>
                    <Badge size="small" color={statusColor(promotion.status)}>{promotion.status}</Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex justify-end">
                      <Button size="small" variant="secondary" asChild>
                        <a href={`/app/promotions/${promotion.id}`}>
                          Edit in Medusa <ArrowUpRightMini />
                        </a>
                      </Button>
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))
            )}
          </Table.Body>
        </Table>
      </div>
    </div>
  )
}
