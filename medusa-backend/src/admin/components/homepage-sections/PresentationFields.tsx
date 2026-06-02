import { Heading, Label, Select, Text } from "@medusajs/ui"

import {
  HOMEPAGE_LAYOUTS,
  HOMEPAGE_MAX_TEXT_WIDTHS,
  HOMEPAGE_MOBILE_TEXT_MODES,
  HOMEPAGE_TEXT_PLACEMENTS,
  mergePresentationIntoPayload,
  parseHomepagePresentation,
  type HomepagePresentation,
} from "../../../lib/homepage-sections/presentation"
import type { HomepageSectionType } from "../../../lib/homepage-sections/types"

const PRESENTATION_SECTION_TYPES: HomepageSectionType[] = [
  "hero",
  "founding_drop",
  "feeling_grid",
  "editorial_feature",
  "gift_block",
  "why_horo",
]

type PresentationFieldsProps = {
  sectionType: HomepageSectionType
  payload: Record<string, unknown> | null
  disabled?: boolean
  onPayloadChange: (payload: Record<string, unknown> | null) => void
}

function updatePresentation(
  payload: Record<string, unknown> | null,
  patch: Partial<HomepagePresentation>,
): Record<string, unknown> {
  const current = parseHomepagePresentation(payload ?? undefined)
  return mergePresentationIntoPayload(payload, { ...current, ...patch })
}

export function supportsPresentationFields(type: HomepageSectionType): boolean {
  return PRESENTATION_SECTION_TYPES.includes(type)
}

export function PresentationFields({
  sectionType,
  payload,
  disabled,
  onPayloadChange,
}: PresentationFieldsProps) {
  if (!supportsPresentationFields(sectionType)) {
    return null
  }

  const presentation = parseHomepagePresentation(payload ?? undefined)
  const setPresentation = (patch: Partial<HomepagePresentation>) => {
    onPayloadChange(updatePresentation(payload, patch))
  }

  return (
    <section className="rounded-md border border-ui-border-base p-5">
      <Heading level="h3" className="mb-4">
        Presentation
      </Heading>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Layout</Label>
          <Select
            size="small"
            value={presentation.layout ?? ""}
            onValueChange={(value) =>
              setPresentation({
                layout: value ? (value as HomepagePresentation["layout"]) : undefined,
              })
            }
            disabled={disabled}
          >
            <Select.Trigger>
              <Select.Value placeholder="Default" />
            </Select.Trigger>
            <Select.Content>
              {HOMEPAGE_LAYOUTS.map((layout) => (
                <Select.Item key={layout} value={layout}>
                  {layout.replace(/_/g, " ")}
                </Select.Item>
              ))}
            </Select.Content>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Text placement</Label>
          <Select
            size="small"
            value={presentation.textPlacement ?? ""}
            onValueChange={(value) =>
              setPresentation({
                textPlacement: value
                  ? (value as HomepagePresentation["textPlacement"])
                  : undefined,
              })
            }
            disabled={disabled}
          >
            <Select.Trigger>
              <Select.Value placeholder="Default" />
            </Select.Trigger>
            <Select.Content>
              {HOMEPAGE_TEXT_PLACEMENTS.map((placement) => (
                <Select.Item key={placement} value={placement}>
                  {placement}
                </Select.Item>
              ))}
            </Select.Content>
          </Select>
        </div>
        <div className="flex flex-col gap-1 md:col-span-2">
          <Label className="text-xs">
            Overlay opacity ({Math.round((presentation.overlayOpacity ?? 0.35) * 100)}%)
          </Label>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            disabled={disabled}
            value={Math.round((presentation.overlayOpacity ?? 0.35) * 100)}
            onChange={(e) =>
              setPresentation({ overlayOpacity: Number(e.target.value) / 100 })
            }
            className="w-full accent-ui-fg-interactive"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Max text width</Label>
          <Select
            size="small"
            value={presentation.maxTextWidth ?? ""}
            onValueChange={(value) =>
              setPresentation({
                maxTextWidth: value
                  ? (value as HomepagePresentation["maxTextWidth"])
                  : undefined,
              })
            }
            disabled={disabled}
          >
            <Select.Trigger>
              <Select.Value placeholder="Default" />
            </Select.Trigger>
            <Select.Content>
              {HOMEPAGE_MAX_TEXT_WIDTHS.map((width) => (
                <Select.Item key={width} value={width}>
                  {width}
                </Select.Item>
              ))}
            </Select.Content>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Mobile text</Label>
          <Select
            size="small"
            value={presentation.mobileTextMode ?? ""}
            onValueChange={(value) =>
              setPresentation({
                mobileTextMode: value
                  ? (value as HomepagePresentation["mobileTextMode"])
                  : undefined,
              })
            }
            disabled={disabled}
          >
            <Select.Trigger>
              <Select.Value placeholder="Default" />
            </Select.Trigger>
            <Select.Content>
              {HOMEPAGE_MOBILE_TEXT_MODES.map((mode) => (
                <Select.Item key={mode} value={mode}>
                  {mode}
                </Select.Item>
              ))}
            </Select.Content>
          </Select>
        </div>
        <div className="flex flex-wrap gap-4 md:col-span-2">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={presentation.showEyebrow ?? true}
              disabled={disabled}
              onChange={(e) => setPresentation({ showEyebrow: e.target.checked })}
            />
            Show eyebrow
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={presentation.showBody ?? true}
              disabled={disabled}
              onChange={(e) => setPresentation({ showBody: e.target.checked })}
            />
            Show body
          </label>
          {sectionType === "why_horo" ? (
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={presentation.showPillars ?? false}
                disabled={disabled}
                onChange={(e) => setPresentation({ showPillars: e.target.checked })}
              />
              Show pillars on homepage
            </label>
          ) : null}
        </div>
      </div>
      <Text size="xsmall" className="mt-3 text-ui-fg-muted">
        Image-led sections: prefer layout image overlay, short copy on image, and hide body when not needed.
      </Text>
    </section>
  )
}
