import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Badge, Button, Container, Heading, Input, Label, Text, toast } from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"

import { SyncDiffTable } from "../../components/catalog-sync/SyncDiffTable"
import { SyncStatusCard } from "../../components/catalog-sync/SyncStatusCard"
import { sdk } from "../../lib/sdk"
import type { CatalogSyncReport } from "../../../lib/catalog-sync/types"

type CatalogSyncStatus = {
  lastCatalogSyncAt: string | null
  lastCatalogSyncSummary: string | null
  productCount: number | null
}

type CatalogSyncResponse = {
  report: CatalogSyncReport
  status?: CatalogSyncStatus
}

type CatalogSyncForm = {
  csvSource: string
  only: string
  force: boolean
  noStock: boolean
  noInventory: boolean
  allowPartial: boolean
}

const initialForm: CatalogSyncForm = {
  csvSource: "",
  only: "",
  force: false,
  noStock: false,
  noInventory: false,
  allowPartial: false,
}

async function fetchStatus() {
  return sdk.client.fetch<{ status: CatalogSyncStatus }>("/admin/custom/catalog-sync/status", { method: "GET" })
}

function requestBody(form: CatalogSyncForm) {
  return {
    csvSource: form.csvSource.trim() || undefined,
    only: form.only.trim() || undefined,
    force: form.force,
    noStock: form.noStock,
    noInventory: form.noInventory,
    allowPartial: form.allowPartial,
  }
}

async function runDryRun(form: CatalogSyncForm) {
  return sdk.client.fetch<CatalogSyncResponse>("/admin/custom/catalog-sync/dry-run", {
    method: "POST",
    body: requestBody(form),
  })
}

async function applySync(form: CatalogSyncForm) {
  return sdk.client.fetch<CatalogSyncResponse>("/admin/custom/catalog-sync/apply", {
    method: "POST",
    body: requestBody(form),
  })
}

function errorMessage(error: unknown) {
  const body = error as { message?: string; body?: { message?: string; report?: CatalogSyncReport } }
  return body.body?.message || body.message || (error instanceof Error ? error.message : "Catalog sync failed.")
}

function reportSummary(report: CatalogSyncReport) {
  return `${report.selectedRows} selected, ${report.readyRows} ready, ${report.validationIssues.length} validation issue(s), ${report.importHandles.length} import handle(s)`
}

export default function CatalogSyncPage() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<CatalogSyncForm>(initialForm)
  const [report, setReport] = useState<CatalogSyncReport | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const { data: statusData } = useQuery({
    queryKey: ["horo", "catalog-sync", "status"],
    queryFn: fetchStatus,
    staleTime: 30_000,
  })

  const dryRunMutation = useMutation({
    mutationFn: () => runDryRun(form),
    onSuccess: ({ report: nextReport }) => {
      setReport(nextReport)
      const summary = reportSummary(nextReport)
      setMessage(summary)
      toast.success("Catalog sync dry run complete.", { description: summary })
    },
    onError: (error) => {
      const text = errorMessage(error)
      setMessage(text)
      toast.error("Dry run failed.", { description: text })
    },
  })

  const applyMutation = useMutation({
    mutationFn: () => applySync(form),
    onSuccess: async ({ report: nextReport }) => {
      setReport(nextReport)
      const summary = reportSummary(nextReport)
      setMessage(summary)
      toast.success("Catalog sync applied.", { description: summary })
      await queryClient.invalidateQueries({ queryKey: ["horo", "catalog-sync", "status"] })
      await queryClient.invalidateQueries({ queryKey: ["horo", "drops"] })
    },
    onError: (error) => {
      const body = error as { body?: { report?: CatalogSyncReport } }
      if (body.body?.report) {
        setReport(body.body.report)
      }
      const text = errorMessage(error)
      setMessage(text)
      toast.error("Apply sync failed.", { description: text })
    },
  })

  const busy = dryRunMutation.isPending || applyMutation.isPending
  const validationIssueCount = report?.validationIssues.length ?? null

  return (
    <Container className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Heading level="h1">Catalog Sync</Heading>
            <Badge size="small" color="purple">
              sheet
            </Badge>
          </div>
          <Text size="small" className="mt-1 max-w-3xl text-ui-fg-subtle">
            Preview and apply the product sheet sync using the same drop importer, stock tracking, and inventory backfill stages as the CLI.
          </Text>
        </div>
      </div>

      <div className="grid gap-5">
        <SyncStatusCard
          lastCatalogSyncAt={statusData?.status.lastCatalogSyncAt}
          lastCatalogSyncSummary={statusData?.status.lastCatalogSyncSummary}
          productCount={statusData?.status.productCount}
          validationIssueCount={validationIssueCount}
        />

        <section className="rounded-md border border-ui-border-base p-5">
          <Heading level="h2" className="mb-4">
            Source and Options
          </Heading>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1">
              <Label htmlFor="catalog-sync-csv" className="text-xs">
                CSV source override
              </Label>
              <Input
                id="catalog-sync-csv"
                size="small"
                value={form.csvSource}
                disabled={busy}
                placeholder="Uses CATALOG_SHEET_CSV_URL when blank"
                onChange={(event) => setForm((prev) => ({ ...prev, csvSource: event.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="catalog-sync-only" className="text-xs">
                Handle filter
              </Label>
              <Input
                id="catalog-sync-only"
                size="small"
                value={form.only}
                disabled={busy}
                placeholder="quiet-revolt,signal-line"
                onChange={(event) => setForm((prev) => ({ ...prev, only: event.target.value }))}
              />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-4">
            {[
              ["force", "Force"],
              ["noStock", "No stock"],
              ["noInventory", "No inventory"],
              ["allowPartial", "Allow partial"],
            ].map(([key, label]) => (
              <label key={key} className="flex cursor-pointer items-center gap-2 text-sm text-ui-fg-base">
                <input
                  type="checkbox"
                  checked={Boolean(form[key as keyof CatalogSyncForm])}
                  disabled={busy}
                  onChange={(event) => {
                    const checked = event.target.checked
                    setForm((prev) => ({ ...prev, [key]: checked }))
                  }}
                  className="accent-ui-fg-interactive"
                />
                {label}
              </label>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              size="small"
              variant="secondary"
              disabled={busy}
              isLoading={dryRunMutation.isPending}
              onClick={() => {
                setMessage(null)
                dryRunMutation.mutate()
              }}
            >
              Dry Run
            </Button>
            <Button
              type="button"
              size="small"
              disabled={busy}
              isLoading={applyMutation.isPending}
              onClick={() => {
                const confirmed = window.confirm("Apply catalog sync for real? This can create or update products, stock, and inventory.")
                if (!confirmed) return
                setMessage(null)
                applyMutation.mutate()
              }}
            >
              Apply Sync
            </Button>
          </div>
          {message ? (
            <Text size="small" className="mt-3 text-ui-fg-muted">
              {message}
            </Text>
          ) : null}
        </section>

        <section className="rounded-md border border-ui-border-base p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <Heading level="h2">Diff Preview</Heading>
            {report ? (
              <div className="flex flex-wrap gap-2">
                <Badge size="small" color="grey">
                  {report.selectedRows} selected
                </Badge>
                <Badge size="small" color={report.stageErrors.length ? "red" : "green"}>
                  {report.stageErrors.length} stage errors
                </Badge>
              </div>
            ) : null}
          </div>
          <SyncDiffTable report={report} />
        </section>
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Catalog Sync",
  rank: 50,
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
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3v6h-6" />
      <path d="M8 12h8" />
      <path d="M12 8v8" />
    </svg>
  ),
})
