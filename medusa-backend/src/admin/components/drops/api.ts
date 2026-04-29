import { sdk } from "../../lib/sdk"
import type { DropLookups, DropPayload, DropSummary, UploadedFile } from "./types"

type DropListResponse = {
  drops: DropSummary[]
  count: number
  limit: number
  offset: number
}

type DropResponse = {
  drop: DropPayload
}

type UploadResponse = {
  files: UploadedFile[]
}

export async function fetchDrops(params: Record<string, string | undefined>) {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value)
  }
  return sdk.client.fetch<DropListResponse>(`/admin/custom/drops?${search.toString()}`, { method: "GET" })
}

export async function fetchDrop(handle: string) {
  return sdk.client.fetch<DropResponse>(`/admin/custom/drops/${encodeURIComponent(handle)}`, { method: "GET" })
}

export async function fetchDropLookups() {
  return sdk.client.fetch<DropLookups>("/admin/custom/drops/lookups", { method: "GET" })
}

export async function saveDrop(drop: DropPayload, existingHandle?: string) {
  const method = drop.id ? "PUT" : "POST"
  const url = drop.id ? `/admin/custom/drops/${encodeURIComponent(existingHandle || drop.handle)}` : "/admin/custom/drops"
  return sdk.client.fetch(url, {
    method,
    body: drop,
  })
}

export async function createOccasion(slug: string, name: string) {
  return sdk.client.fetch<{ id?: string; slug: string }>("/admin/custom/occasions", {
    method: "POST",
    body: { slug, name },
  })
}

export async function createArtist(slug: string, name: string) {
  return sdk.client.fetch<{ artist: { id: string; slug: string; name: string } }>("/admin/custom/artists", {
    method: "POST",
    body: { slug, name, active: true },
  })
}

export async function uploadDropFiles(files: File[]) {
  const form = new FormData()
  files.forEach((file) => form.append("files", file))

  const response = await fetch("/admin/custom/drops/upload", {
    method: "POST",
    credentials: "include",
    body: form,
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.message || `Upload failed (${response.status})`)
  }

  return response.json() as Promise<UploadResponse>
}

export async function uploadDropUrl(url: string) {
  return sdk.client.fetch<UploadResponse>("/admin/custom/drops/upload-from-url", {
    method: "POST",
    body: { url },
  })
}

export async function searchProductHandles(q: string) {
  if (!q.trim()) return []
  const params = new URLSearchParams({
    q: q.trim(),
    limit: "20",
    offset: "0",
    fields: "id,title,handle,thumbnail",
  })
  const data = await sdk.client.fetch<{ products?: Array<{ handle: string; title: string; thumbnail?: string | null }> }>(
    `/admin/products?${params.toString()}`,
    { method: "GET" },
  )
  return data.products ?? []
}
