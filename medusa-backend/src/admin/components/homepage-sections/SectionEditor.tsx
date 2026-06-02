import { Heading, Input, Label, Select, Text } from "@medusajs/ui"
import { useEffect, useState } from "react"

import { BilingualInput } from "./BilingualInput"
import { PresentationFields } from "./PresentationFields"
import {
  HOMEPAGE_SECTION_TYPES,
  type AdminHomepageSection,
  type HomepageSectionType,
} from "../../../lib/homepage-sections/types"

type SectionEditorProps = {
  value: AdminHomepageSection
  disabled?: boolean
  isNew?: boolean
  onChange: (value: AdminHomepageSection) => void
}

export function SectionEditor({ value, disabled, isNew, onChange }: SectionEditorProps) {
  const [payloadText, setPayloadText] = useState(() => value.payload ? JSON.stringify(value.payload, null, 2) : "")
  const [payloadError, setPayloadError] = useState<string | null>(null)

  useEffect(() => {
    setPayloadText(value.payload ? JSON.stringify(value.payload, null, 2) : "")
    setPayloadError(null)
  }, [value.id, value.key])

  const update = <K extends keyof AdminHomepageSection>(key: K, next: AdminHomepageSection[K]) => {
    onChange({ ...value, [key]: next })
  }
  const updateMany = (patch: Partial<AdminHomepageSection>) => {
    onChange({ ...value, ...patch })
  }
  const compactContent = value.type === "trust_ribbon" || value.type === "proof_strip"
  const showCtas = !["trust_ribbon", "proof_strip", "seen_on_you"].includes(value.type)
  const showImage = [
    "hero",
    "founding_drop",
    "featured_piece",
    "gift_block",
    "artist_spotlight",
    "editorial_feature",
    "why_horo",
  ].includes(value.type)

  return (
    <div className="grid gap-5">
      <section className="rounded-md border border-ui-border-base p-5">
        <Heading level="h3" className="mb-4">Identity</Heading>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor="section-key" className="text-xs">Key</Label>
            <Input
              id="section-key"
              size="small"
              value={value.key}
              disabled={disabled || !isNew}
              onChange={(e) => update("key", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="section-type" className="text-xs">Type</Label>
            <Select
              size="small"
              value={value.type}
              onValueChange={(next) => update("type", next as HomepageSectionType)}
            >
              <Select.Trigger id="section-type">
                <Select.Value placeholder="Select type" />
              </Select.Trigger>
              <Select.Content>
                {HOMEPAGE_SECTION_TYPES.map((type) => (
                  <Select.Item key={type} value={type}>{type.replace(/_/g, " ")}</Select.Item>
                ))}
              </Select.Content>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="section-sort" className="text-xs">Sort order</Label>
            <Input
              id="section-sort"
              type="number"
              size="small"
              value={String(value.sortOrder)}
              disabled={disabled}
              onChange={(e) => update("sortOrder", Number(e.target.value) || 0)}
            />
          </div>
        </div>
      </section>

      <section className="rounded-md border border-ui-border-base p-5">
        <Heading level="h3" className="mb-4">Content</Heading>
        <div className="grid gap-4">
          <BilingualInput
            id="section-eyebrow"
            label="Eyebrow"
            valueEn={value.eyebrowEn}
            valueAr={value.eyebrowAr}
            disabled={disabled}
            onChange={(en, ar) => updateMany({ eyebrowEn: en, eyebrowAr: ar })}
          />
          {compactContent ? null : (
            <BilingualInput
              id="section-title"
              label="Title"
              valueEn={value.titleEn}
              valueAr={value.titleAr}
              disabled={disabled}
              onChange={(en, ar) => updateMany({ titleEn: en, titleAr: ar })}
            />
          )}
          <BilingualInput
            id="section-body"
            label="Body"
            valueEn={value.bodyEn}
            valueAr={value.bodyAr}
            disabled={disabled}
            onChange={(en, ar) => updateMany({ bodyEn: en, bodyAr: ar })}
          />
        </div>
      </section>

      {showCtas ? (
      <section className="rounded-md border border-ui-border-base p-5">
        <Heading level="h3" className="mb-4">CTAs</Heading>
        <div className="grid gap-4">
          <BilingualInput
            id="section-primary-cta-label"
            label="Primary CTA label"
            valueEn={value.primaryCtaLabelEn}
            valueAr={value.primaryCtaLabelAr}
            disabled={disabled}
            onChange={(en, ar) => updateMany({ primaryCtaLabelEn: en, primaryCtaLabelAr: ar })}
          />
          <div className="flex flex-col gap-1">
            <Label htmlFor="section-primary-cta-href" className="text-xs">Primary CTA href</Label>
            <Input
              id="section-primary-cta-href"
              size="small"
              value={value.primaryCtaHref ?? ""}
              disabled={disabled}
              placeholder="/products"
              onChange={(e) => update("primaryCtaHref", e.target.value || null)}
            />
          </div>
          <BilingualInput
            id="section-secondary-cta-label"
            label="Secondary CTA label"
            valueEn={value.secondaryCtaLabelEn}
            valueAr={value.secondaryCtaLabelAr}
            disabled={disabled}
            onChange={(en, ar) => updateMany({ secondaryCtaLabelEn: en, secondaryCtaLabelAr: ar })}
          />
          <div className="flex flex-col gap-1">
            <Label htmlFor="section-secondary-cta-href" className="text-xs">Secondary CTA href</Label>
            <Input
              id="section-secondary-cta-href"
              size="small"
              value={value.secondaryCtaHref ?? ""}
              disabled={disabled}
              placeholder="/about"
              onChange={(e) => update("secondaryCtaHref", e.target.value || null)}
            />
          </div>
        </div>
      </section>
      ) : null}

      {showImage ? (
      <section className="rounded-md border border-ui-border-base p-5">
        <Heading level="h3" className="mb-4">Image</Heading>
        <div className="grid gap-4">
          <div className="flex flex-col gap-1">
            <Label htmlFor="section-image-src" className="text-xs">Image URL</Label>
            <Input
              id="section-image-src"
              size="small"
              value={value.imageSrc ?? ""}
              disabled={disabled}
              placeholder="https://..."
              onChange={(e) => update("imageSrc", e.target.value || null)}
            />
          </div>
          <BilingualInput
            id="section-image-alt"
            label="Image alt"
            valueEn={value.imageAltEn}
            valueAr={value.imageAltAr}
            disabled={disabled}
            onChange={(en, ar) => updateMany({ imageAltEn: en, imageAltAr: ar })}
          />
          {value.type === "editorial_feature" ? (
            <Text size="small" className="text-ui-fg-subtle">
              Prefer front artwork: tag drop images as artwork_detail, lifestyle (front on-body), or
              card. Do not use back or flat_lay for this section.
            </Text>
          ) : null}
        </div>
      </section>
      ) : null}

      <PresentationFields
        sectionType={value.type}
        payload={value.payload}
        disabled={disabled}
        onPayloadChange={(payload) => update("payload", payload)}
      />

      <section className="rounded-md border border-ui-border-base p-5">
        <Heading level="h3" className="mb-4">Appearance</Heading>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-1">
            <Label htmlFor="section-accent" className="text-xs">Accent color</Label>
            <Input
              id="section-accent"
              size="small"
              value={value.accent ?? ""}
              disabled={disabled}
              placeholder="#hex or CSS color"
              onChange={(e) => update("accent", e.target.value || null)}
            />
          </div>
          <div className="flex items-end">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-ui-fg-base">
              <input
                type="checkbox"
                checked={value.active}
                disabled={disabled}
                onChange={(e) => update("active", e.target.checked)}
                className="accent-ui-fg-interactive"
              />
              Active
            </label>
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-1">
          <Label htmlFor="section-payload" className="text-xs">Payload (JSON)</Label>
          <textarea
            id="section-payload"
            className="min-h-[80px] rounded-md border border-ui-border-base bg-ui-bg-field px-3 py-2 font-mono text-xs text-ui-fg-base disabled:opacity-50"
            value={payloadText}
            disabled={disabled}
            onChange={(e) => {
              const nextText = e.target.value
              setPayloadText(nextText)
              try {
                const parsed = nextText.trim() ? JSON.parse(nextText) : null
                if (parsed !== null && (typeof parsed !== "object" || Array.isArray(parsed))) {
                  setPayloadError("Payload must be a JSON object.")
                  return
                }
                setPayloadError(null)
                update("payload", parsed)
              } catch (error) {
                setPayloadError(error instanceof Error ? error.message : "Invalid JSON.")
              }
            }}
          />
          <Text size="xsmall" className={payloadError ? "text-ui-fg-error" : "text-ui-fg-muted"}>
            {payloadError || "Optional JSON payload for section-specific data (e.g. feeling slugs, product handles)."}
          </Text>
        </div>
      </section>
    </div>
  )
}
