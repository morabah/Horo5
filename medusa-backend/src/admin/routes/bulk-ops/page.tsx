import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Badge, Container, Heading, Input, Label, Text, toast } from "@medusajs/ui"
import { useMutation } from "@tanstack/react-query"
import { useEffect, useMemo, useState } from "react"

import {
  ActionCard,
  type BulkOpCardStatus,
} from "../../components/bulk-ops/ActionCard"
import { sdk } from "../../lib/sdk"
import { BULK_OP_ACTION_DEFINITIONS } from "../../../lib/bulk-ops/definitions"
import type { BulkOpActionId, BulkOpResult } from "../../../lib/bulk-ops/types"

type BulkOpUiAction = {
  id: BulkOpActionId
  name: string
  description: string
}

type ActionUiState = {
  dryRun: boolean
  status: BulkOpCardStatus
  lastRunAt: string | null
}

const STORAGE_KEY = "horo.bulkOps.lastRuns.v1"

const ACTIONS: BulkOpUiAction[] = BULK_OP_ACTION_DEFINITIONS.filter(
  (action) => action.id !== "update-incentive-threshold",
)

function defaultState(): Record<BulkOpActionId, ActionUiState> {
  return Object.fromEntries(
    ACTIONS.map((action) => [
      action.id,
      {
        dryRun: true,
        status: "idle" as BulkOpCardStatus,
        lastRunAt: null,
      },
    ]),
  ) as Record<BulkOpActionId, ActionUiState>
}

function readLastRuns(): Partial<Record<BulkOpActionId, string>> {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) as unknown : null
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {}
    return parsed as Partial<Record<BulkOpActionId, string>>
  } catch {
    return {}
  }
}

function writeLastRun(actionId: BulkOpActionId, timestamp: string) {
  const current = readLastRuns()
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, [actionId]: timestamp }))
}

async function postBulkOperation(actionId: BulkOpActionId, dryRun: boolean, body?: Record<string, unknown>) {
  const search = new URLSearchParams({ dryRun: dryRun ? "true" : "false" })
  return sdk.client.fetch<BulkOpResult>(`/admin/custom/bulk-ops/${actionId}?${search.toString()}`, {
    method: "POST",
    body: body ?? {},
  })
}

function errorMessage(error: unknown) {
  const body = error as { message?: string; body?: { summary?: string; message?: string } }
  return body.body?.summary || body.body?.message || body.message || (error instanceof Error ? error.message : "Bulk operation failed.")
}

export default function BulkOpsPage() {
  const [state, setState] = useState<Record<BulkOpActionId, ActionUiState>>(() => defaultState())
  const [selectedResult, setSelectedResult] = useState<BulkOpResult | null>(null)
  const [occasionSlug, setOccasionSlug] = useState("")

  useEffect(() => {
    const lastRuns = readLastRuns()
    setState((prev) => {
      const next = { ...prev }
      for (const action of ACTIONS) {
        next[action.id] = {
          ...next[action.id],
          lastRunAt: lastRuns[action.id] ?? null,
        }
      }
      return next
    })
  }, [])

  const mutation = useMutation({
    mutationFn: async ({ actionId, dryRun, body }: { actionId: BulkOpActionId; dryRun: boolean; body?: Record<string, unknown> }) => {
      return postBulkOperation(actionId, dryRun, body)
    },
    onMutate: ({ actionId }) => {
      setSelectedResult(null)
      setState((prev) => ({
        ...prev,
        [actionId]: { ...prev[actionId], status: "running" },
      }))
    },
    onSuccess: (result) => {
      setSelectedResult(result)
      const completedAt = result.completedAt || new Date().toISOString()
      writeLastRun(result.action, completedAt)
      setState((prev) => ({
        ...prev,
        [result.action]: {
          ...prev[result.action],
          status: "success",
          lastRunAt: completedAt,
        },
      }))
      toast.success(result.dryRun ? "Dry run complete." : "Bulk operation complete.", {
        description: result.summary,
      })
    },
    onError: (error, variables) => {
      const message = errorMessage(error)
      setState((prev) => ({
        ...prev,
        [variables.actionId]: { ...prev[variables.actionId], status: "error" },
      }))
      toast.error("Bulk operation failed.", { description: message })
      setSelectedResult({
        ok: false,
        action: variables.actionId,
        dryRun: variables.dryRun,
        summary: message,
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      })
    },
  })

  const runningAction = useMemo(() => {
    return ACTIONS.find((action) => state[action.id]?.status === "running")?.id ?? null
  }, [state])

  const runAction = (action: BulkOpUiAction) => {
    const dryRun = state[action.id]?.dryRun ?? true
    let body: Record<string, unknown> | undefined
    if (action.id === "clear-occasion-slugs") {
      if (!occasionSlug.trim()) {
        toast.error("Occasion slug is required.")
        return
      }
      body = { occasionSlug: occasionSlug.trim() }
    }
    const confirmed = window.confirm(
      dryRun
        ? `Run a dry run for "${action.name}"? No writes will be performed.`
        : `Run "${action.name}" for real? This can change catalog data.`,
    )
    if (!confirmed) return
    mutation.mutate({ actionId: action.id, dryRun, body })
  }

  return (
    <Container className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Heading level="h1">Bulk Operations</Heading>
            <Badge size="small" color="orange">
              guarded
            </Badge>
          </div>
          <Text size="small" className="mt-1 max-w-3xl text-ui-fg-subtle">
            Run recurring catalog infrastructure operations from Admin. Keep dry run on first to preview the impact.
          </Text>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {ACTIONS.map((action) => (
          <ActionCard
            key={action.id}
            action={action}
            dryRun={state[action.id]?.dryRun ?? true}
            status={state[action.id]?.status ?? "idle"}
            lastRunAt={state[action.id]?.lastRunAt ?? null}
            disabled={Boolean(runningAction && runningAction !== action.id)}
            extraFields={
              action.id === "clear-occasion-slugs" ? (
                <div className="flex flex-col gap-1">
                  <Label htmlFor="occasion-slug-input" className="text-xs">Occasion slug</Label>
                  <Input
                    id="occasion-slug-input"
                    size="small"
                    value={occasionSlug}
                    placeholder="e.g. just-because"
                    onChange={(e) => setOccasionSlug(e.target.value)}
                  />
                </div>
              ) : undefined
            }
            onDryRunChange={(dryRun) => {
              setState((prev) => ({
                ...prev,
                [action.id]: { ...prev[action.id], dryRun },
              }))
            }}
            onRun={() => runAction(action)}
          />
        ))}
      </div>

      <section className="mt-6 rounded-md border border-ui-border-base p-5">
        <Heading level="h2" className="mb-3">
          Result
        </Heading>
        {selectedResult ? (
          <div className="grid gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge size="small" color={selectedResult.ok ? "green" : "red"}>
                {selectedResult.ok ? "OK" : "Failed"}
              </Badge>
              <Badge size="small" color={selectedResult.dryRun ? "blue" : "orange"}>
                {selectedResult.dryRun ? "Dry run" : "Live run"}
              </Badge>
              <Text size="small" className="font-mono text-ui-fg-muted">
                {selectedResult.action}
              </Text>
            </div>
            <Text size="small">{selectedResult.summary}</Text>
            {selectedResult.details !== undefined ? (
              <pre className="max-h-[420px] overflow-auto rounded-md border border-ui-border-base bg-ui-bg-subtle p-3 text-xs text-ui-fg-base">
                {JSON.stringify(selectedResult.details, null, 2)}
              </pre>
            ) : null}
          </div>
        ) : (
          <Text size="small" className="text-ui-fg-muted">
            Run an action to see its summary and details.
          </Text>
        )}
      </section>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Bulk Ops",
  rank: 40,
  icon: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18" />
      <path d="M7 12h10" />
      <path d="M10 18h4" />
    </svg>
  ),
})
