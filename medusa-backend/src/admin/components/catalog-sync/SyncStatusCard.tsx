import { Badge, Heading, Text } from "@medusajs/ui"

type SyncStatusCardProps = {
  lastCatalogSyncAt?: string | null
  lastCatalogSyncSummary?: string | null
  productCount?: number | null
  validationIssueCount?: number | null
}

function formatDate(value?: string | null) {
  if (!value) return "Never"
  const ms = Date.parse(value)
  if (!Number.isFinite(ms)) return value
  return new Date(ms).toLocaleString()
}

export function SyncStatusCard({
  lastCatalogSyncAt,
  lastCatalogSyncSummary,
  productCount,
  validationIssueCount,
}: SyncStatusCardProps) {
  const issues = validationIssueCount ?? 0

  return (
    <section className="rounded-md border border-ui-border-base p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <Heading level="h2">Status</Heading>
          <Text size="small" className="mt-1 text-ui-fg-subtle">
            Last sync: {formatDate(lastCatalogSyncAt)}
          </Text>
        </div>
        <Badge size="small" color={issues > 0 ? "red" : "green"}>
          {issues} validation issue{issues === 1 ? "" : "s"}
        </Badge>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <Text size="xsmall" className="text-ui-fg-muted">
            Product count
          </Text>
          <Text size="base" weight="plus">
            {productCount ?? "-"}
          </Text>
        </div>
        <div>
          <Text size="xsmall" className="text-ui-fg-muted">
            Last result
          </Text>
          <Text size="small" className="text-ui-fg-base">
            {lastCatalogSyncSummary || "-"}
          </Text>
        </div>
      </div>
    </section>
  )
}
