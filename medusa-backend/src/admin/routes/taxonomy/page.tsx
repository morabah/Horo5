import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Badge, Button, Container, Heading, Text, toast } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"

import { AuditTable } from "../../components/taxonomy/AuditTable"
import { OccasionManager } from "../../components/taxonomy/OccasionManager"
import { TaxonomyTree } from "../../components/taxonomy/TaxonomyTree"
import { fetchDropLookups } from "../../components/drops/api"
import { sdk } from "../../lib/sdk"
import type { TaxonomyAuditReport } from "../../../lib/taxonomy/audit"

async function fetchAudit() {
  return sdk.client.fetch<{ report: TaxonomyAuditReport }>("/admin/custom/taxonomy/audit", { method: "GET" })
}

export default function TaxonomyPage() {
  const { data: lookups } = useQuery({
    queryKey: ["horo", "drops", "lookups"],
    queryFn: fetchDropLookups,
    staleTime: 60_000,
  })
  const auditQuery = useQuery({
    queryKey: ["horo", "taxonomy", "audit"],
    queryFn: fetchAudit,
    staleTime: 30_000,
  })

  const audit = auditQuery.data?.report

  return (
    <Container className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Heading level="h1">Taxonomy</Heading>
            <Badge size="small" color={audit?.issueCount ? "red" : "green"}>
              {audit?.issueCount ?? 0} issues
            </Badge>
          </div>
          <Text size="small" className="mt-1 max-w-3xl text-ui-fg-subtle">
            Feelings, subfeelings, occasions, and product taxonomy audit.
          </Text>
        </div>
        <Button
          type="button"
          size="small"
          variant="secondary"
          disabled={auditQuery.isFetching}
          isLoading={auditQuery.isFetching}
          onClick={async () => {
            try {
              await auditQuery.refetch()
              toast.success("Taxonomy audit refreshed.")
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Audit refresh failed.")
            }
          }}
        >
          Refresh Audit
        </Button>
      </div>

      <div className="grid gap-5">
        <TaxonomyTree lookups={lookups} audit={audit} />
        <AuditTable audit={audit} loading={auditQuery.isLoading} />
        <OccasionManager />
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Taxonomy",
  rank: 60,
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
      <path d="M6 3v12" />
      <path d="M18 9v12" />
      <path d="M6 15a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
      <path d="M18 3a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
      <path d="M6 9h12" />
    </svg>
  ),
})
