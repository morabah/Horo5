import { defineRouteConfig } from "@medusajs/admin-sdk"
import { SquareTwoStack } from "@medusajs/icons"
import { Badge, Button, Container, Heading, Select, Table, Text, toast } from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useMemo, useState } from "react"

import { SectionEditor } from "../../components/homepage-sections/SectionEditor"
import { SectionTypeBadge } from "../../components/homepage-sections/SectionTypeBadge"
import { sdk } from "../../lib/sdk"
import {
  HOMEPAGE_SECTION_TYPES,
  type AdminHomepageSection,
} from "../../../lib/homepage-sections/types"

type HomepageSectionsResponse = {
  sections: AdminHomepageSection[]
}

const none = "__none__"

function emptySection(sortOrder: number): AdminHomepageSection {
  return {
    id: "",
    key: "",
    type: "hero",
    eyebrowEn: null,
    eyebrowAr: null,
    titleEn: null,
    titleAr: null,
    bodyEn: null,
    bodyAr: null,
    primaryCtaLabelEn: null,
    primaryCtaLabelAr: null,
    primaryCtaHref: null,
    secondaryCtaLabelEn: null,
    secondaryCtaLabelAr: null,
    secondaryCtaHref: null,
    imageSrc: null,
    imageAltEn: null,
    imageAltAr: null,
    accent: null,
    sortOrder,
    active: true,
    payload: null,
  }
}

function payloadFromSection(section: AdminHomepageSection) {
  return {
    key: section.key,
    type: section.type,
    eyebrow_en: section.eyebrowEn,
    eyebrow_ar: section.eyebrowAr,
    title_en: section.titleEn,
    title_ar: section.titleAr,
    body_en: section.bodyEn,
    body_ar: section.bodyAr,
    primary_cta_label_en: section.primaryCtaLabelEn,
    primary_cta_label_ar: section.primaryCtaLabelAr,
    primary_cta_href: section.primaryCtaHref,
    secondary_cta_label_en: section.secondaryCtaLabelEn,
    secondary_cta_label_ar: section.secondaryCtaLabelAr,
    secondary_cta_href: section.secondaryCtaHref,
    image_src: section.imageSrc,
    image_alt_en: section.imageAltEn,
    image_alt_ar: section.imageAltAr,
    accent: section.accent,
    sort_order: section.sortOrder,
    active: section.active,
    payload: section.payload,
  }
}

async function fetchHomepageSections(params: Record<string, string | undefined>) {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value)
  }
  return sdk.client.fetch<HomepageSectionsResponse>(`/admin/custom/homepage-sections?${search.toString()}`, {
    method: "GET",
  })
}

async function saveHomepageSection(section: AdminHomepageSection) {
  if (section.id) {
    return sdk.client.fetch<{ section: AdminHomepageSection }>(
      `/admin/custom/homepage-sections/${encodeURIComponent(section.id)}`,
      {
        method: "PATCH",
        body: payloadFromSection(section),
      },
    )
  }
  return sdk.client.fetch<{ section: AdminHomepageSection }>("/admin/custom/homepage-sections", {
    method: "POST",
    body: payloadFromSection(section),
  })
}

async function archiveHomepageSection(section: AdminHomepageSection) {
  return sdk.client.fetch(`/admin/custom/homepage-sections/${encodeURIComponent(section.id)}`, {
    method: "DELETE",
  })
}

async function reorderSections(sections: AdminHomepageSection[]) {
  return sdk.client.fetch<{ updated: number }>("/admin/custom/homepage-sections/reorder", {
    method: "POST",
    body: {
      items: sections.map((section, index) => ({
        id: section.id,
        sort_order: index * 10,
      })),
    },
  })
}

function errorMessage(error: unknown) {
  const err = error as any
  const issues = err?.response?.data?.issues || err?.body?.issues || err?.issues
  if (issues && Array.isArray(issues) && issues.length > 0) {
    return issues.map((issue: any) => `${issue.field}: ${issue.message}`).join("\n")
  }
  return err?.response?.data?.message || err?.body?.message || err?.message || "Request failed."
}

export default function HomepageSectionsPage() {
  const queryClient = useQueryClient()
  const [type, setType] = useState<string | undefined>()
  const [active, setActive] = useState<string | undefined>()
  const [sections, setSections] = useState<AdminHomepageSection[]>([])
  const [selected, setSelected] = useState<AdminHomepageSection | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)

  const params = useMemo(() => ({ type, active }), [active, type])
  const query = useQuery({
    queryKey: ["horo", "homepage-sections", "list", params],
    queryFn: () => fetchHomepageSections(params),
    staleTime: 30_000,
  })

  useEffect(() => {
    if (query.data?.sections) {
      setSections(query.data.sections)
    }
  }, [query.data?.sections])

  const saveMutation = useMutation({
    mutationFn: saveHomepageSection,
    onSuccess: async (result) => {
      toast.success("Homepage section saved.")
      setSelected(result.section)
      await queryClient.invalidateQueries({ queryKey: ["horo", "homepage-sections"] })
    },
    onError: (error) => toast.error("Save failed.", { description: errorMessage(error) }),
  })

  const archiveMutation = useMutation({
    mutationFn: archiveHomepageSection,
    onSuccess: async () => {
      toast.success("Homepage section archived.")
      setSelected(null)
      await queryClient.invalidateQueries({ queryKey: ["horo", "homepage-sections"] })
    },
    onError: (error) => toast.error("Archive failed.", { description: errorMessage(error) }),
  })

  const reorderMutation = useMutation({
    mutationFn: reorderSections,
    onSuccess: async () => {
      toast.success("Homepage order saved.")
      await queryClient.invalidateQueries({ queryKey: ["horo", "homepage-sections"] })
    },
    onError: (error) => toast.error("Reorder failed.", { description: errorMessage(error) }),
  })

  const toggleActive = (section: AdminHomepageSection) => {
    saveMutation.mutate({ ...section, active: !section.active })
  }

  const onDropSection = (targetId: string) => {
    if (!draggingId || draggingId === targetId) return
    const current = [...sections]
    const from = current.findIndex((section) => section.id === draggingId)
    const to = current.findIndex((section) => section.id === targetId)
    if (from < 0 || to < 0) return
    const [moved] = current.splice(from, 1)
    current.splice(to, 0, moved)
    const reordered = current.map((section, index) => ({ ...section, sortOrder: index * 10 }))
    setSections(reordered)
    setDraggingId(null)
    reorderMutation.mutate(reordered)
  }

  const nextSortOrder = sections.length ? Math.max(...sections.map((section) => section.sortOrder)) + 10 : 0
  const busy = saveMutation.isPending || archiveMutation.isPending || reorderMutation.isPending

  return (
    <Container className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Heading level="h1">Homepage</Heading>
            <Badge size="small" color="blue">
              sections
            </Badge>
          </div>
          <Text size="small" className="mt-1 max-w-3xl text-ui-fg-subtle">
            Manage ordered storefront homepage sections, bilingual copy, CTAs, imagery, and JSON payloads.
          </Text>
        </div>
        <Button type="button" size="small" onClick={() => setSelected(emptySection(nextSortOrder))}>
          New Section
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Select size="small" value={type || none} onValueChange={(next) => setType(next === none ? undefined : next)}>
          <Select.Trigger className="w-48">
            <Select.Value placeholder="All types" />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value={none}>All types</Select.Item>
            {HOMEPAGE_SECTION_TYPES.map((sectionType) => (
              <Select.Item key={sectionType} value={sectionType}>
                {sectionType.replace(/_/g, " ")}
              </Select.Item>
            ))}
          </Select.Content>
        </Select>
        <Select size="small" value={active || none} onValueChange={(next) => setActive(next === none ? undefined : next)}>
          <Select.Trigger className="w-44">
            <Select.Value placeholder="All states" />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value={none}>All states</Select.Item>
            <Select.Item value="true">Active only</Select.Item>
            <Select.Item value="false">Inactive only</Select.Item>
          </Select.Content>
        </Select>
      </div>

      <div className="grid gap-5">
        <div className="overflow-hidden rounded-md border border-ui-border-base">
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Section</Table.HeaderCell>
                <Table.HeaderCell>Type</Table.HeaderCell>
                <Table.HeaderCell>Sort</Table.HeaderCell>
                <Table.HeaderCell>Active</Table.HeaderCell>
                <Table.HeaderCell className="text-right">Actions</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {query.isLoading ? (
                <Table.Row>
                  <td colSpan={5} className="py-8 text-center text-ui-fg-muted">
                    Loading homepage sections...
                  </td>
                </Table.Row>
              ) : sections.length ? (
                sections.map((section) => (
                  <Table.Row
                    key={section.id}
                    draggable={Boolean(section.id)}
                    onDragStart={() => setDraggingId(section.id)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => onDropSection(section.id)}
                    className="cursor-move"
                  >
                    <Table.Cell>
                      <div className="min-w-0">
                        <Text size="small" weight="plus" className="truncate">
                          {section.titleEn || section.titleAr || section.key}
                        </Text>
                        <Text size="xsmall" className="font-mono text-ui-fg-muted">
                          {section.key}
                        </Text>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <SectionTypeBadge type={section.type} />
                    </Table.Cell>
                    <Table.Cell>{section.sortOrder}</Table.Cell>
                    <Table.Cell>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => toggleActive(section)}
                        className="text-left"
                      >
                        <Badge size="small" color={section.active ? "green" : "grey"}>
                          {section.active ? "active" : "inactive"}
                        </Badge>
                      </button>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex justify-end gap-2">
                        <Button type="button" size="small" variant="secondary" onClick={() => setSelected(section)}>
                          Edit
                        </Button>
                        <Button
                          type="button"
                          size="small"
                          variant="secondary"
                          disabled={busy}
                          onClick={() => {
                            if (window.confirm(`Archive "${section.key}"?`)) archiveMutation.mutate(section)
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
                  <td colSpan={5} className="py-8 text-center text-ui-fg-muted">
                    No homepage sections match these filters.
                  </td>
                </Table.Row>
              )}
            </Table.Body>
          </Table>
        </div>

        {selected ? (
          <section className="rounded-md border border-ui-border-base p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <Heading level="h2">{selected.id ? `Edit ${selected.key}` : "New Section"}</Heading>
                <Text size="small" className="mt-1 text-ui-fg-muted">
                  Drag rows in the table to update sort order.
                </Text>
              </div>
              <div className="flex gap-2">
                <Button type="button" size="small" variant="secondary" disabled={busy} onClick={() => setSelected(null)}>
                  Close
                </Button>
                <Button
                  type="button"
                  size="small"
                  disabled={busy}
                  isLoading={saveMutation.isPending}
                  onClick={() => saveMutation.mutate(selected)}
                >
                  Save
                </Button>
              </div>
            </div>
            <SectionEditor
              value={selected}
              isNew={!selected.id}
              disabled={busy}
              onChange={setSelected}
            />
          </section>
        ) : null}
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Homepage",
  rank: 50,
  icon: SquareTwoStack,
})
