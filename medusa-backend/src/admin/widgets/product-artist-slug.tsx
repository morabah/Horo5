import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Badge, Button, Container, Divider, Input, Label, Text } from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { HttpTypes } from "@medusajs/types"
import { useCallback, useEffect, useMemo, useState } from "react"

import { sdk } from "../lib/sdk"

type ArtistOption = {
  slug: string
  name: string
}

type StorefrontProductArtistOptionsResponse = {
  artists: ArtistOption[]
}

async function fetchArtistOptions(): Promise<StorefrontProductArtistOptionsResponse> {
  return sdk.client.fetch<StorefrontProductArtistOptionsResponse>(
    "/admin/custom/storefront-product-artist-options",
    { method: "GET" },
  )
}

type ArtistRow = {
  id: string
  slug: string
  name: string
  style?: string | null
  avatar_src?: string | null
  active?: boolean | null
}

type ArtistsListResponse = {
  artists: ArtistRow[]
  count: number
}

async function fetchAllArtists(): Promise<ArtistsListResponse> {
  return sdk.client.fetch<ArtistsListResponse>("/admin/custom/artists?limit=500&skip=0", {
    method: "GET",
  })
}

type ProductDetailData = Pick<HttpTypes.AdminProduct, "id" | "metadata">

function stripArtistDisplayOverrides(meta: Record<string, unknown>) {
  delete meta.artist
  delete meta.artistName
  delete meta.artistAvatarUrl
}

const HORO_ARTIST_QUERY_KEYS = {
  options: ["horo", "storefront-product-artist-options"] as const,
  catalogList: ["horo", "storefront-artists-admin-list"] as const,
}

function ArtistCatalogCrud() {
  const queryClient = useQueryClient()
  const [crudMessage, setCrudMessage] = useState<string | null>(null)
  const [newSlug, setNewSlug] = useState("")
  const [newName, setNewName] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editStyle, setEditStyle] = useState("")
  const [editAvatar, setEditAvatar] = useState("")

  const invalidateArtistData = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: HORO_ARTIST_QUERY_KEYS.options })
    await queryClient.invalidateQueries({ queryKey: HORO_ARTIST_QUERY_KEYS.catalogList })
  }, [queryClient])

  const { data: listData, isLoading: listLoading } = useQuery({
    queryKey: HORO_ARTIST_QUERY_KEYS.catalogList,
    queryFn: fetchAllArtists,
    staleTime: 30_000,
  })

  const rows = useMemo(() => {
    const raw = listData?.artists ?? []
    return [...raw].sort((a, b) => String(a.name).localeCompare(String(b.name)))
  }, [listData?.artists])

  const beginEdit = useCallback((row: ArtistRow) => {
    setEditingId(row.id)
    setEditName(row.name ?? "")
    setEditStyle(row.style ?? "")
    setEditAvatar(row.avatar_src ?? "")
    setCrudMessage(null)
  }, [])

  const cancelEdit = useCallback(() => {
    setEditingId(null)
  }, [])

  const createMutation = useMutation({
    mutationFn: async () => {
      const slug = newSlug.trim()
      const name = newName.trim()
      if (!slug || !name) {
        throw new Error("Slug and name are required.")
      }
      await sdk.client.fetch("/admin/custom/artists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: { slug, name, style: "" },
      })
    },
    onSuccess: async () => {
      setCrudMessage("Artist created.")
      setNewSlug("")
      setNewName("")
      await invalidateArtistData()
    },
    onError: (err: Error) => {
      setCrudMessage(err?.message || "Create failed")
    },
  })

  const saveEditMutation = useMutation({
    mutationFn: async () => {
      if (!editingId) return
      const payload: Record<string, unknown> = {
        name: editName.trim(),
        style: editStyle.trim(),
        avatar_src: editAvatar.trim() ? editAvatar.trim() : null,
      }
      await sdk.client.fetch(`/admin/custom/artists/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: payload,
      })
    },
    onSuccess: async () => {
      setCrudMessage("Artist updated.")
      setEditingId(null)
      await invalidateArtistData()
    },
    onError: (err: Error) => {
      setCrudMessage(err?.message || "Update failed")
    },
  })

  const deactivateMutation = useMutation({
    mutationFn: async (id: string) => {
      await sdk.client.fetch(`/admin/custom/artists/${id}`, { method: "DELETE" })
    },
    onSuccess: async () => {
      setCrudMessage("Artist deactivated (hidden from PDP picker).")
      if (editingId) setEditingId(null)
      await invalidateArtistData()
    },
    onError: (err: Error) => {
      setCrudMessage(err?.message || "Deactivate failed")
    },
  })

  const activateMutation = useMutation({
    mutationFn: async (id: string) => {
      await sdk.client.fetch(`/admin/custom/artists/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: { active: true },
      })
    },
    onSuccess: async () => {
      setCrudMessage("Artist activated.")
      await invalidateArtistData()
    },
    onError: (err: Error) => {
      setCrudMessage(err?.message || "Activate failed")
    },
  })

  const busy =
    createMutation.isPending ||
    saveEditMutation.isPending ||
    deactivateMutation.isPending ||
    activateMutation.isPending

  return (
    <details className="mt-4 rounded-md border border-ui-border-base p-3">
      <summary className="cursor-pointer select-none text-sm font-medium text-ui-fg-base">
        Manage storefront artist catalog
      </summary>
      <div className="mt-3 flex max-w-3xl flex-col gap-4">
        <Text size="small" className="text-ui-fg-subtle">
          Create artists, edit display fields, or deactivate (soft-delete). Slug cannot be changed
          after creation; to rename URLs, create a new artist and reassign products. Deactivated
          artists disappear from the PDP dropdown above but remain in the database.
        </Text>

        <div className="flex flex-col gap-2 rounded-md border border-dashed border-ui-border-base p-3">
          <Label weight="plus">New artist</Label>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <Label htmlFor="horo-new-artist-slug" className="text-xs">
                Slug
              </Label>
              <Input
                id="horo-new-artist-slug"
                size="small"
                value={newSlug}
                disabled={busy}
                onChange={(e) => setNewSlug(e.target.value)}
                placeholder="layla-farid"
              />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <Label htmlFor="horo-new-artist-name" className="text-xs">
                Name
              </Label>
              <Input
                id="horo-new-artist-name"
                size="small"
                value={newName}
                disabled={busy}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Layla Farid"
              />
            </div>
            <Button
              type="button"
              size="small"
              disabled={busy}
              isLoading={createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              Create
            </Button>
          </div>
        </div>

        {listLoading ? (
          <Text size="small">Loading catalog…</Text>
        ) : (
          <div className="overflow-x-auto rounded-md border border-ui-border-base">
            <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-ui-border-base bg-ui-bg-subtle">
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Slug</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-ui-border-base last:border-0">
                    <td className="px-3 py-2 align-top">
                      {editingId === row.id ? (
                        <div className="flex flex-col gap-2">
                          <Input
                            size="small"
                            value={editName}
                            disabled={busy}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="Name"
                          />
                          <Input
                            size="small"
                            value={editStyle}
                            disabled={busy}
                            onChange={(e) => setEditStyle(e.target.value)}
                            placeholder="Style (optional)"
                          />
                          <Input
                            size="small"
                            value={editAvatar}
                            disabled={busy}
                            onChange={(e) => setEditAvatar(e.target.value)}
                            placeholder="Avatar URL (optional)"
                          />
                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              size="small"
                              disabled={busy}
                              isLoading={saveEditMutation.isPending}
                              onClick={() => saveEditMutation.mutate()}
                            >
                              Save
                            </Button>
                            <Button
                              type="button"
                              size="small"
                              variant="secondary"
                              disabled={busy}
                              onClick={cancelEdit}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <span className="text-ui-fg-base">{row.name}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 align-top font-mono text-xs text-ui-fg-muted">{row.slug}</td>
                    <td className="px-3 py-2 align-top">
                      {row.active === false ? (
                        <Badge size="small" color="orange">
                          Inactive
                        </Badge>
                      ) : (
                        <Badge size="small" color="green">
                          Active
                        </Badge>
                      )}
                    </td>
                    <td className="px-3 py-2 align-top">
                      {editingId === row.id ? null : (
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            size="small"
                            variant="secondary"
                            disabled={busy}
                            onClick={() => beginEdit(row)}
                          >
                            Edit
                          </Button>
                          {row.active === false ? (
                            <Button
                              type="button"
                              size="small"
                              disabled={busy}
                              isLoading={activateMutation.isPending}
                              onClick={() => activateMutation.mutate(row.id)}
                            >
                              Activate
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              size="small"
                              variant="danger"
                              disabled={busy}
                              isLoading={deactivateMutation.isPending}
                              onClick={() => {
                                if (
                                  typeof window !== "undefined" &&
                                  window.confirm(
                                    `Deactivate "${row.name}"? They will be removed from the PDP artist picker.`,
                                  )
                                ) {
                                  deactivateMutation.mutate(row.id)
                                }
                              }}
                            >
                              Deactivate
                            </Button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {crudMessage ? (
          <Text size="small" className="text-ui-fg-muted">
            {crudMessage}
          </Text>
        ) : null}
      </div>
    </details>
  )
}

const ProductArtistSlugWidget = ({ data }: { data: ProductDetailData }) => {
  const queryClient = useQueryClient()
  const [message, setMessage] = useState<string | null>(null)

  const { data: options, isLoading: optionsLoading } = useQuery({
    queryKey: HORO_ARTIST_QUERY_KEYS.options,
    queryFn: fetchArtistOptions,
    staleTime: 60_000,
    enabled: Boolean(data?.id),
  })

  const artistRows = useMemo(() => options?.artists ?? [], [options?.artists])
  const slugSet = useMemo(() => new Set(artistRows.map((a) => a.slug)), [artistRows])

  const currentRaw =
    data?.metadata && typeof data.metadata === "object" && !Array.isArray(data.metadata)
      ? (data.metadata as Record<string, unknown>).artistSlug
      : undefined
  const currentKey =
    typeof currentRaw === "string" && currentRaw.trim() ? currentRaw.trim() : ""

  const [localValue, setLocalValue] = useState<string>(() => (currentKey ? currentKey : "__default__"))

  useEffect(() => {
    setLocalValue(currentKey ? currentKey : "__default__")
  }, [data?.id, currentKey])

  const selectValue = useMemo(() => {
    if (localValue === "__default__") return "__default__"
    if (slugSet.has(localValue)) return localValue
    if (currentKey && localValue === currentKey) return currentKey
    if (localValue && localValue !== "__default__") return localValue
    return "__default__"
  }, [localValue, slugSet, currentKey])

  const { mutate, isPending } = useMutation({
    mutationFn: async (next: string) => {
      if (!data?.id) return
      const prevMeta =
        data.metadata && typeof data.metadata === "object" && !Array.isArray(data.metadata)
          ? { ...(data.metadata as Record<string, unknown>) }
          : ({} as Record<string, unknown>)

      stripArtistDisplayOverrides(prevMeta)

      if (!next || next === "__default__") {
        delete prevMeta.artistSlug
      } else {
        prevMeta.artistSlug = next
      }

      await sdk.admin.product.update(data.id, { metadata: prevMeta })
    },
    onSuccess: async () => {
      setMessage("Saved.")
      await queryClient.invalidateQueries()
    },
    onError: (err: Error) => {
      setMessage(err?.message || "Save failed")
    },
  })

  const onSelectChange = useCallback(
    (value: string) => {
      setLocalValue(value)
      setMessage(null)
      mutate(value)
    },
    [mutate],
  )

  if (!data?.id) {
    return null
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex flex-col gap-3 px-6 py-4">
        <div>
          <Label weight="plus">PDP artist</Label>
          <Text size="small" className="text-ui-fg-subtle">
            Assigns <code className="text-xs">metadata.artistSlug</code> from{" "}
            <code className="text-xs">storefront_artist</code>. Choosing an artist clears{" "}
            <code className="text-xs">metadata.artist</code> overrides so the storefront uses the
            catalog name and avatar. Choose &quot;Not set&quot; to remove the slug (storefront
            falls back to its default artist when the field is empty).
          </Text>
        </div>

        {optionsLoading ? (
          <Text size="small">Loading artists…</Text>
        ) : artistRows.length === 0 && !currentKey ? (
          <Text size="small" className="text-ui-fg-subtle">
            No active artists found. Seed or create artists in{" "}
            <code className="text-xs">storefront_artist</code> first (expand &quot;Manage
            storefront artist catalog&quot; below).
          </Text>
        ) : (
          <div className="flex max-w-md flex-col gap-2">
            {artistRows.length === 0 && currentKey ? (
              <Text size="small" className="text-ui-fg-subtle">
                No active artists in the catalog; you can clear the slug below or fix artist data.
              </Text>
            ) : null}
            <select
              className="border-ui-border-base bg-ui-bg-field text-ui-fg-base w-full rounded-md border px-3 py-2 text-sm shadow-sm"
              disabled={isPending}
              value={selectValue}
              onChange={(e) => {
                onSelectChange(e.target.value)
              }}
              aria-label="Product storefront artist"
            >
              <option value="__default__">Not set (storefront default)</option>
              {artistRows.map((row) => (
                <option key={row.slug} value={row.slug}>
                  {row.name} ({row.slug})
                </option>
              ))}
              {currentKey && !slugSet.has(currentKey) ? (
                <option value={currentKey}>
                  {currentKey} (on product, not in active list)
                </option>
              ) : null}
            </select>
            {isPending ? (
              <Text size="small" className="text-ui-fg-muted">
                Saving…
              </Text>
            ) : null}
            {message ? (
              <Text size="small" className="text-ui-fg-muted">
                {message}
              </Text>
            ) : null}
          </div>
        )}

        <Divider />
        <ArtistCatalogCrud />
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.after",
})

export default ProductArtistSlugWidget
