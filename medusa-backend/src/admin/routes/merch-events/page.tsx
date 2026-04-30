import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Photo, PlusMini } from "@medusajs/icons"
import { Badge, Button, Container, Heading, Input, Select, Table, Text, toast } from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { Link } from "react-router-dom"

import { MerchEventStatusBadge } from "../../components/merch-events/MerchEventStatusBadge"
import { sdk } from "../../lib/sdk"
import {
  MERCH_EVENT_STATUSES,
  MERCH_EVENT_TYPES,
  type AdminMerchEvent,
} from "../../../lib/merch-events/types"

type MerchEventListResponse = {
  events: AdminMerchEvent[]
  count: number
  limit: number
  offset: number
}

const none = "__none__"
async function fetchMerchEvents(params: Record<string, string | undefined>) {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value)
  }
  return sdk.client.fetch<MerchEventListResponse>(`/admin/custom/merch-events?${search.toString()}`, { method: "GET" })
}

async function archiveMerchEvent(event: AdminMerchEvent) {
  return sdk.client.fetch(`/admin/custom/merch-events/${encodeURIComponent(event.id)}`, { method: "DELETE" })
}

function FilterSelect({
  value,
  placeholder,
  options,
  onChange,
}: {
  value?: string
  placeholder: string
  options: Array<{ value: string; label: string }>
  onChange: (value?: string) => void
}) {
  return (
    <Select size="small" value={value || none} onValueChange={(next) => onChange(next === none ? undefined : next)}>
      <Select.Trigger className="w-40">
        <Select.Value placeholder={placeholder} />
      </Select.Trigger>
      <Select.Content>
        <Select.Item value={none}>{placeholder}</Select.Item>
        {options.map((option) => (
          <Select.Item key={option.value} value={option.value}>
            {option.label}
          </Select.Item>
        ))}
      </Select.Content>
    </Select>
  )
}

function activeLabel(active?: string) {
  if (active === "true") return "Active only"
  if (active === "false") return "Inactive only"
  return "All active states"
}

export default function MerchEventsPage() {
  const queryClient = useQueryClient()
  const [q, setQ] = useState("")
  const [status, setStatus] = useState<string | undefined>()
  const [type, setType] = useState<string | undefined>()
  const [active, setActive] = useState<string | undefined>()

  const params = useMemo(() => ({ q, status, type, active, limit: "200" }), [active, q, status, type])
  const { data, isLoading } = useQuery({
    queryKey: ["horo", "merch-events", "list", params],
    queryFn: () => fetchMerchEvents(params),
    staleTime: 30_000,
  })

  const archiveMutation = useMutation({
    mutationFn: archiveMerchEvent,
    onSuccess: async () => {
      toast.success("Merch event archived.")
      await queryClient.invalidateQueries({ queryKey: ["horo", "merch-events"] })
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Archive failed."),
  })

  const events = data?.events ?? []

  return (
    <Container className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <Heading level="h1">Merch Events</Heading>
          <Text size="small" className="mt-1 text-ui-fg-muted">
            {data?.count ?? 0} events
          </Text>
        </div>
        <Button asChild size="small">
          <Link to="/merch-events/new">
            <PlusMini />
            New Event
          </Link>
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Input
          size="small"
          className="w-72"
          placeholder="Search events"
          value={q}
          onChange={(event) => setQ(event.target.value)}
        />
        <FilterSelect
          value={status}
          placeholder="All statuses"
          onChange={setStatus}
          options={MERCH_EVENT_STATUSES.map((value) => ({ value, label: value }))}
        />
        <FilterSelect
          value={type}
          placeholder="All types"
          onChange={setType}
          options={MERCH_EVENT_TYPES.map((value) => ({ value, label: value }))}
        />
        <FilterSelect
          value={active}
          placeholder={activeLabel(active)}
          onChange={setActive}
          options={[
            { value: "true", label: "Active only" },
            { value: "false", label: "Inactive only" },
          ]}
        />
      </div>

      <div className="overflow-hidden rounded-md border border-ui-border-base">
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Event</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell>Type</Table.HeaderCell>
              <Table.HeaderCell>Schedule</Table.HeaderCell>
              <Table.HeaderCell>Products</Table.HeaderCell>
              <Table.HeaderCell className="text-right">Actions</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {isLoading ? (
              <Table.Row>
                <td colSpan={6} className="py-8 text-center text-ui-fg-muted">
                  Loading merch events...
                </td>
              </Table.Row>
            ) : events.length ? (
              events.map((event) => (
                <Table.Row key={event.id}>
                  <Table.Cell>
                    <div className="min-w-0">
                      <Text size="small" weight="plus" className="truncate">
                        {event.name}
                      </Text>
                      <Text size="xsmall" className="font-mono text-ui-fg-muted">
                        {event.slug}
                      </Text>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex items-center gap-2">
                      <MerchEventStatusBadge status={event.status} />
                      {event.active ? null : (
                        <Badge size="small" color="grey">
                          inactive
                        </Badge>
                      )}
                    </div>
                  </Table.Cell>
                  <Table.Cell>{event.type}</Table.Cell>
                  <Table.Cell>
                    <Text size="xsmall" className="text-ui-fg-muted">
                      {event.startsAt ? new Date(event.startsAt).toLocaleDateString() : "-"}
                      {event.endsAt ? ` to ${new Date(event.endsAt).toLocaleDateString()}` : ""}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>{event.productHandles.length}</Table.Cell>
                  <Table.Cell>
                    <div className="flex justify-end gap-2">
                      <Button asChild size="small" variant="secondary">
                        <Link to={`/merch-events/${event.slug}`}>Edit</Link>
                      </Button>
                      <Button
                        type="button"
                        size="small"
                        variant="secondary"
                        disabled={archiveMutation.isPending}
                        onClick={() => {
                          if (window.confirm(`Archive "${event.name}"?`)) archiveMutation.mutate(event)
                        }}
                      >
                        Archive
                      </Button>
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))
            ) : (
              <Table.Row>
                <td colSpan={6} className="py-8 text-center text-ui-fg-muted">
                  No merch events match these filters.
                </td>
              </Table.Row>
            )}
          </Table.Body>
        </Table>
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Merch Events",
  rank: 45,
  icon: Photo,
})
