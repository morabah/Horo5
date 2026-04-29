import { ArrowLeftMini, ArrowUpTray, CheckCircle, XCircle } from "@medusajs/icons"
import { Badge, Button, Container, Heading, Input, Select, Text } from "@medusajs/ui"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useMemo, useRef, useState } from "react"
import { Link } from "react-router-dom"

import { fetchDropLookups, saveDrop, uploadDropFiles } from "../../../components/drops/api"
import type { DropImage, DropPayload, ProductSizeKey } from "../../../components/drops/types"
import { tagForFilename, slugifyDropTitle } from "../../../components/drops/utils"

type BulkGroup = {
  id: string
  title: string
  handle: string
  files: File[]
  previews: string[]
  priceEgp?: number
  feeling?: string
  subfeeling?: string
  sizes: ProductSizeKey[]
  stockPerSize: Partial<Record<ProductSizeKey, number>>
  status: "idle" | "valid" | "error" | "publishing" | "published"
  message?: string
}

const none = "__none__"
const sizeOptions: ProductSizeKey[] = ["S", "M", "L", "XL", "XXL"]

function prefixForFile(file: File) {
  const name = file.name.replace(/\.[^.]+$/, "")
  const [prefix] = name.split(/[_-]/)
  return prefix || name
}

function titleFromPrefix(prefix: string) {
  return prefix
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function groupsFromFiles(files: File[]): BulkGroup[] {
  const buckets = new Map<string, File[]>()
  for (const file of files) {
    if (!file.type.startsWith("image/")) continue
    const key = prefixForFile(file)
    buckets.set(key, [...(buckets.get(key) ?? []), file])
  }

  return [...buckets.entries()].map(([prefix, bucket]) => {
    const title = titleFromPrefix(prefix)
    const sizes: ProductSizeKey[] = ["S", "M", "L", "XL", "XXL"]
    return {
      id: `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      title,
      handle: slugifyDropTitle(title),
      files: bucket,
      previews: bucket.map((file) => URL.createObjectURL(file)),
      sizes,
      stockPerSize: { S: 0, M: 0, L: 0, XL: 0, XXL: 0 },
      status: "idle",
    }
  })
}

function validateGroup(group: BulkGroup) {
  const errors: string[] = []
  if (!group.title.trim()) errors.push("title")
  if (!group.handle.trim()) errors.push("handle")
  if (!group.priceEgp || group.priceEgp <= 0) errors.push("price")
  if (!group.feeling) errors.push("feeling")
  if (!group.subfeeling) errors.push("subfeeling")
  if (!group.files.length) errors.push("images")
  return errors
}

function SelectField({
  value,
  options,
  placeholder,
  onChange,
}: {
  value?: string
  options: Array<{ value: string; label: string }>
  placeholder: string
  onChange: (value?: string) => void
}) {
  return (
    <Select size="small" value={value || none} onValueChange={(next) => onChange(next === none ? undefined : next)}>
      <Select.Trigger>
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

async function mapLimit<T>(items: T[], limit: number, worker: (item: T, index: number) => Promise<void>) {
  let nextIndex = 0
  async function run() {
    while (nextIndex < items.length) {
      const index = nextIndex++
      await worker(items[index], index)
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run))
}

export default function BulkDropsPage() {
  const queryClient = useQueryClient()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const folderInputRef = useRef<HTMLInputElement | null>(null)
  const [groups, setGroups] = useState<BulkGroup[]>([])
  const [defaultPrice, setDefaultPrice] = useState<number | undefined>()
  const [defaultFeeling, setDefaultFeeling] = useState<string | undefined>()
  const [defaultSubfeeling, setDefaultSubfeeling] = useState<string | undefined>()
  const [publishing, setPublishing] = useState(false)

  const { data: lookups } = useQuery({
    queryKey: ["horo", "drops", "lookups"],
    queryFn: fetchDropLookups,
    staleTime: 60_000,
  })

  const defaultSubfeelings = useMemo(() => {
    return (lookups?.subfeelings ?? []).filter((item) => !defaultFeeling || item.feelingSlug === defaultFeeling)
  }, [defaultFeeling, lookups?.subfeelings])

  const updateGroup = (id: string, patch: Partial<BulkGroup>) => {
    setGroups((prev) => prev.map((group) => (group.id === id ? { ...group, ...patch, status: "idle", message: undefined } : group)))
  }

  const addFiles = (files: File[]) => {
    const next = groupsFromFiles(files)
    setGroups((prev) => [...prev, ...next])
  }

  const validateAll = () => {
    setGroups((prev) => prev.map((group) => {
      const errors = validateGroup(group)
      return {
        ...group,
        status: errors.length ? "error" : "valid",
        message: errors.length ? `Missing ${errors.join(", ")}` : "Ready",
      }
    }))
  }

  const publishAll = async () => {
    validateAll()
    const ready = groups.filter((group) => validateGroup(group).length === 0)
    if (!ready.length) return

    setPublishing(true)
    try {
      await mapLimit(ready, 4, async (group) => {
        updateGroup(group.id, { status: "publishing", message: "Uploading" })
        const uploaded = await uploadDropFiles(group.files)
        const images: DropImage[] = uploaded.files.map((file, index) => ({
          url: file.url,
          filename: file.filename,
          tag: tagForFilename(file.filename) || (index === 0 ? "main" : "lifestyle"),
          order: index,
        }))
        if (!images.some((image) => image.tag === "main") && images[0]) {
          images[0] = { ...images[0], tag: "main" }
        }

        const payload: DropPayload = {
          handle: group.handle,
          title: group.title,
          status: "published",
          story: group.title,
          description: group.title,
          feeling: group.feeling,
          subfeeling: group.subfeeling,
          priceEgp: group.priceEgp,
          sizes: group.sizes,
          stockPerSize: group.stockPerSize,
          images,
        }

        await saveDrop(payload)
        updateGroup(group.id, { status: "published", message: "Published" })
      })
      await queryClient.invalidateQueries({ queryKey: ["horo", "drops"] })
    } finally {
      setPublishing(false)
    }
  }

  return (
    <Container className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button asChild size="small" variant="transparent">
            <Link to="/drops">
              <ArrowLeftMini />
              Drops
            </Link>
          </Button>
          <div>
            <Heading level="h1">Bulk Create</Heading>
            <Text size="small" className="mt-1 text-ui-fg-muted">
              {groups.length} grouped products
            </Text>
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="button" size="small" variant="secondary" onClick={validateAll}>
            Validate
          </Button>
          <Button type="button" size="small" disabled={publishing} isLoading={publishing} onClick={publishAll}>
            Publish All
          </Button>
        </div>
      </div>

      <div
        className="mb-6 flex min-h-36 cursor-pointer flex-col items-center justify-center gap-3 rounded-md border border-dashed border-ui-border-base bg-ui-bg-subtle p-6 text-center"
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault()
          addFiles(Array.from(event.dataTransfer.files))
        }}
      >
        <ArrowUpTray className="text-ui-fg-muted" />
        <Text size="small" weight="plus">
          Drop many images
        </Text>
        <div className="flex gap-2">
          <Button
            type="button"
            size="small"
            variant="secondary"
            onClick={(event) => {
              event.stopPropagation()
              inputRef.current?.click()
            }}
          >
            Files
          </Button>
          <Button
            type="button"
            size="small"
            variant="secondary"
            onClick={(event) => {
              event.stopPropagation()
              folderInputRef.current?.click()
            }}
          >
            Folder
          </Button>
        </div>
      </div>
      <input ref={inputRef} type="file" multiple accept="image/*" className="hidden" onChange={(event) => addFiles(Array.from(event.target.files ?? []))} />
      <input
        ref={folderInputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        {...({ webkitdirectory: "", directory: "" } as Record<string, string>)}
        onChange={(event) => addFiles(Array.from(event.target.files ?? []))}
      />

      <div className="mb-6 rounded-md border border-ui-border-base p-4">
        <Heading level="h2" className="mb-3">
          Defaults
        </Heading>
        <div className="grid gap-3 md:grid-cols-4">
          <Input
            size="small"
            type="number"
            min={1}
            placeholder="Price EGP"
            value={defaultPrice ?? ""}
            onChange={(event) => setDefaultPrice(event.target.value ? Number(event.target.value) : undefined)}
          />
          <SelectField
            value={defaultFeeling}
            placeholder="Feeling"
            onChange={(feeling) => {
              setDefaultFeeling(feeling)
              setDefaultSubfeeling(undefined)
            }}
            options={(lookups?.feelings ?? []).map((item) => ({ value: item.slug, label: item.name }))}
          />
          <SelectField
            value={defaultSubfeeling}
            placeholder="Subfeeling"
            onChange={setDefaultSubfeeling}
            options={defaultSubfeelings.map((item) => ({ value: item.slug, label: item.name }))}
          />
          <Button
            type="button"
            size="small"
            variant="secondary"
            onClick={() => {
              setGroups((prev) => prev.map((group) => ({
                ...group,
                priceEgp: defaultPrice ?? group.priceEgp,
                feeling: defaultFeeling ?? group.feeling,
                subfeeling: defaultSubfeeling ?? group.subfeeling,
              })))
            }}
          >
            Apply to all
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {groups.map((group) => {
          const subfeelings = (lookups?.subfeelings ?? []).filter((item) => !group.feeling || item.feelingSlug === group.feeling)
          const errors = validateGroup(group)
          return (
            <div key={group.id} className="rounded-md border border-ui-border-base p-4">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div className="flex gap-3">
                  <div className="flex -space-x-2">
                    {group.previews.slice(0, 4).map((src) => (
                      <img key={src} src={src} alt="" className="h-12 w-12 rounded border border-ui-border-base object-cover" />
                    ))}
                  </div>
                  <div>
                    <Heading level="h2">{group.title}</Heading>
                    <Text size="xsmall" className="text-ui-fg-muted">
                      {group.files.length} image(s)
                    </Text>
                  </div>
                </div>
                <Badge color={group.status === "published" ? "green" : group.status === "error" ? "red" : group.status === "publishing" ? "blue" : "grey"}>
                  {group.status === "published" ? <CheckCircle /> : group.status === "error" ? <XCircle /> : null}
                  {group.message ?? group.status}
                </Badge>
              </div>
              <div className="grid gap-3 md:grid-cols-5">
                <Input
                  size="small"
                  value={group.title}
                  onChange={(event) => updateGroup(group.id, { title: event.target.value, handle: slugifyDropTitle(event.target.value) })}
                />
                <Input size="small" value={group.handle} onChange={(event) => updateGroup(group.id, { handle: slugifyDropTitle(event.target.value) })} />
                <Input
                  size="small"
                  type="number"
                  min={1}
                  value={group.priceEgp ?? ""}
                  onChange={(event) => updateGroup(group.id, { priceEgp: event.target.value ? Number(event.target.value) : undefined })}
                />
                <SelectField
                  value={group.feeling}
                  placeholder="Feeling"
                  onChange={(feeling) => updateGroup(group.id, { feeling, subfeeling: undefined })}
                  options={(lookups?.feelings ?? []).map((item) => ({ value: item.slug, label: item.name }))}
                />
                <SelectField
                  value={group.subfeeling}
                  placeholder="Subfeeling"
                  onChange={(subfeeling) => updateGroup(group.id, { subfeeling })}
                  options={subfeelings.map((item) => ({ value: item.slug, label: item.name }))}
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {sizeOptions.map((size) => (
                  <Button
                    key={size}
                    type="button"
                    size="small"
                    variant={group.sizes.includes(size) ? "primary" : "secondary"}
                    onClick={() => {
                      const sizes = group.sizes.includes(size)
                        ? group.sizes.filter((item) => item !== size)
                        : [...group.sizes, size]
                      updateGroup(group.id, { sizes })
                    }}
                  >
                    {size}
                  </Button>
                ))}
                {group.sizes.map((size) => (
                  <Input
                    key={`${group.id}-${size}`}
                    size="small"
                    type="number"
                    min={0}
                    className="w-24"
                    value={group.stockPerSize[size] ?? 0}
                    onChange={(event) => updateGroup(group.id, {
                      stockPerSize: {
                        ...group.stockPerSize,
                        [size]: Math.max(0, Math.floor(Number(event.target.value || 0))),
                      },
                    })}
                  />
                ))}
              </div>
              {errors.length ? (
                <Text size="xsmall" className="mt-3 text-ui-fg-error">
                  Missing {errors.join(", ")}
                </Text>
              ) : null}
            </div>
          )
        })}
      </div>
    </Container>
  )
}
