import { ArrowLeftMini } from "@medusajs/icons"
import { Button, Container, Heading, Input, Label, Select, Text, Textarea, toast } from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"

import {
  MERCH_EVENT_STATUSES,
  MERCH_EVENT_TYPES,
  type AdminMerchEvent,
  type MerchEventStatus,
} from "../../../lib/merch-events/types"
import { fetchDropLookups } from "../drops/api"
import { ChipInput } from "../drops/ChipInput"
import { MerchEventStatusBadge } from "./MerchEventStatusBadge"
import { sdk } from "../../lib/sdk"

type MerchEventFormProps = {
  initialEvent?: AdminMerchEvent
  mode: "create" | "edit"
}

type MerchEventDraft = {
  slug: string
  name: string
  type: string
  teaser: string
  body: string
  status: MerchEventStatus
  startsAt: string | null
  endsAt: string | null
  heroImageSrc: string | null
  heroImageAlt: string | null
  cardImageSrc: string | null
  cardImageAlt: string | null
  seoTitle: string | null
  seoDescription: string | null
  sortOrder: number
  active: boolean
  productHandles: string[]
  occasionSlug: string | null
}

const none = "__none__"
function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function emptyDraft(): MerchEventDraft {
  return {
    slug: "",
    name: "",
    type: "campaign",
    teaser: "",
    body: "",
    status: "draft",
    startsAt: null,
    endsAt: null,
    heroImageSrc: null,
    heroImageAlt: null,
    cardImageSrc: null,
    cardImageAlt: null,
    seoTitle: null,
    seoDescription: null,
    sortOrder: 0,
    active: true,
    productHandles: [],
    occasionSlug: null,
  }
}

function draftFromEvent(event?: AdminMerchEvent): MerchEventDraft {
  if (!event) return emptyDraft()
  return {
    slug: event.slug,
    name: event.name,
    type: event.type,
    teaser: event.teaser,
    body: event.body,
    status: event.status,
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    heroImageSrc: event.heroImageSrc,
    heroImageAlt: event.heroImageAlt,
    cardImageSrc: event.cardImageSrc,
    cardImageAlt: event.cardImageAlt,
    seoTitle: event.seoTitle,
    seoDescription: event.seoDescription,
    sortOrder: event.sortOrder,
    active: event.active,
    productHandles: event.productHandles,
    occasionSlug: event.occasionSlug,
  }
}

function toDateTimeLocal(value: string | null) {
  if (!value) return ""
  const ms = Date.parse(value)
  if (!Number.isFinite(ms)) return ""
  const date = new Date(ms)
  const pad = (part: number) => String(part).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function fromDateTimeLocal(value: string) {
  if (!value) return null
  const ms = Date.parse(value)
  return Number.isFinite(ms) ? new Date(ms).toISOString() : null
}

function payloadFromDraft(draft: MerchEventDraft) {
  return {
    slug: draft.slug,
    name: draft.name,
    type: draft.type,
    teaser: draft.teaser,
    body: draft.body,
    status: draft.status,
    starts_at: draft.startsAt,
    ends_at: draft.endsAt,
    hero_image_src: draft.heroImageSrc,
    hero_image_alt: draft.heroImageAlt,
    card_image_src: draft.cardImageSrc,
    card_image_alt: draft.cardImageAlt,
    seo_title: draft.seoTitle,
    seo_description: draft.seoDescription,
    sort_order: draft.sortOrder,
    active: draft.active,
    product_handles: draft.productHandles,
    occasion_slug: draft.occasionSlug,
  }
}

function errorMessage(error: unknown) {
  const body = error as { message?: string; body?: { message?: string; issues?: Array<{ field: string; message: string }> } }
  const issues = body.body?.issues
  if (issues?.length) return issues.map((issue) => `${issue.field}: ${issue.message}`).join("\n")
  return body.body?.message || body.message || (error instanceof Error ? error.message : "Save failed.")
}

function stringValue(value: string | null) {
  return value ?? ""
}

export function MerchEventForm({ initialEvent, mode }: MerchEventFormProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState<MerchEventDraft>(() => draftFromEvent(initialEvent))
  const [statusMsg, setStatusMsg] = useState<string | null>(null)

  useEffect(() => {
    setDraft(draftFromEvent(initialEvent))
  }, [initialEvent])

  const { data: lookups } = useQuery({
    queryKey: ["horo", "drops", "lookups"],
    queryFn: fetchDropLookups,
    staleTime: 60_000,
  })

  const saveMutation = useMutation({
    mutationFn: async (nextStatus?: MerchEventStatus) => {
      const payload = payloadFromDraft({ ...draft, status: nextStatus ?? draft.status })
      if (mode === "create") {
        return sdk.client.fetch<{ event: AdminMerchEvent }>("/admin/custom/merch-events", {
          method: "POST",
          body: payload,
        })
      }
      if (!initialEvent) throw new Error("Merch event is still loading.")
      return sdk.client.fetch<{ event: AdminMerchEvent }>(
        `/admin/custom/merch-events/${encodeURIComponent(initialEvent.id)}`,
        {
          method: "PATCH",
          body: payload,
        },
      )
    },
    onSuccess: async (result) => {
      const saved = result.event
      setDraft(draftFromEvent(saved))
      setStatusMsg("Saved.")
      toast.success("Merch event saved.")
      await queryClient.invalidateQueries({ queryKey: ["horo", "merch-events"] })
      if (mode === "create" && saved?.slug) {
        navigate(`/merch-events/${saved.slug}`, { replace: true })
      }
    },
    onError: (error) => {
      const message = errorMessage(error)
      setStatusMsg(message)
      toast.error("Merch event save failed.", { description: message })
    },
  })

  const archiveMutation = useMutation({
    mutationFn: async () => {
      if (!initialEvent) throw new Error("Merch event is still loading.")
      return sdk.client.fetch(`/admin/custom/merch-events/${encodeURIComponent(initialEvent.id)}`, {
        method: "DELETE",
      })
    },
    onSuccess: async () => {
      toast.success("Merch event archived.")
      await queryClient.invalidateQueries({ queryKey: ["horo", "merch-events"] })
      navigate("/merch-events")
    },
    onError: (error) => toast.error("Archive failed.", { description: errorMessage(error) }),
  })

  const busy = saveMutation.isPending || archiveMutation.isPending
  const title = mode === "create" ? "New Merch Event" : draft.name || draft.slug
  const occasionOptions = useMemo(() => lookups?.occasions ?? [], [lookups?.occasions])

  const update = (patch: Partial<MerchEventDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }))
    setStatusMsg(null)
  }

  return (
    <Container className="mx-auto max-w-5xl p-0">
      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-ui-border-base bg-ui-bg-base px-6 py-4">
        <div className="flex items-center gap-3">
          <Button asChild size="small" variant="transparent">
            <Link to="/merch-events">
              <ArrowLeftMini />
              Merch Events
            </Link>
          </Button>
          <div>
            <Heading level="h1">{title}</Heading>
            <div className="mt-1 flex items-center gap-2">
              <MerchEventStatusBadge status={draft.status} />
              {initialEvent?.linkedProductCount !== undefined ? (
                <Text size="xsmall" className="text-ui-fg-muted">
                  {initialEvent.linkedProductCount} linked products
                </Text>
              ) : null}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {mode === "edit" ? (
            <Button
              type="button"
              size="small"
              variant="danger"
              disabled={busy}
              isLoading={archiveMutation.isPending}
              onClick={() => {
                if (window.confirm(`Archive "${draft.name}"?`)) archiveMutation.mutate()
              }}
            >
              Archive
            </Button>
          ) : null}
          <Button type="button" size="small" disabled={busy} isLoading={saveMutation.isPending} onClick={() => saveMutation.mutate(undefined)}>
            Save
          </Button>
        </div>
      </div>

      <div className="grid gap-5 p-6">
        {statusMsg ? (
          <div className="whitespace-pre-wrap rounded-md border border-ui-border-base bg-ui-bg-subtle p-3">
            <Text size="small" className="text-ui-fg-muted">
              {statusMsg}
            </Text>
          </div>
        ) : null}

        <section className="rounded-md border border-ui-border-base p-5">
          <Heading level="h2" className="mb-4">
            Basics
          </Heading>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1">
              <Label htmlFor="merch-event-name" className="text-xs">
                Name
              </Label>
              <Input
                id="merch-event-name"
                size="small"
                value={draft.name}
                disabled={busy}
                onChange={(event) => {
                  const name = event.target.value
                  update({ name, slug: mode === "create" && !draft.slug ? slugify(name) : draft.slug })
                }}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="merch-event-slug" className="text-xs">
                Slug
              </Label>
              <Input
                id="merch-event-slug"
                size="small"
                value={draft.slug}
                disabled={busy || mode === "edit"}
                onChange={(event) => update({ slug: slugify(event.target.value) })}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="merch-event-type" className="text-xs">
                Type
              </Label>
              <Select size="small" value={draft.type} onValueChange={(value) => update({ type: value })}>
                <Select.Trigger id="merch-event-type">
                  <Select.Value placeholder="Type" />
                </Select.Trigger>
                <Select.Content>
                  {MERCH_EVENT_TYPES.map((value) => (
                    <Select.Item key={value} value={value}>
                      {value}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="merch-event-status" className="text-xs">
                Status
              </Label>
              <Select size="small" value={draft.status} onValueChange={(value) => update({ status: value as MerchEventStatus })}>
                <Select.Trigger id="merch-event-status">
                  <Select.Value placeholder="Status" />
                </Select.Trigger>
                <Select.Content>
                  {MERCH_EVENT_STATUSES.map((value) => (
                    <Select.Item key={value} value={value}>
                      {value}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="merch-event-sort" className="text-xs">
                Sort order
              </Label>
              <Input
                id="merch-event-sort"
                type="number"
                size="small"
                value={draft.sortOrder}
                disabled={busy}
                onChange={(event) => update({ sortOrder: Number(event.target.value || 0) })}
              />
            </div>
            <label className="flex items-end gap-2 text-sm text-ui-fg-base">
              <input
                type="checkbox"
                checked={draft.active}
                disabled={busy}
                onChange={(event) => update({ active: event.target.checked })}
                className="mb-2 accent-ui-fg-interactive"
              />
              Active
            </label>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {MERCH_EVENT_STATUSES.map((status) => (
              <Button
                key={status}
                type="button"
                size="small"
                variant={draft.status === status ? "primary" : "secondary"}
                disabled={busy}
                onClick={() => {
                  update({ status })
                  saveMutation.mutate(status)
                }}
              >
                {status}
              </Button>
            ))}
          </div>
        </section>

        <section className="rounded-md border border-ui-border-base p-5">
          <Heading level="h2" className="mb-4">
            Content
          </Heading>
          <div className="grid gap-4">
            <div className="flex flex-col gap-1">
              <Label htmlFor="merch-event-teaser" className="text-xs">
                Teaser
              </Label>
              <Input
                id="merch-event-teaser"
                size="small"
                value={draft.teaser}
                disabled={busy}
                onChange={(event) => update({ teaser: event.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="merch-event-body" className="text-xs">
                Body
              </Label>
              <Textarea
                id="merch-event-body"
                value={draft.body}
                disabled={busy}
                onChange={(event) => update({ body: event.target.value })}
              />
            </div>
          </div>
        </section>

        <section className="rounded-md border border-ui-border-base p-5">
          <Heading level="h2" className="mb-4">
            Schedule And Links
          </Heading>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1">
              <Label htmlFor="merch-event-starts" className="text-xs">
                Starts at
              </Label>
              <Input
                id="merch-event-starts"
                type="datetime-local"
                size="small"
                value={toDateTimeLocal(draft.startsAt)}
                disabled={busy}
                onChange={(event) => update({ startsAt: fromDateTimeLocal(event.target.value) })}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="merch-event-ends" className="text-xs">
                Ends at
              </Label>
              <Input
                id="merch-event-ends"
                type="datetime-local"
                size="small"
                value={toDateTimeLocal(draft.endsAt)}
                disabled={busy}
                onChange={(event) => update({ endsAt: fromDateTimeLocal(event.target.value) })}
              />
            </div>
            <div className="flex flex-col gap-1 md:col-span-2">
              <Label htmlFor="merch-event-occasion" className="text-xs">
                Occasion
              </Label>
              <Select
                size="small"
                value={draft.occasionSlug || none}
                onValueChange={(value) => update({ occasionSlug: value === none ? null : value })}
              >
                <Select.Trigger id="merch-event-occasion">
                  <Select.Value placeholder="No occasion" />
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value={none}>No occasion</Select.Item>
                  {occasionOptions.map((occasion) => (
                    <Select.Item key={occasion.slug} value={occasion.slug}>
                      {occasion.name}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label className="mb-1 block text-xs">Product handles</Label>
              <ChipInput
                values={draft.productHandles}
                placeholder="quiet-revolt, launch-week-tee"
                onChange={(productHandles) => update({ productHandles })}
              />
            </div>
          </div>
        </section>

        <section className="rounded-md border border-ui-border-base p-5">
          <Heading level="h2" className="mb-4">
            Images
          </Heading>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1">
              <Label htmlFor="merch-hero-src" className="text-xs">
                Hero image URL
              </Label>
              <Input
                id="merch-hero-src"
                size="small"
                value={stringValue(draft.heroImageSrc)}
                disabled={busy}
                onChange={(event) => update({ heroImageSrc: event.target.value || null })}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="merch-hero-alt" className="text-xs">
                Hero alt
              </Label>
              <Input
                id="merch-hero-alt"
                size="small"
                value={stringValue(draft.heroImageAlt)}
                disabled={busy}
                onChange={(event) => update({ heroImageAlt: event.target.value || null })}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="merch-card-src" className="text-xs">
                Card image URL
              </Label>
              <Input
                id="merch-card-src"
                size="small"
                value={stringValue(draft.cardImageSrc)}
                disabled={busy}
                onChange={(event) => update({ cardImageSrc: event.target.value || null })}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="merch-card-alt" className="text-xs">
                Card alt
              </Label>
              <Input
                id="merch-card-alt"
                size="small"
                value={stringValue(draft.cardImageAlt)}
                disabled={busy}
                onChange={(event) => update({ cardImageAlt: event.target.value || null })}
              />
            </div>
          </div>
        </section>

        <section className="rounded-md border border-ui-border-base p-5">
          <Heading level="h2" className="mb-4">
            SEO
          </Heading>
          <div className="grid gap-4">
            <div className="flex flex-col gap-1">
              <Label htmlFor="merch-seo-title" className="text-xs">
                SEO title
              </Label>
              <Input
                id="merch-seo-title"
                size="small"
                value={stringValue(draft.seoTitle)}
                disabled={busy}
                onChange={(event) => update({ seoTitle: event.target.value || null })}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="merch-seo-description" className="text-xs">
                SEO description
              </Label>
              <Textarea
                id="merch-seo-description"
                value={stringValue(draft.seoDescription)}
                disabled={busy}
                onChange={(event) => update({ seoDescription: event.target.value || null })}
              />
            </div>
          </div>
        </section>
      </div>
    </Container>
  )
}
