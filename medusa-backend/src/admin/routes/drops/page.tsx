import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ArchiveBox, Photo, PlusMini, SquareTwoStack } from "@medusajs/icons"
import { Badge, Button, Container, Heading, Input, Select, Table, Text } from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { useMemo, useState } from "react"

import { fetchDrop, fetchDropLookups, fetchDrops, saveDrop } from "../../components/drops/api"
import type { DropSummary } from "../../components/drops/types"
import { slugifyDropTitle } from "../../components/drops/utils"

const none = "__none__"

function statusColor(status: DropSummary["status"]) {
  if (status === "published") return "green"
  if (status === "archived") return "orange"
  return "grey"
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

export default function DropsPage() {
  const queryClient = useQueryClient()
  const [q, setQ] = useState("")
  const [status, setStatus] = useState<string | undefined>()
  const [feeling, setFeeling] = useState<string | undefined>()
  const [occasion, setOccasion] = useState<string | undefined>()
  const [statusMsg, setStatusMsg] = useState<string | null>(null)

  const params = useMemo(() => ({ q, status, feeling, occasion, limit: "200" }), [q, status, feeling, occasion])
  const { data, isLoading } = useQuery({
    queryKey: ["horo", "drops", "list", params],
    queryFn: () => fetchDrops(params),
    staleTime: 30_000,
  })
  const { data: lookups } = useQuery({
    queryKey: ["horo", "drops", "lookups"],
    queryFn: fetchDropLookups,
    staleTime: 60_000,
  })

  const archiveMutation = useMutation({
    mutationFn: async (handle: string) => {
      const { drop } = await fetchDrop(handle)
      await saveDrop({ ...drop, status: "archived" })
    },
    onSuccess: async () => {
      setStatusMsg("Archived.")
      await queryClient.invalidateQueries({ queryKey: ["horo", "drops"] })
    },
    onError: (error) => setStatusMsg(error instanceof Error ? error.message : "Archive failed."),
  })

  const duplicateMutation = useMutation({
    mutationFn: async (handle: string) => {
      const { drop } = await fetchDrop(handle)
      const base = `${drop.title || handle} Copy`
      await saveDrop({
        ...drop,
        id: undefined,
        title: base,
        handle: `${slugifyDropTitle(base)}-${Date.now().toString(36)}`,
        status: "draft",
      })
    },
    onSuccess: async () => {
      setStatusMsg("Duplicated as draft.")
      await queryClient.invalidateQueries({ queryKey: ["horo", "drops"] })
    },
    onError: (error) => setStatusMsg(error instanceof Error ? error.message : "Duplicate failed."),
  })

  const drops = data?.drops ?? []

  return (
    <Container className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Heading level="h1">Drops</Heading>
          <Text size="small" className="mt-1 text-ui-fg-muted">
            {data?.count ?? 0} products
          </Text>
        </div>
        <div className="flex gap-2">
          <Button asChild size="small" variant="secondary">
            <Link to="/drops/bulk">Bulk Create</Link>
          </Button>
          <Button asChild size="small">
            <Link to="/drops/new">
              <PlusMini />
              New Drop
            </Link>
          </Button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Input
          size="small"
          className="w-72"
          placeholder="Search drops"
          value={q}
          onChange={(event) => setQ(event.target.value)}
        />
        <FilterSelect
          value={status}
          placeholder="All statuses"
          onChange={setStatus}
          options={[
            { value: "draft", label: "Draft" },
            { value: "published", label: "Published" },
            { value: "archived", label: "Archived" },
          ]}
        />
        <FilterSelect
          value={feeling}
          placeholder="All feelings"
          onChange={setFeeling}
          options={(lookups?.feelings ?? []).map((item) => ({ value: item.slug, label: item.name }))}
        />
        <FilterSelect
          value={occasion}
          placeholder="All occasions"
          onChange={setOccasion}
          options={(lookups?.occasions ?? []).map((item) => ({ value: item.slug, label: item.name }))}
        />
      </div>

      {statusMsg ? (
        <Text size="small" className="mb-3 text-ui-fg-muted">
          {statusMsg}
        </Text>
      ) : null}

      <div className="overflow-hidden rounded-md border border-ui-border-base">
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Product</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell>Feeling</Table.HeaderCell>
              <Table.HeaderCell>Price</Table.HeaderCell>
              <Table.HeaderCell>Stock</Table.HeaderCell>
              <Table.HeaderCell>Updated</Table.HeaderCell>
              <Table.HeaderCell className="text-right">Actions</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {isLoading ? (
              <Table.Row>
                <td colSpan={7} className="py-8 text-center text-ui-fg-muted">
                  Loading drops...
                </td>
              </Table.Row>
            ) : drops.length ? (
              drops.map((drop) => (
                <Table.Row key={drop.id}>
                  <Table.Cell>
                    <div className="flex items-center gap-3">
                      {drop.thumbnail ? (
                        <img src={drop.thumbnail} alt="" className="h-10 w-10 rounded object-cover" />
                      ) : (
                        <div className="h-10 w-10 rounded bg-ui-bg-subtle" />
                      )}
                      <div className="min-w-0">
                        <Text size="small" weight="plus" className="truncate">
                          {drop.title}
                        </Text>
                        <Text size="xsmall" className="font-mono text-ui-fg-muted">
                          {drop.handle}
                        </Text>
                      </div>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge size="small" color={statusColor(drop.status)}>
                      {drop.status}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>{drop.feeling || "-"}</Table.Cell>
                  <Table.Cell>{drop.priceEgp ? `${drop.priceEgp} EGP` : "-"}</Table.Cell>
                  <Table.Cell>{drop.totalStock ?? "-"}</Table.Cell>
                  <Table.Cell>
                    {drop.updatedAt ? new Date(drop.updatedAt).toLocaleDateString() : "-"}
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex justify-end gap-2">
                      <Button asChild size="small" variant="secondary">
                        <Link to={`/drops/${drop.handle}`}>Edit</Link>
                      </Button>
                      <Button
                        type="button"
                        size="small"
                        variant="secondary"
                        disabled={duplicateMutation.isPending}
                        onClick={() => duplicateMutation.mutate(drop.handle)}
                      >
                        <SquareTwoStack />
                      </Button>
                      <Button
                        type="button"
                        size="small"
                        variant="secondary"
                        disabled={archiveMutation.isPending || drop.status === "archived"}
                        onClick={() => archiveMutation.mutate(drop.handle)}
                      >
                        <ArchiveBox />
                      </Button>
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))
            ) : (
              <Table.Row>
                <td colSpan={7} className="py-8 text-center text-ui-fg-muted">
                  No drops found.
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
  label: "Drops",
  rank: 20,
  icon: Photo,
})
