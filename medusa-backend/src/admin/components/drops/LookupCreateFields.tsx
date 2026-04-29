import { XMarkMini } from "@medusajs/icons"
import { Badge, Button, Input, Select, Text } from "@medusajs/ui"
import { useState } from "react"

import { slugifyDropTitle } from "./utils"

const none = "__none__"

type LookupOption = {
  slug: string
  name: string
}

function nameFromSlug(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

export function OccasionPicker({
  values,
  options,
  onChange,
  onCreate,
  onError,
}: {
  values: string[]
  options: LookupOption[]
  onChange: (values: string[]) => void
  onCreate: (slug: string, name: string) => Promise<void>
  onError?: (message: string) => void
}) {
  const [draft, setDraft] = useState("")
  const [creating, setCreating] = useState(false)
  const available = options.filter((option) => !values.includes(option.slug))

  const create = async () => {
    const slug = slugifyDropTitle(draft)
    if (!slug) return
    setCreating(true)
    try {
      await onCreate(slug, nameFromSlug(slug))
      onChange([...new Set([...values, slug])])
      setDraft("")
    } catch (error) {
      onError?.(error instanceof Error ? error.message : "Create failed.")
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Select
        size="small"
        value={none}
        onValueChange={(slug) => {
          if (slug === none) return
          onChange([...new Set([...values, slug])])
        }}
      >
        <Select.Trigger>
          <Select.Value placeholder="Add occasion" />
        </Select.Trigger>
        <Select.Content>
          <Select.Item value={none}>Add occasion</Select.Item>
          {available.map((option) => (
            <Select.Item key={option.slug} value={option.slug}>
              {option.name}
            </Select.Item>
          ))}
        </Select.Content>
      </Select>
      <div className="flex gap-2">
        <Input
          size="small"
          value={draft}
          placeholder="new-occasion-slug"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault()
              create()
            }
          }}
        />
        <Button type="button" size="small" variant="secondary" disabled={creating || !draft.trim()} onClick={create}>
          + Create
        </Button>
      </div>
      {values.length ? (
        <div className="flex flex-wrap gap-2">
          {values.map((value) => (
            <Badge key={value} size="small" color="grey" className="gap-1">
              {options.find((option) => option.slug === value)?.name ?? value}
              <button type="button" aria-label={`Remove ${value}`} onClick={() => onChange(values.filter((item) => item !== value))}>
                <XMarkMini />
              </button>
            </Badge>
          ))}
        </div>
      ) : (
        <Text size="xsmall" className="text-ui-fg-muted">
          No occasions selected.
        </Text>
      )}
    </div>
  )
}

export function ArtistPicker({
  value,
  options,
  onChange,
  onCreate,
  onError,
}: {
  value?: string
  options: LookupOption[]
  onChange: (value?: string) => void
  onCreate: (slug: string, name: string) => Promise<void>
  onError?: (message: string) => void
}) {
  const [draft, setDraft] = useState("")
  const [creating, setCreating] = useState(false)

  const create = async () => {
    const slug = slugifyDropTitle(draft)
    if (!slug) return
    setCreating(true)
    try {
      await onCreate(slug, nameFromSlug(slug))
      onChange(slug)
      setDraft("")
    } catch (error) {
      onError?.(error instanceof Error ? error.message : "Create failed.")
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Select size="small" value={value || none} onValueChange={(next) => onChange(next === none ? undefined : next)}>
        <Select.Trigger>
          <Select.Value placeholder="Select artist" />
        </Select.Trigger>
        <Select.Content>
          <Select.Item value={none}>Select artist</Select.Item>
          {options.map((option) => (
            <Select.Item key={option.slug} value={option.slug}>
              {option.name}
            </Select.Item>
          ))}
        </Select.Content>
      </Select>
      <div className="flex gap-2">
        <Input
          size="small"
          value={draft}
          placeholder="new-artist-slug"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault()
              create()
            }
          }}
        />
        <Button type="button" size="small" variant="secondary" disabled={creating || !draft.trim()} onClick={create}>
          + Create
        </Button>
      </div>
    </div>
  )
}
