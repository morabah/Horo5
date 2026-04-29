import { ArrowLeftMini, ArrowUpRightMini, Eye, LockClosedSolidMini, LockOpenSolid, PlusMini } from "@medusajs/icons"
import {
  Badge,
  Button,
  Container,
  Heading,
  Input,
  Select,
  Text,
  Textarea,
  Tooltip,
} from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useMemo, useState } from "react"
import { Link, unstable_usePrompt, useNavigate } from "react-router-dom"

import { createArtist, createOccasion, fetchDropLookups, saveDrop } from "./api"
import { ChipInput } from "./ChipInput"
import { Dropzone } from "./Dropzone"
import { Field } from "./Field"
import { ImageCard } from "./ImageCard"
import { ArtistPicker, OccasionPicker } from "./LookupCreateFields"
import { ProductHandlePicker } from "./ProductHandlePicker"
import { StockBySizeTable } from "./StockBySizeTable"
import type { DropImage, DropPayload, ProductSizeKey, ValidationIssue } from "./types"
import {
  emptyDrop,
  formatDateTimeLocal,
  issueFor,
  parseDateTimeLocal,
  slugifyDropTitle,
  validationIssues,
} from "./utils"

type DropFormProps = {
  initialDrop?: DropPayload
  mode: "create" | "edit"
}

const none = "__none__"
const sizeOptions: ProductSizeKey[] = ["S", "M", "L", "XL", "XXL"]
const colorOptions = ["Black", "White", "Off-white", "Grey", "Navy", "Olive", "Burgundy"]

function toNumber(value: string): number | undefined {
  if (!value.trim()) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.floor(parsed) : undefined
}

function normalizeServerIssues(error: unknown): ValidationIssue[] {
  const body = error as { body?: { issues?: ValidationIssue[] }; issues?: ValidationIssue[] }
  return body.body?.issues ?? body.issues ?? []
}

function SelectField({
  value,
  onChange,
  options,
  placeholder,
}: {
  value?: string
  onChange: (value?: string) => void
  options: Array<{ value: string; label: string }>
  placeholder?: string
}) {
  return (
    <Select size="small" value={value || none} onValueChange={(next) => onChange(next === none ? undefined : next)}>
      <Select.Trigger>
        <Select.Value placeholder={placeholder} />
      </Select.Trigger>
      <Select.Content>
        <Select.Item value={none}>{placeholder || "None"}</Select.Item>
        {options.map((option) => (
          <Select.Item key={option.value} value={option.value}>
            {option.label}
          </Select.Item>
        ))}
      </Select.Content>
    </Select>
  )
}

export function DropForm({ initialDrop, mode }: DropFormProps) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [drop, setDrop] = useState<DropPayload>(() => initialDrop ?? emptyDrop())
  const [handleLocked, setHandleLocked] = useState(Boolean(initialDrop?.handle))
  const [dirty, setDirty] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(initialDrop?.updatedAt ?? null)
  const [serverIssues, setServerIssues] = useState<ValidationIssue[]>([])
  const [statusMsg, setStatusMsg] = useState<string | null>(null)
  const [draggingImageIndex, setDraggingImageIndex] = useState<number | null>(null)

  const { data: lookups } = useQuery({
    queryKey: ["horo", "drops", "lookups"],
    queryFn: fetchDropLookups,
    staleTime: 60_000,
  })

  useEffect(() => {
    setDrop(initialDrop ?? emptyDrop())
    setHandleLocked(Boolean(initialDrop?.handle))
    setDirty(false)
    setLastSavedAt(initialDrop?.updatedAt ?? null)
  }, [initialDrop])

  useEffect(() => {
    if (!dirty) return
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ""
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [dirty])

  const update = (patch: Partial<DropPayload>) => {
    setDrop((prev) => ({ ...prev, ...patch }))
    setDirty(true)
    setServerIssues([])
  }

  const issues = useMemo(() => [...validationIssues(drop), ...serverIssues], [drop, serverIssues])
  const publishIssues = useMemo(() => validationIssues(drop, "published"), [drop])
  const subfeelings = useMemo(() => {
    return (lookups?.subfeelings ?? []).filter((item) => !drop.feeling || item.feelingSlug === drop.feeling)
  }, [drop.feeling, lookups?.subfeelings])

  const mutation = useMutation({
    mutationFn: async (status: DropPayload["status"]) => saveDrop({ ...drop, status }, initialDrop?.handle),
    onSuccess: async (_data, status) => {
      await queryClient.invalidateQueries({ queryKey: ["horo", "drops"] })
      setDirty(false)
      setLastSavedAt(new Date().toISOString())
      setStatusMsg(status === "published" ? "Published." : status === "archived" ? "Archived." : "Saved.")
      if (mode === "create" && drop.handle) {
        navigate(`/drops/${drop.handle}`)
      } else if (mode === "edit" && initialDrop?.handle && drop.handle !== initialDrop.handle) {
        navigate(`/drops/${drop.handle}`, { replace: true })
      } else {
        setDrop((prev) => ({ ...prev, status }))
      }
    },
    onError: (error) => {
      const normalized = normalizeServerIssues(error)
      setServerIssues(normalized)
      setStatusMsg(normalized.length ? "Fix the highlighted fields." : error instanceof Error ? error.message : "Save failed.")
    },
  })

  unstable_usePrompt({
    when: dirty && !mutation.isPending,
    message: "You have unsaved changes. Leave this page?",
  })

  const setImages = (images: DropImage[]) => {
    let sawMain = false
    update({
      images: images.map((image, index) => {
        if (image.tag === "main") {
          if (sawMain) {
            return { ...image, tag: "lifestyle", order: index }
          }
          sawMain = true
        }
        return { ...image, order: index }
      }),
    })
  }

  const onImageChange = (index: number, image: DropImage) => {
    const next = [...(drop.images ?? [])]
    next[index] = image
    if (image.tag === "main") {
      for (let i = 0; i < next.length; i++) {
        if (i !== index && next[i].tag === "main") next[i] = { ...next[i], tag: "lifestyle" }
      }
    }
    setImages(next)
  }

  const onMoveImage = (index: number, direction: -1 | 1) => {
    const next = [...(drop.images ?? [])]
    const target = index + direction
    if (target < 0 || target >= next.length) return
    const [item] = next.splice(index, 1)
    next.splice(target, 0, item)
    setImages(next)
  }

  const onDropImage = (targetIndex: number) => {
    if (draggingImageIndex === null || draggingImageIndex === targetIndex) return
    const next = [...(drop.images ?? [])]
    const [item] = next.splice(draggingImageIndex, 1)
    next.splice(targetIndex, 0, item)
    setDraggingImageIndex(null)
    setImages(next)
  }

  const onSizeToggle = (size: ProductSizeKey) => {
    const current = drop.sizes ?? []
    const sizes = current.includes(size) ? current.filter((item) => item !== size) : [...current, size]
    const stock = { ...(drop.stockPerSize ?? {}) }
    if (!stock[size]) stock[size] = 0
    update({ sizes, stockPerSize: stock })
  }

  const previewHref = `${import.meta.env.VITE_STOREFRONT_URL || ""}/products/${drop.handle}${drop.status === "published" ? "" : "?preview=1"}`

  return (
    <Container className="mx-auto max-w-6xl p-0">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-ui-border-base bg-ui-bg-base px-6 py-4">
        <div className="flex items-center gap-3">
          <Button asChild size="small" variant="transparent">
            <Link to="/drops">
              <ArrowLeftMini />
              Drops
            </Link>
          </Button>
          <div>
            <Heading level="h1">{mode === "create" ? "New Drop" : drop.title || drop.handle}</Heading>
            {lastSavedAt ? (
              <Text size="xsmall" className="text-ui-fg-muted">
                Last saved {new Date(lastSavedAt).toLocaleString()}
              </Text>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {drop.handle ? (
            <Button asChild size="small" variant="secondary">
              <a href={previewHref} target="_blank" rel="noreferrer">
                <Eye />
                Preview
              </a>
            </Button>
          ) : null}
          <Button size="small" variant="secondary" type="button" disabled={mutation.isPending} onClick={() => mutation.mutate("draft")}>
            Save draft
          </Button>
          <Button asChild size="small" variant="secondary">
            <Link to="/drops">Cancel</Link>
          </Button>
          <Tooltip
            content={publishIssues.length ? publishIssues.map((issue) => issue.message).join(" ") : "Ready"}
          >
            <span>
              <Button
                size="small"
                type="button"
                disabled={mutation.isPending || publishIssues.length > 0}
                isLoading={mutation.isPending}
                onClick={() => mutation.mutate("published")}
              >
                Publish
              </Button>
            </span>
          </Tooltip>
        </div>
      </div>

      {statusMsg ? (
        <div className="border-b border-ui-border-base px-6 py-3">
          <Text size="small" className="text-ui-fg-muted">
            {statusMsg}
          </Text>
        </div>
      ) : null}

      <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-6">
          <section className="rounded-md border border-ui-border-base p-5">
            <Heading level="h2" className="mb-4">
              Identity
            </Heading>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Title" htmlFor="drop-title" error={issueFor(issues, "title")}>
                <Input
                  id="drop-title"
                  size="small"
                  value={drop.title}
                  onChange={(event) => {
                    const title = event.target.value
                    update({
                      title,
                      ...(handleLocked ? {} : { handle: slugifyDropTitle(title) }),
                    })
                  }}
                />
              </Field>
              <Field label="Handle" htmlFor="drop-handle" error={issueFor(issues, "handle")}>
                <div className="flex gap-2">
                  <Input
                    id="drop-handle"
                    size="small"
                    value={drop.handle}
                    disabled={handleLocked}
                    onChange={(event) => update({ handle: slugifyDropTitle(event.target.value) })}
                  />
                  <Button type="button" size="small" variant="secondary" onClick={() => setHandleLocked((prev) => !prev)}>
                    {handleLocked ? <LockClosedSolidMini /> : <LockOpenSolid />}
                  </Button>
                </div>
              </Field>
              <Field label="Status">
                <SelectField
                  value={drop.status}
                  onChange={(status) => update({ status: (status || "draft") as DropPayload["status"] })}
                  options={[
                    { value: "draft", label: "Draft" },
                    { value: "published", label: "Published" },
                    { value: "archived", label: "Archived" },
                  ]}
                />
              </Field>
            </div>
          </section>

          <section className="rounded-md border border-ui-border-base p-5">
            <Heading level="h2" className="mb-4">
              Story
            </Heading>
            <div className="grid gap-4">
              <Field label="Story" htmlFor="drop-story" error={issueFor(issues, "story")}>
                <Textarea
                  id="drop-story"
                  value={drop.story || ""}
                  rows={3}
                  onChange={(event) => update({ story: event.target.value })}
                />
              </Field>
              <Field label="Description" htmlFor="drop-description">
                <Textarea
                  id="drop-description"
                  value={drop.description || ""}
                  rows={6}
                  onChange={(event) => update({ description: event.target.value })}
                />
              </Field>
            </div>
          </section>

          <section className="rounded-md border border-ui-border-base p-5">
            <Heading level="h2" className="mb-4">
              Classification
            </Heading>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Feeling" error={issueFor(issues, "feeling")}>
                <SelectField
                  value={drop.feeling}
                  onChange={(feeling) => update({ feeling, subfeeling: undefined })}
                  placeholder="Select feeling"
                  options={(lookups?.feelings ?? []).map((item) => ({ value: item.slug, label: item.name }))}
                />
              </Field>
              <Field label="Subfeeling" error={issueFor(issues, "subfeeling")}>
                <SelectField
                  value={drop.subfeeling}
                  onChange={(subfeeling) => update({ subfeeling })}
                  placeholder="Select subfeeling"
                  options={subfeelings.map((item) => ({ value: item.slug, label: item.name }))}
                />
              </Field>
              <Field label="Occasions">
                <OccasionPicker
                  values={drop.occasions ?? []}
                  options={(lookups?.occasions ?? []).map((item) => ({ slug: item.slug, name: item.name }))}
                  onChange={(occasions) => update({ occasions })}
                  onError={setStatusMsg}
                  onCreate={async (slug, name) => {
                    await createOccasion(slug, name)
                    await queryClient.invalidateQueries({ queryKey: ["horo", "drops", "lookups"] })
                    setStatusMsg(`Created occasion ${slug}.`)
                  }}
                />
              </Field>
              <Field label="Apparel category">
                <SelectField
                  value={drop.apparelCategory}
                  onChange={(apparelCategory) => update({ apparelCategory })}
                  placeholder="Select category"
                  options={(lookups?.apparelCategories ?? []).map((item) => ({
                    value: item.path,
                    label: `${"  ".repeat(Math.max(0, item.depth))}${item.name}`,
                  }))}
                />
              </Field>
              <Field label="Artist">
                <ArtistPicker
                  value={drop.artist}
                  options={(lookups?.artists ?? []).map((item) => ({ slug: item.slug, name: item.name }))}
                  onChange={(artist) => update({ artist })}
                  onError={setStatusMsg}
                  onCreate={async (slug, name) => {
                    await createArtist(slug, name)
                    await queryClient.invalidateQueries({ queryKey: ["horo", "drops", "lookups"] })
                    setStatusMsg(`Created artist ${slug}.`)
                  }}
                />
              </Field>
              <Field label="Decoration">
                <SelectField
                  value={drop.decorationType}
                  onChange={(decorationType) => update({ decorationType: decorationType as DropPayload["decorationType"] })}
                  options={(lookups?.decorationTypes ?? ["graphic"]).map((value) => ({ value, label: value }))}
                />
              </Field>
              <Field label="Fit label">
                <SelectField
                  value={drop.fitLabel}
                  onChange={(fitLabel) => update({ fitLabel })}
                  placeholder="Select fit"
                  options={(lookups?.fitLabels ?? []).map((value) => ({ value, label: value }))}
                />
              </Field>
              <Field label="Size table">
                <SelectField
                  value={drop.sizeTableKey}
                  onChange={(sizeTableKey) => update({ sizeTableKey })}
                  placeholder="Select size table"
                  options={(lookups?.sizeTables ?? []).map((value) => ({ value, label: value }))}
                />
              </Field>
            </div>
          </section>

          <section className="rounded-md border border-ui-border-base p-5">
            <Heading level="h2" className="mb-4">
              Commerce
            </Heading>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Price EGP" htmlFor="drop-price" error={issueFor(issues, "priceEgp")}>
                <Input
                  id="drop-price"
                  size="small"
                  type="number"
                  min={1}
                  value={drop.priceEgp ?? ""}
                  onChange={(event) => update({ priceEgp: toNumber(event.target.value) })}
                />
              </Field>
              <Field label="Original price EGP" htmlFor="drop-original-price">
                <Input
                  id="drop-original-price"
                  size="small"
                  type="number"
                  min={1}
                  value={drop.originalPriceEgp ?? ""}
                  onChange={(event) => update({ originalPriceEgp: toNumber(event.target.value) ?? null })}
                />
              </Field>
              <Field label="Sizes">
                <div className="flex flex-wrap gap-2">
                  {sizeOptions.map((size) => (
                    <Button
                      key={size}
                      type="button"
                      size="small"
                      variant={(drop.sizes ?? []).includes(size) ? "primary" : "secondary"}
                      onClick={() => onSizeToggle(size)}
                    >
                      {size}
                    </Button>
                  ))}
                </div>
              </Field>
              <Field label="Garment color">
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`rounded-md border px-3 py-1.5 text-sm ${
                        drop.garmentColor === color ? "border-ui-border-interactive bg-ui-bg-interactive text-ui-fg-on-color" : "border-ui-border-base"
                      }`}
                      onClick={() => update({ garmentColor: color })}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </Field>
              <div className="md:col-span-2">
                <Field label="Stock per size">
                  <StockBySizeTable
                    sizes={drop.sizes ?? []}
                    stockPerSize={drop.stockPerSize ?? {}}
                    onChange={(stockPerSize) => update({ stockPerSize })}
                  />
                </Field>
              </div>
            </div>
          </section>

          <section className="rounded-md border border-ui-border-base p-5">
            <Heading level="h2" className="mb-4">
              Media
            </Heading>
            <Dropzone
              busy={mutation.isPending}
              existingCount={drop.images?.length ?? 0}
              onError={setStatusMsg}
              onUploaded={(images) => {
                const existing = drop.images ?? []
                setImages([...existing, ...images.map((image, index) => ({ ...image, order: existing.length + index }))])
              }}
            />
            {issueFor(issues, "images") ? (
              <Text size="small" className="mt-3 text-ui-fg-error">
                {issueFor(issues, "images")}
              </Text>
            ) : null}
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {(drop.images ?? []).map((image, index) => (
                <ImageCard
                  key={`${image.url}-${index}`}
                  image={image}
                  index={index}
                  canMoveUp={index > 0}
                  canMoveDown={index < (drop.images?.length ?? 0) - 1}
                  onChange={(next) => onImageChange(index, next)}
                  onMove={(direction) => onMoveImage(index, direction)}
                  onDelete={() => setImages((drop.images ?? []).filter((_item, itemIndex) => itemIndex !== index))}
                  onDragStart={() => setDraggingImageIndex(index)}
                  onDragEnd={() => setDraggingImageIndex(null)}
                  onDropOn={() => onDropImage(index)}
                />
              ))}
            </div>
          </section>

          <section className="rounded-md border border-ui-border-base p-5">
            <Heading level="h2" className="mb-4">
              Cross-sell
            </Heading>
            <div className="grid gap-4 md:grid-cols-2">
              {([
                ["Capsules", "capsuleSlugs"],
                ["Complementary", "complementarySlugs"],
                ["Frequently bought", "frequentlyBoughtWithSlugs"],
                ["Also bought", "customersAlsoBoughtSlugs"],
              ] as const).map(([label, key]) => (
                <Field key={key} label={label}>
                  <ProductHandlePicker values={drop[key] ?? []} onChange={(values) => update({ [key]: values })} />
                </Field>
              ))}
              <Field label="Trust badges">
                <ChipInput values={drop.trustBadges ?? []} onChange={(trustBadges) => update({ trustBadges })} placeholder="badge" />
              </Field>
              <Field label="Merchandising badge">
                <Input
                  size="small"
                  value={drop.merchandisingBadge ?? ""}
                  onChange={(event) => update({ merchandisingBadge: event.target.value })}
                />
              </Field>
              <Field label="Stock note">
                <Input size="small" value={drop.stockNote ?? ""} onChange={(event) => update({ stockNote: event.target.value })} />
              </Field>
            </div>
          </section>

          <section className="rounded-md border border-ui-border-base p-5">
            <Heading level="h2" className="mb-4">
              Lifecycle
            </Heading>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Launch at">
                <Input
                  size="small"
                  type="datetime-local"
                  value={formatDateTimeLocal(drop.launchAt)}
                  onChange={(event) => update({ launchAt: parseDateTimeLocal(event.target.value) })}
                />
              </Field>
              <Field label="Sunset at">
                <Input
                  size="small"
                  type="datetime-local"
                  value={formatDateTimeLocal(drop.sunsetAt)}
                  onChange={(event) => update({ sunsetAt: parseDateTimeLocal(event.target.value) })}
                />
              </Field>
            </div>
          </section>
        </div>

        <aside className="flex flex-col gap-4">
          <div className="rounded-md border border-ui-border-base p-4">
            <Heading level="h2" className="mb-3">
              Publish state
            </Heading>
            <div className="flex flex-col gap-2">
              <Badge color={drop.status === "published" ? "green" : drop.status === "archived" ? "orange" : "grey"}>
                {drop.status}
              </Badge>
              {publishIssues.length ? (
                <div className="rounded-md bg-ui-bg-subtle p-3">
                  {publishIssues.map((issue) => (
                    <Text key={`${issue.field}-${issue.message}`} size="xsmall" className="text-ui-fg-muted">
                      {issue.message}
                    </Text>
                  ))}
                </div>
              ) : (
                <Text size="small" className="text-ui-fg-muted">
                  Ready to publish.
                </Text>
              )}
            </div>
          </div>
          <div className="rounded-md border border-ui-border-base p-4">
            <Heading level="h2" className="mb-3">
              Quick actions
            </Heading>
            <div className="flex flex-col gap-2">
              <Button type="button" size="small" variant="secondary" onClick={() => mutation.mutate("archived")}>
                Archive
              </Button>
              <Button asChild size="small" variant="secondary">
                <Link to="/drops">Cancel</Link>
              </Button>
              <Button asChild size="small" variant="secondary">
                <Link to="/drops/new">
                  <PlusMini />
                  New Drop
                </Link>
              </Button>
              {drop.handle ? (
                <Button asChild size="small" variant="secondary">
                  <a href={previewHref} target="_blank" rel="noreferrer">
                    <ArrowUpRightMini />
                    PDP preview
                  </a>
                </Button>
              ) : null}
            </div>
          </div>
        </aside>
      </div>
    </Container>
  )
}
