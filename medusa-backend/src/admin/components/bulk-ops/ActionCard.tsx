import { Badge, Button, Text } from "@medusajs/ui"
import type { ReactNode } from "react"

export type BulkOpCardStatus = "idle" | "running" | "success" | "error"

export type BulkOpCardAction = {
  id: string
  name: string
  description: string
}

type ActionCardProps = {
  action: BulkOpCardAction
  dryRun: boolean
  status: BulkOpCardStatus
  lastRunAt?: string | null
  disabled?: boolean
  extraFields?: ReactNode
  onDryRunChange: (value: boolean) => void
  onRun: () => void
}

function statusColor(status: BulkOpCardStatus) {
  if (status === "success") return "green"
  if (status === "error") return "red"
  if (status === "running") return "orange"
  return "grey"
}

function statusLabel(status: BulkOpCardStatus) {
  if (status === "success") return "Succeeded"
  if (status === "error") return "Failed"
  if (status === "running") return "Running"
  return "Ready"
}

function formatTimestamp(value?: string | null) {
  if (!value) return "Never"
  const ms = Date.parse(value)
  if (!Number.isFinite(ms)) return value
  return new Date(ms).toLocaleString()
}

export function ActionCard({
  action,
  dryRun,
  status,
  lastRunAt,
  disabled,
  extraFields,
  onDryRunChange,
  onRun,
}: ActionCardProps) {
  const running = status === "running"

  return (
    <div className="flex min-h-[210px] flex-col justify-between rounded-md border border-ui-border-base bg-ui-bg-base p-5">
      <div>
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <Text size="base" weight="plus">
              {action.name}
            </Text>
            <Text size="xsmall" className="mt-1 font-mono text-ui-fg-muted">
              {action.id}
            </Text>
          </div>
          <Badge size="small" color={statusColor(status)}>
            {statusLabel(status)}
          </Badge>
        </div>
        <Text size="small" className="text-ui-fg-subtle">
          {action.description}
        </Text>
        {extraFields ? <div className="mt-3">{extraFields}</div> : null}
      </div>

      <div className="mt-5 grid gap-3">
        <Text size="xsmall" className="text-ui-fg-muted">
          Last run: {formatTimestamp(lastRunAt)}
        </Text>
        <div className="flex items-center justify-between gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-ui-fg-base">
            <input
              type="checkbox"
              checked={dryRun}
              disabled={disabled || running}
              onChange={(event) => onDryRunChange(event.target.checked)}
              className="accent-ui-fg-interactive"
            />
            Dry run
          </label>
          <Button type="button" size="small" disabled={disabled || running} isLoading={running} onClick={onRun}>
            Run
          </Button>
        </div>
      </div>
    </div>
  )
}
