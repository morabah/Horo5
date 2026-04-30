import { Button, Heading, Input, Label, Table, Text, toast } from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"

import { sdk } from "../../lib/sdk"

type AdminOccasion = {
  id?: string
  slug: string
  name: string
  blurb?: string
  active?: boolean
  sortOrder?: number
}

async function fetchOccasions() {
  return sdk.client.fetch<{ occasions: AdminOccasion[] }>("/admin/custom/occasions?includeIds=true", { method: "GET" })
}

async function createOccasion(payload: { slug: string; name: string }) {
  return sdk.client.fetch("/admin/custom/occasions", {
    method: "POST",
    body: payload,
  })
}

async function updateOccasion(occasion: AdminOccasion) {
  if (!occasion.id) throw new Error("Occasion id is required.")
  return sdk.client.fetch(`/admin/custom/occasions/${encodeURIComponent(occasion.id)}`, {
    method: "PATCH",
    body: {
      name: occasion.name,
      blurb: occasion.blurb ?? "",
      active: occasion.active !== false,
      sort_order: Number(occasion.sortOrder || 0),
    },
  })
}

async function archiveOccasion(occasion: AdminOccasion) {
  if (!occasion.id) throw new Error("Occasion id is required.")
  return sdk.client.fetch(`/admin/custom/occasions/${encodeURIComponent(occasion.id)}`, {
    method: "DELETE",
  })
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function OccasionManager() {
  const queryClient = useQueryClient()
  const [newName, setNewName] = useState("")
  const [newSlug, setNewSlug] = useState("")
  const [edits, setEdits] = useState<Record<string, AdminOccasion>>({})

  const { data, isLoading } = useQuery({
    queryKey: ["horo", "taxonomy", "occasions"],
    queryFn: fetchOccasions,
    staleTime: 30_000,
  })

  const createMutation = useMutation({
    mutationFn: createOccasion,
    onSuccess: async () => {
      setNewName("")
      setNewSlug("")
      toast.success("Occasion created.")
      await queryClient.invalidateQueries({ queryKey: ["horo", "taxonomy", "occasions"] })
      await queryClient.invalidateQueries({ queryKey: ["horo", "drops", "lookups"] })
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Create failed."),
  })

  const updateMutation = useMutation({
    mutationFn: updateOccasion,
    onSuccess: async () => {
      toast.success("Occasion saved.")
      await queryClient.invalidateQueries({ queryKey: ["horo", "taxonomy", "occasions"] })
      await queryClient.invalidateQueries({ queryKey: ["horo", "drops", "lookups"] })
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Save failed."),
  })

  const archiveMutation = useMutation({
    mutationFn: archiveOccasion,
    onSuccess: async () => {
      toast.success("Occasion archived.")
      await queryClient.invalidateQueries({ queryKey: ["horo", "taxonomy", "occasions"] })
      await queryClient.invalidateQueries({ queryKey: ["horo", "drops", "lookups"] })
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Archive failed."),
  })

  const occasions = data?.occasions ?? []
  const busy = createMutation.isPending || updateMutation.isPending || archiveMutation.isPending

  return (
    <section className="rounded-md border border-ui-border-base p-5">
      <Heading level="h2" className="mb-4">
        Occasions
      </Heading>
      <div className="mb-4 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
        <div className="flex flex-col gap-1">
          <Label htmlFor="occasion-name" className="text-xs">
            Name
          </Label>
          <Input
            id="occasion-name"
            size="small"
            value={newName}
            disabled={busy}
            onChange={(event) => {
              setNewName(event.target.value)
              if (!newSlug) setNewSlug(slugify(event.target.value))
            }}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="occasion-slug" className="text-xs">
            Slug
          </Label>
          <Input
            id="occasion-slug"
            size="small"
            value={newSlug}
            disabled={busy}
            onChange={(event) => setNewSlug(slugify(event.target.value))}
          />
        </div>
        <div className="flex items-end">
          <Button
            type="button"
            size="small"
            disabled={busy || !newName.trim() || !newSlug.trim()}
            isLoading={createMutation.isPending}
            onClick={() => createMutation.mutate({ name: newName.trim(), slug: newSlug.trim() })}
          >
            Create
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-md border border-ui-border-base">
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Name</Table.HeaderCell>
              <Table.HeaderCell>Slug</Table.HeaderCell>
              <Table.HeaderCell className="text-right">Actions</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {isLoading ? (
              <Table.Row>
                <td colSpan={3} className="py-8 text-center text-ui-fg-muted">
                  Loading occasions...
                </td>
              </Table.Row>
            ) : occasions.length === 0 ? (
              <Table.Row>
                <td colSpan={3} className="py-8 text-center text-ui-fg-muted">
                  No occasions found.
                </td>
              </Table.Row>
            ) : (
              occasions.map((occasion) => {
                const draft = edits[occasion.id || occasion.slug] ?? occasion
                return (
                  <Table.Row key={occasion.id || occasion.slug}>
                    <Table.Cell>
                      <Input
                        size="small"
                        value={draft.name}
                        disabled={busy || !occasion.id}
                        onChange={(event) => {
                          const key = occasion.id || occasion.slug
                          setEdits((prev) => ({ ...prev, [key]: { ...draft, name: event.target.value } }))
                        }}
                      />
                    </Table.Cell>
                    <Table.Cell>
                      <Text size="small" className="font-mono text-ui-fg-muted">
                        {occasion.slug}
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          size="small"
                          variant="secondary"
                          disabled={busy || !occasion.id}
                          onClick={() => updateMutation.mutate(draft)}
                        >
                          Save
                        </Button>
                        <Button
                          type="button"
                          size="small"
                          variant="danger"
                          disabled={busy || !occasion.id}
                          onClick={() => {
                            if (window.confirm(`Archive "${occasion.name}"?`)) {
                              archiveMutation.mutate(occasion)
                            }
                          }}
                        >
                          Archive
                        </Button>
                      </div>
                    </Table.Cell>
                  </Table.Row>
                )
              })
            )}
          </Table.Body>
        </Table>
      </div>
    </section>
  )
}
