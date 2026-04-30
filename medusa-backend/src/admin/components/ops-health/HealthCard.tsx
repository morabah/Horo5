import { Badge, Heading, Text } from "@medusajs/ui"

export type HealthStatus = "ok" | "warn" | "error"

export type HealthCardData = {
  status: HealthStatus
  title: string
  summary: string
  details?: unknown
}

type HealthCardProps = {
  check: HealthCardData
}

function color(status: HealthStatus) {
  if (status === "ok") return "green"
  if (status === "warn") return "orange"
  return "red"
}

export function HealthCard({ check }: HealthCardProps) {
  return (
    <div className="rounded-md border border-ui-border-base p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <Heading level="h2">{check.title}</Heading>
        <Badge size="small" color={color(check.status)}>
          {check.status}
        </Badge>
      </div>
      <Text size="small" className="text-ui-fg-subtle">
        {check.summary}
      </Text>
      {check.details !== undefined ? (
        <pre className="mt-4 max-h-[260px] overflow-auto rounded-md border border-ui-border-base bg-ui-bg-subtle p-3 text-xs text-ui-fg-base">
          {JSON.stringify(check.details, null, 2)}
        </pre>
      ) : null}
    </div>
  )
}
