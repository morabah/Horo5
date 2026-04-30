import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Badge, Button, Container, Heading, Text, toast } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"

import { HealthCard, type HealthCardData } from "../../components/ops-health/HealthCard"
import { sdk } from "../../lib/sdk"

type OpsHealthPayload = {
  generatedAt: string
  checks: {
    s3: HealthCardData
    paymentProviders: HealthCardData
    promotions: HealthCardData
    parity: HealthCardData
  }
}

type ParitySnapshot = {
  local: unknown
  remote: unknown
  comparison: unknown
}

async function fetchHealth() {
  return sdk.client.fetch<{ health: OpsHealthPayload }>("/admin/custom/ops-health", { method: "GET" })
}

async function fetchParity() {
  return sdk.client.fetch<{ detail: ParitySnapshot }>("/admin/custom/ops-health/parity", { method: "GET" })
}

export default function OpsHealthPage() {
  const healthQuery = useQuery({
    queryKey: ["horo", "ops-health"],
    queryFn: fetchHealth,
    staleTime: 30_000,
  })
  const parityQuery = useQuery({
    queryKey: ["horo", "ops-health", "parity"],
    queryFn: fetchParity,
    enabled: false,
  })

  const health = healthQuery.data?.health
  const checks = health?.checks ? Object.values(health.checks) : []
  const errorCount = checks.filter((check) => check.status === "error").length
  const warnCount = checks.filter((check) => check.status === "warn").length

  return (
    <Container className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Heading level="h1">Ops Health</Heading>
            <Badge size="small" color={errorCount ? "red" : warnCount ? "orange" : "green"}>
              {errorCount ? `${errorCount} errors` : warnCount ? `${warnCount} warnings` : "ok"}
            </Badge>
          </div>
          <Text size="small" className="mt-1 max-w-3xl text-ui-fg-subtle">
            S3, payment providers, promotions, and catalog parity signals.
          </Text>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            size="small"
            variant="secondary"
            disabled={healthQuery.isFetching}
            isLoading={healthQuery.isFetching}
            onClick={async () => {
              await healthQuery.refetch()
              toast.success("Ops health refreshed.")
            }}
          >
            Refresh
          </Button>
          <Button
            type="button"
            size="small"
            variant="secondary"
            disabled={parityQuery.isFetching}
            isLoading={parityQuery.isFetching}
            onClick={async () => {
              await parityQuery.refetch()
              toast.success("Parity snapshot refreshed.")
            }}
          >
            Parity Detail
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {checks.length === 0 ? (
          <div className="rounded-md border border-ui-border-base p-8 text-center md:col-span-2">
            <Text size="small" className="text-ui-fg-muted">
              Loading health checks...
            </Text>
          </div>
        ) : (
          checks.map((check) => <HealthCard key={check.title} check={check} />)
        )}
      </div>

      <section className="mt-5 rounded-md border border-ui-border-base p-5">
        <Heading level="h2" className="mb-3">
          Parity Detail
        </Heading>
        {parityQuery.data?.detail ? (
          <pre className="max-h-[520px] overflow-auto rounded-md border border-ui-border-base bg-ui-bg-subtle p-3 text-xs text-ui-fg-base">
            {JSON.stringify(parityQuery.data.detail, null, 2)}
          </pre>
        ) : (
          <Text size="small" className="text-ui-fg-muted">
            Open parity detail to load the full local snapshot.
          </Text>
        )}
      </section>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Ops Health",
  rank: 70,
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
      <path d="M20 13c0 5-3.5 8-8 8s-8-3-8-8V5l8-3 8 3v8Z" />
      <path d="m9 12 2 2 4-5" />
    </svg>
  ),
})
